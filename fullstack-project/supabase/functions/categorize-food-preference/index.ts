import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { ai, Type } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error('Text is required');

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Analise a frase sobre preferência alimentar: "${text}". Extraia o nome do alimento e se a pessoa gosta ('like'), não gosta ('dislike'), ou se é incerto ('unknown').`,
        config: {
            systemInstruction: "Você é um especialista em entender linguagem natural sobre preferências alimentares. Sua tarefa é extrair o alimento e classificar a preferência. Retorne apenas um objeto JSON.",
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    food: { type: Type.STRING, description: "O alimento específico mencionado, em sua forma base (ex: 'maçãs' -> 'maçã')." },
                    preference: { type: Type.STRING, enum: ['like', 'dislike', 'unknown'] }
                }
            }
        }
    });

    const result = JSON.parse(response.text);

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
