import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import PhishingSimulator from "./pages/PhishingSimulator";
import Progress from "./pages/Progress";
import SecurityGuide from "./pages/SecurityGuide";
import AdminCourseManagement from "./pages/AdminCourseManagement";
import AdminPhishingTest from "./pages/AdminPhishingTest";
import AdminIncidentDashboard from "./pages/AdminIncidentDashboard";
import SecurityPlayground from "./pages/SecurityPlayground";
import ProfileSettings from "./components/profile/ProfileSettings";
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
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><DashboardLayout><Courses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><DashboardLayout><CourseDetail /></DashboardLayout></ProtectedRoute>} />
            <Route path="/phishing-simulator" element={<ProtectedRoute><DashboardLayout><PhishingSimulator /></DashboardLayout></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><DashboardLayout><Progress /></DashboardLayout></ProtectedRoute>} />
            <Route path="/guide" element={<ProtectedRoute><DashboardLayout><SecurityGuide /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><DashboardLayout><AdminCourseManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/phishing-test" element={<ProtectedRoute><DashboardLayout><AdminPhishingTest /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/incidents" element={<ProtectedRoute><DashboardLayout><AdminIncidentDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/security-playground" element={<ProtectedRoute><DashboardLayout><SecurityPlayground /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfileSettings /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
