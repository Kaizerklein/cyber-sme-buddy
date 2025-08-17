import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  Download, 
  Lock, 
  Wifi, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  Building, 
  Mail,
  Eye,
  Key,
  HardDrive,
  Router,
  Cloud,
  UserCheck,
  Settings,
  Globe,
  Zap
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  content: {
    overview: string;
    steps: string[];
    tips: string[];
    tools?: string[];
    downloadable?: {
      title: string;
      description: string;
      type: string;
    }[];
  };
}

const guideSections: GuideSection[] = [
  {
    id: 'password-security',
    title: 'Password Security',
    description: 'Implement strong password policies and multi-factor authentication',
    icon: Lock,
    priority: 'high',
    content: {
      overview: 'Strong passwords are your first line of defense. This guide helps you implement robust password policies for your organization.',
      steps: [
        'Establish minimum password requirements (12+ characters, mixed case, numbers, symbols)',
        'Implement multi-factor authentication (MFA) for all accounts',
        'Use a business password manager for secure password storage',
        'Set up regular password rotation policies',
        'Train employees on password best practices',
        'Monitor for compromised passwords using breach databases'
      ],
      tips: [
        'Use passphrases instead of complex passwords',
        'Never reuse passwords across different systems',
        'Store passwords securely - never in plain text',
        'Consider single sign-on (SSO) solutions to reduce password fatigue'
      ],
      tools: ['1Password Business', 'Bitwarden', 'Microsoft Authenticator', 'Google Authenticator'],
      downloadable: [
        {
          title: 'Password Policy Template',
          description: 'Ready-to-use password policy document for Sri Lankan SMEs',
          type: 'PDF'
        },
        {
          title: 'MFA Implementation Checklist',
          description: 'Step-by-step checklist for implementing multi-factor authentication',
          type: 'PDF'
        }
      ]
    }
  },
  {
    id: 'phishing-protection',
    title: 'Phishing Protection',
    description: 'Recognize and prevent phishing attacks targeting your business',
    icon: Mail,
    priority: 'high',
    content: {
      overview: 'Phishing attacks are one of the most common cyber threats facing SMEs. Learn to identify and prevent these attacks.',
      steps: [
        'Train employees to identify phishing emails and suspicious links',
        'Implement email filtering and anti-phishing solutions',
        'Set up domain-based message authentication (DMARC)',
        'Create a clear incident response process for suspected phishing',
        'Regularly test employees with simulated phishing campaigns',
        'Keep email security software updated'
      ],
      tips: [
        'Always verify sender identity through alternative communication channels',
        'Hover over links to preview URLs before clicking',
        'Be suspicious of urgent requests for sensitive information',
        'Check for spelling errors and unusual formatting in emails'
      ],
      tools: ['Microsoft Defender', 'Proofpoint', 'Mimecast', 'KnowBe4'],
      downloadable: [
        {
          title: 'Phishing Identification Guide',
          description: 'Visual guide to identifying common phishing tactics',
          type: 'PDF'
        },
        {
          title: 'Email Security Checklist',
          description: 'Complete checklist for securing your business email',
          type: 'PDF'
        }
      ]
    }
  },
  {
    id: 'data-backup',
    title: 'Data Backup & Recovery',
    description: 'Protect your business data with proper backup strategies',
    icon: HardDrive,
    priority: 'high',
    content: {
      overview: 'Regular data backups are essential for business continuity. Implement the 3-2-1 backup strategy for maximum protection.',
      steps: [
        'Identify critical business data that needs protection',
        'Implement the 3-2-1 backup rule (3 copies, 2 different media, 1 offsite)',
        'Set up automated daily backups for critical systems',
        'Test backup restoration procedures monthly',
        'Document backup and recovery procedures',
        'Train staff on backup verification processes'
      ],
      tips: [
        'Test your backups regularly - untested backups may be worthless',
        'Keep backups encrypted and access-controlled',
        'Consider cloud backup solutions for offsite storage',
        'Document recovery time objectives (RTO) and recovery point objectives (RPO)'
      ],
      tools: ['Google Drive', 'Microsoft OneDrive', 'Acronis', 'Carbonite'],
      downloadable: [
        {
          title: 'Backup Strategy Template',
          description: 'Template for creating a comprehensive backup strategy',
          type: 'PDF'
        },
        {
          title: 'Recovery Testing Checklist',
          description: 'Checklist for regular backup testing procedures',
          type: 'PDF'
        }
      ]
    }
  },
  {
    id: 'network-security',
    title: 'Network Security',
    description: 'Secure your business network infrastructure',
    icon: Router,
    priority: 'medium',
    content: {
      overview: 'Secure your network infrastructure to prevent unauthorized access and data breaches.',
      steps: [
        'Change default passwords on all network equipment',
        'Enable WPA3 encryption on Wi-Fi networks',
        'Set up a guest network separate from business systems',
        'Implement network access control (NAC)',
        'Install and configure business firewalls',
        'Monitor network traffic for suspicious activity'
      ],
      tips: [
        'Regularly update firmware on routers and network equipment',
        'Use VPNs for remote access to business networks',
        'Segment your network to limit access to sensitive systems',
        'Disable unused network services and ports'
      ],
      tools: ['pfSense', 'SonicWall', 'Fortinet', 'Cisco Meraki'],
      downloadable: [
        {
          title: 'Network Security Assessment',
          description: 'Self-assessment tool for network security posture',
          type: 'PDF'
        }
      ]
    }
  },
  {
    id: 'mobile-security',
    title: 'Mobile Device Security',
    description: 'Secure smartphones and tablets used for business',
    icon: Smartphone,
    priority: 'medium',
    content: {
      overview: 'Mobile devices are increasingly targeted by cybercriminals. Implement mobile device management (MDM) solutions.',
      steps: [
        'Implement mobile device management (MDM) policies',
        'Require device encryption and screen locks',
        'Install security apps on business mobile devices',
        'Establish clear BYOD (Bring Your Own Device) policies',
        'Enable remote wipe capabilities for lost devices',
        'Keep mobile operating systems and apps updated'
      ],
      tips: [
        'Only download apps from official app stores',
        'Be cautious when connecting to public Wi-Fi networks',
        'Use business-approved cloud storage for work files',
        'Report lost or stolen devices immediately'
      ],
      tools: ['Microsoft Intune', 'VMware Workspace ONE', 'Jamf', 'Google Workspace'],
      downloadable: [
        {
          title: 'BYOD Policy Template',
          description: 'Template for creating bring-your-own-device policies',
          type: 'PDF'
        }
      ]
    }
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    description: 'Prepare for and respond to cybersecurity incidents',
    icon: AlertTriangle,
    priority: 'medium',
    content: {
      overview: 'Having a clear incident response plan helps minimize damage when security incidents occur.',
      steps: [
        'Create an incident response team with defined roles',
        'Develop incident classification and escalation procedures',
        'Establish communication protocols for different incident types',
        'Create contact lists for internal teams and external experts',
        'Document common incident response procedures',
        'Conduct regular incident response training and simulations'
      ],
      tips: [
        'Practice incident response procedures before you need them',
        'Keep incident response plans updated and accessible',
        'Establish relationships with cybersecurity experts before incidents occur',
        'Document lessons learned after each incident'
      ],
      tools: ['NIST Cybersecurity Framework', 'SANS Incident Response Framework'],
      downloadable: [
        {
          title: 'Incident Response Plan Template',
          description: 'Customizable incident response plan for SMEs',
          type: 'PDF'
        },
        {
          title: 'Incident Report Form',
          description: 'Standardized form for reporting security incidents',
          type: 'PDF'
        }
      ]
    }
  }
];

export default function SecurityGuide() {
  const [selectedSection, setSelectedSection] = useState<string>('password-security');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const selectedGuide = guideSections.find(section => section.id === selectedSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security Guide</h1>
        <p className="text-muted-foreground">
          Comprehensive cybersecurity guidance specifically designed for Sri Lankan SMEs
        </p>
      </div>

      {/* Quick Start Alert */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Quick Start Recommendation</AlertTitle>
        <AlertDescription>
          New to cybersecurity? Start with Password Security and Phishing Protection - these address the most common threats to Sri Lankan businesses.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Security Topics</CardTitle>
              <CardDescription>Choose a topic to explore</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {guideSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{section.title}</div>
                        <Badge
                          variant={getPriorityColor(section.priority) as any}
                          className="text-xs mt-1"
                        >
                          {section.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedGuide && (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <selectedGuide.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{selectedGuide.title}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {selectedGuide.description}
                    </CardDescription>
                    <Badge
                      variant={getPriorityColor(selectedGuide.priority) as any}
                      className="mt-3"
                    >
                      {selectedGuide.priority} priority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="implementation">Implementation</TabsTrigger>
                    <TabsTrigger value="tools">Tools & Resources</TabsTrigger>
                    <TabsTrigger value="downloads">Downloads</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedGuide.content.overview}
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Why This Matters for Sri Lankan SMEs
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedGuide.id === 'password-security' && 
                          "With the increasing digitization of Sri Lankan businesses, weak passwords have become a major vulnerability. Recent surveys show that 80% of data breaches involve weak or stolen passwords."}
                        {selectedGuide.id === 'phishing-protection' && 
                          "Phishing attacks targeting Sri Lankan businesses have increased by 150% in the past year, making email security a critical priority for local SMEs."}
                        {selectedGuide.id === 'data-backup' && 
                          "Power outages and infrastructure challenges in Sri Lanka make data backup particularly crucial for business continuity."}
                        {selectedGuide.id === 'network-security' && 
                          "With the expansion of broadband internet across Sri Lanka, many SMEs are facing new network security challenges they haven't encountered before."}
                        {selectedGuide.id === 'mobile-security' && 
                          "The widespread adoption of smartphones for business in Sri Lanka has created new security risks that many SMEs are unprepared for."}
                        {selectedGuide.id === 'incident-response' && 
                          "Limited cybersecurity expertise in Sri Lankan SMEs makes having a clear incident response plan essential for minimizing damage during security incidents."}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="implementation" className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Step-by-Step Implementation
                      </h4>
                      <div className="space-y-3">
                        {selectedGuide.content.steps.map((step, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-sm">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Best Practices & Tips
                      </h4>
                      <div className="grid gap-3">
                        {selectedGuide.content.tips.map((tip, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tools" className="space-y-6">
                    {selectedGuide.content.tools && (
                      <div>
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Recommended Tools & Solutions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedGuide.content.tools.map((tool, index) => (
                            <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded">
                                  <Globe className="h-4 w-4" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm">{tool}</h5>
                                  <p className="text-xs text-muted-foreground">
                                    Professional security solution
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Alert>
                      <Building className="h-4 w-4" />
                      <AlertTitle>Local Support in Sri Lanka</AlertTitle>
                      <AlertDescription>
                        Many of these tools have local partners or distributors in Sri Lanka. 
                        Contact their local representatives for pricing and support in your area.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="downloads" className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Downloadable Resources
                      </h4>
                      
                      {selectedGuide.content.downloadable ? (
                        <div className="grid gap-4">
                          {selectedGuide.content.downloadable.map((resource, index) => (
                            <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-primary/10 text-primary rounded">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium">{resource.title}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {resource.description}
                                    </p>
                                    <Badge variant="outline" className="mt-2">
                                      {resource.type}
                                    </Badge>
                                  </div>
                                </div>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Resources Coming Soon</h3>
                          <p className="text-muted-foreground">
                            Downloadable resources for this topic are being prepared and will be available soon.
                          </p>
                        </div>
                      )}
                    </div>

                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertTitle>Need Help Implementing?</AlertTitle>
                      <AlertDescription>
                        Consider engaging with local cybersecurity consultants or the Sri Lanka CERT 
                        for additional guidance on implementing these security measures.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources for Sri Lankan SMEs</CardTitle>
          <CardDescription>Local and international resources for cybersecurity guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Sri Lanka CERT</h4>
              <p className="text-sm text-muted-foreground mb-3">
                National cybersecurity incident response team providing local guidance and support.
              </p>
              <Button variant="outline" size="sm">Visit Website</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">ICTA Sri Lanka</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Information and Communication Technology Agency providing digital security resources.
              </p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Local IT Partners</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Find certified cybersecurity professionals and vendors in your area.
              </p>
              <Button variant="outline" size="sm">Find Partners</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}