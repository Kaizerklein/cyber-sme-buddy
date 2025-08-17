import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Target,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PhishingSimulation {
  id: string;
  title: string;
  description: string;
  email_content: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  is_phishing: boolean;
  difficulty_level: string;
  explanation: string;
}

interface PhishingResult {
  user_answer: boolean;
  is_correct: boolean;
  time_taken_seconds: number;
}

export default function PhishingSimulator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<PhishingSimulation[]>([]);
  const [currentSimulation, setCurrentSimulation] = useState<PhishingSimulation | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations();
    fetchUserStats();
  }, [user]);

  const fetchSimulations = async () => {
    const { data } = await supabase
      .from('phishing_simulations')
      .select('*')
      .order('difficulty_level', { ascending: true });
    
    if (data) {
      setSimulations(data);
      if (data.length > 0 && !currentSimulation) {
        startNewSimulation(data[Math.floor(Math.random() * data.length)]);
      }
    }
    setLoading(false);
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('phishing_results')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) {
      setStats({
        total: data.length,
        correct: data.filter(r => r.is_correct).length,
      });
    }
  };

  const startNewSimulation = (simulation: PhishingSimulation) => {
    setCurrentSimulation(simulation);
    setShowResult(false);
    setUserAnswer(null);
    setResult(null);
    setStartTime(Date.now());
  };

  const handleAnswer = async (answer: boolean) => {
    if (!currentSimulation || !user) return;
    
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const isCorrect = answer === currentSimulation.is_phishing;
    
    setUserAnswer(answer);
    
    const resultData: PhishingResult = {
      user_answer: answer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken,
    };
    
    setResult(resultData);
    setShowResult(true);
    
    // Save result to database
    await supabase
      .from('phishing_results')
      .insert({
        user_id: user.id,
        simulation_id: currentSimulation.id,
        user_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken,
      });
    
    // Update stats
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
    
    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect ? "Well done identifying this email." : "Learn from this example for next time.",
      variant: isCorrect ? "default" : "destructive",
    });
  };

  const getRandomSimulation = () => {
    const randomIndex = Math.floor(Math.random() * simulations.length);
    startNewSimulation(simulations[randomIndex]);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-success text-success-foreground';
      case 'intermediate': return 'bg-warning text-warning-foreground';
      case 'advanced': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const successRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Phishing Email Simulator</h1>
        <p className="text-muted-foreground">
          Practice identifying phishing emails in a safe environment.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correct</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.correct}/{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Simulation */}
      {currentSimulation && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Simulation
                </CardTitle>
                <CardDescription>{currentSimulation.title}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(currentSimulation.difficulty_level)}>
                  {currentSimulation.difficulty_level}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getRandomSimulation}
                  disabled={showResult}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Email
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Preview */}
            <div className="bg-muted p-4 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div><strong>From:</strong> {currentSimulation.sender_name} &lt;{currentSimulation.sender_email}&gt;</div>
                <div><strong>Subject:</strong> {currentSimulation.subject}</div>
                <div className="border-t pt-2 mt-2">
                  <div className="whitespace-pre-wrap">{currentSimulation.email_content}</div>
                </div>
              </div>
            </div>

            {/* Question and Answer Buttons */}
            {!showResult ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Is this email a phishing attempt?</h3>
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAnswer(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Yes, it's phishing
                  </Button>
                  <Button
                    onClick={() => handleAnswer(false)}
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    No, it's legitimate
                  </Button>
                </div>
              </div>
            ) : (
              /* Result Display */
              <div className="space-y-4">
                <Alert className={result?.is_correct ? "border-success" : "border-destructive"}>
                  <div className="flex items-center gap-2">
                    {result?.is_correct ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription>
                      <strong>{result?.is_correct ? 'Correct!' : 'Incorrect'}</strong>
                      {' '}
                      This email is {currentSimulation.is_phishing ? 'a phishing attempt' : 'legitimate'}.
                      {result && ` (Answered in ${result.time_taken_seconds} seconds)`}
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Explanation:</h4>
                  <p className="text-sm">{currentSimulation.explanation}</p>
                </div>

                <Button onClick={getRandomSimulation} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Another Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {simulations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No simulations available</h3>
            <p className="text-muted-foreground">
              Phishing simulation exercises will be available soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}