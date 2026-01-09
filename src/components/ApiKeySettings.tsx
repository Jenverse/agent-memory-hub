import { useState, useEffect } from "react";
import { Key, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/sonner";

const ApiKeySettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      toast.error("Invalid OpenAI API key format");
      return;
    }

    localStorage.setItem("openai_api_key", apiKey);
    setIsSaved(true);
    toast.success("API key saved successfully");
  };

  const handleClear = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setIsSaved(false);
    toast.success("API key cleared");
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Key className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">OpenAI API Key</h3>
          <p className="text-sm text-muted-foreground">
            Required for AI-powered schema generation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsSaved(false);
              }}
              className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            variant={isSaved ? "secondary" : "hero"}
            className="gap-2 flex-1"
            disabled={!apiKey.trim()}
          >
            <Save className="h-4 w-4" />
            {isSaved ? "Saved" : "Save API Key"}
          </Button>
          {isSaved && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 text-sm">
          <p className="text-muted-foreground">
            Don't have an API key?{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get one from OpenAI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;

