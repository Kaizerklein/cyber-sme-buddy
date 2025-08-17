import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, BookOpen, Target, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center max-w-4xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <Shield className="h-24 w-24 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-foreground">CyberGuard LMS</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cybersecurity awareness training designed specifically for Sri Lankan Small to Medium Enterprises. 
            Learn to protect your business from cyber threats through interactive courses and hands-on simulations.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate('/auth')}>
              <BookOpen className="mr-2 h-5 w-5" />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              <Users className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Courses</h3>
              <p className="text-muted-foreground">Learn cybersecurity fundamentals through engaging, easy-to-understand courses.</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Phishing Simulator</h3>
              <p className="text-muted-foreground">Practice identifying phishing emails in a safe, controlled environment.</p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">SME Focused</h3>
              <p className="text-muted-foreground">Tailored specifically for small and medium enterprises in Sri Lanka.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
