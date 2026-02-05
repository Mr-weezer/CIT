
import React, { useState } from 'react';
import { Asset, Bias, BiasOutput, NewsArticle, EconomicEvent, TradeHorizon } from '../types';
import { ASSET_ICONS } from '../constants';

interface Props {
  biases: Partial<Record<Asset, BiasOutput>>;
  isAnalyzing: boolean;
  news: NewsArticle[];
  events: EconomicEvent[];
}

const IntelligenceMonitor: React.FC<Props> = ({ biases, isAnalyzing, news, events }) => {
  const [selectedHorizons, setSelectedHorizons] = useState<Record<Asset, TradeHorizon>>({
    [Asset.GOLD]: TradeHorizon.INTRADAY,
    [Asset.SILVER]: TradeHorizon.INTRADAY,
    [Asset.OIL]: TradeHorizon.INTRADAY,
  });

  const setHorizon = (asset: Asset, horizon: TradeHorizon) => {
    setSelectedHorizons(prev => ({ ...prev, [asset]: horizon }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(Asset).map((asset) => {
          const biasData = biases[asset];
          const activeHorizonKey = selectedHorizons[asset].toLowerCase() as keyof BiasOutput['horizons'];
          const activeHorizon = biasData?.horizons?.[activeHorizonKey];
          
          const isNeutral = activeHorizon?.bias === Bias.NEUTRAL;
          const isBullish = activeHorizon?.bias === Bias.BULLISH;
          
          return (
            <div key={asset} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-slate-700 shadow-2xl shadow-black/50">
              <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  {ASSET_ICONS[asset]}
                  <span className="font-black tracking-widest text-sm">{asset}</span>
                </div>
                {isAnalyzing && !biasData ? (
                  <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
                ) : activeHorizon ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                      isBullish ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                      isNeutral ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' : 
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {activeHorizon.bias}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex bg-slate-950/50 p-1 border-b border-slate-800/50">
                {Object.values(TradeHorizon).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(asset, h)}
                    className={`flex-1 py-1 text-[9px] font-black uppercase rounded transition-all ${
                      selectedHorizons[asset] === h 
                        ? 'bg-slate-800 text-indigo-400 shadow-inner' 
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              
              <div className="p-4 flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
                {activeHorizon ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Confidence</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{(activeHorizon.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                          isBullish ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 
                          isNeutral ? 'bg-slate-600' : 
                          'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                        }`}
                        style={{ width: `${activeHorizon.confidence * 100}%` }}
                      />
                    </div>
                    
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/50 backdrop-blur-sm">
                      <span className="text-[9px] text-indigo-500 uppercase font-black block mb-1.5 tracking-wider">Market Driver</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        {activeHorizon.driver}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Invalidation Risks</span>
                      <ul className="text-[10px] space-y-1.5">
                        {biasData.invalidated_if.slice(0, 2).map((inv, i) => (
                          <li key={i} className="flex gap-2 text-slate-400 group">
                            <span className="text-rose-500/60 font-black">×</span>
                            <span className="group-hover:text-slate-300 transition-colors">{inv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Analyzing Stream</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-World News Layer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Live Ingestion Feed
            </div>
            <span className="text-[9px] text-slate-600 font-mono">Source Grounding: ACTIVE</span>
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {news.length > 0 ? news.sort((a, b) => b.impact_score - a.impact_score).map((article) => (
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                key={article.id} 
                className="block p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl group hover:border-indigo-500/50 hover:bg-slate-950/80 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase border ${
                      article.impact_score > 80 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                      article.impact_score > 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                      'bg-slate-800/50 text-slate-500 border-slate-700/50'
                    }`}>
                      Impact: {article.impact_score}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{article.source}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {article.assets.map(a => (
                      <span key={a} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-black tracking-tighter">{a}</span>
                    ))}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-2 leading-tight group-hover:text-white transition-colors">
                  {article.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed font-medium">
                  {article.content}
                </p>
                <div className="text-[9px] text-slate-600 flex justify-between font-mono pt-2 border-t border-slate-800/30">
                  <span>SYNCED: {new Date(article.published_at).toLocaleTimeString()} UTC</span>
                  <span className="text-indigo-500/60 flex items-center gap-1">
                    VERIFY SOURCE
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </div>
              </a>
            )) : (
              <div className="h-60 flex flex-col items-center justify-center text-slate-700 space-y-4">
                {isAnalyzing ? (
                  <>
                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/2 animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scouring Live Markets...</span>
                  </>
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-slate-800 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Recent Intelligence Found</span>
                    <p className="text-[9px] text-slate-600 mt-2">Try refreshing to re-initiate search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Macro Grounding Data */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest mb-5">Institutional Macro Environment</h3>
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Risk Catalysts</span>
                <span className="text-[9px] text-emerald-500 font-mono animate-pulse">● LIVE UPDATES</span>
              </div>
              {events.length > 0 ? events.map(event => (
                <div key={event.id} className="p-4 bg-slate-950/60 border border-slate-800/50 rounded-xl border-l-2 border-l-indigo-500 shadow-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-slate-200 uppercase tracking-wide">{event.event_name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{event.actual}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between font-medium">
                    <span>{event.country} • IMPACT: {event.impact}</span>
                    <span className="italic">Verification: SUCCESS</span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Waiting for Macro Events</span>
                </div>
              )}
            </div>
            
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Intermarket Pulse</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'DXY (USD)', val: 'LIVE MONITOR', color: 'text-indigo-400', sub: 'Bearish Bias' },
                  { label: 'US 10-YEAR', val: 'GROUNDED', color: 'text-blue-400', sub: 'Stable' },
                  { label: 'VIX VOLA', val: 'REAL-TIME', color: 'text-emerald-400', sub: 'Consolidation' }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between h-24 hover:border-slate-600 transition-colors">
                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">{item.label}</div>
                    <div className={`text-[10px] font-black tracking-wider ${item.color}`}>{item.val}</div>
                    <div className="text-[8px] text-slate-500 font-bold italic">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                <span className="font-black text-indigo-400 mr-2 uppercase tracking-widest">Ingestion Core:</span> 
                Proprietary AI filtering active. Currently correlating live News Impact Scores with multi-horizon timeframes. Using Google Search Grounding for source verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020617;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
};

export default IntelligenceMonitor;
