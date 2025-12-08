import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Mail, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailHeader {
  from: string;
  replyTo: string;
  returnPath: string;
  spfResult: 'PASS' | 'FAIL' | 'NONE';
  dkimResult: 'PASS' | 'FAIL' | 'NONE';
  dmarcResult: 'PASS' | 'FAIL' | 'NONE';
  receivedFrom: string;
  subject: string;
  date: string;
}

interface IoC {
  id: string;
  name: string;
  description: string;
  isCritical: boolean;
}

interface EmailHeaderAnalyzerProps {
  headers: EmailHeader;
  correctIoCs: IoC[];
  onComplete: (identifiedIoCs: string[], missed: string[], timeTaken: number) => void;
  onBack: () => void;
}

export function EmailHeaderAnalyzer({ headers, correctIoCs, onComplete, onBack }: EmailHeaderAnalyzerProps) {
  const [selectedIoCs, setSelectedIoCs] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [expandedSection, setExpandedSection] = useState<string | null>('headers');

  const allPossibleIoCs: IoC[] = [
    { id: 'spf_fail', name: 'SPF Failure', description: 'Sender Policy Framework check failed', isCritical: true },
    { id: 'dkim_fail', name: 'DKIM Failure', description: 'DomainKeys Identified Mail signature invalid', isCritical: true },
    { id: 'dmarc_fail', name: 'DMARC Failure', description: 'Domain-based Message Authentication failed', isCritical: true },
    { id: 'reply_mismatch', name: 'Reply-To Mismatch', description: 'Reply-To differs from From address', isCritical: true },
    { id: 'return_path_mismatch', name: 'Return-Path Mismatch', description: 'Return-Path differs from From address', isCritical: false },
    { id: 'suspicious_domain', name: 'Suspicious Domain', description: 'Domain appears to be spoofed or typosquatted', isCritical: true },
    { id: 'missing_spf', name: 'Missing SPF Record', description: 'No SPF authentication present', isCritical: false },
    { id: 'missing_dkim', name: 'Missing DKIM Signature', description: 'No DKIM authentication present', isCritical: false },
  ];

  const toggleIoC = (iocId: string) => {
    setSelectedIoCs(prev => 
      prev.includes(iocId) 
        ? prev.filter(id => id !== iocId)
        : [...prev, iocId]
    );
  };

  const handleSubmit = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correctIoCIds = correctIoCs.map(ioc => ioc.id);
    const missed = correctIoCIds.filter(id => !selectedIoCs.includes(id));
    setShowResults(true);
    onComplete(selectedIoCs, missed, timeTaken);
  };

  const getResultColor = (result: 'PASS' | 'FAIL' | 'NONE') => {
    switch (result) {
      case 'PASS': return 'text-green-500';
      case 'FAIL': return 'text-destructive';
      case 'NONE': return 'text-warning';
    }
  };

  const getResultIcon = (result: 'PASS' | 'FAIL' | 'NONE') => {
    switch (result) {
      case 'PASS': return <CheckCircle className="w-4 h-4" />;
      case 'FAIL': return <XCircle className="w-4 h-4" />;
      case 'NONE': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const correctIoCIds = correctIoCs.map(ioc => ioc.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" />
          Email Header Analysis
        </h2>
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Raw Email Headers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze the headers below to identify Indicators of Compromise (IoCs)
          </p>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto space-y-1">
            <div><span className="text-primary font-semibold">From:</span> {headers.from}</div>
            <div><span className="text-primary font-semibold">Reply-To:</span> {headers.replyTo}</div>
            <div><span className="text-primary font-semibold">Return-Path:</span> {headers.returnPath}</div>
            <div><span className="text-primary font-semibold">Subject:</span> {headers.subject}</div>
            <div><span className="text-primary font-semibold">Date:</span> {headers.date}</div>
            <div><span className="text-primary font-semibold">Received:</span> from {headers.receivedFrom}</div>
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">X-SPF-Result:</span> 
                <span className={cn("flex items-center gap-1", getResultColor(headers.spfResult))}>
                  {getResultIcon(headers.spfResult)} {headers.spfResult}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">X-DKIM-Result:</span> 
                <span className={cn("flex items-center gap-1", getResultColor(headers.dkimResult))}>
                  {getResultIcon(headers.dkimResult)} {headers.dkimResult}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">X-DMARC-Result:</span> 
                <span className={cn("flex items-center gap-1", getResultColor(headers.dmarcResult))}>
                  {getResultIcon(headers.dmarcResult)} {headers.dmarcResult}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identify Indicators of Compromise</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select all security issues you've identified in the email headers
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPossibleIoCs.map(ioc => {
              const isSelected = selectedIoCs.includes(ioc.id);
              const isCorrect = showResults && correctIoCIds.includes(ioc.id);
              const wasSelectedCorrectly = showResults && isSelected && isCorrect;
              const wasMissed = showResults && !isSelected && isCorrect;
              const wasFalsePositive = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={ioc.id}
                  onClick={() => !showResults && toggleIoC(ioc.id)}
                  disabled={showResults}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    !showResults && isSelected && "border-primary bg-primary/10",
                    !showResults && !isSelected && "border-border hover:border-primary/50",
                    wasSelectedCorrectly && "border-green-500 bg-green-500/10",
                    wasMissed && "border-destructive bg-destructive/10",
                    wasFalsePositive && "border-warning bg-warning/10",
                    showResults && "cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ioc.name}</span>
                    {ioc.isCritical && (
                      <Badge variant="destructive" className="text-xs">Critical</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ioc.description}</p>
                  {showResults && (
                    <div className="mt-2 text-xs">
                      {wasSelectedCorrectly && <span className="text-green-500">✓ Correctly identified</span>}
                      {wasMissed && <span className="text-destructive">✗ You missed this IoC</span>}
                      {wasFalsePositive && <span className="text-warning">⚠ False positive</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!showResults && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleSubmit} size="lg" className="gap-2">
                Submit Analysis <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {showResults && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Analysis Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {selectedIoCs.filter(id => correctIoCIds.includes(id)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Correctly Identified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {correctIoCIds.filter(id => !selectedIoCs.includes(id)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Missed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {selectedIoCs.filter(id => !correctIoCIds.includes(id)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">False Positives</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}