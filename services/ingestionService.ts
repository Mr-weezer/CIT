
import { GoogleGenAI } from "@google/genai";
import { Asset, NewsArticle, EconomicEvent, IngestionBundle } from '../types';
import { ASSET_KEYWORDS } from '../constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function tagAsset(text: string, suggestedAsset?: string): Asset[] {
  const assets = new Set<Asset>();
  const lowerText = text.toLowerCase();
  
  Object.entries(ASSET_KEYWORDS).forEach(([asset, keywords]) => {
    if (keywords.some(k => lowerText.includes(k.toLowerCase()))) {
      assets.add(asset as Asset);
    }
  });

  if (suggestedAsset && Object.values(Asset).includes(suggestedAsset as Asset)) {
    assets.add(suggestedAsset as Asset);
  }

  return Array.from(assets);
}

export const fetchLatestData = async (): Promise<IngestionBundle> => {
  // Initialize inside function to prevent top-level ReferenceErrors
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const assets = Object.values(Asset).join(", ");
  const now = new Date();
  
  const searchPrompt = `
    Find high-impact institutional financial news from the last 24 hours for: ${assets}.
    Focus on: Reuters Commodities, CNBC Markets, Bloomberg, and official EIA/OPEC releases.
    Specific objectives:
    - GOLD: Fed dot plot shifts, US Treasury yield trends, central bank accumulation.
    - SILVER: Manufacturing PMIs (China/US), industrial silver demand in solar/EV.
    - OIL: WTI/Brent spreads, geopolitical supply disruptions, inventory draws/builds.
    
    Provide a comprehensive intelligence dump with specific sources mentioned.
  `;

  try {
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const searchResultText = searchResponse.text;
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const extractionPrompt = `
      Convert the following intelligence into valid JSON.
      
      INTELLIGENCE:
      ${searchResultText}
      
      AVAILABLE SOURCES (Use these for URLs):
      ${groundingChunks.map((c, i) => `[ID:${i}] ${c.web?.title} - ${c.web?.uri}`).join('\n')}
      
      JSON SCHEMA:
      Array<{
        "asset": "GOLD" | "SILVER" | "OIL",
        "title": "string",
        "summary": "string",
        "source": "string",
        "url": "string (MUST correspond to one of the AVAILABLE SOURCES IDs above)",
        "impact": number (1-100)
      }>
    `;

    const extractionResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: extractionPrompt,
      config: { responseMimeType: "application/json" }
    });

    const rawArticles = JSON.parse(extractionResponse.text.trim());
    
    const news: NewsArticle[] = rawArticles.map((art: any) => ({
      id: generateId(),
      source: art.source || "Market Feed",
      title: art.title,
      content: art.summary,
      url: art.url || "https://www.reuters.com/business/commodities",
      published_at: now.toISOString(),
      fetched_at: now.toISOString(),
      assets: tagAsset(`${art.title} ${art.summary}`, art.asset),
      impact_score: art.impact || 50
    }));

    const events: EconomicEvent[] = [{
      id: generateId(),
      event_name: "Macro Trend Pulse",
      country: "Global",
      impact: "HIGH",
      actual: "Monitored",
      forecast: null,
      previous: null,
      release_time: now.toISOString()
    }];

    return { news: news.filter(n => n.assets.length > 0), events };
  } catch (error: any) {
    console.error("Ingestion Layer Error:", error);
    throw error;
  }
};
