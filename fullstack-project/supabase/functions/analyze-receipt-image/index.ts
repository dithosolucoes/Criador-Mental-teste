import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { ai, Type } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, mimeType } = await req.json();
    if (!image || !mimeType) throw new Error('Image and mimeType are required');

    const imagePart = {
        inlineData: { data: image, mimeType },
    };
    const textPart = {
        text: `Extraia todos os itens de mercearia desta nota fiscal. Ignore itens não alimentícios. Retorne uma lista de strings em formato JSON. Exemplo: ["Maçã Fuji 1kg", "Pão Integral", "Leite Desnatado 1L"]`,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: "Apenas extraia os itens alimentícios de uma nota fiscal e retorne como um array JSON de strings. Não adicione nenhum outro texto.",
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    const items = JSON.parse(response.text);

    return new Response(JSON.stringify({ items }), {
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
