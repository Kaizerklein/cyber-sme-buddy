import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Award, Play, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Course {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
}

interface CourseWithProgress extends Course {
  progress?: {
    completed: boolean;
    progress_percentage: number;
  };
}

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    
    // Fetch all published courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (coursesData && user) {
      // Fetch user progress for these courses
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('course_id', coursesData.map(c => c.id));

      // Combine courses with progress
      const coursesWithProgress = coursesData.map(course => ({
        ...course,
        progress: progressData?.find(p => p.course_id === course.id),
      }));

      setCourses(coursesWithProgress);
    } else if (coursesData) {
      setCourses(coursesData);
    }
    
    setLoading(false);
  };

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cybersecurity Courses</h1>
        <p className="text-muted-foreground">
          Learn essential cybersecurity skills to protect your business from cyber threats.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All Categories' : category}
          </Button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-3">
                    {course.description}
                  </CardDescription>
                </div>
                {course.progress?.completed && (
                  <CheckCircle className="h-5 w-5 text-success ml-2 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {course.duration_minutes}m
                </div>
              </div>

              {course.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{course.progress.progress_percentage}%</span>
                  </div>
                  <Progress value={course.progress.progress_percentage} className="h-2" />
                </div>
              )}

              <div className="pt-4">
                <Link to={`/courses/${course.id}`} className="w-full">
                  <Button className="w-full">
                    {course.progress?.completed ? (
                      <>
                        <Award className="mr-2 h-4 w-4" />
                        Review Course
                      </>
                    ) : course.progress ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Continue Course
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Course
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {selectedCategory === 'all' 
              ? 'No courses are available at the moment.' 
              : `No courses found in the ${selectedCategory} category.`
            }
          </p>
        </div>
      )}
    </div>
  );
}