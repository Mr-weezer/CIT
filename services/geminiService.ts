
import { GoogleGenAI, Type } from "@google/genai";
import { Asset, BiasOutput, NewsArticle, EconomicEvent, MacroContext } from '../types';

const HORIZON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bias: { type: Type.STRING, description: 'BULLISH, BEARISH, or NEUTRAL' },
    confidence: { type: Type.NUMBER },
    driver: { type: Type.STRING }
  },
  required: ['bias', 'confidence', 'driver']
};

const ASSET_BIAS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    horizons: {
      type: Type.OBJECT,
      properties: {
        scalping: HORIZON_SCHEMA,
        intraday: HORIZON_SCHEMA,
        swing: HORIZON_SCHEMA
      },
      required: ['scalping', 'intraday', 'swing']
    },
    key_drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
    supporting_news_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
    invalidated_if: { type: Type.ARRAY, items: { type: Type.STRING } },
    timestamp: { type: Type.STRING }
  },
  required: ['horizons', 'key_drivers', 'supporting_news_ids', 'invalidated_if', 'timestamp']
};

const SYSTEM_BIAS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    [Asset.GOLD]: ASSET_BIAS_SCHEMA,
    [Asset.SILVER]: ASSET_BIAS_SCHEMA,
    [Asset.OIL]: ASSET_BIAS_SCHEMA
  },
  required: [Asset.GOLD, Asset.SILVER, Asset.OIL]
};

export const generateSystemBiases = async (
  news: NewsArticle[], 
  events: EconomicEvent[],
  macro: MacroContext
): Promise<Record<Asset, BiasOutput>> => {
  // Initialize inside function to prevent top-level ReferenceErrors
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const topNews = news.sort((a, b) => b.impact_score - a.impact_score).slice(0, 20);

  const prompt = `
    Institutional Role: Lead Commodity Strategist.
    Objective: Generate bias for GOLD, SILVER, and OIL.
    
    STABILITY & BIAS CONTINUITY RULES:
    1. ANCHORING: Swing and Intraday biases MUST be anchored to the Macro Pulse (DXY, Yields). Do not flip these based on a single inventory report.
    2. TRANSIENCE: Only the SCALPING horizon should react to "noise" headlines (Impact < 70).
    3. SILVER SPECIALIZATION: Silver is an industrial metal. Evaluate it via manufacturing PMIs and PV demand. It often decouples from Gold during periods of industrial expansion.
    4. NOISE FILTER: If news is contradictory and there is no clear macro trend, the bias MUST default to NEUTRAL.
    
    INPUT INTELLIGENCE:
    ${topNews.map(n => `[ASSET:${n.assets.join(',')}] IMPACT:${n.impact_score} | ${n.title}`).join('\n')}
    
    MACRO ANCHORS:
    - USD Trend: ${macro.usd_trend}
    - Yields: ${macro.yields_trend}
    - Risk Sentiment: ${macro.risk_sentiment}
    
    Return the analysis in strict JSON format according to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SYSTEM_BIAS_SCHEMA
      }
    });

    const result = JSON.parse(response.text.trim());
    const formattedResult: any = {};
    Object.keys(result).forEach(asset => {
      formattedResult[asset] = { ...result[asset], asset: asset as Asset };
    });

    return formattedResult as Record<Asset, BiasOutput>;
  } catch (error: any) {
    console.error("AI Bias Engine Failure:", error);
    throw error;
  }
};
