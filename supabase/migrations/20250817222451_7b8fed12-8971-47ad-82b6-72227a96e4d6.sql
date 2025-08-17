-- Create table for photo-based phishing tests
CREATE TABLE public.phishing_photo_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_phishing BOOLEAN NOT NULL,
  explanation TEXT,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT DEFAULT 'email' CHECK (category IN ('email', 'website', 'social_media', 'text_message')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for test sessions
CREATE TABLE public.phishing_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'practice' CHECK (session_type IN ('practice', 'certification')),
  total_questions INTEGER NOT NULL DEFAULT 10,
  current_question INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER DEFAULT 30,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for photo test results
CREATE TABLE public.phishing_photo_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.phishing_test_sessions(id) ON DELETE CASCADE,
  photo_test_id UUID REFERENCES public.phishing_photo_tests(id) ON DELETE CASCADE,
  user_answer BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  question_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.phishing_photo_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_photo_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for phishing_photo_tests
CREATE POLICY "Anyone can view photo tests" 
ON public.phishing_photo_tests 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage photo tests" 
ON public.phishing_photo_tests 
FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- RLS policies for phishing_test_sessions
CREATE POLICY "Users can view their own test sessions" 
ON public.phishing_test_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test sessions" 
ON public.phishing_test_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions" 
ON public.phishing_test_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for phishing_photo_results
CREATE POLICY "Users can view their own photo results" 
ON public.phishing_photo_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own photo results" 
ON public.phishing_photo_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updating timestamps
CREATE TRIGGER update_phishing_photo_tests_updated_at
BEFORE UPDATE ON public.phishing_photo_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phishing_test_sessions_updated_at
BEFORE UPDATE ON public.phishing_test_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample photo test data
INSERT INTO public.phishing_photo_tests (title, description, image_url, is_phishing, explanation, difficulty_level, category) VALUES
('Suspicious Email Alert', 'PayPal security alert email', '/placeholder.svg', true, 'This is a phishing email because it uses urgency tactics and asks you to click a link to verify your account. Real PayPal emails would direct you to log in through their official website.', 'beginner', 'email'),
('Bank Statement Email', 'Monthly bank statement notification', '/placeholder.svg', false, 'This is a legitimate email from your bank. It has proper branding, doesn''t ask for sensitive information, and directs you to log in through secure methods.', 'beginner', 'email'),
('Social Media Login Page', 'Facebook login page with suspicious URL', '/placeholder.svg', true, 'This is a phishing website because the URL is not facebook.com but a similar-looking domain. Always check the URL carefully before entering credentials.', 'intermediate', 'website'),
('Microsoft Office Update', 'Legitimate Microsoft Office update notification', '/placeholder.svg', false, 'This is a legitimate Microsoft update notification. It comes from official Microsoft domains and doesn''t ask for personal information.', 'beginner', 'email'),
('Prize Winner Notification', 'You''ve won a contest you never entered', '/placeholder.svg', true, 'This is a classic phishing scam. You cannot win a contest you never entered. These emails try to collect personal information or money.', 'beginner', 'email');