import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Play,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  video_url?: string;
}

interface UserProgress {
  id?: string;
  completed: boolean;
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndProgress();
    }
  }, [courseId, user]);

  const fetchCourseAndProgress = async () => {
    if (!courseId) return;
    
    setLoading(true);
    
    // Fetch course details
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !courseData) {
      toast({
        title: "Course not found",
        description: "The requested course could not be found.",
        variant: "destructive",
      });
      navigate('/courses');
      return;
    }

    setCourse(courseData);

    // Fetch user progress if logged in
    if (user) {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      setProgress(progressData);
    }
    
    setLoading(false);
  };

  const startCourse = async () => {
    if (!user || !course) return;
    
    setUpdating(true);
    
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        course_id: course.id,
        progress_percentage: 10,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,course_id'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start the course. Please try again.",
        variant: "destructive",
      });
    } else {
      setProgress(data);
      toast({
        title: "Course started!",
        description: "You've begun your cybersecurity learning journey.",
      });
    }
    
    setUpdating(false);
  };

  const updateProgress = async (percentage: number) => {
    if (!user || !course) return;
    
    setUpdating(true);
    
    const isCompleted = percentage >= 100;
    const updateData: any = {
      user_id: user.id,
      course_id: course.id,
      progress_percentage: percentage,
    };

    if (isCompleted) {
      updateData.completed = true;
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_progress')
      .upsert(updateData, {
        onConflict: 'user_id,course_id'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    } else {
      setProgress(data);
      if (isCompleted) {
        toast({
          title: "Congratulations!",
          description: "You've completed the course successfully.",
        });
      } else {
        toast({
          title: "Progress saved",
          description: `Course progress updated to ${percentage}%.`,
        });
      }
    }
    
    setUpdating(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-success text-success-foreground';
      case 'intermediate': return 'bg-warning text-warning-foreground';
      case 'advanced': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Course not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested course could not be found or is not available.
        </p>
        <Button onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
              <CardDescription className="text-base">
                {course.description}
              </CardDescription>
            </div>
            {progress?.completed && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Badge className={getDifficultyColor(course.difficulty_level)}>
              {course.difficulty_level}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {course.duration_minutes} minutes
            </div>
            <Badge variant="outline">{course.category}</Badge>
          </div>

          {progress && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.progress_percentage}%</span>
              </div>
              <Progress value={progress.progress_percentage} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Course Content */}
      {course.video_url && (
        <Card>
          <CardHeader>
            <CardTitle>Course Video</CardTitle>
          </CardHeader>
          <CardContent>
            <video 
              controls 
              className="w-full rounded-lg"
              poster=""
            >
              <source src={course.video_url} type="video/mp4" />
              <source src={course.video_url} type="video/webm" />
              <source src={course.video_url} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{course.content}</div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          {!user ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to track your progress and earn certificates.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Sign In to Continue
              </Button>
            </div>
          ) : !progress ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Ready to start your cybersecurity learning journey?
              </p>
              <Button onClick={startCourse} disabled={updating}>
                <Play className="mr-2 h-4 w-4" />
                {updating ? 'Starting...' : 'Start Course'}
              </Button>
            </div>
          ) : progress.completed ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-success" />
              </div>
              <h3 className="text-lg font-medium mb-2">Course Completed!</h3>
              <p className="text-muted-foreground mb-4">
                Congratulations on completing this course. You can review the content anytime.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/courses')} variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse More Courses
                </Button>
                <Button onClick={() => updateProgress(100)} disabled={updating}>
                  <Award className="mr-2 h-4 w-4" />
                  Review Course
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Continue your progress or mark sections as complete.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button 
                  onClick={() => updateProgress(50)} 
                  disabled={updating || progress.progress_percentage >= 50}
                  variant="outline"
                >
                  Mark 50% Complete
                </Button>
                <Button 
                  onClick={() => updateProgress(75)} 
                  disabled={updating || progress.progress_percentage >= 75}
                  variant="outline"
                >
                  Mark 75% Complete
                </Button>
                <Button 
                  onClick={() => updateProgress(100)} 
                  disabled={updating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {updating ? 'Completing...' : 'Complete Course'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}