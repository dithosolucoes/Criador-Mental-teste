import { GoogleGenAI, Type } from 'npm:@google/genai@0.1.0';
import { createSupabaseClient } from './supabase.ts';

const API_KEY = Deno.env.get('GEMINI_API_KEY')!;
export const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getSystemInstruction = async (userId: string): Promise<string> => {
  const supabase = createSupabaseClient();

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const { data: tastesData } = await supabase.from('food_preferences').select('food, preference').eq('user_id', userId);
  const { data: latestExamData } = await supabase.from('exam_records').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(1).single();

  const tastes = {
    liked: tastesData?.filter(t => t.preference === 'like').map(t => t.food) || [],
    disliked: tastesData?.filter(t => t.preference === 'dislike').map(t => t.food) || [],
  };

  const userProfile = profileData || {
    name: "Iracy Amancio Da Silva Gonçalves",
    nickname: "Cyca",
    age: 65,
    conditions: ["diabetes", "insuficiência cardíaca", "problemas renais"],
    potassium_level: 6.9,
  };

  let potassiumInfo = `Seu nível de potássio está atualmente em ${userProfile.potassium_level}, que é perigosamente alto.`;
  if (latestExamData?.potassium) {
      const examDate = new Date(latestExamData.date).toLocaleDateString('pt-BR');
      potassiumInfo = `De acordo com seu último exame de ${examDate}, seu nível de potássio está em ${latestExamData.potassium}.`;
      if (latestExamData.potassium > 5.2) {
          potassiumInfo += " Este valor é ALTO e requer atenção especial na dieta."
      } else if (latestExamData.potassium < 3.5) {
          potassiumInfo += " Este valor é BAIXO."
      } else {
          potassiumInfo += " Este valor está dentro da faixa normal."
      }
  }
  
  let tastesInfo = '';
  if (tastes) {
      if (tastes.liked.length > 0) {
          tastesInfo += ` Ela GOSTA de comer: ${tastes.liked.join(', ')}.`;
      }
      if (tastes.disliked.length > 0) {
          tastesInfo += ` Ela NÃO GOSTA de comer: ${tastes.disliked.join(', ')}.`;
      }
      if (tastesInfo) {
          tastesInfo = ` Leve em consideração as preferências alimentares dela.${tastesInfo} Use isso para personalizar suas sugestões.`
      }
  }

  return `Você é um assistente de saúde compassivo e altamente qualificado. Seu nome é Guardião. Você está ajudando a Sra. ${userProfile.name}, de ${userProfile.age} anos, a quem você deve se dirigir carinhosamente como "Dona ${userProfile.nickname}". 
Ela tem as seguintes condições de saúde: ${userProfile.conditions.join(', ')}. ${potassiumInfo} ${tastesInfo}
Sua principal responsabilidade é fornecer informações claras, simples e encorajadoras para ajudá-la a gerenciar sua saúde.
Fale em português do Brasil. Use uma linguagem simples e um tom amigável. Evite jargão médico complexo.
Sempre reforce a importância de seguir as orientações médicas e nunca substitua o conselho de um profissional de saúde.`;
}

export { Type };
