
export enum Asset {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  OIL = 'OIL'
}

export enum Bias {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL'
}

export enum TradeHorizon {
  SCALPING = 'SCALPING', // Short term (minutes/hours)
  INTRADAY = 'INTRADAY', // Intermediate term (hours/day)
  SWING = 'SWING'      // Long term (days/weeks)
}

export interface NewsArticle {
  id: string;
  source: string;
  title: string;
  content: string;
  url: string;
  published_at: string;
  fetched_at: string;
  assets: Asset[];
  impact_score: number;
}

export interface EconomicEvent {
  id: string;
  event_name: string;
  country: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  release_time: string;
}

export interface MacroContext {
  usd_trend: string;
  yields_trend: string;
  risk_sentiment: string;
}

export interface HorizonAnalysis {
  bias: Bias;
  confidence: number;
  driver: string;
}

export interface BiasOutput {
  asset: Asset;
  horizons: {
    scalping: HorizonAnalysis;
    intraday: HorizonAnalysis;
    swing: HorizonAnalysis;
  };
  key_drivers: string[];
  supporting_news_ids: string[];
  invalidated_if: string[];
  timestamp: string;
}

export interface IngestionBundle {
  news: NewsArticle[];
  events: EconomicEvent[];
}
