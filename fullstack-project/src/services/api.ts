import { supabase } from '../lib/supabaseClient';
import { ExamRecord, FoodPreference, GroundingChunk } from '../types';

// This file replaces the old geminiService.ts
// All calls now go to our secure Supabase Edge Functions.

export async function generateMealPlan(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-meal-plan');
  if (error) throw error;
  return data.plan;
}

export async function analyzeMealImage(base64Image: string, mimeType: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('analyze-meal-image', {
    body: { image: base64Image, mimeType },
  });
  if (error) throw error;
  return data.analysis;
}

export async function analyzeReceiptImage(base64Image: string, mimeType: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('analyze-receipt-image', {
    body: { image: base64Image, mimeType },
  });
  if (error) throw error;
  return data.items;
}

export async function getFeedbackOnPurchases(items: string[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('get-feedback-on-purchases', {
    body: { items },
  });
  if (error) throw error;
  return data.feedback;
}

export async function analyzeExamImage(base64Image: string, mimeType: string): Promise<Omit<ExamRecord, 'id' | 'imageUrl'>> {
  const { data, error } = await supabase.functions.invoke('analyze-exam-image', {
    body: { image: base64Image, mimeType },
  });
  if (error) throw error;
  return data;
}

export async function categorizeFoodPreference(text: string): Promise<FoodPreference> {
  const { data, error } = await supabase.functions.invoke('categorize-food-preference', {
    body: { text },
  });
  if (error) throw error;
  return data;
}

export async function generateTextToSpeech(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-tts', {
    body: { text },
  });
  if (error) throw error;
  return data.audio;
}

export async function getMedicationInfo(medicationName: string): Promise<{ text: string, sources: GroundingChunk[] }> {
  const { data, error } = await supabase.functions.invoke('get-medication-info', {
    body: { medicationName },
  });
  if (error) throw error;
  return data;
}

export async function findNearbyHealthSpots(query: string, location: { latitude: number, longitude: number }): Promise<{ text: string, places: GroundingChunk[] }> {
  const { data, error } = await supabase.functions.invoke('find-nearby-health-spots', {
    body: { query, location },
  });
  if (error) throw error;
  return data;
}

export async function getComplexAnswer(query: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('get-complex-answer', {
    body: { query },
  });
  if (error) throw error;
  return data.answer;
}

export async function generateImage(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: { prompt },
  });
  if (error) throw error;
  return data.imageUrl;
}
