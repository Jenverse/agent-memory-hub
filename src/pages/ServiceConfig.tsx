import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Database, Save, Plus, Clock, Brain, Settings, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchemaBuilder from "@/components/SchemaBuilder";
import MemoryPolicyCard from "@/components/MemoryPolicyCard";
import MemoryBucketCard from "@/components/MemoryBucketCard";

interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
}

interface PolicyRule {
  id: string;
  type: "store" | "delete" | "edit";
  condition: string;
  enabled: boolean;
}

interface MemoryBucket {
  id: string;
  name: string;
  description: string;
  schema: SchemaField[];
}

const ServiceConfig = () => {
  const { id } = useParams();
  
  // Short-term memory schema with defaults
  const [shortTermFields, setShortTermFields] = useState<SchemaField[]>([
    { id: "st-1", name: "session_id", type: "string", required: true },
    { id: "st-2", name: "messages", type: "array", required: true },
    { id: "st-3", name: "context", type: "object", required: false },
    { id: "st-4", name: "last_updated", type: "string", required: true },
  ]);

  // Long-term: User Preferences schema
  const [preferencesFields, setPreferencesFields] = useState<SchemaField[]>([
    { id: "pref-1", name: "user_id", type: "string", required: true },
    { id: "pref-2", name: "language", type: "string", required: false },
    { id: "pref-3", name: "timezone", type: "string", required: false },
    { id: "pref-4", name: "communication_style", type: "string", required: false },
    { id: "pref-5", name: "topics_of_interest", type: "array", required: false },
  ]);

  // Long-term: Facts schema
  const [factsFields, setFactsFields] = useState<SchemaField[]>([
    { id: "fact-1", name: "fact_id", type: "string", required: true },
    { id: "fact-2", name: "user_id", type: "string", required: true },
    { id: "fact-3", name: "content", type: "string", required: true },
    { id: "fact-4", name: "source", type: "string", required: false },
    { id: "fact-5", name: "confidence", type: "number", required: false },
    { id: "fact-6", name: "created_at", type: "string", required: true },
  ]);

  // Custom memory buckets
  const [customBuckets, setCustomBuckets] = useState<MemoryBucket[]>([]);

  // Memory policies
  const [storeRules, setStoreRules] = useState<PolicyRule[]>([
    { id: "sr-1", type: "store", condition: "User explicitly states a personal preference (e.g., 'I prefer...', 'I like...')", enabled: true },
    { id: "sr-2", type: "store", condition: "User shares a factual statement about themselves (e.g., name, job, location)", enabled: true },
  ]);

  const [editRules, setEditRules] = useState<PolicyRule[]>([
    { id: "er-1", type: "edit", condition: "User corrects previously stored information (e.g., 'Actually, my name is...')", enabled: true },
  ]);

  const [deleteRules, setDeleteRules] = useState<PolicyRule[]>([
    { id: "dr-1", type: "delete", condition: "User explicitly requests to forget information (e.g., 'Forget that I said...')", enabled: true },
    { id: "dr-2", type: "delete", condition: "Information becomes stale after 90 days without access", enabled: false },
  ]);

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
                <h1 className="text-2xl font-bold">customer-support-agent</h1>
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
          <Tabs defaultValue="short-term" className="space-y-6">
            <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto">
              <TabsTrigger value="short-term" className="gap-2 data-[state=active]:bg-primary/20">
                <Clock className="h-4 w-4" />
                Short-Term Memory
              </TabsTrigger>
              <TabsTrigger value="long-term" className="gap-2 data-[state=active]:bg-primary/20">
                <Brain className="h-4 w-4" />
                Long-Term Memory
              </TabsTrigger>
              <TabsTrigger value="policies" className="gap-2 data-[state=active]:bg-primary/20">
                <Settings className="h-4 w-4" />
                Memory Policies
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
              {/* User Preferences */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">User Preferences</h2>
                    <p className="text-sm text-muted-foreground">
                      Persistent preferences learned about the user over time.
                    </p>
                  </div>
                </div>

                <SchemaBuilder
                  title="Preferences Schema"
                  description="Structure for storing user preferences"
                  fields={preferencesFields}
                  onChange={setPreferencesFields}
                />
              </div>

              {/* Facts */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">Facts</h2>
                    <p className="text-sm text-muted-foreground">
                      Factual information about the user that persists across sessions.
                    </p>
                  </div>
                </div>

                <SchemaBuilder
                  title="Facts Schema"
                  description="Structure for storing factual user information"
                  fields={factsFields}
                  onChange={setFactsFields}
                />
              </div>

              {/* Custom Buckets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">Custom Memory Buckets</h2>
                    <p className="text-sm text-muted-foreground">
                      Create additional memory categories specific to your agent
                    </p>
                  </div>
                  <Button variant="outline" onClick={addCustomBucket} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bucket
                  </Button>
                </div>

                {customBuckets.length > 0 ? (
                  <div className="space-y-4">
                    {customBuckets.map((bucket) => (
                      <MemoryBucketCard
                        key={bucket.id}
                        bucket={bucket}
                        onUpdate={updateBucket}
                        onDelete={deleteBucket}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No custom buckets yet. Add one to store specialized memory types.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Memory Policies Tab */}
            <TabsContent value="policies" className="space-y-6 animate-fade-in">
              <div className="glass-card rounded-xl p-6 mb-6">
                <h2 className="font-semibold text-lg mb-2">Memory Policies</h2>
                <p className="text-sm text-muted-foreground">
                  Define the rules that govern when your agent stores, edits, or deletes information 
                  in long-term memory. These policies help your agent make intelligent decisions about 
                  what to remember.
                </p>
              </div>

              <div className="space-y-4">
                <MemoryPolicyCard
                  title="Storage Rules"
                  description="When should the agent store new information?"
                  rules={storeRules}
                  onChange={setStoreRules}
                />

                <MemoryPolicyCard
                  title="Edit Rules"
                  description="When should the agent update existing memories?"
                  rules={editRules}
                  onChange={setEditRules}
                />

                <MemoryPolicyCard
                  title="Deletion Rules"
                  description="When should the agent remove stored information?"
                  rules={deleteRules}
                  onChange={setDeleteRules}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ServiceConfig;
