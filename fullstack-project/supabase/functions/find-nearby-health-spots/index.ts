import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { ai, getSystemInstruction } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, location } = await req.json();
    if (!query || !location) throw new Error('Query and location are required');

    const supabase = createSupabaseClient(req.headers.get('Authorization')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const systemInstruction = await getSystemInstruction(user.id);

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `A Dona Cyca precisa encontrar "${query}" perto dela. Mostre algumas opções saudáveis e acessíveis.`,
        config: {
            systemInstruction,
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            }
        }
    });

    const places = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const result = { text: response.text, places };

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
