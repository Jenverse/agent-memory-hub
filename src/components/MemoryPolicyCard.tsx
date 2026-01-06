import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Trash2, Edit3, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface PolicyRule {
  id: string;
  type: "store" | "delete" | "edit";
  condition: string;
  enabled: boolean;
}

interface MemoryPolicyCardProps {
  title: string;
  description: string;
  rules: PolicyRule[];
  onChange: (rules: PolicyRule[]) => void;
}

const MemoryPolicyCard = ({ title, description, rules, onChange }: MemoryPolicyCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const addRule = (type: PolicyRule["type"]) => {
    const newRule: PolicyRule = {
      id: `rule-${Date.now()}`,
      type,
      condition: "",
      enabled: true,
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<PolicyRule>) => {
    onChange(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter(r => r.id !== id));
  };

  const typeIcons = {
    store: <PlusCircle className="h-4 w-4 text-success" />,
    delete: <Trash2 className="h-4 w-4 text-destructive" />,
    edit: <Edit3 className="h-4 w-4 text-warning" />,
  };

  const typeLabels = {
    store: "Store when...",
    delete: "Delete when...",
    edit: "Edit when...",
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addRule("store")}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4 text-success" />
              Store Rule
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addRule("edit")}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4 text-warning" />
              Edit Rule
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addRule("delete")}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete Rule
            </Button>
          </div>

          {rules.length > 0 && (
            <div className="space-y-3 pt-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className="p-4 bg-secondary/30 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[rule.type]}
                      <span className="text-sm font-medium">{typeLabels[rule.type]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(rule.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="e.g., User explicitly states a preference or fact about themselves"
                    value={rule.condition}
                    onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                    className="bg-secondary/50 border-border/50 text-sm min-h-[60px]"
                  />
                </div>
              ))}
            </div>
          )}

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No rules configured. Add rules to control memory behavior.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryPolicyCard;
