import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema
const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "other"], {
    errorMap: () => ({ message: "Tipo de feedback inválido" }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "A mensagem deve ter pelo menos 10 caracteres")
    .max(2000, "A mensagem não pode exceder 2000 caracteres"),
});

// HTML sanitization - escape HTML entities
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Logging helper
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-FEEDBACK] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // 1. Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logStep("ERROR: Authentication failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // 2. Input validation
    const body = await req.json();
    const validationResult = feedbackSchema.safeParse(body);
    
    if (!validationResult.success) {
      logStep("ERROR: Validation failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({ 
          error: "Dados inválidos", 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, message } = validationResult.data;

    // 3. Rate limiting check
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentFeedback, error: rateCheckError } = await supabase
      .from("feedback_log")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (rateCheckError) {
      logStep("ERROR: Rate limit check failed", { error: rateCheckError });
    }

    if (recentFeedback && recentFeedback.length >= 3) {
      logStep("ERROR: Rate limit exceeded", { count: recentFeedback.length });
      return new Response(
        JSON.stringify({ 
          error: "Limite de feedback excedido", 
          message: "Você pode enviar no máximo 3 feedbacks por hora. Tente novamente mais tarde." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Sanitize HTML
    const sanitizedMessage = escapeHtml(message);
    const sanitizedEmail = escapeHtml(user.email || "email não disponível");

    logStep("Input sanitized and validated");

    // 5. Log feedback to database
    const { error: logError } = await supabase
      .from("feedback_log")
      .insert({
        user_id: user.id,
        type,
        message: sanitizedMessage,
      });

    if (logError) {
      logStep("WARNING: Failed to log feedback", { error: logError });
      // Continue anyway - logging failure shouldn't block email sending
    }

    // 6. Send email
    const typeEmoji = {
      bug: "🐛",
      feature: "✨",
      improvement: "🚀",
      other: "💬",
    }[type] || "💬";

    const typeName = {
      bug: "Bug",
      feature: "Sugestão de Funcionalidade",
      improvement: "Melhoria",
      other: "Outro",
    }[type] || "Outro";

    const emailResponse = await resend.emails.send({
      from: "Neumann Feedback <onboarding@resend.dev>",
      to: ["gabrielestrela8@gmail.com"],
      subject: `${typeEmoji} Novo Feedback: ${typeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            ${typeEmoji} Novo Feedback Recebido
          </h1>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${typeName}</p>
            <p style="margin: 5px 0;"><strong>Email do usuário:</strong> ${sanitizedEmail}</p>
            <p style="margin: 5px 0;"><strong>User ID:</strong> ${user.id}</p>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Mensagem:</h2>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            Este email foi enviado automaticamente pelo sistema Neumann
          </p>
        </div>
      `,
    });

    logStep("Feedback email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback enviado com sucesso" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    logStep("ERROR: Unexpected error", { message: error.message });
    return new Response(
      JSON.stringify({ 
        error: "Erro ao enviar feedback", 
        message: "Tente novamente mais tarde" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
