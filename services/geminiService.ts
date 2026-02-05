
import { GoogleGenAI, Type } from "@google/genai";
import { Asset, Bias, BiasOutput, NewsArticle, EconomicEvent, MacroContext } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const topNews = news.sort((a, b) => b.impact_score - a.impact_score).slice(0, 15);

  const prompt = `
    Role: Institutional Commodity Strategist.
    Task: Generate directional bias for GOLD, SILVER, and OIL.
    
    STABILITY RULES:
    1. PRIORITIZE STRUCTURAL MACRO: USD (DXY) and Real Yields are the "Anchor Drivers" for Swing/Intraday. 
    2. TRANSIENT NOISE: Headlines with Impact < 70 should only influence the SCALPING horizon.
    3. SILVER INDEPENDENCE: Evaluate Silver based on manufacturing/industrial PMIs and solar demand. Do not auto-copy Gold bias.
    4. CONFIDENCE: If news is contradictory, bias MUST be NEUTRAL with low confidence.
    
    INPUT DATA:
    ${topNews.map(n => `[${n.assets.join(',')}] IMPACT:${n.impact_score} | ${n.title}`).join('\n')}
    
    MACRO ANCHOR:
    - USD Trend: ${macro.usd_trend}
    - Yields: ${macro.yields_trend}
    - Risk: ${macro.risk_sentiment}
    
    Provide the response in the specified JSON schema. Ensure the 'driver' field contains a concise, logical justification.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SYSTEM_BIAS_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const result = JSON.parse(response.text.trim());
    const formattedResult: any = {};
    Object.keys(result).forEach(asset => {
      formattedResult[asset] = { ...result[asset], asset: asset as Asset };
    });

    return formattedResult as Record<Asset, BiasOutput>;
  } catch (error: any) {
    console.error("Bias Engine Failure:", error);
    throw error;
  }
};
