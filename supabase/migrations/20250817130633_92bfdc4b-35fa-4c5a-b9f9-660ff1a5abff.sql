-- Add video storage support
-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);

-- Add video URL column to courses table
ALTER TABLE public.courses ADD COLUMN video_url TEXT;

-- Create admin roles table
CREATE TABLE public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_roles
CREATE POLICY "Admins can view admin roles" 
ON public.admin_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage admin roles" 
ON public.admin_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

-- Update courses policies to allow admin management
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;

CREATE POLICY "Anyone can view published courses" 
ON public.courses 
FOR SELECT 
USING (is_published = true OR EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid()
));

CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

-- Create storage policies for course videos
CREATE POLICY "Anyone can view course videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-videos');

CREATE POLICY "Admins can upload course videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'course-videos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update course videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'course-videos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete course videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'course-videos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid()
  )
);

-- Add trigger for admin_roles updated_at
CREATE TRIGGER update_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();