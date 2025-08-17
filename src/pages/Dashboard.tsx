import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Shield, TrendingUp, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  phishingAttempts: number;
  phishingSuccess: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    phishingAttempts: 0,
    phishingSuccess: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch total courses
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true);

    // Fetch user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*, courses(*)')
      .eq('user_id', user.id);

    // Fetch phishing results
    const { data: phishingResults } = await supabase
      .from('phishing_results')
      .select('*')
      .eq('user_id', user.id);

    const completedCourses = progress?.filter(p => p.completed).length || 0;
    const phishingAttempts = phishingResults?.length || 0;
    const phishingSuccess = phishingResults?.filter(r => r.is_correct).length || 0;

    setStats({
      totalCourses: courses?.length || 0,
      completedCourses,
      phishingAttempts,
      phishingSuccess,
    });

    // Set recent courses (in progress or not started)
    const recentProgress = progress?.slice(0, 3) || [];
    setRecentCourses(recentProgress);
  };

  const overallProgress = stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0;
  const phishingSuccessRate = stats.phishingAttempts > 0 ? (stats.phishingSuccess / stats.phishingAttempts) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Track your cybersecurity learning progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}/{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {overallProgress.toFixed(0)}% of total courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phishing Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phishingSuccessRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.phishingSuccess}/{stats.phishingAttempts} correct identifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallProgress >= 80 ? 'High' : overallProgress >= 50 ? 'Medium' : 'Low'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on course completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 days</div>
            <p className="text-xs text-muted-foreground">
              Keep up the good work!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your cybersecurity learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Course Completion</span>
                <span>{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Phishing Detection</span>
                <span>{phishingSuccessRate.toFixed(0)}%</span>
              </div>
              <Progress value={phishingSuccessRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Continue your cybersecurity training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/courses">
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
            <Link to="/phishing-simulator">
              <Button className="w-full justify-start" variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Practice Phishing Detection
              </Button>
            </Link>
            <Link to="/progress">
              <Button className="w-full justify-start" variant="outline">
                <Award className="mr-2 h-4 w-4" />
                View Detailed Progress
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Continue Learning</CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((progress) => (
                <div key={progress.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{progress.courses?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {progress.completed ? 'Completed' : `${progress.progress_percentage}% complete`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {progress.courses?.duration_minutes}m
                    </span>
                    <Link to={`/courses/${progress.course_id}`}>
                      <Button size="sm">
                        {progress.completed ? 'Review' : 'Continue'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start Your Learning Journey</h3>
              <p className="text-muted-foreground mb-4">
                No courses started yet. Begin with our foundational cybersecurity courses.
              </p>
              <Link to="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}