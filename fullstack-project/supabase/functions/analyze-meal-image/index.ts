import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, mimeType } = await req.json();
    if (!image || !mimeType) throw new Error('Image and mimeType are required');

    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const imagePart = {
        inlineData: { data: image, mimeType },
    };
    const textPart = {
        text: "Analise esta refeição. É apropriada para a Dona Cyca, considerando suas condições de saúde (diabetes, insuficiência cardíaca, rins e potássio alto)? Dê uma resposta simples e direta (SIM ou NÃO) e uma breve explicação do porquê.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction },
    });

    return new Response(JSON.stringify({ analysis: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
