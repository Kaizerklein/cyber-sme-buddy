import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link2, Shield, AlertTriangle, CheckCircle, XCircle, Unlock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EncodedURL {
  id: string;
  displayText: string;
  encodedUrl: string;
  decodedUrl: string;
  encodingType: 'base64' | 'hex' | 'punycode' | 'url-encoded';
  isMalicious: boolean;
  explanation: string;
}

interface URLDecoderProps {
  encodedUrls: EncodedURL[];
  onComplete: (results: { urlId: string; userAnswer: boolean; isCorrect: boolean }[], timeTaken: number) => void;
  onBack: () => void;
}

export function URLDecoder({ encodedUrls, onComplete, onBack }: URLDecoderProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [decodedValue, setDecodedValue] = useState('');
  const [showDecoded, setShowDecoded] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ urlId: string; userAnswer: boolean; isCorrect: boolean }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  const currentUrl = encodedUrls[currentUrlIndex];

  const decodeUrl = (encoded: string, type: string): string => {
    try {
      switch (type) {
        case 'base64':
          return atob(encoded);
        case 'hex':
          return encoded.replace(/%([0-9A-Fa-f]{2})/g, (_, p1) => 
            String.fromCharCode(parseInt(p1, 16))
          );
        case 'url-encoded':
          return decodeURIComponent(encoded);
        case 'punycode':
          // Simplified punycode handling
          return encoded.replace('xn--', '(punycode) ');
        default:
          return encoded;
      }
    } catch {
      return 'Decoding error';
    }
  };

  const handleDecode = () => {
    const decoded = decodeUrl(currentUrl.encodedUrl, currentUrl.encodingType);
    setDecodedValue(decoded);
    setShowDecoded(true);
  };

  const handleAnswer = (isMalicious: boolean) => {
    const isCorrect = isMalicious === currentUrl.isMalicious;
    const newAnswer = {
      urlId: currentUrl.id,
      userAnswer: isMalicious,
      isCorrect
    };
    
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentUrlIndex < encodedUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setDecodedValue('');
      setShowDecoded(false);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setShowResults(true);
      onComplete(updatedAnswers, timeTaken);
    }
  };

  const getEncodingBadgeColor = (type: string) => {
    switch (type) {
      case 'base64': return 'bg-blue-500/20 text-blue-500';
      case 'hex': return 'bg-purple-500/20 text-purple-500';
      case 'punycode': return 'bg-orange-500/20 text-orange-500';
      case 'url-encoded': return 'bg-green-500/20 text-green-500';
      default: return '';
    }
  };

  if (showResults) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctCount / userAnswers.length) * 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            URL Analysis Complete
          </h2>
          <Button variant="outline" onClick={onBack}>Back to Menu</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
              <p className="text-muted-foreground">Accuracy Rate</p>
              <p className="text-sm mt-2">
                {correctCount} of {userAnswers.length} URLs correctly identified
              </p>
            </div>

            <div className="space-y-4">
              {encodedUrls.map((url, index) => {
                const answer = userAnswers.find(a => a.urlId === url.id);
                return (
                  <div key={url.id} className={cn(
                    "p-4 rounded-lg border",
                    answer?.isCorrect ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {answer?.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="font-medium">{url.displayText}</span>
                      <Badge className={cn("ml-auto", getEncodingBadgeColor(url.encodingType))}>
                        {url.encodingType}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Encoded:</span> <code className="bg-muted px-1 rounded">{url.encodedUrl}</code></p>
                      <p><span className="text-muted-foreground">Decoded:</span> <code className="bg-muted px-1 rounded">{url.decodedUrl}</code></p>
                      <p className="text-muted-foreground mt-2">{url.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          URL Forensics
        </h2>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {currentUrlIndex + 1} / {encodedUrls.length}
          </Badge>
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Analyze This Link
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Decode the obfuscated URL and determine if it's malicious
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Link Text Displayed:</p>
            <p className="text-lg font-medium text-primary">{currentUrl.displayText}</p>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Actual URL (Encoded):</p>
              <Badge className={cn(getEncodingBadgeColor(currentUrl.encodingType))}>
                {currentUrl.encodingType.toUpperCase()}
              </Badge>
            </div>
            <code className="block bg-muted p-3 rounded text-sm break-all">
              {currentUrl.encodedUrl}
            </code>
          </div>

          {!showDecoded ? (
            <Button onClick={handleDecode} className="w-full gap-2" size="lg">
              <Unlock className="w-4 h-4" />
              Decode URL
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Decoded Result:</p>
                </div>
                <code className="block bg-muted p-3 rounded text-sm break-all font-bold">
                  {decodedValue}
                </code>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold mb-4">Is this URL malicious?</p>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => handleAnswer(false)} 
                    variant="outline" 
                    size="lg"
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Safe / Legitimate
                  </Button>
                  <Button 
                    onClick={() => handleAnswer(true)} 
                    variant="destructive" 
                    size="lg"
                    className="gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Malicious / Phishing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Decoder Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-muted rounded">
              <p className="font-semibold text-blue-500">Base64</p>
              <p className="text-muted-foreground">Binary-to-text encoding</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="font-semibold text-purple-500">Hex (%XX)</p>
              <p className="text-muted-foreground">Hexadecimal characters</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="font-semibold text-orange-500">Punycode</p>
              <p className="text-muted-foreground">Unicode domain encoding</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="font-semibold text-green-500">URL Encoded</p>
              <p className="text-muted-foreground">Percent-encoding</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}