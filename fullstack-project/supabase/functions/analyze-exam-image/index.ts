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
        text: `Analise esta imagem de um laudo de exame de sangue. Extraia os seguintes valores: Potássio (K+), Glicose, Creatinina e a data do exame. Retorne em formato JSON. Se um valor não for encontrado, retorne null para ele. Formate a data como DD/MM/YYYY.`,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "Data do exame no formato DD/MM/YYYY" },
                    potassium: { type: Type.NUMBER, description: "Valor do Potássio (K+)", nullable: true },
                    glucose: { type: Type.NUMBER, description: "Valor da Glicose", nullable: true },
                    creatinine: { type: Type.NUMBER, description: "Valor da Creatinina", nullable: true },
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
