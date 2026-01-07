import { useState } from "react";
import { Plus, Trash2, Lightbulb, Target, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type MemoryAction = "store" | "update" | "delete";

interface ExampleMemory {
  id: string;
  userMessage: string;
  extractedMemory: string;
  memoryType: "preference" | "fact" | "custom";
  action: MemoryAction;
}

interface AgentContextData {
  purpose: string;
  goals: string[];
  exampleMemories: ExampleMemory[];
}

interface AgentContextBuilderProps {
  data: AgentContextData;
  onChange: (data: AgentContextData) => void;
}

const AgentContextBuilder = ({ data, onChange }: AgentContextBuilderProps) => {
  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    if (newGoal.trim()) {
      onChange({
        ...data,
        goals: [...data.goals, newGoal.trim()],
      });
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    onChange({
      ...data,
      goals: data.goals.filter((_, i) => i !== index),
    });
  };

  const addExampleMemory = (action: MemoryAction = "store") => {
    const newExample: ExampleMemory = {
      id: `example-${Date.now()}`,
      userMessage: "",
      extractedMemory: "",
      memoryType: "fact",
      action,
    };
    onChange({
      ...data,
      exampleMemories: [...data.exampleMemories, newExample],
    });
  };

  const updateExampleMemory = (id: string, updates: Partial<ExampleMemory>) => {
    onChange({
      ...data,
      exampleMemories: data.exampleMemories.map((ex) =>
        ex.id === id ? { ...ex, ...updates } : ex
      ),
    });
  };

  const removeExampleMemory = (id: string) => {
    onChange({
      ...data,
      exampleMemories: data.exampleMemories.filter((ex) => ex.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      {/* Agent Purpose */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg mb-1">Agent Purpose</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Describe what your agent does. This helps the memory extraction system understand context.
            </p>
            <Textarea
              placeholder="e.g., I am a travel planning assistant that helps users plan trips, book accommodations, and discover destinations based on their preferences and budget."
              value={data.purpose}
              onChange={(e) => onChange({ ...data, purpose: e.target.value })}
              className="min-h-[120px] bg-secondary/50 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Memory Goals */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg mb-1">Memory Goals</h2>
            <p className="text-sm text-muted-foreground mb-4">
              What types of information should your agent remember? Be specific about what's valuable.
            </p>

            <div className="space-y-3">
              {data.goals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3"
                >
                  <span className="flex-1 text-sm">{goal}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGoal(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Remember user's travel preferences like preferred airlines, seat choices"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  className="bg-secondary/50 border-border/50"
                />
                <Button variant="outline" onClick={addGoal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Memories */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-lg">Memory Lifecycle Examples</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addExampleMemory("store")} className="gap-1.5 text-success border-success/30 hover:bg-success/10">
                  <Plus className="h-3.5 w-3.5" />
                  Store
                </Button>
                <Button variant="outline" size="sm" onClick={() => addExampleMemory("update")} className="gap-1.5 text-warning border-warning/30 hover:bg-warning/10">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Update
                </Button>
                <Button variant="outline" size="sm" onClick={() => addExampleMemory("delete")} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Provide examples of user messages and the expected action. This trains the LLM to handle store, update, and delete operations.
            </p>

            <div className="space-y-4">
              {data.exampleMemories.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border/50 rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    No examples yet. Add examples for store, update, and delete operations.
                  </p>
                </div>
              ) : (
                data.exampleMemories.map((example) => {
                  const actionStyles = {
                    store: "border-l-success bg-success/5",
                    update: "border-l-warning bg-warning/5",
                    delete: "border-l-destructive bg-destructive/5",
                  };
                  const actionLabels = {
                    store: { text: "STORE", color: "text-success" },
                    update: { text: "UPDATE", color: "text-warning" },
                    delete: { text: "DELETE", color: "text-destructive" },
                  };
                  
                  return (
                    <div
                      key={example.id}
                      className={`rounded-lg p-4 space-y-4 border-l-4 ${actionStyles[example.action]}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold ${actionLabels[example.action].color}`}>
                              {actionLabels[example.action].text}
                            </span>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                              User Message
                            </Label>
                            <Input
                              placeholder={
                                example.action === "store" 
                                  ? 'e.g., "I have 2 kids and we usually travel during summer break"'
                                  : example.action === "update"
                                  ? 'e.g., "Actually, I have 3 kids now"'
                                  : 'e.g., "Please forget that I mentioned my travel dates"'
                              }
                              value={example.userMessage}
                              onChange={(e) =>
                                updateExampleMemory(example.id, {
                                  userMessage: e.target.value,
                                })
                              }
                              className="bg-background/50 border-border/50"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                              {example.action === "delete" ? "Memory to Delete" : "Extracted Memory"}
                            </Label>
                            <Input
                              placeholder={
                                example.action === "store"
                                  ? 'e.g., "User has 2 children; prefers summer travel"'
                                  : example.action === "update"
                                  ? 'e.g., "Update: User now has 3 children (was 2)"'
                                  : 'e.g., "Delete memory about user\'s travel dates"'
                              }
                              value={example.extractedMemory}
                              onChange={(e) =>
                                updateExampleMemory(example.id, {
                                  extractedMemory: e.target.value,
                                })
                              }
                              className="bg-background/50 border-border/50"
                            />
                          </div>
                          {example.action !== "delete" && (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                Memory Type
                              </Label>
                              <select
                                value={example.memoryType}
                                onChange={(e) =>
                                  updateExampleMemory(example.id, {
                                    memoryType: e.target.value as "preference" | "fact" | "custom",
                                  })
                                }
                                className="w-full h-10 px-3 rounded-md bg-background/50 border border-border/50 text-sm"
                              >
                                <option value="preference">User Preference</option>
                                <option value="fact">Fact</option>
                                <option value="custom">Custom Bucket</option>
                              </select>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExampleMemory(example.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          How Memory Lifecycle Works
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• <strong>Short-term memory</strong> captures all conversation data in real-time</li>
          <li>• A <strong>background job</strong> runs LLM analysis using your context and examples</li>
          <li>• The LLM determines whether to <strong className="text-success">store</strong>, <strong className="text-warning">update</strong>, or <strong className="text-destructive">delete</strong> memories</li>
          <li>• <strong>Store:</strong> New information is embedded and saved to long-term memory</li>
          <li>• <strong>Update:</strong> Existing memories are modified when user corrects information</li>
          <li>• <strong>Delete:</strong> Memories are removed when user requests to forget or data expires</li>
          <li>• Future prompts trigger <strong>semantic search</strong> to retrieve relevant memories</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentContextBuilder;
