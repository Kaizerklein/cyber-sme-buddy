import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Code, 
  Lock, 
  Unlock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { useToast } from '@/hooks/use-toast';

export default function SecurityPlayground() {
  const [xssInput, setXssInput] = useState('');
  const [vulnerableOutput, setVulnerableOutput] = useState('');
  const [sanitizedOutput, setSanitizedOutput] = useState('');
  const [sqlInput, setSqlInput] = useState('');
  const [rateLimitAttempts, setRateLimitAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  const handleXssTest = () => {
    // Vulnerable output - DO NOT do this in production!
    setVulnerableOutput(xssInput);
    
    // Sanitized output
    const clean = DOMPurify.sanitize(xssInput, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    setSanitizedOutput(clean);
  };

  const simulateLogin = () => {
    if (isBlocked) {
      toast({
        title: "Blocked",
        description: "Too many attempts. Please wait 15 minutes.",
        variant: "destructive",
      });
      return;
    }

    const newAttempts = rateLimitAttempts + 1;
    setRateLimitAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsBlocked(true);
      toast({
        title: "Rate Limited!",
        description: "5 failed attempts detected. Account locked for 15 minutes.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Failed",
        description: `Invalid credentials. ${5 - newAttempts} attempts remaining.`,
        variant: "destructive",
      });
    }
  };

  const resetRateLimit = () => {
    setRateLimitAttempts(0);
    setIsBlocked(false);
    toast({
      title: "Reset",
      description: "Rate limit counter has been reset.",
    });
  };

  const xssExamples = [
    { label: 'Script Tag', value: '<script>alert("XSS")</script>' },
    { label: 'Event Handler', value: '<img src="x" onerror="alert(\'XSS\')">' },
    { label: 'SVG Injection', value: '<svg onload="alert(\'XSS\')">' },
    { label: 'Link with JS', value: '<a href="javascript:alert(\'XSS\')">Click</a>' },
  ];

  const sqlExamples = [
    { label: 'Basic Injection', value: "' OR '1'='1" },
    { label: 'Union Attack', value: "' UNION SELECT * FROM users --" },
    { label: 'Drop Table', value: "'; DROP TABLE users; --" },
    { label: 'Comment Bypass', value: "admin'--" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Security Playground
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Learn about common web vulnerabilities and how to defend against them.
          This is a safe sandbox environment for educational purposes.
        </p>
      </div>

      <Tabs defaultValue="xss" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="xss">XSS Demo</TabsTrigger>
          <TabsTrigger value="sql">SQL Injection</TabsTrigger>
          <TabsTrigger value="ratelimit">Rate Limiting</TabsTrigger>
        </TabsList>

        {/* XSS Demonstration */}
        <TabsContent value="xss">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Unlock className="w-5 h-5" />
                  Vulnerable Input
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This simulates a text field that doesn't sanitize input (DANGEROUS!)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Try XSS Payload:</label>
                  <Textarea 
                    value={xssInput}
                    onChange={(e) => setXssInput(e.target.value)}
                    placeholder="Enter HTML/JavaScript code..."
                    className="font-mono text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {xssExamples.map(example => (
                    <Button
                      key={example.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setXssInput(example.value)}
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>

                <Button onClick={handleXssTest} className="w-full">
                  Test Input
                </Button>

                {vulnerableOutput && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Vulnerable Output:</span>
                    </div>
                    <div 
                      className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg min-h-[40px]"
                      dangerouslySetInnerHTML={{ __html: vulnerableOutput }}
                    />
                    <p className="text-xs text-destructive">
                      ⚠️ In a real app, this would execute malicious scripts!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <Lock className="w-5 h-5" />
                  Sanitized Input (Safe)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Using DOMPurify to strip dangerous content
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`// Sanitization Code
import DOMPurify from 'dompurify';

const cleanInput = DOMPurify.sanitize(
  userInput, 
  { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }
);`}
                  </pre>
                </div>

                {sanitizedOutput !== undefined && xssInput && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">Sanitized Output:</span>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg min-h-[40px]">
                      {sanitizedOutput || <span className="text-muted-foreground italic">All dangerous content removed</span>}
                    </div>
                    <p className="text-xs text-green-500">
                      ✓ Malicious scripts are stripped out
                    </p>
                  </div>
                )}

                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" />
                    OWASP A03:2021 - Injection
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cross-Site Scripting (XSS) allows attackers to inject malicious scripts 
                    into web pages. Always sanitize user input and use Content Security Policy (CSP).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SQL Injection Demo */}
        <TabsContent value="sql">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Unlock className="w-5 h-5" />
                  Vulnerable Query
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  String concatenation in SQL queries
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username Input:</label>
                  <Input 
                    value={sqlInput}
                    onChange={(e) => setSqlInput(e.target.value)}
                    placeholder="Enter username..."
                    className="font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {sqlExamples.map(example => (
                    <Button
                      key={example.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setSqlInput(example.value)}
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Vulnerable Query:</p>
                  <pre className="text-sm font-mono text-destructive overflow-x-auto">
                    {`SELECT * FROM users WHERE username = '${sqlInput || 'user_input'}'`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <Lock className="w-5 h-5" />
                  Parameterized Query (Safe)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Using prepared statements with Supabase
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`// Safe Query with Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('username', userInput);

// The SDK automatically parameterizes
// the query, preventing SQL injection`}
                  </pre>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Safe Query (Parameterized):</p>
                  <pre className="text-sm font-mono text-green-500 overflow-x-auto">
                    {`SELECT * FROM users WHERE username = $1`}
                  </pre>
                  <p className="text-xs text-green-500 mt-2">
                    ✓ User input is treated as data, not code
                  </p>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" />
                    Prevention Strategies
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use parameterized queries / prepared statements</li>
                    <li>• Use ORMs like Prisma or Supabase client</li>
                    <li>• Implement input validation</li>
                    <li>• Apply principle of least privilege</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate Limiting Demo */}
        <TabsContent value="ratelimit">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Rate Limiting Demo
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Demonstrates brute force protection (OWASP A07:2021)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Login Attempts</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div 
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          i <= rateLimitAttempts 
                            ? "bg-destructive text-destructive-foreground" 
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {5 - rateLimitAttempts} attempts remaining before lockout
                  </p>
                </div>

                {isBlocked && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="font-semibold text-destructive">Account Temporarily Locked</p>
                    <p className="text-sm text-muted-foreground">
                      Too many failed login attempts. Please wait 15 minutes.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Input placeholder="Username" disabled={isBlocked} />
                  <Input type="password" placeholder="Password" disabled={isBlocked} />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={simulateLogin} 
                    disabled={isBlocked}
                    variant="destructive"
                    className="flex-1"
                  >
                    Attempt Login (Wrong Password)
                  </Button>
                  <Button onClick={resetRateLimit} variant="outline">
                    Reset Demo
                  </Button>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4" />
                    Implementation
                  </h4>
                  <pre className="text-xs overflow-x-auto">
{`// Edge Function Rate Limiting
const RATE_LIMIT = 5;
const WINDOW_MINUTES = 15;

if (attempts >= RATE_LIMIT) {
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests',
      retryAfter: WINDOW_MINUTES * 60 
    }),
    { status: 429 }
  );
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}