-- Fix the security definer view issue by dropping and recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.user_risk_scores;

CREATE VIEW public.user_risk_scores 
WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.full_name,
  COALESCE(incident_counts.total_incidents, 0) as total_incidents,
  COALESCE(incident_counts.phishing_failures, 0) as phishing_failures,
  COALESCE(incident_counts.avg_decision_time, 0) as avg_decision_time,
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