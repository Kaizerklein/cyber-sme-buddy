import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Shield, CheckCircle, XCircle, Image, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PhotoTestSession } from '@/components/phishing/PhotoTestSession';
import { TestResults } from '@/components/phishing/TestResults';


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
  const [photoTests, setPhotoTests] = useState<PhotoTest[]>([]);
  const [currentPhotoTest, setCurrentPhotoTest] = useState<PhotoTest | null>(null);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'menu' | 'photo-practice'>('menu');
  const [userStats, setUserStats] = useState({
    photoTestAttempts: 0,
    photoTestCorrect: 0
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPhotoTests();
      fetchUserStats();
    }
  }, [user]);


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
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch photo test stats
      const { data: photoResults, error: photoError } = await supabase
        .from('phishing_photo_results')
        .select('is_correct')
        .eq('user_id', user.id);

      if (photoError) throw photoError;

      const photoTestAttempts = photoResults?.length || 0;
      const photoTestCorrect = photoResults?.filter(result => result.is_correct).length || 0;

      setUserStats({
        photoTestAttempts,
        photoTestCorrect
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };


  const startPhotoTest = () => {
    setCurrentPhotoTest(null);
    setUserAnswer(null);
    setResult(null);
    setStartTime(0);
    getRandomPhotoTest();
    setCurrentView('photo-practice');
  };


  const handleAnswer = async (answer: boolean) => {
    if (!currentPhotoTest || !user) return;

    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const isCorrect = answer === currentPhotoTest.is_phishing;

    const resultData: PhishingResult = {
      user_answer: answer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken
    };

    setUserAnswer(answer);
    setResult(resultData);

    // Save result to database
    try {
      const { error } = await supabase
        .from('phishing_photo_results')
        .insert({
          user_id: user.id,
          photo_test_id: currentPhotoTest.id,
          user_answer: answer,
          is_correct: isCorrect,
          time_taken_seconds: timeTaken,
          question_number: 1
        });

      if (error) throw error;
      
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


  const getRandomPhotoTest = () => {
    if (photoTests.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * photoTests.length);
    const photoTest = photoTests[randomIndex];
    setCurrentPhotoTest(photoTest);
    setStartTime(Date.now());
  };


  const backToMenu = () => {
    setCurrentView('menu');
    setCurrentPhotoTest(null);
    setUserAnswer(null);
    setResult(null);
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>

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
            Photo-Based Phishing Training
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice identifying phishing attempts through real screenshots and images. Learn to spot the warning signs
            and protect yourself from visual phishing attacks.
          </p>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.photoTestAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Photo tests completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.photoTestAttempts > 0 ? Math.round((userStats.photoTestCorrect / userStats.photoTestAttempts) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Correct answers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Option */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Image className="w-5 h-5" />
                Photo Test Practice
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Analyze screenshots of emails, websites, and messages to identify phishing attempts.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startPhotoTest} 
                className="w-full"
                disabled={photoTests.length === 0}
                size="lg"
              >
                Start Photo Test
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Tests Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {photoTests.length} photo tests available
          </p>
        </div>
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
                <div className="relative group">
                  <img
                    src={currentPhotoTest.image_url}
                    alt="Phishing test image"
                    className="max-w-full max-h-96 rounded-lg border shadow-sm"
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                      <img
                        src={currentPhotoTest.image_url}
                        alt="Phishing test image - enlarged"
                        className="w-full h-auto max-h-[calc(90vh-2rem)] object-contain rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
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