import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Camera, Target, ArrowLeft, ZoomIn, Mail, Link2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EmailHeaderAnalyzer } from "@/components/phishing/EmailHeaderAnalyzer";
import { URLDecoder } from "@/components/phishing/URLDecoder";

interface PhotoTest {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_phishing: boolean;
  explanation: string;
  difficulty_level: string;
  category: string;
  ioc_list: string[];
  email_headers: string | null;
  encoded_urls: any[] | null;
}

interface PhishingResult {
  userAnswer: boolean;
  isCorrect: boolean;
  timeTaken: number;
}

type ViewMode = 'menu' | 'photo-practice' | 'header-analysis' | 'url-forensics';

const PhishingSimulator = () => {
  const { user } = useAuth();
  const [photoTests, setPhotoTests] = useState<PhotoTest[]>([]);
  const [currentPhotoTest, setCurrentPhotoTest] = useState<PhotoTest | null>(null);
  const [photoResult, setPhotoResult] = useState<PhishingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('menu');
  const [photoStartTime, setPhotoStartTime] = useState<number>(0);
  const [userStats, setUserStats] = useState({ totalAttempts: 0, correctAnswers: 0 });

  useEffect(() => {
    fetchPhotoTests();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchPhotoTests = async () => {
    try {
      const { data, error } = await supabase
        .from('phishing_photo_tests')
        .select('*');
      
      if (error) throw error;
      
      const mappedData = (data || []).map(item => ({
        ...item,
        ioc_list: Array.isArray(item.ioc_list) ? item.ioc_list : [],
        encoded_urls: Array.isArray(item.encoded_urls) ? item.encoded_urls : null,
      })) as PhotoTest[];
      
      setPhotoTests(mappedData);
    } catch (error) {
      console.error('Error fetching photo tests:', error);
      toast.error('Failed to load photo tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('phishing_photo_results')
        .select('is_correct')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const totalAttempts = data?.length || 0;
      const correctAnswers = data?.filter(r => r.is_correct).length || 0;
      
      setUserStats({ totalAttempts, correctAnswers });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getRandomPhotoTest = () => {
    if (photoTests.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * photoTests.length);
    return photoTests[randomIndex];
  };

  const startPhotoTest = () => {
    const test = getRandomPhotoTest();
    if (test) {
      setCurrentPhotoTest(test);
      setPhotoResult(null);
      setPhotoStartTime(Date.now());
      setCurrentView('photo-practice');
    }
  };

  const startHeaderAnalysis = () => {
    const test = getRandomPhotoTest();
    if (test) {
      setCurrentPhotoTest(test);
      setPhotoResult(null);
      setPhotoStartTime(Date.now());
      setCurrentView('header-analysis');
    }
  };

  const startUrlForensics = () => {
    const test = getRandomPhotoTest();
    if (test) {
      setCurrentPhotoTest(test);
      setPhotoResult(null);
      setPhotoStartTime(Date.now());
      setCurrentView('url-forensics');
    }
  };

  const logForensicIncident = async (
    testType: string,
    isCorrect: boolean,
    timeTaken: number,
    missedIocs: string[] = []
  ) => {
    if (!user || !currentPhotoTest || isCorrect) return;

    try {
      await supabase.from('security_incidents').insert({
        user_id: user.id,
        incident_type: 'phishing_failure',
        severity: currentPhotoTest.difficulty_level === 'advanced' ? 'high' : 'medium',
        photo_test_id: currentPhotoTest.id,
        user_answer: !currentPhotoTest.is_phishing,
        time_to_decision_seconds: timeTaken,
        missed_iocs: missedIocs.length > 0 ? missedIocs : currentPhotoTest.ioc_list,
        user_agent: navigator.userAgent,
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        geolocation_country: 'Sri Lanka',
        raw_event_data: {
          test_title: currentPhotoTest.title,
          test_category: currentPhotoTest.category,
          test_mode: testType,
          session_time: new Date().toISOString()
        }
      });
      console.log('Forensic incident logged');
    } catch (error) {
      console.error('Error logging forensic incident:', error);
    }
  };

  const handlePhotoAnswer = async (userAnswer: boolean) => {
    if (!currentPhotoTest || !user) return;

    const timeTaken = Math.round((Date.now() - photoStartTime) / 1000);
    const isCorrect = userAnswer === currentPhotoTest.is_phishing;

    setPhotoResult({ userAnswer, isCorrect, timeTaken });

    try {
      await supabase.from('phishing_photo_results').insert({
        user_id: user.id,
        photo_test_id: currentPhotoTest.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken,
        question_number: userStats.totalAttempts + 1,
      });

      if (!isCorrect) {
        await logForensicIncident('photo-practice', isCorrect, timeTaken);
      }

      fetchUserStats();
      toast(isCorrect ? 'Correct! Well done!' : 'Incorrect. Review the explanation below.', {
        description: isCorrect ? undefined : 'This incident has been logged for analysis.'
      });
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error('Failed to save result');
    }
  };

  const handleHeaderComplete = async (results: { 
    correctlyIdentified: string[]; 
    missed: string[]; 
    falsePositives: string[]; 
    timeTaken: number 
  }) => {
    const totalIocs = results.correctlyIdentified.length + results.missed.length;
    const accuracy = totalIocs > 0 ? results.correctlyIdentified.length / totalIocs : 0;
    const isCorrect = accuracy >= 0.6;

    if (!isCorrect && currentPhotoTest) {
      await logForensicIncident('header-analysis', isCorrect, results.timeTaken, results.missed);
    }

    toast(isCorrect ? 'Good analysis!' : 'Review missed indicators', {
      description: `Accuracy: ${Math.round(accuracy * 100)}%`
    });
  };

  const handleUrlComplete = async (results: { 
    correct: number; 
    total: number; 
    timeTaken: number;
    answers: { urlId: string; correct: boolean }[] 
  }) => {
    const accuracy = results.total > 0 ? results.correct / results.total : 0;
    const isCorrect = accuracy >= 0.6;

    if (!isCorrect && currentPhotoTest) {
      const missedUrls = results.answers.filter(a => !a.correct).map(a => a.urlId);
      await logForensicIncident('url-forensics', isCorrect, results.timeTaken, missedUrls);
    }

    toast(isCorrect ? 'Good URL analysis!' : 'Review missed malicious URLs', {
      description: `Score: ${results.correct}/${results.total}`
    });
  };

  const backToMenu = () => {
    setCurrentView('menu');
    setCurrentPhotoTest(null);
    setPhotoResult(null);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Header Analysis View
  if (currentView === 'header-analysis' && currentPhotoTest) {
    const sampleHeaders = currentPhotoTest.email_headers || `From: "Security Team" <security@bank-secure.com>
Reply-To: attacker@malicious.ru
Return-Path: <bounce@suspicious-server.net>
Subject: Urgent: Verify Your Account
Date: ${new Date().toUTCString()}
Received: from mail.suspicious-server.net (192.168.1.100)
X-SPF-Result: FAIL
X-DKIM-Result: NONE
X-DMARC-Result: FAIL
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8`;

    const headerData = {
      from: 'Security Team <security@bank-secure.com>',
      replyTo: 'attacker@malicious.ru',
      returnPath: 'bounce@suspicious-server.net',
      subject: currentPhotoTest.title,
      date: new Date().toUTCString(),
      received: 'from mail.suspicious-server.net (192.168.1.100)',
      spf: 'fail' as const,
      dkim: 'fail' as const,
      dmarc: 'fail' as const,
      raw: sampleHeaders
    };

    const correctIocs = currentPhotoTest.ioc_list.length > 0 
      ? currentPhotoTest.ioc_list 
      : ['spf_fail', 'dkim_fail', 'dmarc_fail', 'reply_mismatch'];

    return (
      <EmailHeaderAnalyzer
        headers={headerData}
        correctIoCs={correctIocs}
        onComplete={handleHeaderComplete}
        onBack={backToMenu}
      />
    );
  }

  // URL Forensics View
  if (currentView === 'url-forensics' && currentPhotoTest) {
    const sampleUrls = currentPhotoTest.encoded_urls && currentPhotoTest.encoded_urls.length > 0
      ? currentPhotoTest.encoded_urls
      : [
          {
            id: 'url1',
            displayText: 'Click here to verify',
            encodedUrl: 'aHR0cHM6Ly9mYWtlLWJhbmsubmV0L2xvZ2lu',
            decodedUrl: 'https://fake-bank.net/login',
            encodingType: 'base64',
            isMalicious: true,
            explanation: 'Decoded URL reveals a fake bank domain.'
          },
          {
            id: 'url2',
            displayText: 'Google Support',
            encodedUrl: 'https://xn--googl-yua.com',
            decodedUrl: 'https://googlé.com',
            encodingType: 'punycode',
            isMalicious: true,
            explanation: 'Punycode homograph attack using accented characters.'
          },
          {
            id: 'url3',
            displayText: 'Microsoft Update',
            encodedUrl: 'https://microsoft.com/update',
            decodedUrl: 'https://microsoft.com/update',
            encodingType: 'none',
            isMalicious: false,
            explanation: 'Legitimate Microsoft domain.'
          }
        ];

    return (
      <URLDecoder
        encodedUrls={sampleUrls}
        onComplete={handleUrlComplete}
        onBack={backToMenu}
      />
    );
  }

  // Photo Practice View
  if (currentView === 'photo-practice' && currentPhotoTest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={backToMenu}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-bold">Photo Test Practice</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentPhotoTest.title}</CardTitle>
                <CardDescription>{currentPhotoTest.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{currentPhotoTest.category}</Badge>
                <Badge className={getDifficultyColor(currentPhotoTest.difficulty_level)}>
                  {currentPhotoTest.difficulty_level}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="relative group">
                <img 
                  src={currentPhotoTest.image_url} 
                  alt={currentPhotoTest.title}
                  className="max-w-full max-h-96 rounded-lg border shadow-sm"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="absolute top-2 right-2 opacity-80 hover:opacity-100">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                    <img
                      src={currentPhotoTest.image_url}
                      alt="Enlarged view"
                      className="w-full h-auto max-h-[calc(90vh-2rem)] object-contain rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {!photoResult ? (
              <div className="flex gap-4 justify-center">
                <Button size="lg" variant="outline" onClick={() => handlePhotoAnswer(false)} className="min-w-32">
                  Legitimate
                </Button>
                <Button size="lg" variant="destructive" onClick={() => handlePhotoAnswer(true)} className="min-w-32">
                  Phishing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${photoResult.isCorrect ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
                  {photoResult.isCorrect ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                  <div className="text-center">
                    <p className="font-semibold">{photoResult.isCorrect ? 'Correct!' : 'Incorrect!'}</p>
                    <p className="text-sm text-muted-foreground">
                      This was {currentPhotoTest.is_phishing ? 'a phishing attempt' : 'legitimate'}. Time: {photoResult.timeTaken}s
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Explanation:</p>
                  <p className="text-sm">{currentPhotoTest.explanation}</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={startPhotoTest}>Try Another</Button>
                  <Button variant="outline" onClick={backToMenu}>Back to Menu</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Menu View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Threat Analysis Lab
        </h1>
        <p className="text-muted-foreground mt-2">
          Practice identifying phishing attempts through multiple forensic analysis modes
        </p>
      </div>

      {/* User Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Your Performance</p>
                <p className="text-2xl font-bold">
                  {userStats.totalAttempts > 0 
                    ? `${Math.round((userStats.correctAnswers / userStats.totalAttempts) * 100)}%` 
                    : '0%'} Accuracy
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tests Completed</p>
              <p className="text-2xl font-bold">{userStats.totalAttempts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Modes */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Photo Analysis */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              <CardTitle>Photo Analysis</CardTitle>
            </div>
            <CardDescription>
              Analyze screenshots and images to identify visual phishing indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2">Visual</Badge>
              <Badge variant="outline">Screenshots</Badge>
              <p className="text-sm text-muted-foreground mt-4">
                {photoTests.length} tests available
              </p>
            </div>
            <Button className="w-full mt-4" onClick={startPhotoTest}>Start Photo Test</Button>
          </CardContent>
        </Card>

        {/* Email Header Analysis */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-500" />
              <CardTitle>Header Investigation</CardTitle>
            </div>
            <CardDescription>
              Inspect email headers to identify SPF/DKIM/DMARC failures and spoofing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2">SPF</Badge>
              <Badge variant="outline" className="mr-2">DKIM</Badge>
              <Badge variant="outline">DMARC</Badge>
              <p className="text-sm text-muted-foreground mt-4">
                Analyze authentication records
              </p>
            </div>
            <Button className="w-full mt-4" variant="secondary" onClick={startHeaderAnalysis}>Start Header Analysis</Button>
          </CardContent>
        </Card>

        {/* URL Forensics */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-6 w-6 text-orange-500" />
              <CardTitle>URL Forensics</CardTitle>
            </div>
            <CardDescription>
              Decode obfuscated URLs to reveal malicious destinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2">Base64</Badge>
              <Badge variant="outline" className="mr-2">Hex</Badge>
              <Badge variant="outline">Punycode</Badge>
              <p className="text-sm text-muted-foreground mt-4">
                Identify URL obfuscation techniques
              </p>
            </div>
            <Button className="w-full mt-4" variant="secondary" onClick={startUrlForensics}>Start URL Analysis</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhishingSimulator;
