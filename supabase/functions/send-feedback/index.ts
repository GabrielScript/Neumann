import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAllHeaders, checkRateLimit, logSecurityEvent, getIpAddress, sanitizeString } from '../_shared/security.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  phone: z.string().optional().nullable(),
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
  const origin = req.headers.get('origin');
  const headers = getAllHeaders(origin);
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers.get('user-agent');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const requestId = crypto.randomUUID();
  logStep(`[${requestId}] Request received`);

  try {
    logStep(`[${requestId}] Function started`);

    // 1. Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep(`[${requestId}] ERROR: No authorization header`);
      await logSecurityEvent(null as any, null, 'feedback_attempt', 'feedback', null, ipAddress, userAgent, 'blocked', { reason: 'missing_auth' });
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      logStep(`[${requestId}] ERROR: Authentication failed`, { error: authError?.message });
      await logSecurityEvent(supabaseAdmin, null, 'feedback_attempt', 'feedback', null, ipAddress, userAgent, 'blocked', { reason: 'invalid_auth' });
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers }
      );
    }

    logStep(`[${requestId}] User authenticated: ${user.email}`);

    // Rate limiting: 5 requests per hour
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, user.id, ipAddress, 'send-feedback', 5, 60);
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(supabaseAdmin, user.id, 'rate_limit_exceeded', 'feedback', null, ipAddress, userAgent, 'blocked');
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { headers, status: 429 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    logStep(`[${requestId}] Request body parsed`, { type: body.type });
    
    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      logStep(`[${requestId}] Validation failed`, { errors: validation.error.errors });
      return new Response(
        JSON.stringify({ 
          error: "Dados inválidos", 
          details: validation.error.errors.map(e => e.message) 
        }),
        { status: 400, headers }
      );
    }

    const { type, message, phone } = validation.data;

    // Sanitize inputs
    const sanitizedMessage = sanitizeString(escapeHtml(type === 'bug' ? `${message} [BUG REPORT]` : message), 5000);
    const sanitizedEmail = escapeHtml(user.email || 'unknown');
    const sanitizedPhone = phone ? escapeHtml(phone) : null;

    logStep(`[${requestId}] Input sanitized successfully`);

    // 4. Insert feedback into database
    const { error: dbError } = await supabaseAdmin
      .from('feedback_log')
      .insert({
        user_id: user.id,
        type,
        message: sanitizedMessage,
        phone: sanitizedPhone,
      });

    if (dbError) {
      logStep(`[${requestId}] Database error`, { error: dbError.message });
      throw new Error('Erro ao salvar feedback no banco de dados');
    }

    logStep(`[${requestId}] Feedback logged in database`);

    // 5. Send email notification
    try {
      const { error: emailError } = await resend.emails.send({
        from: 'Feedback <feedback@resend.dev>',
        to: 'danilojuniordev@gmail.com',
        subject: `[${type.toUpperCase()}] Novo Feedback - Challenger App`,
        html: `
          <h2>Novo Feedback Recebido</h2>
          <p><strong>Tipo:</strong> ${type}</p>
          <p><strong>Usuário:</strong> ${sanitizedEmail}</p>
          ${sanitizedPhone ? `<p><strong>Telefone:</strong> ${sanitizedPhone}</p>` : ''}
          <p><strong>Mensagem:</strong></p>
          <p>${sanitizedMessage}</p>
          <p><em>Enviado em: ${new Date().toLocaleString('pt-BR')}</em></p>
        `,
      });

      if (emailError) {
        logStep(`[${requestId}] Email sending failed (non-critical)`, { error: emailError });
        // Não lançar erro para não bloquear a resposta ao usuário
      } else {
        logStep(`[${requestId}] Email sent successfully`);
      }
    } catch (emailError) {
      logStep(`[${requestId}] Email sending exception (non-critical)`, { error: emailError });
      // Continuar mesmo se o email falhar
    }

    logStep(`[${requestId}] Feedback sent successfully`);

    // Log successful feedback submission
    await logSecurityEvent(supabaseAdmin, user.id, 'feedback_submitted', 'feedback', null, ipAddress, userAgent, 'success', { type });

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback enviado com sucesso!' }),
      { headers, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logStep(`[${requestId}] ERROR: ${errorMessage}`);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: getAllHeaders(req.headers.get('origin')), status: 400 }
    );
  }
};

serve(handler);
