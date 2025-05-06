import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Navbar } from "@/components/Navbar";
import CareerProfile from "@/components/CareerProfile";
import { useAuth } from "@/lib/auth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {user ? (
        <CareerProfile />
      ) : (
        <>
          <Hero />
          <Features />
        </>
      )}
    </div>
  );
};

export default Index;