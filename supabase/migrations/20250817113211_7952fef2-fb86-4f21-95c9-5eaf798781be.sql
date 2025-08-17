-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  duration_minutes INTEGER DEFAULT 30,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  category TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table to track course completion
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create phishing_simulations table for storing simulation scenarios
CREATE TABLE public.phishing_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  email_content TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  is_phishing BOOLEAN NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phishing_results table to track user performance in simulations
CREATE TABLE public.phishing_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES public.phishing_simulations(id) ON DELETE CASCADE,
  user_answer BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for courses (public read access)
CREATE POLICY "Anyone can view published courses" 
ON public.courses 
FOR SELECT 
USING (is_published = true);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for phishing_simulations (public read access)
CREATE POLICY "Anyone can view phishing simulations" 
ON public.phishing_simulations 
FOR SELECT 
USING (true);

-- Create RLS policies for phishing_results
CREATE POLICY "Users can view their own phishing results" 
ON public.phishing_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own phishing results" 
ON public.phishing_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample courses
INSERT INTO public.courses (title, description, content, duration_minutes, difficulty_level, category, is_published) VALUES
('Phishing Email Detection', 'Learn to identify and avoid phishing emails targeting SMEs', 'This course covers the basics of phishing email detection, common red flags, and best practices for email security.', 30, 'beginner', 'Email Security', true),
('Data Security Fundamentals', 'Essential data protection practices for small businesses', 'Understanding data classification, storage best practices, and compliance requirements for SMEs.', 45, 'beginner', 'Data Protection', true),
('Incident Response Planning', 'How to respond effectively to cybersecurity incidents', 'Creating an incident response plan, roles and responsibilities, and post-incident analysis.', 60, 'intermediate', 'Incident Response', true),
('Password Security Best Practices', 'Creating and managing secure passwords', 'Learn about password complexity, multi-factor authentication, and password managers.', 25, 'beginner', 'Access Control', true);

-- Insert sample phishing simulations
INSERT INTO public.phishing_simulations (title, description, email_content, sender_email, sender_name, subject, is_phishing, difficulty_level, explanation) VALUES
('Fake Invoice Simulation', 'A common phishing attempt using fake invoices', 'Dear Customer, Please find attached your invoice for services rendered. Click here to download: [malicious link]. Thank you for your business!', 'billing@fake-company.com', 'Billing Department', 'Invoice #12345 - Payment Required', true, 'beginner', 'This is a phishing email because it contains a suspicious link and comes from an unknown sender requesting immediate action.'),
('Legitimate Bank Update', 'A real bank security notification', 'Dear Customer, Your account security settings have been updated successfully. If you did not make this change, please contact us at our official number. No action required.', 'security@realbank.lk', 'ABC Bank Security', 'Account Security Update Confirmation', false, 'beginner', 'This is a legitimate email because it does not request personal information or contain suspicious links, and comes from a verified bank domain.'),
('CEO Fraud Attempt', 'An advanced social engineering attack', 'Hi [Name], I need you to urgently transfer funds for a confidential acquisition. Please wire $50,000 to account: 1234567890. Keep this confidential. Thanks, CEO John Smith', 'j.smith@external-email.com', 'John Smith', 'Urgent - Confidential Transfer Required', true, 'advanced', 'This is a sophisticated phishing attempt known as CEO fraud, using urgency and authority to pressure victims into unauthorized transfers.');