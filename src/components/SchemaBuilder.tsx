import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
}

interface SchemaBuilderProps {
  title: string;
  description: string;
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

const SchemaBuilder = ({ title, description, fields, onChange }: SchemaBuilderProps) => {
  const addField = () => {
    const newField: SchemaField = {
      id: `field-${Date.now()}`,
      name: "",
      type: "string",
      required: false,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div 
            key={field.id}
            className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
            
            <Input
              placeholder="Field name"
              value={field.name}
              onChange={(e) => updateField(field.id, { name: e.target.value })}
              className="flex-1 bg-secondary/50 border-border/50 font-mono text-sm"
            />
            
            <Select 
              value={field.type}
              onValueChange={(value: SchemaField["type"]) => updateField(field.id, { type: value })}
            >
              <SelectTrigger className="w-32 bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="array">Array</SelectItem>
                <SelectItem value="object">Object</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-muted-foreground">Required</span>
            </label>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => removeField(field.id)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={addField}
        className="mt-4 gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
};

export default SchemaBuilder;
