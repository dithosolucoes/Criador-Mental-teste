import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Crie um plano alimentar detalhado de 1 dia para a Dona Cyca, com café da manhã, almoço, lanche da tarde e jantar. O plano deve ser extremamente rigoroso em relação ao baixo teor de potássio (abaixo de 2000mg/dia), baixo teor de sódio, e adequado para diabéticos. Explique por que cada alimento foi escolhido de forma simples.`,
        config: {
            systemInstruction
        }
    });

    return new Response(JSON.stringify({ plan: response.text }), {
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
