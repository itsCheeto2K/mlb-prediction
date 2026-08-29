import { PredictionRequestPayload, PredictionResult } from '../types/prediction';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function runPrediction(payload: PredictionRequestPayload): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction engine error (${response.status}): ${errorText}`);
  }

  const data: PredictionResult = await response.json();
  return data;
}
