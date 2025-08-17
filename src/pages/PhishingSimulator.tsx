import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Clock, Target, CheckCircle, XCircle, Trophy, Image, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PhotoTestSession } from '@/components/phishing/PhotoTestSession';
import { TestResults } from '@/components/phishing/TestResults';

interface PhishingSimulation {
  id: string;
  title: string;
  description: string;
  email_content: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  is_phishing: boolean;
  explanation: string;
  difficulty_level: string;
}

interface PhotoTest {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_phishing: boolean;
  explanation: string;
  difficulty_level: string;
  category: string;
}

interface PhishingResult {
  user_answer: boolean;
  is_correct: boolean;
  time_taken_seconds: number;
}

export default function PhishingSimulator() {
  const [simulations, setSimulations] = useState<PhishingSimulation[]>([]);
  const [photoTests, setPhotoTests] = useState<PhotoTest[]>([]);
  const [currentSimulation, setCurrentSimulation] = useState<PhishingSimulation | null>(null);
  const [currentPhotoTest, setCurrentPhotoTest] = useState<PhotoTest | null>(null);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'menu' | 'email-practice' | 'photo-practice' | 'certification-test' | 'test-results'>('menu');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [testScore, setTestScore] = useState<{ score: number; total: number } | null>(null);
  const [userStats, setUserStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    successRate: 0,
    photoTestAttempts: 0,
    photoTestCorrect: 0,
    certificationTests: 0,
    bestScore: 0
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSimulations();
      fetchPhotoTests();
      fetchUserStats();
    }
  }, [user]);

  const fetchSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('phishing_simulations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSimulations(data || []);
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast({
        title: "Error",
        description: "Failed to load phishing simulations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoTests = async () => {
    try {
      const { data, error } = await supabase
        .from('phishing_photo_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotoTests(data || []);
    } catch (error) {
      console.error('Error fetching photo tests:', error);
      toast({
        title: "Error",
        description: "Failed to load photo tests",
        variant: "destructive",
      });
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch email simulation stats
      const { data: emailResults, error: emailError } = await supabase
        .from('phishing_results')
        .select('is_correct')
        .eq('user_id', user.id);

      if (emailError) throw emailError;

      // Fetch photo test stats
      const { data: photoResults, error: photoError } = await supabase
        .from('phishing_photo_results')
        .select('is_correct')
        .eq('user_id', user.id);

      if (photoError) throw photoError;

      // Fetch certification test stats
      const { data: certTests, error: certError } = await supabase
        .from('phishing_test_sessions')
        .select('score, total_questions, is_completed')
        .eq('user_id', user.id)
        .eq('session_type', 'certification')
        .eq('is_completed', true);

      if (certError) throw certError;

      const totalAttempts = emailResults?.length || 0;
      const correctAnswers = emailResults?.filter(result => result.is_correct).length || 0;
      const successRate = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
      
      const photoTestAttempts = photoResults?.length || 0;
      const photoTestCorrect = photoResults?.filter(result => result.is_correct).length || 0;
      
      const certificationTests = certTests?.length || 0;
      const bestScore = certTests?.length > 0 ? Math.max(...certTests.map(test => Math.round((test.score / test.total_questions) * 100))) : 0;

      setUserStats({
        totalAttempts,
        correctAnswers,
        successRate,
        photoTestAttempts,
        photoTestCorrect,
        certificationTests,
        bestScore
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const startNewSimulation = () => {
    setCurrentSimulation(null);
    setUserAnswer(null);
    setResult(null);
    setStartTime(0);
    getRandomSimulation();
    setCurrentView('email-practice');
  };

  const startPhotoTest = () => {
    setCurrentPhotoTest(null);
    setUserAnswer(null);
    setResult(null);
    setStartTime(0);
    getRandomPhotoTest();
    setCurrentView('photo-practice');
  };

  const startCertificationTest = async () => {
    if (!user || photoTests.length < 10) {
      toast({
        title: "Error",
        description: "Not enough questions available for certification test",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get 10 random photo tests
      const shuffled = [...photoTests].sort(() => Math.random() - 0.5);
      const selectedTests = shuffled.slice(0, 10);

      // Create test session
      const { data, error } = await supabase
        .from('phishing_test_sessions')
        .insert({
          user_id: user.id,
          session_type: 'certification',
          total_questions: 10,
          questions_data: JSON.stringify(selectedTests),
          time_limit_minutes: 30
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSessionId(data.id);
      setCurrentView('certification-test');
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to start certification test",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (!currentSimulation && !currentPhotoTest || !user) return;

    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    let isCorrect = false;

    if (currentSimulation) {
      isCorrect = answer === currentSimulation.is_phishing;
    } else if (currentPhotoTest) {
      isCorrect = answer === currentPhotoTest.is_phishing;
    }

    const resultData: PhishingResult = {
      user_answer: answer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken
    };

    setUserAnswer(answer);
    setResult(resultData);

    // Save result to appropriate database table
    try {
      if (currentSimulation) {
        const { error } = await supabase
          .from('phishing_results')
          .insert({
            user_id: user.id,
            simulation_id: currentSimulation.id,
            user_answer: answer,
            is_correct: isCorrect,
            time_taken_seconds: timeTaken
          });

        if (error) throw error;
      } else if (currentPhotoTest) {
        const { error } = await supabase
          .from('phishing_photo_results')
          .insert({
            user_id: user.id,
            photo_test_id: currentPhotoTest.id,
            user_answer: answer,
            is_correct: isCorrect,
            time_taken_seconds: timeTaken,
            question_number: 1 // Single question for practice mode
          });

        if (error) throw error;
      }
      
      // Refresh stats
      fetchUserStats();
    } catch (error) {
      console.error('Error saving result:', error);
      toast({
        title: "Error",
        description: "Failed to save your answer",
        variant: "destructive",
      });
    }
  };

  const getRandomSimulation = () => {
    if (simulations.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * simulations.length);
    const simulation = simulations[randomIndex];
    setCurrentSimulation(simulation);
    setStartTime(Date.now());
  };

  const getRandomPhotoTest = () => {
    if (photoTests.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * photoTests.length);
    const photoTest = photoTests[randomIndex];
    setCurrentPhotoTest(photoTest);
    setStartTime(Date.now());
  };

  const handleSessionComplete = (score: number, totalQuestions: number) => {
    setTestScore({ score, total: totalQuestions });
    setCurrentView('test-results');
    fetchUserStats();
  };

  const backToMenu = () => {
    setCurrentView('menu');
    setCurrentSimulation(null);
    setCurrentPhotoTest(null);
    setUserAnswer(null);
    setResult(null);
    setActiveSessionId(null);
    setTestScore(null);
  };

  // Render different views based on current state
  if (currentView === 'certification-test' && activeSessionId) {
    return (
      <div className="container mx-auto py-8">
        <PhotoTestSession
          sessionId={activeSessionId}
          onSessionComplete={handleSessionComplete}
          onBackToMenu={backToMenu}
        />
      </div>
    );
  }

  if (currentView === 'test-results' && testScore) {
    return (
      <div className="container mx-auto py-8">
        <TestResults
          score={testScore.score}
          totalQuestions={testScore.total}
          onRetakeTest={startCertificationTest}
          onBackToMenu={backToMenu}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main menu
  if (currentView === 'menu') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Phishing Security Training
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice identifying phishing attempts through emails and images. Learn to spot the warning signs
            and protect yourself from real threats.
          </p>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Practice</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {userStats.successRate}% success rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photo Tests</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.photoTestAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {userStats.photoTestAttempts > 0 ? Math.round((userStats.photoTestCorrect / userStats.photoTestAttempts) * 100) : 0}% accuracy
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certifications</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.certificationTests}</div>
              <p className="text-xs text-muted-foreground">
                Best: {userStats.bestScore}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(((userStats.correctAnswers + userStats.photoTestCorrect) / 
                Math.max(1, userStats.totalAttempts + userStats.photoTestAttempts)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Total accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Email Practice
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Practice with realistic phishing emails. Learn to identify suspicious content, sender details, and links.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startNewSimulation} 
                className="w-full"
                disabled={simulations.length === 0}
              >
                Start Email Practice
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Photo Test Practice
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Analyze screenshots of emails, websites, and messages to identify phishing attempts.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startPhotoTest} 
                className="w-full"
                disabled={photoTests.length === 0}
              >
                Start Photo Practice
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Certification Test
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Take a 10-question photo-based test to earn your phishing detection certification.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startCertificationTest} 
                className="w-full"
                disabled={photoTests.length < 10}
              >
                Take Certification Test
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                30 minutes • 10 questions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Tests Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {simulations.length} email simulations • {photoTests.length} photo tests available
          </p>
        </div>
      </div>
    );
  }

  // Email Practice View
  if (currentView === 'email-practice') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Email Practice
          </h1>
          <Button variant="outline" onClick={backToMenu}>
            Back to Menu
          </Button>
        </div>

        {!currentSimulation ? (
          <Card>
            <CardHeader>
              <CardTitle>No Email Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No email simulations are currently available for practice.
              </p>
              <Button onClick={backToMenu}>Back to Menu</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{currentSimulation.title}</CardTitle>
                <Badge variant="outline">{currentSimulation.difficulty_level}</Badge>
              </div>
              {currentSimulation.description && (
                <p className="text-muted-foreground">{currentSimulation.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Header */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">From: {currentSimulation.sender_name}</p>
                    <p className="text-sm text-muted-foreground">{currentSimulation.sender_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
                <p className="font-medium">Subject: {currentSimulation.subject}</p>
              </div>

              {/* Email Content */}
              <div className="prose max-w-none">
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: currentSimulation.email_content }}
                />
              </div>

              {/* Answer Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Is this email legitimate or phishing?</h3>
                
                {!result ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleAnswer(false)}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Legitimate
                    </Button>
                    <Button
                      onClick={() => handleAnswer(true)}
                      variant="destructive"
                      size="lg"
                      className="flex-1"
                    >
                      Phishing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Result Display */}
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
                      {result.is_correct ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {result.is_correct ? 'Correct!' : 'Incorrect!'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You answered: {userAnswer ? 'Phishing' : 'Legitimate'} | 
                          Time taken: {result.time_taken_seconds} seconds
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p className="text-sm">{currentSimulation.explanation}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Button onClick={startNewSimulation} className="flex-1">
                        Try Another Email
                      </Button>
                      <Button variant="outline" onClick={backToMenu}>
                        Back to Menu
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Photo Practice View
  if (currentView === 'photo-practice') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="w-6 h-6" />
            Photo Test Practice
          </h1>
          <Button variant="outline" onClick={backToMenu}>
            Back to Menu
          </Button>
        </div>

        {!currentPhotoTest ? (
          <Card>
            <CardHeader>
              <CardTitle>No Photo Test Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No photo tests are currently available for practice.
              </p>
              <Button onClick={backToMenu}>Back to Menu</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{currentPhotoTest.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{currentPhotoTest.category}</Badge>
                  <Badge variant="secondary">{currentPhotoTest.difficulty_level}</Badge>
                </div>
              </div>
              {currentPhotoTest.description && (
                <p className="text-muted-foreground">{currentPhotoTest.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image */}
              <div className="flex justify-center">
                <img
                  src={currentPhotoTest.image_url}
                  alt="Phishing test image"
                  className="max-w-full max-h-96 rounded-lg border shadow-sm"
                />
              </div>

              {/* Answer Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">
                  Is this legitimate or phishing?
                </h3>
                
                {!result ? (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => handleAnswer(false)}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      Legitimate
                    </Button>
                    <Button
                      onClick={() => handleAnswer(true)}
                      variant="destructive"
                      size="lg"
                      className="px-8"
                    >
                      Phishing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Result Display */}
                    <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted">
                      {result.is_correct ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div className="text-center">
                        <p className="font-semibold">
                          {result.is_correct ? 'Correct!' : 'Incorrect!'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You answered: {userAnswer ? 'Phishing' : 'Legitimate'} | 
                          Time taken: {result.time_taken_seconds} seconds
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-4 bg-muted rounded-lg max-w-2xl mx-auto">
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p className="text-sm">{currentPhotoTest.explanation}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4">
                      <Button onClick={startPhotoTest}>
                        Try Another Photo
                      </Button>
                      <Button variant="outline" onClick={backToMenu}>
                        Back to Menu
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}