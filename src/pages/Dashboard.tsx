import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, LayoutGrid, List, Settings, Database, Plane } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceCard from "@/components/ServiceCard";
import ApiKeySettings from "@/components/ApiKeySettings";
import TravelAgentDemo from "@/components/TravelAgentDemo";
import { serviceAPI } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Service {
  id: string;
  name: string;
  status: "active" | "inactive" | "configuring";
  hasShortTerm: boolean;
  longTermBucketNames: string[];
  lastActive: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState("services");

  // Load services from backend
  useEffect(() => {
    const loadServices = async () => {
      // Load from backend API only - no localStorage syncing
      const response = await serviceAPI.list();

      if (response.success && response.data) {
        const loadedServices: Service[] = response.data.map((data: any) => {
          const bucketNames = data.schemas?.longTermBuckets?.map((b: any) => b.name) || [];
          return {
            id: data.id,
            name: data.name,
            status: "configuring",
            hasShortTerm: (data.schemas?.shortTermFields?.length || 0) > 0,
            longTermBucketNames: bucketNames,
            lastActive: "just now",
          };
        });
        setServices(loadedServices);
      } else {
        console.error("Failed to load services from backend");
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agent Memory Hub</h1>
              <p className="text-muted-foreground">
                Manage memory services and test your AI agents
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
                <Settings className="h-5 w-5" />
                API Settings
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-card p-1 w-full justify-start">
              <TabsTrigger value="services" className="gap-2 data-[state=active]:bg-primary/20">
                <Database className="h-4 w-4" />
                Memory Services
              </TabsTrigger>
              <TabsTrigger value="agent-demo" className="gap-2 data-[state=active]:bg-primary/20">
                <Plane className="h-4 w-4" />
                Agent Demo using Memory
              </TabsTrigger>
            </TabsList>

            {/* Memory Services Tab */}
            <TabsContent value="services" className="space-y-6 animate-fade-in">
              <div className="flex justify-end">
                <Button variant="hero" onClick={() => navigate("/create-service")} className="gap-2">
                  <Plus className="h-5 w-5" />
                  New Service
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="icon">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Services Grid */}
              {filteredServices.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} {...service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-card rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No services yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first memory service to get started
                  </p>
                  <Button variant="hero" onClick={() => navigate("/create-service")}>
                    Create Service
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Agent Demo Tab */}
            <TabsContent value="agent-demo" className="animate-fade-in">
              <TravelAgentDemo />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Settings</DialogTitle>
          </DialogHeader>
          <ApiKeySettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
