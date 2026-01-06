import { useState } from "react";
import { Folder, Settings, Trash2, ChevronDown, ChevronUp, Database } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import SchemaBuilder from "./SchemaBuilder";

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

interface MemoryBucketCardProps {
  bucket: MemoryBucket;
  onUpdate: (bucket: MemoryBucket) => void;
  onDelete: (id: string) => void;
}

const MemoryBucketCard = ({ bucket, onUpdate, onDelete }: MemoryBucketCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">{bucket.name || "Unnamed Bucket"}</h4>
            <p className="text-xs text-muted-foreground">
              {bucket.schema.length} fields configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bucket.id);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bucket Name</label>
              <Input
                value={bucket.name}
                onChange={(e) => onUpdate({ ...bucket, name: e.target.value })}
                placeholder="e.g., user_habits"
                className="bg-secondary/50 border-border/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={bucket.description}
                onChange={(e) => onUpdate({ ...bucket, description: e.target.value })}
                placeholder="What this bucket stores..."
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="pt-4">
            <SchemaBuilder
              title="Bucket Schema"
              description="Define the structure of data stored in this bucket"
              fields={bucket.schema}
              onChange={(schema) => onUpdate({ ...bucket, schema })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryBucketCard;
