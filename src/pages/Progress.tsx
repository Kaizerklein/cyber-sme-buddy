import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Award, TrendingUp, Target, Clock, BookOpen, Shield, Trophy, Star, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  target?: number;
}

interface ProgressData {
  courses: any[];
  phishingResults: any[];
  userProgress: any[];
  weeklyActivity: any[];
  categoryProgress: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function Progress() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({
    courses: [],
    phishingResults: [],
    userProgress: [],
    weeklyActivity: [],
    categoryProgress: []
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel
      const [coursesRes, progressRes, phishingRes] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true),
        supabase.from('user_progress').select('*, courses(*)').eq('user_id', user.id),
        supabase.from('phishing_results').select('*, phishing_simulations(*)').eq('user_id', user.id)
      ]);

      const courses = coursesRes.data || [];
      const userProgress = progressRes.data || [];
      const phishingResults = phishingRes.data || [];

      // Calculate weekly activity based on real data
      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const coursesCompleted = userProgress.filter(p => 
          p.completed_at && 
          new Date(p.completed_at) >= dayStart && 
          new Date(p.completed_at) <= dayEnd
        ).length;
        
        const phishingAttempts = phishingResults.filter(r => 
          r.created_at && 
          new Date(r.created_at) >= dayStart && 
          new Date(r.created_at) <= dayEnd
        ).length;
        
        return {
          day: format(date, 'EEE'),
          courses: coursesCompleted,
          phishing: phishingAttempts,
        };
      }).reverse();

      // Calculate category progress
      const categories = [...new Set(courses.map(c => c.category))];
      const categoryProgress = categories.map(category => {
        const categoryMicroses = courses.filter(c => c.category === category);
        const completed = userProgress.filter(p => 
          p.completed && categoryMicroses.some(c => c.id === p.course_id)
        ).length;
        return {
          category: category.charAt(0).toUpperCase() + category.slice(1),
          completed,
          total: categoryMicroses.length,
          percentage: categoryMicroses.length > 0 ? (completed / categoryMicroses.length) * 100 : 0
        };
      });

      setData({
        courses,
        phishingResults,
        userProgress,
        weeklyActivity,
        categoryProgress
      });

      // Calculate achievements
      calculateAchievements(userProgress, phishingResults, courses, categories);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (userProgress: any[], phishingResults: any[], courses: any[], categories: string[]) => {
    const completedCourses = userProgress.filter(p => p.completed).length;
    const phishingSuccess = phishingResults.filter(r => r.is_correct).length;
    const totalPhishing = phishingResults.length;

    const achievementsList: Achievement[] = [
      {
        id: 'first-course',
        title: 'First Steps',
        description: 'Complete your first cybersecurity course',
        icon: BookOpen,
        earned: completedCourses >= 1,
        earnedDate: completedCourses >= 1 ? userProgress.find(p => p.completed)?.completed_at : undefined,
        progress: completedCourses,
        target: 1
      },
      {
        id: 'course-master',
        title: 'Course Master',
        description: 'Complete 5 cybersecurity courses',
        icon: Trophy,
        earned: completedCourses >= 5,
        progress: completedCourses,
        target: 5
      },
      {
        id: 'phishing-detector',
        title: 'Phishing Detector',
        description: 'Successfully identify 10 phishing attempts',
        icon: Target,
        earned: phishingSuccess >= 10,
        progress: phishingSuccess,
        target: 10
      },
      {
        id: 'security-expert',
        title: 'Security Expert',
        description: 'Achieve 90% success rate in phishing detection',
        icon: Shield,
        earned: totalPhishing >= 10 && (phishingSuccess / totalPhishing) >= 0.9,
        progress: totalPhishing >= 10 ? Math.round((phishingSuccess / totalPhishing) * 100) : 0,
        target: 90
      },
      {
        id: 'learning-streak',
        title: 'Dedicated Learner',
        description: 'Maintain a 7-day learning streak',
        icon: Star,
        earned: false, // Streak tracking would need to be implemented with proper date tracking
        progress: 0,
        target: 7
      },
      {
        id: 'all-categories',
        title: 'Well Rounded',
        description: 'Complete courses in all categories',
        icon: Award,
        earned: categories.length > 0 && categories.every(category => 
          userProgress.some(p => p.completed && courses.find(c => c.id === p.course_id && c.category === category))
        ),
        progress: categories.filter(category => 
          userProgress.some(p => p.completed && courses.find(c => c.id === p.course_id && c.category === category))
        ).length,
        target: categories.length || 1
      }
    ];

    setAchievements(achievementsList);
  };

  const overallProgress = data.courses.length > 0 ? 
    (data.userProgress.filter(p => p.completed).length / data.courses.length) * 100 : 0;

  const phishingSuccessRate = data.phishingResults.length > 0 ? 
    (data.phishingResults.filter(r => r.is_correct).length / data.phishingResults.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
        <p className="text-muted-foreground">Track your cybersecurity learning journey and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{overallProgress.toFixed(0)}%</div>
            <ProgressBar value={overallProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {data.userProgress.filter(p => p.completed).length} of {data.courses.length} courses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phishing Detection</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{phishingSuccessRate.toFixed(0)}%</div>
            <ProgressBar value={phishingSuccessRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {data.phishingResults.filter(r => r.is_correct).length} correct of {data.phishingResults.length} attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {data.userProgress.reduce((total, p) => total + (p.courses?.duration_minutes || 0), 0)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Total time invested in learning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Your learning activity over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="courses" fill="hsl(var(--primary))" name="Courses" />
                <Bar dataKey="phishing" fill="hsl(var(--accent))" name="Phishing Tests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
            <CardDescription>Your completion rate across different security topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryProgress.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{category.category}</span>
                    <span>{category.completed}/{category.total}</span>
                  </div>
                  <ProgressBar value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your cybersecurity learning milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg transition-all ${
                  achievement.earned 
                    ? 'border-success bg-success/5' 
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.earned 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <achievement.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      {achievement.earned && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    {!achievement.earned && achievement.progress !== undefined && achievement.target && (
                      <>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <ProgressBar 
                          value={(achievement.progress / achievement.target) * 100} 
                          className="h-1"
                        />
                      </>
                    )}
                    {achievement.earned && achievement.earnedDate && (
                      <p className="text-xs text-success">
                        Earned {format(new Date(achievement.earnedDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.userProgress
              .filter(p => p.completed)
              .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
              .slice(0, 5)
              .map((progress) => (
                <div key={progress.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="p-2 bg-success/10 text-success rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{progress.courses?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Course completed • {format(new Date(progress.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary">{progress.courses?.category}</Badge>
                </div>
              ))}
            
            {data.phishingResults
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3)
              .map((result) => (
                <div key={result.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    result.is_correct 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Phishing Simulation</h4>
                    <p className="text-sm text-muted-foreground">
                      {result.is_correct ? 'Correctly identified' : 'Missed'} phishing attempt • {format(new Date(result.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={result.is_correct ? "default" : "destructive"}>
                    {result.is_correct ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}

            {data.userProgress.length === 0 && data.phishingResults.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start taking courses and practicing phishing detection to see your activity here.
                </p>
                <Button>Start Learning</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}