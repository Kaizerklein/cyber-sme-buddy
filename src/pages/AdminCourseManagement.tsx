import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  BookOpen,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  is_published: boolean;
  video_url?: string;
}

export default function AdminCourseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: 30,
    difficulty_level: 'beginner',
    category: '',
    is_published: false,
  });

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    setIsAdmin(!!data);
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch courses.",
        variant: "destructive",
      });
    } else {
      setCourses(data || []);
    }
  };

  const handleVideoUpload = async (file: File, courseId?: string) => {
    if (!file) return null;

    setUploadingVideo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload Error",
        description: "Failed to upload video.",
        variant: "destructive",
      });
      setUploadingVideo(false);
      return null;
    }

    const { data } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    setUploadingVideo(false);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const videoFile = (e.currentTarget as HTMLFormElement).video_file?.files?.[0];
    let videoUrl = editingCourse?.video_url;

    if (videoFile) {
      videoUrl = await handleVideoUpload(videoFile);
      if (!videoUrl) return;
    }

    const courseData = {
      ...formData,
      video_url: videoUrl,
    };

    if (editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourse.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update course.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Course updated successfully.",
        });
        setEditingCourse(null);
        fetchCourses();
      }
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([courseData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create course.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Course created successfully.",
        });
        setIsCreateModalOpen(false);
        fetchCourses();
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      duration_minutes: 30,
      difficulty_level: 'beginner',
      category: '',
      is_published: false,
    });
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      content: course.content,
      duration_minutes: course.duration_minutes,
      difficulty_level: course.difficulty_level,
      category: course.category,
      is_published: course.is_published,
    });
  };

  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete course.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Course deleted successfully.",
        });
        fetchCourses();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          You don't have permission to access the admin course management.
        </p>
      </div>
    );
  }

  const CourseForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Course Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={8}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video_file">Course Video (MP4, WebM, OGV)</Label>
        <Input
          id="video_file"
          name="video_file"
          type="file"
          accept="video/*"
          disabled={uploadingVideo}
        />
        {editingCourse?.video_url && (
          <p className="text-sm text-muted-foreground">
            Current video: {editingCourse.video_url.split('/').pop()}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="published"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
        <Label htmlFor="published">Published</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={uploadingVideo}>
          <Save className="mr-2 h-4 w-4" />
          {uploadingVideo ? 'Uploading...' : editingCourse ? 'Update Course' : 'Create Course'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditingCourse(null);
            setIsCreateModalOpen(false);
            resetForm();
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Create and manage cybersecurity courses</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new cybersecurity course with video content.
              </DialogDescription>
            </DialogHeader>
            <CourseForm />
          </DialogContent>
        </Dialog>
      </div>

      {editingCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Course: {editingCourse.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseForm />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {course.title}
                    {course.video_url && <Video className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(course)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first cybersecurity course to get started.
          </p>
        </div>
      )}
    </div>
  );
}