import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Database, Save, Clock, Brain, AlertCircle, Code, Copy, Check, Loader2 } from "lucide-react";
import { serviceAPI } from "@/lib/api-client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const ServiceConfig = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "short-term");
  const [serviceName, setServiceName] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Short-term memory schema
  const [shortTermFields, setShortTermFields] = useState<SchemaField[]>([]);

  // Memory buckets (long-term)
  const [customBuckets, setCustomBuckets] = useState<MemoryBucket[]>([]);

  // Load service config from backend API
  useEffect(() => {
    const loadServiceConfig = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        // Load from backend API
        const response = await serviceAPI.get(id);

        if (response.success && response.data) {
          const data = response.data;

          // Set service name
          setServiceName(data.name || "Unnamed Service");

          // Set short-term fields
          if (data.schemas?.shortTermFields) {
            setShortTermFields(data.schemas.shortTermFields);
          }

          // Set all long-term buckets
          if (data.schemas?.longTermBuckets) {
            setCustomBuckets(data.schemas.longTermBuckets);
          }

          // Also cache to localStorage
          localStorage.setItem(`service_${id}`, JSON.stringify(data));
        } else {
          setLoadError(response.error || "Failed to load service");
        }
      } catch (error) {
        console.error("Error loading service:", error);
        setLoadError("Failed to load service configuration");
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceConfig();
  }, [id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading service configuration...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="glass-card rounded-xl p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Service</h2>
              <p className="text-muted-foreground">{loadError}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">AWS AgentCore Memory Schema</p>
                    <p className="text-muted-foreground">
                      This service uses the fixed AWS-style schema. Schema cannot be modified.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">Schema Fields (Read-only)</h3>
                  <div className="bg-secondary/30 rounded-lg divide-y divide-border/30">
                    {shortTermFields.map((field) => (
                      <div key={field.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">{field.name}</code>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded">{field.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{(field as any).description || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                      AWS AgentCore Memory extraction types: semantic, episodic, and procedural memories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Fixed Memory Strategies</p>
                  <p className="text-muted-foreground">
                    This service uses the AWS AgentCore Memory structure with 4 built-in strategies. Strategies cannot be modified.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Memory Strategies (Read-only)</h3>
                <div className="grid gap-4">
                  {customBuckets.map((bucket) => (
                    <div key={bucket.id} className="bg-secondary/30 rounded-xl p-5 border border-border/30">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                          {bucket.name === 'user_preferences' ? '⭐' :
                           bucket.name === 'semantic' ? '🧠' :
                           bucket.name === 'summary' ? '📝' :
                           bucket.name === 'episodic' ? '📅' : '📋'}
                        </span>
                        <div>
                          <h4 className="font-semibold">{bucket.name}</h4>
                          <p className="text-sm text-muted-foreground">{bucket.description}</p>
                        </div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Memory Record Schema:</p>
                        <div className="flex flex-wrap gap-2">
                          {bucket.schema.map((field) => (
                            <span key={field.id} className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                              {field.name}: {field.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* API Integration Tab */}
            <TabsContent value="api-integration" className="space-y-8 animate-fade-in">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">API Endpoints Reference</h3>
                    <p className="text-sm text-muted-foreground">
                      Base URL: <code className="bg-secondary px-2 py-0.5 rounded">/api/services/{id}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Events (Short-Term Memory) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Events (Short-Term Memory)</h3>
                    <p className="text-sm text-muted-foreground">Store and retrieve conversation events</p>
                  </div>
                </div>

                {/* POST /events */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-success/20 text-success rounded text-xs font-mono font-semibold">
                        POST
                      </div>
                      <code className="text-sm">/api/services/{id}/events</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`POST /api/services/${id}/events`);
                        setCopiedEndpoint('post-events');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'post-events' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Store a conversation event</p>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
{`// Request Body
{
  "userId": "user-123",
  "sessionId": "session-456",
  "role": "USER",              // USER | ASSISTANT | TOOL
  "text": "I'd like to book a flight to Paris",
  "timestamp": 1704628800000,  // Unix ms
  "metadata": {}               // Optional
}

// Response
{
  "eventId": "evt-abc123...",  // Auto-generated
  "userId": "user-123",
  "sessionId": "session-456",
  "role": "USER",
  "text": "I'd like to book a flight to Paris",
  "timestamp": 1704628800000
}`}
                    </pre>
                  </div>
                </div>

                {/* GET /events */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-semibold">
                        GET
                      </div>
                      <code className="text-sm">/api/services/{id}/events</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`GET /api/services/${id}/events?userId=user-123&sessionId=session-456`);
                        setCopiedEndpoint('get-events');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'get-events' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">List events for a user/session</p>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
{`// Query Parameters
userId: string (required)
sessionId: string (optional)

// Response
{
  "events": [
    {
      "eventId": "evt-abc123...",
      "userId": "user-123",
      "sessionId": "session-456",
      "role": "USER",
      "text": "I'd like to book a flight to Paris",
      "timestamp": 1704628800000
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                {/* DELETE /events/{eventId} */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs font-mono font-semibold">
                        DELETE
                      </div>
                      <code className="text-sm">/api/services/{id}/events/{'{eventId}'}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`DELETE /api/services/${id}/events/{eventId}`);
                        setCopiedEndpoint('delete-event');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'delete-event' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Delete a specific event</p>
                </div>
              </div>

              {/* Memory Records (Long-Term Memory) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Memory Records (Long-Term Memory)</h3>
                    <p className="text-sm text-muted-foreground">Store and retrieve extracted memories</p>
                  </div>
                </div>

                {/* GET /records */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-semibold">
                        GET
                      </div>
                      <code className="text-sm">/api/services/{id}/records</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`GET /api/services/${id}/records?userId=user-123&memoryType=user_preferences`);
                        setCopiedEndpoint('get-records');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'get-records' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">List memory records by user and type</p>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
{`// Query Parameters
userId: string (required)
memoryType: string (optional)  // user_preferences | semantic | summary | episodic

// Response
{
  "records": [
    {
      "memoryRecordId": "mem-xyz789...",
      "memoryType": "user_preferences",
      "userId": "user-123",
      "content": { "text": "prefers window seats" },
      "createdAt": "2024-01-07T12:00:00Z",
      "metadata": {}
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                {/* POST /records/retrieve */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-success/20 text-success rounded text-xs font-mono font-semibold">
                        POST
                      </div>
                      <code className="text-sm">/api/services/{id}/records/retrieve</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`POST /api/services/${id}/records/retrieve`);
                        setCopiedEndpoint('retrieve-records');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'retrieve-records' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Semantic search for relevant memories</p>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
{`// Request Body
{
  "userId": "user-123",
  "query": "What are the user's food preferences?",
  "memoryType": "user_preferences",  // Optional
  "maxResults": 10                   // Optional
}

// Response
{
  "records": [
    {
      "memoryRecordId": "mem-xyz789...",
      "memoryType": "user_preferences",
      "userId": "user-123",
      "content": { "text": "prefers Italian food" },
      "createdAt": "2024-01-07T12:00:00Z",
      "relevanceScore": 0.95
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                {/* DELETE /records/{recordId} */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs font-mono font-semibold">
                        DELETE
                      </div>
                      <code className="text-sm">/api/services/{id}/records/{'{recordId}'}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`DELETE /api/services/${id}/records/{recordId}`);
                        setCopiedEndpoint('delete-record');
                        setTimeout(() => setCopiedEndpoint(null), 2000);
                      }}
                    >
                      {copiedEndpoint === 'delete-record' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Delete a specific memory record</p>
                </div>
              </div>

              {/* Automatic Extraction Note */}
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-warning">Automatic Memory Extraction</p>
                    <p className="text-muted-foreground">
                      Long-term memories are automatically extracted from events. You don't need to create them manually.
                      The system analyzes conversations and creates memory records for each type:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>user_preferences</strong> - Preferences and choices</li>
                      <li><strong>semantic</strong> - Facts and knowledge</li>
                      <li><strong>summary</strong> - Session summaries</li>
                      <li><strong>episodic</strong> - Structured episodes</li>
                    </ul>
                  </div>
                </div>
              </div>

            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ServiceConfig;
