import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { Database, Zap, Shield, Code2, Layers, RefreshCw } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Agent Needs to <span className="gradient-text">Remember</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete memory management system designed specifically for AI agents, 
              with configurable schemas and intelligent policies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureBox 
              icon={<Database className="h-6 w-6" />}
              title="Redis-Powered"
              description="Leverage the speed and reliability of Redis for lightning-fast memory operations."
            />
            <FeatureBox 
              icon={<Layers className="h-6 w-6" />}
              title="Dual Memory Layers"
              description="Separate short-term (session) and long-term (persistent) memory with distinct schemas."
            />
            <FeatureBox 
              icon={<Code2 className="h-6 w-6" />}
              title="Custom Schemas"
              description="Define exactly what data to store with flexible, customizable schemas."
            />
            <FeatureBox 
              icon={<Shield className="h-6 w-6" />}
              title="Memory Policies"
              description="Set rules for when data gets stored, edited, or deleted automatically."
            />
            <FeatureBox 
              icon={<RefreshCw className="h-6 w-6" />}
              title="Real-Time Sync"
              description="Keep agent memory synchronized across sessions and instances."
            />
            <FeatureBox 
              icon={<Zap className="h-6 w-6" />}
              title="Simple API"
              description="Integrate with any agent framework using our straightforward REST API."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your agent memory up and running in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard 
              number="01"
              title="Create a Service"
              description="Connect your Redis database and create a memory service for your agent."
            />
            <StepCard 
              number="02"
              title="Configure Memory"
              description="Set up short-term and long-term memory schemas with custom fields."
            />
            <StepCard 
              number="03"
              title="Define Policies"
              description="Create rules for how your agent stores, updates, and removes memories."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="font-semibold">Redis<span className="text-primary">Memory</span></span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Redis Memory. Built for AI agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureBox = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <span className="text-2xl font-bold gradient-text">{number}</span>
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
