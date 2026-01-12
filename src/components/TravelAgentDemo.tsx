import { useState, useEffect } from "react";
import { Send, Plane, User, Loader2, Database, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/sonner";
import { memoryAPI, serviceAPI } from "@/lib/api-client";
import type { ServiceConfig } from "../../lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TravelAgentDemo = () => {
  const [userId, setUserId] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  const [userMemories, setUserMemories] = useState<any>(null);

  // Service selection
  const [availableServices, setAvailableServices] = useState<ServiceConfig[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Memory viewer
  const [showMemoryDialog, setShowMemoryDialog] = useState(false);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [loadingMemory, setLoadingMemory] = useState(false);

  // Load available services on mount
  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true);
      const response = await serviceAPI.list();

      if (response.success && response.data) {
        setAvailableServices(response.data);
        // Auto-select first service or travel-agent-example if it exists
        const travelAgent = response.data.find(s => s.id === "travel-agent-example");
        const defaultService = travelAgent || response.data[0];
        if (defaultService) {
          setSelectedServiceId(defaultService.id);
          setSelectedService(defaultService);
        }
      } else {
        toast.error("Failed to load services");
      }
      setServicesLoading(false);
    };

    loadServices();
  }, []);

  // Update selected service when ID changes
  useEffect(() => {
    const service = availableServices.find(s => s.id === selectedServiceId);
    setSelectedService(service || null);
  }, [selectedServiceId, availableServices]);

  // Load user memories when userId or selectedServiceId changes
  useEffect(() => {
    const loadMemories = async () => {
      if (!userId.trim() || !selectedServiceId) {
        setMemoriesLoaded(false);
        setUserMemories(null);
        return;
      }

      try {
        const response = await memoryAPI.retrieveLongTerm(
          userId,
          selectedServiceId
        );

        if (response.success && response.data) {
          setUserMemories(response.data.memories);
          setMemoriesLoaded(true);

          // Show toast if user has memories
          const hasMemories = Object.values(response.data.memories).some(
            (bucket: any) => Array.isArray(bucket) && bucket.length > 0
          );

          if (hasMemories) {
            toast.success("Loaded your travel preferences and history!");
          }
        }
      } catch (error) {
        console.error("Error loading memories:", error);
      }
    };

    loadMemories();
  }, [userId, selectedServiceId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!userId.trim()) {
      toast.error("Please enter a User ID");
      return;
    }

    if (!selectedServiceId) {
      toast.error("Please select a memory service");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build system prompt with memory context
      let systemPrompt = `You are a knowledgeable and enthusiastic travel planning assistant. Your role is to help users plan personalized trips based on their preferences, past experiences, and travel companions.

Your responsibilities:
- Provide detailed, personalized travel itineraries
- Recommend destinations, activities, accommodations, and dining options
- Ask questions to learn about user preferences (budget, dietary restrictions, interests, travel style)
- Remember and reference past trips and preferences
- Be friendly, enthusiastic, and helpful

When planning trips, try to learn:
- Budget range and travel style (luxury, mid-range, budget)
- Dietary restrictions or food preferences
- Interests and hobbies (photography, hiking, museums, beaches, etc.)
- Travel preferences (morning vs evening flights, window vs aisle, preferred airlines)
- Past trips they've enjoyed
- Who they're traveling with (solo, partner, family, friends)

Be conversational and warm, but also practical and informative.`;

      // Add memory context if available
      if (userMemories) {
        const { generic_memory, preferences, facts, past_trips } = userMemories;

        // Add generic/unstructured memories
        if (generic_memory && generic_memory.length > 0) {
          systemPrompt += `\n\nGeneral Information About User:`;
          generic_memory.forEach((memory: any) => {
            systemPrompt += `\n- ${memory.data.text}`;
          });
        }

        // Add structured preferences
        if (preferences && preferences.length > 0) {
          const prefs = preferences[0].data;
          systemPrompt += `\n\nUser Preferences:`;
          if (prefs.budget_range) systemPrompt += `\n- Budget: ${prefs.budget_range}`;
          if (prefs.dietary_restrictions?.length > 0) {
            systemPrompt += `\n- Dietary Restrictions: ${prefs.dietary_restrictions.join(', ')}`;
          }
          if (prefs.preferred_airlines?.length > 0) {
            systemPrompt += `\n- Preferred Airlines: ${prefs.preferred_airlines.join(', ')}`;
          }
          if (prefs.seat_preference) systemPrompt += `\n- Seat Preference: ${prefs.seat_preference}`;
          if (prefs.accommodation_type) systemPrompt += `\n- Accommodation Type: ${prefs.accommodation_type}`;
        }

        // Add facts
        if (facts && facts.length > 0) {
          systemPrompt += `\n\nUser Facts:`;
          facts.forEach((fact: any) => {
            systemPrompt += `\n- ${fact.data.fact_type}: ${fact.data.fact_value}`;
          });
        }

        // Add past trips
        if (past_trips && past_trips.length > 0) {
          systemPrompt += `\n\nPast Trips:`;
          past_trips.forEach((trip: any) => {
            systemPrompt += `\n- ${trip.data.destination}${trip.data.trip_dates ? ` (${trip.data.trip_dates})` : ''}`;
            if (trip.data.rating) systemPrompt += ` - Rating: ${trip.data.rating}/5`;
          });
        }
      }

      // Call backend API which uses server-side OpenAI key
      const response = await fetch("/api/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: inputMessage }
          ],
          temperature: 0.7,
          service_id: selectedServiceId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Store conversation in short-term memory - adapt to service schema
      try {
        const timestamp = new Date().toISOString();
        const schema = selectedService?.schemas?.shortTermFields || [];

        // Build data object based on schema fields
        const buildSchemaData = (userMsg: string, agentMsg: string | null) => {
          const data: Record<string, any> = {};

          for (const field of schema) {
            const fieldName = field.name.toLowerCase();

            // Map common field names to our data
            if (fieldName === 'user_id' || fieldName === 'userid') {
              data[field.name] = userId;
            } else if (fieldName === 'session_id' || fieldName === 'sessionid') {
              data[field.name] = sessionId;
            } else if (fieldName === 'timestamp' || fieldName === 'time' || fieldName === 'created_at') {
              data[field.name] = timestamp;
            } else if (fieldName === 'role') {
              data[field.name] = agentMsg ? "agent" : "user";
            } else if (fieldName === 'text' || fieldName === 'message' || fieldName === 'content') {
              data[field.name] = agentMsg || userMsg;
            } else if (fieldName === 'user_message' || fieldName === 'usermessage') {
              data[field.name] = userMsg;
            } else if (fieldName === 'agent_response' || fieldName === 'agentresponse' || fieldName === 'assistant_message') {
              data[field.name] = agentMsg || "";
            }
          }

          return data;
        };

        // Check if schema uses combined format (user_message + agent_response in one record)
        const hasCombinedFormat = schema.some(f =>
          f.name.toLowerCase().includes('user_message') ||
          f.name.toLowerCase().includes('agent_response')
        );

        if (hasCombinedFormat) {
          // Store as single record with both user and agent message
          const combinedData = buildSchemaData(inputMessage, assistantMessage.content);
          await memoryAPI.storeShortTerm({
            service_id: selectedServiceId,
            data: combinedData,
          });
        } else {
          // Store as separate records (role/text format)
          const userData = buildSchemaData(inputMessage, null);
          await memoryAPI.storeShortTerm({
            service_id: selectedServiceId,
            data: userData,
          });

          const agentData = buildSchemaData(inputMessage, assistantMessage.content);
          await memoryAPI.storeShortTerm({
            service_id: selectedServiceId,
            data: agentData,
          });
        }
      } catch (memoryError) {
        console.error("Error storing conversation:", memoryError);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error("Error calling chat API:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewMemory = async () => {
    if (!userId || !selectedServiceId) {
      toast.error("Please enter a User ID and select a service first");
      return;
    }

    setLoadingMemory(true);
    setShowMemoryDialog(true);

    try {
      // Fetch long-term memory
      const longTermResponse = await memoryAPI.retrieveLongTerm(userId, selectedServiceId);

      // Fetch short-term memory
      const shortTermResponse = await memoryAPI.retrieveShortTerm(sessionId, selectedServiceId);

      setMemoryData({
        longTerm: longTermResponse.success ? longTermResponse.data : null,
        shortTerm: shortTermResponse.success ? shortTermResponse.data : null,
      });
    } catch (error) {
      console.error("Error fetching memory:", error);
      toast.error("Failed to fetch memory data");
    } finally {
      setLoadingMemory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Plane className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Travel Itinerary Agent</h2>
            <p className="text-sm text-muted-foreground">
              Ask me to help plan your perfect trip!
            </p>
          </div>
        </div>

        {/* Service Selection */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="service-select" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Memory Service
          </Label>
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={servicesLoading}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue placeholder={servicesLoading ? "Loading services..." : "Select a memory service"} />
            </SelectTrigger>
            <SelectContent>
              {availableServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedService && (
            <p className="text-xs text-muted-foreground">
              {selectedService.agentPurpose}
            </p>
          )}
        </div>

        {/* User ID Input */}
        <div className="space-y-2">
          <Label htmlFor="user-id" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User ID
          </Label>
          <Input
            id="user-id"
            placeholder="Enter your user ID (e.g., user123)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              This will be used to identify you in the conversation
            </p>
            {memoriesLoaded && userId && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Memories loaded
              </p>
            )}
          </div>

          {/* View Memory Button */}
          <Button
            onClick={handleViewMemory}
            variant="outline"
            className="w-full mt-2"
            disabled={!userId || !selectedServiceId}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Stored Memory
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Chat</h3>
        
        {/* Messages */}
        <div className="space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation to plan your trip!</p>
              <p className="text-sm mt-2">Try asking: "Plan a 5-day trip to Paris"</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary/50 rounded-lg p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask me to plan your trip..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || !userId.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Memory Viewer Dialog */}
      <Dialog open={showMemoryDialog} onOpenChange={setShowMemoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stored Memory for {userId}</DialogTitle>
          </DialogHeader>

          {loadingMemory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : memoryData ? (
            <div className="space-y-6">
              {/* Long-term Memory */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Long-term Memory
                </h3>
                {memoryData.longTerm?.memories ? (
                  <div className="space-y-4">
                    {Object.entries(memoryData.longTerm.memories).map(([bucket, items]: [string, any]) => (
                      <div key={bucket} className="border rounded-lg p-4 bg-secondary/20">
                        <h4 className="font-medium text-sm mb-2 text-primary capitalize">
                          {bucket.replace(/_/g, ' ')}
                        </h4>
                        {Array.isArray(items) && items.length > 0 ? (
                          <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                            {JSON.stringify(items, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No memories yet</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No long-term memories stored yet</p>
                )}
              </div>

              {/* Short-term Memory */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Short-term Memory (Session)</h3>
                {memoryData.shortTerm?.messages && memoryData.shortTerm.messages.length > 0 ? (
                  <div className="space-y-2">
                    {memoryData.shortTerm.messages.map((msg: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 bg-secondary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">
                            {msg.role || 'unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp || ''}
                          </span>
                        </div>
                        <p className="text-sm">{msg.text || JSON.stringify(msg)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No short-term memories in this session</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No memory data available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelAgentDemo;

