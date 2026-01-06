import { useState } from "react";
import { X, Database, Link as LinkIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, redisUrl: string) => void;
}

const CreateServiceModal = ({ isOpen, onClose, onCreate }: CreateServiceModalProps) => {
  const [name, setName] = useState("");
  const [redisUrl, setRedisUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && redisUrl) {
      onCreate(name, redisUrl);
      setName("");
      setRedisUrl("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-8 w-full max-w-lg mx-4 animate-fade-in">
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
            <p className="text-sm text-muted-foreground">Connect your Redis database for memory storage</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              placeholder="my-agent-memory"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier for your memory service
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redis-url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Redis Connection URL
            </Label>
            <Input
              id="redis-url"
              type="password"
              placeholder="redis://default:***@hostname:port"
              value={redisUrl}
              onChange={(e) => setRedisUrl(e.target.value)}
              className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your Redis database URL. Supports Redis Cloud, Upstash, or self-hosted.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={!name || !redisUrl}>
              Create Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceModal;
