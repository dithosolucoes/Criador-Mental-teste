import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items } = await req.json();
    if (!items || !Array.isArray(items)) throw new Error('Items array is required');

    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const prompt = `Analise esta lista de compras da Dona Cyca: ${items.join(', ')}.
    Considerando as condições de saúde dela, seus últimos resultados de exame e suas preferências alimentares, forneça um feedback curto, gentil e encorajador em 2-3 frases.
    Primeiro, elogie uma ou duas boas escolhas.
    Depois, se houver um ou dois itens que exigem cuidado (alto teor de potássio, sódio ou açúcar), dê uma sugestão prática e positiva sobre como consumi-los com moderação, sem soar como uma proibição.
    Exemplo: "Ótimas escolhas com o frango e a abobrinha! Vi que também tem bananas; elas são ricas em potássio, então que tal comer apenas metade por dia por enquanto?"
    Fale diretamente com ela ("Dona Cyca...").`;

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { systemInstruction },
    });

    return new Response(JSON.stringify({ feedback: response.text }), {
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
