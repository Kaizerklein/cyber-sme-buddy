import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'achievement' | 'reminder' | 'alert';
  data?: any;
  sendEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { userId, title, message, type, data, sendEmail }: NotificationRequest = await req.json();

    // Create in-app notification
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data
      });

    if (notificationError) {
      throw notificationError;
    }

    // Send email if requested and user has email notifications enabled
    if (sendEmail) {
      const { data: preferences } = await supabaseClient
        .from('notification_preferences')
        .select('email_notifications')
        .eq('user_id', userId)
        .single();

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (preferences?.email_notifications) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user?.email) {
          const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
          
          await resend.emails.send({
            from: "CyberGuard LMS <notifications@cyberguard.lk>",
            to: [user.email],
            subject: title,
            html: `
              <h2>Hello ${profile?.full_name || 'User'},</h2>
              <p>${message}</p>
              <p>Visit your dashboard to view more details.</p>
              <br>
              <p>Best regards,<br>CyberGuard LMS Team</p>
            `,
          });
        }
      }
    }

    console.log(`Notification sent successfully to user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in send-notification function:', error);
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