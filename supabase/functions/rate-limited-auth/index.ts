import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = 5; // Max attempts
const WINDOW_MINUTES = 15; // Lockout window

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, ip_address } = await req.json();

    // Get client IP (simulated if not provided)
    const clientIp = ip_address || req.headers.get('x-forwarded-for') || '127.0.0.1';

    console.log(`Rate limit check for IP: ${clientIp}, action: ${action}`);

    if (action === 'check') {
      // Check if IP is rate limited
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

      const { data: attempts, error: attemptsError } = await supabase
        .from('rate_limit_attempts')
        .select('*')
        .eq('ip_address', clientIp)
        .eq('endpoint', 'auth')
        .gte('first_attempt_at', windowStart)
        .maybeSingle();

      if (attemptsError) {
        console.error('Error checking rate limit:', attemptsError);
      }

      if (attempts && attempts.attempt_count >= RATE_LIMIT) {
        const blockedUntil = new Date(new Date(attempts.first_attempt_at).getTime() + WINDOW_MINUTES * 60 * 1000);
        
        // Log brute force attempt as security incident
        await supabase.from('security_incidents').insert({
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          incident_type: 'brute_force',
          severity: 'high',
          ip_address: clientIp,
          raw_event_data: {
            email,
            attempt_count: attempts.attempt_count,
            blocked_until: blockedUntil.toISOString()
          }
        });

        console.log(`Rate limit exceeded for IP ${clientIp}`);

        return new Response(
          JSON.stringify({
            allowed: false,
            error: 'Too many login attempts',
            retryAfter: Math.ceil((blockedUntil.getTime() - Date.now()) / 1000),
            message: `Account locked. Try again in ${Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)} minutes.`
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          allowed: true,
          remainingAttempts: RATE_LIMIT - (attempts?.attempt_count || 0)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_attempt') {
      // Record a failed login attempt
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

      const { data: existing } = await supabase
        .from('rate_limit_attempts')
        .select('*')
        .eq('ip_address', clientIp)
        .eq('endpoint', 'auth')
        .gte('first_attempt_at', windowStart)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('rate_limit_attempts')
          .update({
            attempt_count: existing.attempt_count + 1,
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        console.log(`Updated attempt count for IP ${clientIp}: ${existing.attempt_count + 1}`);
      } else {
        // Create new record
        await supabase
          .from('rate_limit_attempts')
          .insert({
            ip_address: clientIp,
            endpoint: 'auth',
            attempt_count: 1,
            first_attempt_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString()
          });

        console.log(`Created new rate limit record for IP ${clientIp}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reset') {
      // Clear rate limit for successful login
      await supabase
        .from('rate_limit_attempts')
        .delete()
        .eq('ip_address', clientIp)
        .eq('endpoint', 'auth');

      console.log(`Cleared rate limit for IP ${clientIp}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rate-limited-auth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});