
import React from 'react';
import { Asset } from './types';

export const ASSET_KEYWORDS: Record<Asset, string[]> = {
  [Asset.GOLD]: ["gold", "xau", "bullion", "fed", "yields", "inflation", "central bank", "haven"],
  [Asset.SILVER]: ["silver", "xag", "industrial metals", "manufacturing", "solar", "photovoltaic", "white metal"],
  [Asset.OIL]: ["oil", "crude", "wti", "brent", "opec", "inventory", "eia", "energy", "petroleum"]
};

export const SOURCES = [
  "Reuters",
  "CNBC",
  "Investing.com",
  "MarketWatch",
  "EIA",
  "World Gold Council"
];

export const ASSET_ICONS: Record<Asset, React.ReactNode> = {
  [Asset.GOLD]: (
    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [Asset.SILVER]: (
    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  ),
  [Asset.OIL]: (
    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 102.828 2.828l2.387-2.387a2 2 0 00.547-1.022l.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l.477-2.387a2 2 0 00-.547-1.022L2.433 3.51a2 2 0 10-2.828-2.828L1.992 3.07a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L-.042 3.29z" />
    </svg>
  )
};
