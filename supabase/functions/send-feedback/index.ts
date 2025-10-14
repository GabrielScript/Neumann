import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  email: string;
  type: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, message }: FeedbackRequest = await req.json();

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
            <p style="margin: 5px 0;"><strong>Email do usuário:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Mensagem:</h2>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            Este email foi enviado automaticamente pelo sistema Neumann
          </p>
        </div>
      `,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
