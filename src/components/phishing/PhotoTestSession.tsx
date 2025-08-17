import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

interface TestSession {
  id: string;
  session_type: string;
  total_questions: number;
  current_question: number;
  score: number;
  started_at: string;
  time_limit_minutes: number;
  questions_data: any;
}

interface PhotoTestSessionProps {
  sessionId: string;
  onSessionComplete: (score: number, totalQuestions: number) => void;
  onBackToMenu: () => void;
}

export function PhotoTestSession({ sessionId, onSessionComplete, onBackToMenu }: PhotoTestSessionProps) {
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<PhotoTest | null>(null);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (session && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session, timeRemaining]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('phishing_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(data);
      setCurrentPhoto(data.questions_data[data.current_question - 1]);
      
      // Calculate time remaining
      const startTime = new Date(data.started_at).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const totalTime = data.time_limit_minutes * 60;
      setTimeRemaining(Math.max(0, totalTime - elapsed));
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error fetching session:', error);
      toast({
        title: "Error",
        description: "Failed to load test session",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (!session || !currentPhoto) return;

    setUserAnswer(answer);
    const isCorrect = answer === currentPhoto.is_phishing;
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      // Save the result
      await supabase.from('phishing_photo_results').insert({
        user_id: user?.id,
        session_id: sessionId,
        photo_test_id: currentPhoto.id,
        user_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken,
        question_number: session.current_question,
      });

      // Update session score
      const newScore = session.score + (isCorrect ? 1 : 0);
      await supabase
        .from('phishing_test_sessions')
        .update({ score: newScore })
        .eq('id', sessionId);

      setSession(prev => prev ? { ...prev, score: newScore } : null);
      setShowResult(true);
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Error",
        description: "Failed to save answer",
        variant: "destructive",
      });
    }
  };

  const handleNextQuestion = async () => {
    if (!session) return;

    if (session.current_question >= session.total_questions) {
      // Test completed
      await supabase
        .from('phishing_test_sessions')
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      onSessionComplete(session.score, session.total_questions);
      return;
    }

    // Move to next question
    const nextQuestion = session.current_question + 1;
    await supabase
      .from('phishing_test_sessions')
      .update({ current_question: nextQuestion })
      .eq('id', sessionId);

    setSession(prev => prev ? { ...prev, current_question: nextQuestion } : null);
    setCurrentPhoto(session.questions_data[nextQuestion - 1]);
    setUserAnswer(null);
    setShowResult(false);
    setQuestionStartTime(Date.now());
  };

  const handleTimeUp = async () => {
    if (!session) return;
    
    await supabase
      .from('phishing_test_sessions')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    toast({
      title: "Time's Up!",
      description: "The test has been completed due to time limit",
      variant: "destructive",
    });

    onSessionComplete(session.score, session.total_questions);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session || !currentPhoto) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBackToMenu}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            Question {session.current_question} of {session.total_questions}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>Score: {session.score}/{session.current_question - 1}</span>
        </div>
        <Progress value={(session.current_question / session.total_questions) * 100} />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentPhoto.title}</span>
            <Badge variant="outline">{currentPhoto.category}</Badge>
          </CardTitle>
          {currentPhoto.description && (
            <p className="text-muted-foreground">{currentPhoto.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image */}
          <div className="flex justify-center">
            <img
              src={currentPhoto.image_url}
              alt="Phishing test image"
              className="max-w-full max-h-96 rounded-lg border shadow-sm"
            />
          </div>

          {/* Question */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              Is this legitimate or phishing?
            </h3>

            {!showResult ? (
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  className="px-8"
                >
                  Legitimate
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => handleAnswer(true)}
                  className="px-8"
                >
                  Phishing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result */}
                <div className="flex items-center justify-center gap-2">
                  {userAnswer === currentPhoto.is_phishing ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-lg font-semibold">
                    {userAnswer === currentPhoto.is_phishing ? 'Correct!' : 'Incorrect!'}
                  </span>
                </div>

                {/* Explanation */}
                <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
                  <h4 className="font-semibold mb-2">Explanation:</h4>
                  <p className="text-sm">{currentPhoto.explanation}</p>
                </div>

                {/* Next Button */}
                <Button onClick={handleNextQuestion} size="lg">
                  {session.current_question >= session.total_questions ? (
                    'View Results'
                  ) : (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}