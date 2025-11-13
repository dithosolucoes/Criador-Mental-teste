import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) throw new Error('Query is required');

    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: query,
        config: {
            systemInstruction: `${systemInstruction} Responda à pergunta da Dona Cyca da forma mais completa e cuidadosa possível, usando sua capacidade de raciocínio avançada. Simplifique conceitos complexos.`,
        }
    });

    return new Response(JSON.stringify({ answer: response.text }), {
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
