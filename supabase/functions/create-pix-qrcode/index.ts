import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, name, cellphone, email, taxId, description } = await req.json();

    console.log('Creating PIX QR code with data:', { amount, name, email, description });

    // Validar dados obrigatórios
    if (!amount || !name || !cellphone || !email || !taxId) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ABACATEPAY_API_KEY = Deno.env.get('ABACATEPAY_API_KEY');
    if (!ABACATEPAY_API_KEY) {
      console.error('ABACATEPAY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Chave de API do AbacatePay não configurada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Chamar API do AbacatePay para criar QR code
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Converter para centavos
        expiresIn: 3600, // 1 hora de expiração
        description: description || 'Assinatura Desafio 30 Dias',
        customer: {
          name,
          cellphone,
          email,
          taxId,
        },
        metadata: {
          externalId: `sub_${Date.now()}`,
        },
      }),
    });

    const responseData = await abacatePayResponse.json();
    console.log('AbacatePay response:', responseData);

    if (!abacatePayResponse.ok) {
      console.error('AbacatePay error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: responseData.error || 'Erro ao criar QR code PIX',
          details: responseData 
        }),
        { 
          status: abacatePayResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Retornar dados do QR code
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: responseData.data.id,
          amount: responseData.data.amount,
          status: responseData.data.status,
          brCode: responseData.data.brCode,
          brCodeBase64: responseData.data.brCodeBase64,
          expiresAt: responseData.data.expiresAt,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-pix-qrcode function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
