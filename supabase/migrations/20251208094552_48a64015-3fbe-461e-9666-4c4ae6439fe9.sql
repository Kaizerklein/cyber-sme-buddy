-- Phase 1: Enhanced Forensic Logging System

-- Create security_incidents table for forensic logging
CREATE TABLE public.security_incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  incident_type text NOT NULL, -- 'phishing_failure', 'xss_attempt', 'brute_force', 'header_analysis_failure', 'url_decode_failure'
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp timestamptz DEFAULT now(),
  
  -- Forensic Artifacts
  user_agent text,
  ip_address text, -- simulated for learning purposes
  geolocation_country text, -- simulated
  session_id uuid,
  
  -- Phishing-specific data
  photo_test_id uuid REFERENCES public.phishing_photo_tests(id),
  user_answer boolean,
  time_to_decision_seconds integer,
  missed_iocs jsonb DEFAULT '[]'::jsonb, -- Indicators of Compromise the user missed
  
  -- Metadata
  raw_event_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security_incidents
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Users can insert their own incidents
CREATE POLICY "Users can create their own security incidents"
ON public.security_incidents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own incidents
CREATE POLICY "Users can view their own security incidents"
ON public.security_incidents
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all incidents
CREATE POLICY "Admins can view all security incidents"
ON public.security_incidents
FOR SELECT
USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- Phase 2: Enhance phishing_photo_tests with IoC data
ALTER TABLE public.phishing_photo_tests 
ADD COLUMN IF NOT EXISTS ioc_list jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email_headers text,
ADD COLUMN IF NOT EXISTS encoded_urls jsonb DEFAULT '[]'::jsonb;

-- Create user_risk_scores view for admin dashboard
CREATE OR REPLACE VIEW public.user_risk_scores AS
SELECT 
  p.user_id,
  p.full_name,
  COALESCE(incident_counts.total_incidents, 0) as total_incidents,
  COALESCE(incident_counts.phishing_failures, 0) as phishing_failures,
  COALESCE(incident_counts.avg_decision_time, 0) as avg_decision_time,
  -- Risk Score Calculation
  LEAST(100, GREATEST(0,
    50 + 
    (COALESCE(incident_counts.phishing_failures, 0) * 10) +
    (CASE WHEN COALESCE(incident_counts.avg_decision_time, 10) < 3 THEN 15 ELSE 0 END)
  )) as risk_score,
  CASE 
    WHEN LEAST(100, 50 + COALESCE(incident_counts.phishing_failures, 0) * 10) <= 30 THEN 'low'
    WHEN LEAST(100, 50 + COALESCE(incident_counts.phishing_failures, 0) * 10) <= 60 THEN 'medium'
    WHEN LEAST(100, 50 + COALESCE(incident_counts.phishing_failures, 0) * 10) <= 80 THEN 'high'
    ELSE 'critical'
  END as risk_level
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE incident_type = 'phishing_failure') as phishing_failures,
    AVG(time_to_decision_seconds) as avg_decision_time
  FROM public.security_incidents
  GROUP BY user_id
) incident_counts ON p.user_id = incident_counts.user_id;

-- Create rate_limit_attempts table for brute force tracking
CREATE TABLE public.rate_limit_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS for rate_limit_attempts (admins only)
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limit attempts"
ON public.rate_limit_attempts
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));