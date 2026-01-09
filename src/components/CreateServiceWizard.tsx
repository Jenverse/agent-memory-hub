import { useState } from "react";
import { X, Database, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/sonner";

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

interface GeneratedSchemas {
  shortTermFields: SchemaField[];
  longTermBuckets: MemoryBucket[];
}

interface CreateServiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    redisUrl: string,
    agentPurpose: string,
    memoryGoals: string[],
    schemas: GeneratedSchemas
  ) => void;
}

const CreateServiceWizard = ({ isOpen, onClose, onCreate }: CreateServiceWizardProps) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Basic Info
  const [serviceName, setServiceName] = useState("");
  const [redisUrl, setRedisUrl] = useState("");

  // Step 2: Agent Context
  const [agentPurpose, setAgentPurpose] = useState("");
  const [memoryDescription, setMemoryDescription] = useState("");

  // Step 3 & 4: Generated Schemas
  const [generatedSchemas, setGeneratedSchemas] = useState<GeneratedSchemas | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!serviceName.trim()) {
        toast.error("Please enter a service name");
        return;
      }
      if (!redisUrl.trim()) {
        toast.error("Please enter a Redis URL");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!agentPurpose.trim()) {
        toast.error("Please describe your agent's purpose");
        return;
      }
      if (!memoryDescription.trim()) {
        toast.error("Please describe what memories should be stored");
        return;
      }
      generateSchemas();
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    if (generatedSchemas) {
      const goals = memoryDescription.split('\n').filter(g => g.trim());
      onCreate(serviceName, redisUrl, agentPurpose, goals, generatedSchemas);
      resetWizard();
      onClose();
    }
  };

  const resetWizard = () => {
    setStep(1);
    setServiceName("");
    setRedisUrl("");
    setAgentPurpose("");
    setMemoryDescription("");
    setGeneratedSchemas(null);
    setIsGenerating(false);
  };

  const generateSchemas = async () => {
    setIsGenerating(true);
    setStep(3);

    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      toast.error("Please configure your OpenAI API key in settings");
      setIsGenerating(false);
      setStep(2);
      return;
    }

    try {
      const prompt = constructPrompt();
      const response = await callOpenAI(apiKey, prompt);
      setGeneratedSchemas(response);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating schemas:", error);
      toast.error("Failed to generate schemas. Please try again.");
      setIsGenerating(false);
      setStep(2);
    }
  };

  const constructPrompt = () => {
    return `You are a memory schema architect for AI agents. Based on the following information, generate a comprehensive memory structure.

Service Name: ${serviceName}
Agent Purpose: ${agentPurpose}
Memory Requirements: ${memoryDescription}

Generate a JSON response with the following structure:
{
  "shortTermFields": [
    {"id": "unique-id", "name": "field_name", "type": "string|number|boolean|array|object", "required": true|false, "description": "what this field stores"}
  ],
  "longTermBuckets": [
    {"id": "unique-id", "name": "bucket_name", "description": "what this bucket stores", "schema": [/* array of fields like shortTermFields */]}
  ]
}

Guidelines:
- Short-term memory should include session-based data (session_id, messages, context, timestamps)
- Long-term memory buckets should be categorized (e.g., user_preferences, facts, habits, custom categories based on the agent's purpose)
- Each bucket should have 3-8 relevant fields
- Field names should be snake_case
- Include helpful descriptions
- Make it specific to the agent's purpose

Return ONLY valid JSON, no markdown or explanations.`;
  };

  const callOpenAI = async (apiKey: string, prompt: string): Promise<GeneratedSchemas> => {
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
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
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
              className={`w-12 h-0.5 ${
                s < step ? "bg-primary/30" : "bg-secondary"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-8 w-full max-w-2xl mx-4 animate-fade-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create New Service</h2>
            <p className="text-sm text-muted-foreground">
              Step {step} of 4: {
                step === 1 ? "Basic Information" :
                step === 2 ? "Agent Context" :
                step === 3 ? "Generating Schemas" :
                "Review & Confirm"
              }
            </p>
          </div>
        </div>

        {renderStepIndicator()}

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
                className="bg-secondary/50 border-border/50 focus:border-primary min-h-[120px]"
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
                className="bg-secondary/50 border-border/50 focus:border-primary min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                List the types of information your agent should remember (one per line)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Generating Schemas */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating Your Memory Schemas</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Our AI is analyzing your agent's purpose and creating optimized memory structures...
            </p>
          </div>
        )}

        {/* Step 4: Review & Confirm - Will be added next */}
        {step === 4 && generatedSchemas && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Schemas Generated!</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the AI-generated memory structure below. You can edit these after creation.
                  </p>
                </div>
              </div>
            </div>

            {/* Schema preview will be added */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Short-Term Memory Fields</h4>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {generatedSchemas.shortTermFields.length} fields generated
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Long-Term Memory Buckets</h4>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {generatedSchemas.longTermBuckets.length} buckets generated
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6 border-t border-border/50 mt-6">
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
          {step < 4 && step !== 3 && (
            <Button
              type="button"
              variant="hero"
              onClick={handleNext}
              className="gap-2"
            >
              {step === 2 ? "Generate Schemas" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 4 && (
            <Button
              type="button"
              variant="hero"
              onClick={handleFinish}
              className="gap-2"
            >
              Create Service
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateServiceWizard;

