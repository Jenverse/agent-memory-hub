import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Database, Sparkles, Loader2, Plus, Trash2, Clock, Brain, Code, Copy, Check } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchemaBuilder from "@/components/SchemaBuilder";
import MemoryBucketCard from "@/components/MemoryBucketCard";
import { serviceAPI } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description?: string;
}

interface MemoryBucket {
  id: string;
  name: string;
  description: string;
  schema: SchemaField[];
}

interface ExampleMemory {
  id: string;
  userMessage: string;
  extractedMemory: string;
  memoryType: "preference" | "fact" | "custom";
  action: "store" | "update" | "delete";
}

interface GeneratedSchemas {
  shortTermFields: SchemaField[];
  longTermBuckets: MemoryBucket[];
}

const CreateService = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState("");
  const [redisUrl, setRedisUrl] = useState("");
  const [agentPurpose, setAgentPurpose] = useState("");
  const [memoryDescription, setMemoryDescription] = useState("");
  const [exampleMemories, setExampleMemories] = useState<ExampleMemory[]>([]);
  const [generatedSchemas, setGeneratedSchemas] = useState<GeneratedSchemas | null>(null);

  const addExampleMemory = () => {
    const newExample: ExampleMemory = {
      id: `ex-${Date.now()}`,
      userMessage: "",
      extractedMemory: "",
      memoryType: "fact",
      action: "store",
    };
    setExampleMemories([...exampleMemories, newExample]);
  };

  const updateExampleMemory = (id: string, updates: Partial<ExampleMemory>) => {
    setExampleMemories(exampleMemories.map(ex => ex.id === id ? { ...ex, ...updates } : ex));
  };

  const removeExampleMemory = (id: string) => {
    setExampleMemories(exampleMemories.filter(ex => ex.id !== id));
  };

  const handleNext = async () => {
    if (step === 2) {
      // Skip AI generation and use default schemas
      setStep(3);

      const memoryGoals = memoryDescription
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.trim());

      // Create simple default schemas
      const defaultSchemas = {
        shortTermFields: [
          { id: "1", name: "user_id", type: "string" as const, required: true },
          { id: "2", name: "session_id", type: "string" as const, required: true },
          { id: "3", name: "role", type: "string" as const, required: true },
          { id: "4", name: "text", type: "string" as const, required: true },
          { id: "5", name: "timestamp", type: "string" as const, required: false },
        ],
        longTermBuckets: [
          {
            id: "generic-memory",
            name: "generic_memory",
            description: "General memories about the user",
            isUnstructured: true,
            schema: [
              { id: "1", name: "text", type: "string" as const, required: true },
              { id: "2", name: "timestamp", type: "string" as const, required: false }
            ]
          },
          {
            id: "preferences",
            name: "preferences",
            description: "User preferences and settings",
            schema: [
              { id: "1", name: "preference_type", type: "string" as const, required: true },
              { id: "2", name: "preference_value", type: "string" as const, required: true },
            ]
          }
        ]
      };

      setGeneratedSchemas(defaultSchemas);
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!generatedSchemas) return;

    const memoryGoals = memoryDescription
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim());

    const serviceConfig = {
      id: Date.now().toString(),
      name: serviceName,
      redisUrl,
      agentPurpose,
      memoryGoals,
      schemas: generatedSchemas,
    };

    try {
      // Save to backend API first
      const response = await serviceAPI.create(serviceConfig);

      if (response.success) {
        toast.success(`Service "${serviceName}" created successfully!`);

        // Also save to localStorage as cache
        localStorage.setItem(`service_${serviceConfig.id}`, JSON.stringify(serviceConfig));

        // Add to services list in localStorage
        const serviceIds = JSON.parse(localStorage.getItem("service_ids") || "[]");
        serviceIds.push(serviceConfig.id);
        localStorage.setItem("service_ids", JSON.stringify(serviceIds));

        // Navigate back to dashboard
        navigate("/dashboard");
      } else {
        toast.error(`Failed to create service: ${response.error}`);
        console.error("Service creation error:", response.error);
      }
    } catch (error) {
      toast.error("Failed to create service. Check console for details.");
      console.error("Service creation error:", error);
    }
  };

  const callOpenAI = async (
    apiKey: string,
    serviceName: string,
    purpose: string,
    goals: string[],
    examples: ExampleMemory[]
  ): Promise<GeneratedSchemas> => {
    const examplesText = examples.length > 0
      ? `\n\nExample Memory Scenarios:\n${examples.map((ex, i) =>
          `${i + 1}. User says: "${ex.userMessage}"\n   Extract: "${ex.extractedMemory}"\n   Type: ${ex.memoryType}, Action: ${ex.action}`
        ).join("\n")}`
      : "";

    const prompt = `You are a memory schema architect for AI agents. Generate a structured JSON schema for a memory service.

Service Name: ${serviceName}
Agent Purpose: ${purpose}
Memory Requirements:
${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}${examplesText}

IMPORTANT GUIDELINES:

SHORT-TERM MEMORY:
- This is for SESSION/CONVERSATION context that expires
- MUST include: user_id, session_id, role, text
- Can optionally include: timestamp, metadata
- These are temporary and cleared after session ends
- Each message (user or agent) is stored separately with a role field

LONG-TERM MEMORY:
- This is for PERSISTENT user data that survives across sessions
- Common buckets: "User Profile", "User Preferences", "User Facts"
- Profile: name, email, age, location, occupation, etc.
- Preferences: language, timezone, communication_style, topics_of_interest, etc.
- Facts: important information the user shares about themselves

Return ONLY valid JSON in this exact format:
{
  "shortTermFields": [
    {
      "id": "st-1",
      "name": "session_id",
      "type": "string",
      "required": true,
      "description": "Unique session identifier"
    },
    {
      "id": "st-2",
      "name": "user_message",
      "type": "string",
      "required": true,
      "description": "The user's message in the conversation"
    }
    // ... more short-term fields
  ],
  "longTermBuckets": [
    {
      "id": "bucket-1",
      "name": "User Profile",
      "description": "Basic user information and demographics",
      "schema": [
        {
          "id": "prof-1",
          "name": "user_id",
          "type": "string",
          "required": true,
          "description": "Unique user identifier"
        }
        // ... more profile fields
      ]
    }
    // ... more buckets
  ]
}

Create 4-6 short-term fields (including the required ones) and 2-4 long-term buckets. Make all field names snake_case.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a memory schema architect for AI agents. You generate structured JSON schemas for memory storage."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-12">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              s === step
                ? "bg-primary text-primary-foreground"
                : s < step
                ? "bg-primary/30 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {s}
          </div>
          {s < 4 && (
            <div
              className={`w-16 h-0.5 ${
                s < step ? "bg-primary/30" : "bg-secondary"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create New Service</h1>
                <p className="text-sm text-muted-foreground">
                  Step {step} of 5: {
                    step === 1 ? "Basic Information" :
                    step === 2 ? "Agent Context" :
                    step === 3 ? "Generating Schemas" :
                    step === 4 ? "Review & Edit Schemas" :
                    "API Integration"
                  }
                </p>
              </div>
            </div>
          </div>

          {renderStepIndicator()}

          {/* Step Content */}
          <div className="glass-card rounded-2xl p-8 mb-8">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Service Name</Label>
                  <Input
                    id="service-name"
                    placeholder="my-agent-memory"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique identifier for your memory service
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redis-url">Redis Connection URL</Label>
                  <Input
                    id="redis-url"
                    type="password"
                    placeholder="redis://default:***@hostname:port"
                    value={redisUrl}
                    onChange={(e) => setRedisUrl(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pick the Redis database where you would like to store your memories
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Agent Context */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="agent-purpose">What is your AI agent's purpose?</Label>
                  <Textarea
                    id="agent-purpose"
                    placeholder="e.g., A customer support agent that helps users troubleshoot technical issues and remembers their preferences..."
                    value={agentPurpose}
                    onChange={(e) => setAgentPurpose(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-primary min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what your agent does and how it interacts with users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memory-description">What memories should be stored?</Label>
                  <Textarea
                    id="memory-description"
                    placeholder="e.g., User preferences and settings&#10;Past conversation topics&#10;Technical issues they've encountered&#10;Product recommendations made"
                    value={memoryDescription}
                    onChange={(e) => setMemoryDescription(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-primary min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    List the types of information your agent should remember (one per line)
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Example Memory Scenarios (Optional)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Provide examples to guide the AI in generating better schemas
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExampleMemory}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Example
                    </Button>
                  </div>

                  {exampleMemories.map((example) => (
                    <div key={example.id} className="glass-card p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Memory Type</Label>
                              <Select
                                value={example.memoryType}
                                onValueChange={(value: ExampleMemory["memoryType"]) =>
                                  updateExampleMemory(example.id, { memoryType: value })
                                }
                              >
                                <SelectTrigger className="bg-secondary/50 border-border/50 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="preference">Preference</SelectItem>
                                  <SelectItem value="fact">Fact</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Action</Label>
                              <Select
                                value={example.action}
                                onValueChange={(value: ExampleMemory["action"]) =>
                                  updateExampleMemory(example.id, { action: value })
                                }
                              >
                                <SelectTrigger className="bg-secondary/50 border-border/50 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="store">Store</SelectItem>
                                  <SelectItem value="update">Update</SelectItem>
                                  <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">User Message</Label>
                            <Input
                              placeholder="e.g., I have 2 kids and we usually travel during summer"
                              value={example.userMessage}
                              onChange={(e) =>
                                updateExampleMemory(example.id, { userMessage: e.target.value })
                              }
                              className="bg-secondary/50 border-border/50 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Extracted Memory</Label>
                            <Input
                              placeholder="e.g., User has 2 children; prefers summer travel"
                              value={example.extractedMemory}
                              onChange={(e) =>
                                updateExampleMemory(example.id, { extractedMemory: e.target.value })
                              }
                              className="bg-secondary/50 border-border/50 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExampleMemory(example.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Generating Schemas */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Generating Your Memory Schemas</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Our AI is analyzing your agent's purpose and creating optimized memory structures...
                </p>
              </div>
            )}

            {/* Step 4: Review & Edit Schemas */}
            {step === 4 && generatedSchemas && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Schemas Generated!</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and customize the AI-generated memory structure. Switch between tabs to edit both short-term and long-term schemas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabbed Interface for Schemas */}
                <Tabs defaultValue="short-term" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="short-term" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Short-Term Memory
                      <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {generatedSchemas.shortTermFields.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="long-term" className="gap-2">
                      <Brain className="h-4 w-4" />
                      Long-Term Memory
                      <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {generatedSchemas.longTermBuckets.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Short-Term Memory Tab */}
                  <TabsContent value="short-term" className="space-y-4">
                    <div className="bg-accent/30 border border-border/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Session/Conversation Context</h4>
                          <p className="text-sm text-muted-foreground">
                            Temporary data that expires after the session ends. Typically includes messages, context, and session metadata.
                          </p>
                        </div>
                      </div>
                    </div>

                    <SchemaBuilder
                      title="Short-Term Fields"
                      description="Configure the fields for session-based memory storage"
                      fields={generatedSchemas.shortTermFields}
                      onChange={(fields) =>
                        setGeneratedSchemas({ ...generatedSchemas, shortTermFields: fields })
                      }
                    />
                  </TabsContent>

                  {/* Long-Term Memory Tab */}
                  <TabsContent value="long-term" className="space-y-4">
                    <div className="bg-accent/30 border border-border/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Persistent User Data</h4>
                          <p className="text-sm text-muted-foreground">
                            Categorized storage that survives across sessions. Organize memories into buckets like Profile, Preferences, and Facts.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">Memory Buckets</h3>
                          <p className="text-sm text-muted-foreground">
                            Each bucket represents a category of long-term memories
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newBucket: MemoryBucket = {
                              id: `bucket-${Date.now()}`,
                              name: "",
                              description: "",
                              schema: [],
                            };
                            setGeneratedSchemas({
                              ...generatedSchemas,
                              longTermBuckets: [...generatedSchemas.longTermBuckets, newBucket],
                            });
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Bucket
                        </Button>
                      </div>

                      {generatedSchemas.longTermBuckets.map((bucket) => (
                        <MemoryBucketCard
                          key={bucket.id}
                          bucket={bucket}
                          onUpdate={(updatedBucket) =>
                            setGeneratedSchemas({
                              ...generatedSchemas,
                              longTermBuckets: generatedSchemas.longTermBuckets.map((b) =>
                                b.id === updatedBucket.id ? updatedBucket : b
                              ),
                            })
                          }
                          onDelete={(id) =>
                            setGeneratedSchemas({
                              ...generatedSchemas,
                              longTermBuckets: generatedSchemas.longTermBuckets.filter(
                                (b) => b.id !== id
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 5: API Integration */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Integration Ready!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your memory service is configured. Use these API endpoints to integrate memory into your application.
                      </p>
                    </div>
                  </div>
                </div>

                {/* API Endpoints */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">API Endpoints</h3>

                  {/* Store Memory */}
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-success/20 text-success rounded text-xs font-mono font-semibold">
                          POST
                        </div>
                        <code className="text-sm">/redis-agent-memory/store</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`POST /redis-agent-memory/store`);
                          setCopiedEndpoint('store');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'store' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Store new memories (short-term or long-term)</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`{
  "user_id": "user_123",
  "session_id": "session_456",
  "memory_type": "short_term" | "long_term",
  "bucket_name": "user_preferences", // for long-term only
  "data": {
    // Your schema fields here
  }
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Retrieve Memory */}
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-semibold">
                          GET
                        </div>
                        <code className="text-sm">/redis-agent-memory/retrieve</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`GET /redis-agent-memory/retrieve`);
                          setCopiedEndpoint('retrieve');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'retrieve' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Retrieve stored memories</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`Query Parameters:
  user_id: string (required)
  session_id: string (optional, for short-term)
  memory_type: "short_term" | "long_term"
  bucket_name: string (optional, for long-term)`}
                      </pre>
                    </div>
                  </div>

                  {/* Update Memory */}
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-mono font-semibold">
                          PUT
                        </div>
                        <code className="text-sm">/redis-agent-memory/update</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`PUT /redis-agent-memory/update`);
                          setCopiedEndpoint('update');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'update' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Update existing memories</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`{
  "user_id": "user_123",
  "memory_id": "mem_789",
  "data": {
    // Updated fields
  }
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Delete Memory */}
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs font-mono font-semibold">
                          DELETE
                        </div>
                        <code className="text-sm">/redis-agent-memory/delete</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`DELETE /redis-agent-memory/delete`);
                          setCopiedEndpoint('delete');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'delete' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Delete specific memories</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`Query Parameters:
  user_id: string (required)
  memory_id: string (required)`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-accent/30 border border-border/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Ready to Go!</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Go to Service Dashboard" to save your service and access it from the dashboard. You can edit all configurations anytime.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step > 1 && step !== 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step < 5 && step !== 3 && (
              <Button
                type="button"
                variant="hero"
                onClick={handleNext}
                className="gap-2"
                disabled={
                  (step === 1 && (!serviceName || !redisUrl)) ||
                  (step === 2 && (!agentPurpose || !memoryDescription))
                }
              >
                {step === 2 ? "Generate Schemas" : step === 4 ? "Continue to Integration" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 5 && (
              <Button
                type="button"
                variant="hero"
                onClick={handleFinish}
                className="gap-2"
              >
                Go to Service Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateService;

