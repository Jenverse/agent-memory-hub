import Header from "@/components/Header";
import TravelAgentDemo from "@/components/TravelAgentDemo";

const Demo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <TravelAgentDemo />
        </div>
      </main>
    </div>
  );
};

export default Demo;

