import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import PhishingSimulator from "./pages/PhishingSimulator";
import { AuthForm } from "./components/auth/AuthForm";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/courses" element={<DashboardLayout><Courses /></DashboardLayout>} />
            <Route path="/courses/:courseId" element={<DashboardLayout><CourseDetail /></DashboardLayout>} />
            <Route path="/phishing-simulator" element={<DashboardLayout><PhishingSimulator /></DashboardLayout>} />
            <Route path="/progress" element={<DashboardLayout><div className="text-center py-12"><h2 className="text-2xl font-bold">Progress page coming soon!</h2></div></DashboardLayout>} />
            <Route path="/guide" element={<DashboardLayout><div className="text-center py-12"><h2 className="text-2xl font-bold">Security Guide coming soon!</h2></div></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
