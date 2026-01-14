import { Database, MoreVertical, Activity, Settings, Clock, Brain, CheckCircle2, Code, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { serviceAPI } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ServiceCardProps {
  id: string;
  name: string;
  status: "active" | "inactive" | "configuring";
  hasShortTerm: boolean;
  longTermBucketNames: string[];
  lastActive: string;
}

const ServiceCard = ({ id, name, status, hasShortTerm, longTermBucketNames, lastActive }: ServiceCardProps) => {
  const navigate = useNavigate();

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

  const handleViewAPI = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/service/${id}?tab=api-integration`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        // Delete from backend API
        const response = await serviceAPI.delete(id);

        if (response.success) {
          // Also remove from localStorage
          const serviceIds = JSON.parse(localStorage.getItem("service_ids") || "[]");
          const updatedIds = serviceIds.filter((sid: string) => sid !== id);
          localStorage.setItem("service_ids", JSON.stringify(updatedIds));
          localStorage.removeItem(`service_${id}`);

          toast.success(`Service "${name}" deleted successfully`);
          // Reload page to refresh the list
          window.location.reload();
        } else {
          toast.error(`Failed to delete service: ${response.error}`);
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        toast.error("Failed to delete service");
      }
    }
  };

  return (
    <Link to={`/service/${id}`} className="block">
      <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group cursor-pointer">
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
              <p className="text-xs text-muted-foreground/70 font-mono mt-1">ID: {id}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleViewAPI} className="gap-2">
                <Code className="h-4 w-4" />
                View API Endpoints
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3 mb-4">
          {/* Short-Term Memory */}
          {hasShortTerm && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Short-term memory</span>
                <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
              </div>
            </div>
          )}

          {/* Long-Term Memory */}
          {longTermBucketNames.length > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Long-term memory</span>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {longTermBucketNames.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No memory configured */}
          {!hasShortTerm && longTermBucketNames.length === 0 && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">No memory configured</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Last active {lastActive}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Settings className="h-4 w-4" />
            Edit
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
