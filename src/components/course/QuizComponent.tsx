import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle, Trophy, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizComponentProps {
  courseId: string;
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function QuizComponent({ courseId, questions, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeQuiz = () => {
    setShowResults(true);
    setIsComplete(true);
    
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    onComplete(score);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
    setIsComplete(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Needs Improvement' };
  };

  if (showResults) {
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const badge = getScoreBadge(score);

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 text-primary rounded-full w-fit">
            <Trophy className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Overview */}
          <div className="text-center space-y-4">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <Badge variant={badge.variant} className="text-sm px-3 py-1">
              {badge.label}
            </Badge>
            <p className="text-muted-foreground">
              You answered {correctAnswers} out of {questions.length} questions correctly
            </p>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h4 className="font-medium">Question Review</h4>
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded-full ${
                      isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">Question {index + 1}</h5>
                      <p className="text-sm mb-3">{question.question}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Your answer:</span>
                          <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                            {userAnswer >= 0 ? question.options[userAnswer] : 'Not answered'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Correct answer:</span>
                            <span className="text-success">
                              {question.options[question.correctAnswer]}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={restartQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
            <Button onClick={() => window.history.back()}>
              Continue Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allQuestionsAnswered = selectedAnswers.every(answer => answer >= 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quiz: Question {currentQuestion + 1}</CardTitle>
            <CardDescription>
              Question {currentQuestion + 1} of {questions.length}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>
          
          <RadioGroup
            value={selectedAnswers[currentQuestion]?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {selectedAnswers.filter(a => a >= 0).length} of {questions.length} answered
          </div>
          
          <Button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === -1}
          >
            {currentQuestion === questions.length - 1 ? 'Complete Quiz' : 'Next'}
          </Button>
        </div>

        {/* Complete Quiz Button for early submission */}
        {allQuestionsAnswered && currentQuestion < questions.length - 1 && (
          <div className="text-center pt-4 border-t">
            <Button onClick={completeQuiz} variant="outline">
              Complete Quiz Early
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}