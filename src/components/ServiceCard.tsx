import { Database, MoreVertical, Activity, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  id: string;
  name: string;
  status: "active" | "inactive" | "configuring";
  shortTermSchema: number;
  longTermBuckets: number;
  lastActive: string;
}

const ServiceCard = ({ id, name, status, shortTermSchema, longTermBuckets, lastActive }: ServiceCardProps) => {
  const statusColors = {
    active: "bg-success",
    inactive: "bg-muted-foreground",
    configuring: "bg-warning",
  };

  const statusLabels = {
    active: "Active",
    inactive: "Inactive",
    configuring: "Configuring",
  };

  return (
    <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Short-Term Fields</p>
          <p className="font-mono text-lg font-semibold">{shortTermSchema}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Memory Buckets</p>
          <p className="font-mono text-lg font-semibold">{longTermBuckets}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Last active {lastActive}</span>
        </div>
        <Link to={`/service/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
