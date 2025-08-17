import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, RotateCcw, Home } from 'lucide-react';

interface TestResultsProps {
  score: number;
  totalQuestions: number;
  timeTaken?: string;
  onRetakeTest: () => void;
  onBackToMenu: () => void;
}

export function TestResults({ score, totalQuestions, timeTaken, onRetakeTest, onBackToMenu }: TestResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Expert', color: 'bg-green-500', icon: Trophy };
    if (percentage >= 80) return { level: 'Advanced', color: 'bg-blue-500', icon: Star };
    if (percentage >= 70) return { level: 'Good', color: 'bg-yellow-500', icon: Star };
    if (percentage >= 60) return { level: 'Fair', color: 'bg-orange-500', icon: Star };
    return { level: 'Needs Improvement', color: 'bg-red-500', icon: Star };
  };

  const performance = getPerformanceLevel();
  const Icon = performance.icon;

  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! You're excellent at identifying phishing attempts.";
    if (percentage >= 80) return "Great job! You have strong phishing detection skills.";
    if (percentage >= 70) return "Good work! You're getting better at spotting threats.";
    if (percentage >= 60) return "Not bad! Keep practicing to improve your skills.";
    return "Keep learning! Consider reviewing phishing awareness materials.";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${performance.color} text-white`}>
              <Icon className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Test Complete!</CardTitle>
          <p className="text-muted-foreground">Here's how you performed</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-primary">
              {score}/{totalQuestions}
            </div>
            <div className="text-xl text-muted-foreground">
              {percentage}% Correct
            </div>
            <Badge variant="secondary" className="text-sm">
              {performance.level}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Accuracy</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Performance Message */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-center text-sm">{getScoreMessage()}</p>
          </div>

          {/* Additional Stats */}
          {timeTaken && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-lg font-semibold">{timeTaken}</div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-lg font-semibold">
                  {Math.round(percentage / 10) || 1}/10
                </div>
                <div className="text-sm text-muted-foreground">Skill Level</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onRetakeTest} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Test
            </Button>
            <Button variant="outline" onClick={onBackToMenu} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Expert (90-100%)</span>
              <span className="text-green-600">Excellent phishing detection</span>
            </div>
            <div className="flex justify-between">
              <span>Advanced (80-89%)</span>
              <span className="text-blue-600">Strong security awareness</span>
            </div>
            <div className="flex justify-between">
              <span>Good (70-79%)</span>
              <span className="text-yellow-600">Above average skills</span>
            </div>
            <div className="flex justify-between">
              <span>Fair (60-69%)</span>
              <span className="text-orange-600">Room for improvement</span>
            </div>
            <div className="flex justify-between">
              <span>Needs Improvement (&lt;60%)</span>
              <span className="text-red-600">Consider additional training</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}