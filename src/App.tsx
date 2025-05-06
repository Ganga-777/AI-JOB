import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Interview from "./pages/Interview";
import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import SalaryPredictor from "./pages/SalaryPredictor";
import CareerProfile from "@/components/CareerProfile";
import ResumeBuilder from "@/components/resume-builder/ResumeBuilder";

const queryClient = new QueryClient();

const AppContent = () => (
  <AuthProvider>
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/salary-predictor" element={<SalaryPredictor />} />
        <Route path="/profile" element={<CareerProfile />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
      </Routes>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;