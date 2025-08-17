import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

interface ScenarioProps {
  title: string;
  description: string;
  scenario: string;
  options: ScenarioOption[];
  onComplete: (correct: boolean) => void;
  className?: string;
}

export default function InteractiveScenario({
  title,
  description,
  scenario,
  options,
  onComplete,
  className
}: ScenarioProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    setShowFeedback(true);
    const selected = options.find(opt => opt.id === selectedOption);
    const isCorrect = selected?.isCorrect || false;
    
    setTimeout(() => {
      setIsComplete(true);
      onComplete(isCorrect);
    }, 2000);
  };

  const selectedOptionData = options.find(opt => opt.id === selectedOption);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-sm leading-relaxed">{scenario}</div>
          </div>
        </div>

        {/* Options */}
        {!isComplete && (
          <div className="space-y-3">
            <h4 className="font-medium">What would you do?</h4>
            {options.map((option) => (
              <div
                key={option.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${
                  showFeedback
                    ? option.isCorrect
                      ? 'border-success bg-success/10'
                      : selectedOption === option.id
                      ? 'border-destructive bg-destructive/10'
                      : 'opacity-50'
                    : ''
                }`}
                onClick={() => !showFeedback && setSelectedOption(option.id)}
              >
                <div className="flex items-start gap-3">
                  {showFeedback && (
                    <div className="mt-0.5">
                      {option.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : selectedOption === option.id ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.text}</div>
                    {showFeedback && (selectedOption === option.id || option.isCorrect) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {option.feedback}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        {!showFeedback && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {/* Completion Badge */}
        {isComplete && (
          <div className="flex items-center justify-center pt-4">
            <Badge variant={selectedOptionData?.isCorrect ? "default" : "destructive"}>
              {selectedOptionData?.isCorrect ? "Correct!" : "Incorrect"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}