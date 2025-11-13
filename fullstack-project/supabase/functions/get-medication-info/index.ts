import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { medicationName } = await req.json();
    if (!medicationName) throw new Error('medicationName is required');

    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Forneça informações cruciais sobre o medicamento "${medicationName}" para a Dona Cyca. Foque em: 1. Para que serve (de forma simples). 2. Efeitos colaterais mais comuns. 3. Interações importantes com alimentos, especialmente considerando suas condições.`,
        config: {
            systemInstruction,
            tools: [{googleSearch: {}}],
        }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const result = { text: response.text, sources };

    return new Response(JSON.stringify(result), {
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
