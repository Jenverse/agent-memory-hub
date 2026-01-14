import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Database, Clock, Brain, FileText, Info, Lock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { serviceAPI } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";

// Fixed schema structure (AWS-style)
const FIXED_SHORT_TERM_SCHEMA = {
  description: "Raw conversation events organized by session",
  fields: [
    { name: "user_id", type: "string", description: "Unique user identifier" },
    { name: "session_id", type: "string", description: "Unique session identifier" },
    { name: "role", type: "string", description: "Message role (USER, ASSISTANT, TOOL)" },
    { name: "text", type: "string", description: "The message content" },
    { name: "timestamp", type: "number", description: "Unix timestamp in milliseconds" },
  ]
};

// AWS AgentCore Memory extraction types
const FIXED_LONG_TERM_BUCKETS = [
  {
    name: "semantic",
    icon: "🧠",
    description: "Facts, knowledge, and preferences extracted from conversations",
    example: '"User works at Acme Corp", "Prefers Python over JavaScript", "Budget is $50k"',
  },
  {
    name: "episodic",
    icon: "📅",
    description: "Past events, experiences, and interactions the user has had",
    example: '"Had a demo call last Tuesday", "Visited Paris in 2023", "Attended AWS re:Invent"',
  },
  {
    name: "procedural",
    icon: "📋",
    description: "How-to knowledge and processes learned during conversations",
    example: '"Prefers 3-step explanations", "Likes code examples first", "Wants summary at end"',
  },
];

const CreateServiceFixed = () => {
  const navigate = useNavigate();
  const [serviceName, setServiceName] = useState("");
  const [redisUrl, setRedisUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!serviceName || !redisUrl) return;
    
    setIsCreating(true);
    
    // Build the fixed schema structure
    const serviceConfig = {
      id: Date.now().toString(),
      name: serviceName,
      redisUrl,
      serviceType: "fixed", // Mark as fixed type
      agentPurpose: "Fixed schema memory service (AWS-style)",
      memoryGoals: ["Facts extraction", "Preferences extraction", "Session summaries"],
      schemas: {
        shortTermFields: FIXED_SHORT_TERM_SCHEMA.fields.map((f, i) => ({
          id: `st-${i}`,
          name: f.name,
          type: f.type,
          required: true,
          description: f.description,
        })),
        longTermBuckets: FIXED_LONG_TERM_BUCKETS.map((bucket, i) => ({
          id: `bucket-${i}`,
          name: bucket.name,
          description: bucket.description,
          isUnstructured: true, // Text-based like AWS
          schema: [
            { id: "1", name: "content", type: "string", required: true, description: "The extracted memory text" },
            { id: "2", name: "timestamp", type: "string", required: false, description: "When this was extracted" },
          ],
        })),
      },
    };

    try {
      const response = await serviceAPI.create(serviceConfig);

      if (response.success) {
        toast.success(`Service "${serviceName}" created successfully!`);
        localStorage.setItem(`service_${serviceConfig.id}`, JSON.stringify(serviceConfig));
        const serviceIds = JSON.parse(localStorage.getItem("service_ids") || "[]");
        serviceIds.push(serviceConfig.id);
        localStorage.setItem("service_ids", JSON.stringify(serviceIds));
        navigate("/dashboard");
      } else {
        toast.error(`Failed to create service: ${response.error}`);
      }
    } catch (error) {
      toast.error("Failed to create service. Check console for details.");
      console.error("Service creation error:", error);
    } finally {
      setIsCreating(false);
    }
  };

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
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Fixed Memory Service</h1>
                <p className="text-sm text-muted-foreground">
                  AWS-style predefined schema (Facts, Preferences, Summary)
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Fixed Schema Structure</h3>
                <p className="text-sm text-muted-foreground">
                  This service type uses a predefined schema similar to AWS AgentCore Memory. 
                  You cannot customize the fields - just provide your service name and Redis URL.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-8 mb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                placeholder="my-agent-memory"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary"
              />
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
            </div>
          </div>

          {/* Fixed Schema Display */}
          <div className="space-y-6 mb-8">
            {/* Short-Term Memory */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Short-Term Memory</h3>
                  <p className="text-sm text-muted-foreground">{FIXED_SHORT_TERM_SCHEMA.description}</p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Field</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIXED_SHORT_TERM_SCHEMA.fields.map((field) => (
                      <tr key={field.name} className="border-t border-border/30">
                        <td className="py-2 font-mono text-primary">{field.name}</td>
                        <td className="py-2 text-muted-foreground">{field.type}</td>
                        <td className="py-2 text-muted-foreground">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Long-Term Memory */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Long-Term Memory</h3>
                  <p className="text-sm text-muted-foreground">3 predefined buckets for extracted insights</p>
                </div>
              </div>

              <div className="grid gap-4">
                {FIXED_LONG_TERM_BUCKETS.map((bucket) => (
                  <div key={bucket.name} className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{bucket.icon}</span>
                      <span className="font-semibold capitalize">{bucket.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{bucket.description}</p>
                    <div className="bg-background/50 rounded p-2">
                      <p className="text-xs font-mono text-muted-foreground">
                        Example: {bucket.example}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <Button
              variant="hero"
              onClick={handleCreate}
              disabled={!serviceName || !redisUrl || isCreating}
              className="gap-2"
            >
              {isCreating ? "Creating..." : "Create Service"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateServiceFixed;

