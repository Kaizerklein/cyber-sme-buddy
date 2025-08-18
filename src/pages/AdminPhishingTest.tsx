import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Image, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoTest {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_phishing: boolean;
  explanation: string;
  difficulty_level: string;
  category: string;
  created_at: string;
}

export default function AdminPhishingTest() {
  const [photoTests, setPhotoTests] = useState<PhotoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    explanation: '',
    is_phishing: false,
    difficulty_level: 'beginner',
    category: 'email'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotoTests();
  }, []);

  const fetchPhotoTests = async () => {
    try {
      const { data, error } = await supabase
        .from('phishing_photo_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotoTests(data || []);
    } catch (error) {
      console.error('Error fetching photo tests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch photo tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `phishing-tests/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !editingId) {
      toast({
        title: "Missing image",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const dataToSave = {
        ...formData,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (editingId) {
        const { error } = await supabase
          .from('phishing_photo_tests')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Photo test updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('phishing_photo_tests')
          .insert([{ ...dataToSave, image_url: imageUrl }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Photo test created successfully",
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        explanation: '',
        is_phishing: false,
        difficulty_level: 'beginner',
        category: 'email'
      });
      setSelectedFile(null);
      setEditingId(null);
      fetchPhotoTests();
    } catch (error) {
      console.error('Error saving photo test:', error);
      toast({
        title: "Error",
        description: "Failed to save photo test",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (test: PhotoTest) => {
    setFormData({
      title: test.title,
      description: test.description,
      explanation: test.explanation,
      is_phishing: test.is_phishing,
      difficulty_level: test.difficulty_level,
      category: test.category
    });
    setEditingId(test.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo test?')) return;

    try {
      const { error } = await supabase
        .from('phishing_photo_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Photo test deleted successfully",
      });
      fetchPhotoTests();
    } catch (error) {
      console.error('Error deleting photo test:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo test",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      explanation: '',
      is_phishing: false,
      difficulty_level: 'beginner',
      category: 'email'
    });
    setSelectedFile(null);
    setEditingId(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Phishing Test Management</h1>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {editingId ? 'Edit Photo Test' : 'Upload New Photo Test'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter test title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what to look for"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Detailed explanation shown after answering"
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_phishing"
                checked={formData.is_phishing}
                onCheckedChange={(checked) => setFormData({ ...formData, is_phishing: checked })}
              />
              <Label htmlFor="is_phishing">
                This is a phishing attempt
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image File</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                required={!editingId}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : editingId ? 'Update Test' : 'Create Test'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Photo Tests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Existing Photo Tests ({photoTests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : photoTests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No photo tests uploaded yet
            </p>
          ) : (
            <div className="space-y-4">
              {photoTests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{test.title}</h3>
                        <Badge variant={test.is_phishing ? "destructive" : "secondary"}>
                          {test.is_phishing ? "Phishing" : "Legitimate"}
                        </Badge>
                        <Badge variant="outline">
                          {test.difficulty_level}
                        </Badge>
                      </div>
                      {test.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {test.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <img
                        src={test.image_url}
                        alt={test.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(test)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(test.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}