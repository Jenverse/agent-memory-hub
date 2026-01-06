import { useState } from "react";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ServiceCard from "@/components/ServiceCard";
import CreateServiceModal from "@/components/CreateServiceModal";

interface Service {
  id: string;
  name: string;
  status: "active" | "inactive" | "configuring";
  shortTermSchema: number;
  longTermBuckets: number;
  lastActive: string;
}

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "customer-support-agent",
      status: "active",
      shortTermSchema: 5,
      longTermBuckets: 3,
      lastActive: "2 min ago",
    },
    {
      id: "2",
      name: "personal-assistant",
      status: "configuring",
      shortTermSchema: 8,
      longTermBuckets: 4,
      lastActive: "1 hour ago",
    },
    {
      id: "3",
      name: "code-review-bot",
      status: "active",
      shortTermSchema: 3,
      longTermBuckets: 2,
      lastActive: "5 min ago",
    },
  ]);

  const handleCreateService = (name: string, redisUrl: string) => {
    const newService: Service = {
      id: Date.now().toString(),
      name,
      status: "configuring",
      shortTermSchema: 0,
      longTermBuckets: 0,
      lastActive: "Just now",
    };
    setServices([newService, ...services]);
  };

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
              <h1 className="text-3xl font-bold mb-2">Memory Services</h1>
              <p className="text-muted-foreground">
                Manage your AI agent memory configurations
              </p>
            </div>
            <Button variant="hero" onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              New Service
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
              <Button variant="hero" onClick={() => setIsModalOpen(true)}>
                Create Service
              </Button>
            </div>
          )}
        </div>
      </main>

      <CreateServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateService}
      />
    </div>
  );
};

export default Dashboard;
