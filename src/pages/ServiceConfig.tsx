import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Database, Save, Plus, Clock, Brain, AlertCircle, Sparkles, Code, Copy, Check, User, Plane, ShoppingBag, Calendar } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SchemaBuilder from "@/components/SchemaBuilder";
import MemoryBucketCard from "@/components/MemoryBucketCard";
import AgentContextBuilder from "@/components/AgentContextBuilder";

interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
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

interface AgentContextData {
  purpose: string;
  goals: string[];
  exampleMemories: ExampleMemory[];
}

const ServiceConfig = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "agent-details");
  const [showSchemaRecommendationDialog, setShowSchemaRecommendationDialog] = useState(false);
  const [agentDetailsChanged, setAgentDetailsChanged] = useState(false);
  const [serviceName, setServiceName] = useState<string>("Loading...");
  const [redisUrl, setRedisUrl] = useState<string>("");

  // Short-term memory schema
  const [shortTermFields, setShortTermFields] = useState<SchemaField[]>([]);

  // Long-term: User Preferences schema
  const [preferencesFields, setPreferencesFields] = useState<SchemaField[]>([]);

  // Long-term: Facts schema
  const [factsFields, setFactsFields] = useState<SchemaField[]>([]);

  // Custom memory buckets
  const [customBuckets, setCustomBuckets] = useState<MemoryBucket[]>([]);

  // Agent context for extraction guidance
  const [agentContext, setAgentContext] = useState<AgentContextData>({
    purpose: "",
    goals: [],
    exampleMemories: [],
  });

  // Load generated schemas from localStorage
  useEffect(() => {
    if (id) {
      const savedData = localStorage.getItem(`service_${id}`);
      if (savedData) {
        const data = JSON.parse(savedData);

        // Set service name and Redis URL
        setServiceName(data.name || "Unnamed Service");
        setRedisUrl(data.redisUrl || "");

        // Set agent context
        setAgentContext({
          purpose: data.agentPurpose || "",
          goals: data.memoryGoals || [],
          exampleMemories: [],
        });

        // Set short-term fields
        if (data.schemas?.shortTermFields) {
          setShortTermFields(data.schemas.shortTermFields);
        }

        // Set all long-term buckets
        if (data.schemas?.longTermBuckets) {
          setCustomBuckets(data.schemas.longTermBuckets);
        }
      }
    }
  }, [id]);

  const addCustomBucket = () => {
    const newBucket: MemoryBucket = {
      id: `bucket-${Date.now()}`,
      name: "",
      description: "",
      schema: [],
    };
    setCustomBuckets([...customBuckets, newBucket]);
  };

  const updateBucket = (bucket: MemoryBucket) => {
    setCustomBuckets(customBuckets.map(b => b.id === bucket.id ? bucket : b));
  };

  const deleteBucket = (id: string) => {
    setCustomBuckets(customBuckets.filter(b => b.id !== id));
  };

  const handleAgentContextChange = (data: AgentContextData) => {
    setAgentContext(data);
    setAgentDetailsChanged(true);
  };

  const handleSaveAgentDetails = () => {
    // Save to localStorage
    if (id) {
      const savedData = localStorage.getItem(`service_${id}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        data.name = serviceName;
        data.redisUrl = redisUrl;
        data.agentPurpose = agentContext.purpose;
        data.memoryGoals = agentContext.goals;
        data.exampleMemories = agentContext.exampleMemories;
        localStorage.setItem(`service_${id}`, JSON.stringify(data));
      }
    }

    // Show recommendation dialog if details changed
    if (agentDetailsChanged) {
      setShowSchemaRecommendationDialog(true);
      setAgentDetailsChanged(false);
    }
  };

  const handleRegenerateSchemas = () => {
    // TODO: Implement schema regeneration based on updated agent details
    // This would call the AI to regenerate schemas
    setShowSchemaRecommendationDialog(false);
    alert("Schema regeneration will be implemented soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Breadcrumb */}
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{serviceName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
            <Button variant="hero" className="gap-2">
              <Save className="h-5 w-5" />
              Save Configuration
            </Button>
          </div>

          {/* Configuration Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto">
              <TabsTrigger value="agent-details" className="gap-2 data-[state=active]:bg-primary/20">
                <User className="h-4 w-4" />
                Agent Details
              </TabsTrigger>
              <TabsTrigger value="short-term" className="gap-2 data-[state=active]:bg-primary/20">
                <Clock className="h-4 w-4" />
                Short-Term Memory
              </TabsTrigger>
              <TabsTrigger value="long-term" className="gap-2 data-[state=active]:bg-primary/20">
                <Brain className="h-4 w-4" />
                Long-Term Memory
              </TabsTrigger>
              <TabsTrigger value="api-integration" className="gap-2 data-[state=active]:bg-primary/20">
                <Code className="h-4 w-4" />
                API Integration
              </TabsTrigger>
            </TabsList>

            {/* Agent Details Tab */}
            <TabsContent value="agent-details" className="space-y-6 animate-fade-in">
              {/* Service Configuration */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">Service Configuration</h2>
                    <p className="text-sm text-muted-foreground">
                      Basic service settings including name and Redis connection
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service ID</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={id || ''}
                        readOnly
                        className="flex-1 px-3 py-2 bg-secondary/30 border border-border/50 rounded-lg font-mono text-sm text-muted-foreground cursor-not-allowed"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(id || '');
                          setCopiedEndpoint('service-id');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'service-id' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is your unique service ID (auto-generated, cannot be changed)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Name</label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="my-agent-memory"
                    />
                    <p className="text-xs text-muted-foreground">
                      Display name for your memory service (editable)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Redis URL</label>
                    <input
                      type="text"
                      value={redisUrl}
                      onChange={(e) => setRedisUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none font-mono text-sm"
                      placeholder="redis://default:password@host:port"
                    />
                    <p className="text-xs text-muted-foreground">
                      Redis connection URL (required for memory storage)
                    </p>
                  </div>
                </div>
              </div>

              <AgentContextBuilder
                data={agentContext}
                onChange={handleAgentContextChange}
              />

              <div className="flex justify-end">
                <Button
                  variant="hero"
                  className="gap-2"
                  onClick={handleSaveAgentDetails}
                >
                  <Save className="h-5 w-5" />
                  Save Agent Details
                </Button>
              </div>
            </TabsContent>

            {/* Short-Term Memory Tab */}
            <TabsContent value="short-term" className="space-y-6 animate-fade-in">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">Short-Term Memory</h2>
                    <p className="text-sm text-muted-foreground">
                      Temporary session-based memory that persists during active conversations. 
                      This data is typically cleared after session timeout.
                    </p>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Default Schema Loaded</p>
                    <p className="text-muted-foreground">
                      The default schema includes essential fields. Modify as needed for your use case.
                    </p>
                  </div>
                </div>

                <SchemaBuilder
                  title="Session Schema"
                  description="Define the structure of short-term memory data"
                  fields={shortTermFields}
                  onChange={setShortTermFields}
                />
              </div>
            </TabsContent>

            {/* Long-Term Memory Tab */}
            <TabsContent value="long-term" className="space-y-6 animate-fade-in">
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
                    <h3 className="font-semibold text-lg">Your Memory Buckets</h3>
                    <p className="text-sm text-muted-foreground">
                      Create custom buckets for your agent's specific needs
                    </p>
                  </div>
                  <Button variant="outline" onClick={addCustomBucket} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bucket
                  </Button>
                </div>

                {customBuckets.map((bucket) => (
                  <MemoryBucketCard
                    key={bucket.id}
                    bucket={bucket}
                    onUpdate={updateBucket}
                    onDelete={deleteBucket}
                  />
                ))}
              </div>
            </TabsContent>

            {/* API Integration Tab */}
            <TabsContent value="api-integration" className="space-y-8 animate-fade-in">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">Memory Flow Journey</h3>
                    <p className="text-sm text-muted-foreground">
                      Follow the numbered steps below to understand how your agent interacts with the memory system.
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP 1: Store Conversation */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Store Conversation</h3>
                    <p className="text-sm text-muted-foreground">Agent → Short-Term Memory</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                  Your agent calls this endpoint after each conversation turn to store the interaction in short-term memory.
                </p>

                <div className="glass-card p-6 rounded-xl space-y-3 ml-13">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-success/20 text-success rounded text-xs font-mono font-semibold">
                        POST
                      </div>
                      <code className="text-sm">/short-term/store</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`POST /short-term/store`);
                        setCopiedEndpoint('short-store');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'short-store' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Store conversation data in short-term memory</p>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
{`{
  "user_id": "user_123",
  "session_id": "session_456",
  "data": {
    "message": "User's message",
    "response": "Agent's response",
    "timestamp": "2024-01-07T12:00:00Z"
    // ... other short-term schema fields
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* STEP 2: Retrieve Context */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Retrieve Context</h3>
                    <p className="text-sm text-muted-foreground">Agent ← Short-Term + Long-Term Memory</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                  Your agent retrieves both recent conversations and persistent memories together to get full context.
                </p>

                {/* Short-Term Retrieve */}
                <div className="ml-13 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Recent Conversations</h4>
                  </div>
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-semibold">
                          GET
                        </div>
                        <code className="text-sm">/short-term/retrieve</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`GET /short-term/retrieve?user_id=user_123&session_id=session_456`);
                          setCopiedEndpoint('short-retrieve');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'short-retrieve' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Get conversation history from current session</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`Query Parameters:
  user_id: string (required)
  session_id: string (required)

Response:
{
  "conversations": [
    {
      "message": "User's message",
      "response": "Agent's response",
      "timestamp": "2024-01-07T12:00:00Z"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Long-Term Retrieve */}
                <div className="ml-13 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Persistent Memories</h4>
                  </div>
                  <div className="glass-card p-6 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-semibold">
                          GET
                        </div>
                        <code className="text-sm">/long-term/retrieve</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`GET /long-term/retrieve?user_id=user_123&bucket_name=user_preferences`);
                          setCopiedEndpoint('long-retrieve');
                          setTimeout(() => setCopiedEndpoint(null), 2000);
                        }}
                      >
                        {copiedEndpoint === 'long-retrieve' ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Get long-term memories from specific buckets</p>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
{`Query Parameters:
  user_id: string (required)
  bucket_name: string (optional, e.g., "user_preferences", "facts")

Response:
{
  "memories": [
    {
      "id": "mem_123",
      "bucket": "user_preferences",
      "data": { /* bucket schema fields */ },
      "created_at": "2024-01-07T12:00:00Z",
      "updated_at": "2024-01-07T12:00:00Z"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: Automatic Processing */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center font-bold text-warning">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Automatic Processing</h3>
                    <p className="text-sm text-muted-foreground">Redis → Long-Term Memory</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                  Redis automatically processes short-term conversations and creates long-term memories. No action needed from your agent.
                </p>

                <div className="bg-warning/5 border border-warning/20 rounded-lg p-5 ml-13">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-3">
                      <div>
                        <p className="font-medium text-warning mb-1">How Redis Processes Memories</p>
                        <p className="text-muted-foreground">
                          Redis runs in the background, analyzing short-term conversations and automatically managing long-term memory buckets.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">What Redis Does:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Reads short-term conversation data</li>
                          <li>Applies your agent's purpose and goals</li>
                          <li>Uses memory bucket schemas and examples</li>
                          <li>Automatically stores, updates, or deletes long-term memories</li>
                        </ul>
                      </div>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">No API calls needed</strong> - This happens automatically based on your configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </TabsContent>

          </Tabs>
        </div>
      </main>

      {/* Schema Recommendation Dialog */}
      <AlertDialog open={showSchemaRecommendationDialog} onOpenChange={setShowSchemaRecommendationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Update Memory Schemas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've updated your agent details. Would you like us to recommend changes to your memory schemas based on the new agent purpose and goals?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Current Schemas</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateSchemas} className="bg-primary hover:bg-primary/90">
              Yes, Recommend Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceConfig;
