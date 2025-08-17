import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Get all users with weekly digest enabled
    const { data: users } = await supabaseClient
      .from('profiles')
      .select(`
        user_id,
        full_name,
        notification_preferences!inner(weekly_digest)
      `)
      .eq('notification_preferences.weekly_digest', true);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with weekly digest enabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const user of users) {
      try {
        // Get user's progress from last week
        const { data: progress } = await supabaseClient
          .from('user_progress')
          .select(`
            course_id,
            progress_percentage,
            completed,
            courses(title)
          `)
          .eq('user_id', user.user_id)
          .gte('updated_at', oneWeekAgo.toISOString());

        // Get phishing results from last week
        const { data: phishingResults } = await supabaseClient
          .from('phishing_results')
          .select('is_correct, created_at')
          .eq('user_id', user.user_id)
          .gte('created_at', oneWeekAgo.toISOString());

        // Calculate statistics
        const completedCourses = progress?.filter(p => p.completed).length || 0;
        const totalProgress = progress?.reduce((sum, p) => sum + p.progress_percentage, 0) || 0;
        const avgProgress = progress?.length ? Math.round(totalProgress / progress.length) : 0;
        
        const phishingAttempts = phishingResults?.length || 0;
        const phishingCorrect = phishingResults?.filter(r => r.is_correct).length || 0;
        const phishingAccuracy = phishingAttempts > 0 ? Math.round((phishingCorrect / phishingAttempts) * 100) : 0;

        // Get user email
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(user.user_id);

        if (authUser.user?.email) {
          await resend.emails.send({
            from: "CyberGuard LMS <digest@cyberguard.lk>",
            to: [authUser.user.email],
            subject: "Your Weekly Learning Summary - CyberGuard LMS",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Your Weekly Learning Summary</h1>
                
                <p>Hello ${user.full_name || 'User'},</p>
                
                <p>Here's your learning progress from the past week:</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #1e40af; margin-top: 0;">📚 Course Progress</h2>
                  <ul>
                    <li><strong>Courses Completed:</strong> ${completedCourses}</li>
                    <li><strong>Average Progress:</strong> ${avgProgress}%</li>
                  </ul>
                </div>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #d97706; margin-top: 0;">🎯 Phishing Simulator</h2>
                  <ul>
                    <li><strong>Simulations Completed:</strong> ${phishingAttempts}</li>
                    <li><strong>Accuracy Rate:</strong> ${phishingAccuracy}%</li>
                  </ul>
                </div>
                
                ${completedCourses === 0 && phishingAttempts === 0 ? `
                <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #dc2626; margin-top: 0;">⚠️ No Activity This Week</h2>
                  <p>We noticed you haven't been active this week. Don't forget to continue your cybersecurity learning journey!</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SITE_URL')}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Continue Learning
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Keep up the great work protecting your business from cyber threats!
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">
                  You're receiving this because you have weekly digest notifications enabled. 
                  You can update your preferences in your profile settings.
                </p>
              </div>
            `,
          });
        }

        console.log(`Weekly digest sent to user ${user.user_id}`);
      } catch (userError) {
        console.error(`Error sending digest to user ${user.user_id}:`, userError);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Weekly digest processed for ${users.length} users` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in weekly-digest function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);