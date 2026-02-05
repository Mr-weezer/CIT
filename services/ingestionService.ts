
import { GoogleGenAI } from "@google/genai";
import { Asset, NewsArticle, EconomicEvent, IngestionBundle } from '../types';
import { ASSET_KEYWORDS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const assets = Object.values(Asset).join(", ");
  const now = new Date();
  
  const searchPrompt = `
    Search for high-impact financial news from the last 24 hours for: ${assets}.
    Focus on: Reuters, CNBC, Bloomberg, and EIA reports.
    Specifically find: 
    1. Gold/XAU: Fed sentiment, central bank buying, yield shifts.
    2. Silver/XAG: Industrial demand, solar/EV manufacturing, silver/gold ratio.
    3. Oil/WTI: OPEC+ output, EIA inventory data, geopolitical supply risks.
    
    Return a detailed summary of high-impact intelligence.
  `;

  try {
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const searchResultText = searchResponse.text;
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Pass the search text AND the grounding chunks to the extraction phase
    const extractionPrompt = `
      Convert the following market intelligence into a structured JSON array.
      
      INTELLIGENCE:
      ${searchResultText}
      
      SOURCES/URLS AVAILABLE:
      ${groundingChunks.map((c, i) => `[S${i}]: ${c.web?.title} - ${c.web?.uri}`).join('\n')}
      
      RULES:
      1. Map the most relevant Source URL from the list above to each article.
      2. Set "impact_score" 1-100 based on institutional significance.
      
      JSON SCHEMA:
      Array<{
        "asset_context": "GOLD" | "SILVER" | "OIL",
        "headline": "string",
        "summary": "string",
        "source_name": "string",
        "url": "string (MUST BE FROM SOURCES LIST)",
        "impact_score": number
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
      source: art.source_name || "Financial Feed",
      title: art.headline,
      content: art.summary,
      url: art.url || "https://www.reuters.com/business/commodities",
      published_at: now.toISOString(),
      fetched_at: now.toISOString(),
      assets: tagAsset(`${art.headline} ${art.summary}`, art.asset_context),
      impact_score: art.impact_score || 50
    }));

    // Logic-driven Macro Event Generation
    const events: EconomicEvent[] = [{
      id: generateId(),
      event_name: "Unified Macro Pulse",
      country: "US/GLOBAL",
      impact: "HIGH",
      actual: "MONITORED",
      forecast: "N/A",
      previous: "N/A",
      release_time: now.toISOString()
    }];

    return { 
      news: news.filter(n => n.assets.length > 0), 
      events 
    };
  } catch (error: any) {
    console.error("Ingestion Service Error:", error);
    throw error;
  }
};
