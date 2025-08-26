import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Shield, 
  TrendingUp, 
  Award,
  Target,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  phishingAttempts: number;
  phishingSuccess: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    phishingAttempts: 0,
    phishingSuccess: 0
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch course statistics
      const { data: courses } = await supabase
        .from('courses')
        .select('*');

      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      const { data: phishingResults } = await supabase
        .from('phishing_photo_results')
        .select('*')
        .eq('user_id', user?.id);

      // Calculate statistics
      const totalCourses = courses?.length || 0;
      const completedCourses = userProgress?.filter(p => p.completed === true).length || 0;
      const phishingAttempts = phishingResults?.length || 0;
      const phishingSuccess = phishingResults?.filter(r => r.is_correct).length || 0;

      setStats({
        totalCourses,
        completedCourses,
        phishingAttempts,
        phishingSuccess
      });

      // Fetch recent courses (last 3 enrolled or in progress)
      const { data: recent } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            difficulty_level
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentCourses(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhishingSuccessRate = () => {
    if (stats.phishingAttempts === 0) return 0;
    return Math.round((stats.phishingSuccess / stats.phishingAttempts) * 100);
  };

  const getSecurityLevel = () => {
    const successRate = calculatePhishingSuccessRate();
    if (successRate >= 90) return { level: 'Expert', color: 'bg-green-500', textColor: 'text-green-700' };
    if (successRate >= 70) return { level: 'Advanced', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (successRate >= 50) return { level: 'Intermediate', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Beginner', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const calculateOverallProgress = () => {
    if (stats.totalCourses === 0) return 0;
    return Math.round((stats.completedCourses / stats.totalCourses) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your cybersecurity learning progress and continue your training.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
            <p className="text-xs text-muted-foreground">
              out of {stats.totalCourses} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phishing Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatePhishingSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.phishingSuccess} correct out of {stats.phishingAttempts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSecurityLevel().level}</div>
            <Badge className={`mt-1 ${getSecurityLevel().textColor} bg-opacity-20`}>
              {calculatePhishingSuccessRate()}% accuracy
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            <CardDescription>
              Your completion rate across all courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Course Completion</span>
                <span>{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Phishing Detection
            </CardTitle>
            <CardDescription>
              Your accuracy in identifying phishing attempts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Detection Rate</span>
                <span>{calculatePhishingSuccessRate()}%</span>
              </div>
              <Progress value={calculatePhishingSuccessRate()} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into your cybersecurity training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/courses')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <BookOpen className="h-6 w-6" />
              <span>Browse Courses</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/phishing-simulator')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Shield className="h-6 w-6" />
              <span>Practice Phishing Detection</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/progress')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span>View Detailed Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Continue Learning */}
      {recentCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Continue Learning
            </CardTitle>
            <CardDescription>
              Pick up where you left off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.map((progress) => (
                <Card key={progress.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {progress.courses?.difficulty_level}
                      </Badge>
                      {progress.completed && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="text-base line-clamp-2">
                      {progress.courses?.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.progress_percentage}%</span>
                      </div>
                      <Progress value={progress.progress_percentage} className="h-2" />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => navigate(`/courses/${progress.courses?.id}`)}
                    >
                      {progress.completed ? 'Review' : 'Continue'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}