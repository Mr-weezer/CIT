
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, BiasOutput, NewsArticle, EconomicEvent, MacroContext } from './types';
import { fetchLatestData } from './services/ingestionService';
import { generateSystemBiases } from './services/geminiService';
import { sendIntelligenceReport } from './services/telegramService';
import IntelligenceMonitor from './components/IntelligenceMonitor';

const REFRESH_INTERVAL = 3600000; // 1 Hour

const App: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [biases, setBiases] = useState<Partial<Record<Asset, BiasOutput>>>({});
  const [isIngesting, setIsIngesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastTelegramSent, setLastTelegramSent] = useState<Date | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  // Fix: Replaced NodeJS.Timeout with any to avoid namespace error in browser environment
  const timerRef = useRef<any>(null);

  const runIntelligenceCycle = useCallback(async () => {
    setIsIngesting(true);
    setSystemError(null);
    
    try {
      // Layer 1: Data Ingestion
      const data = await fetchLatestData();
      setNews(data.news);
      setEvents(data.events);
      setIsIngesting(false);

      // Layer 2: AI Bias Engine
      setIsAnalyzing(true);
      
      const macro: MacroContext = {
        usd_trend: 'WEAKENING',
        yields_trend: 'STABLE',
        risk_sentiment: 'RISK_ON'
      };

      const biasResults = await generateSystemBiases(data.news, data.events, macro);
      setBiases(biasResults);
      setLastUpdate(new Date());

      // Layer 3: Telegram Reporting
      const tgSuccess = await sendIntelligenceReport(biasResults);
      if (tgSuccess) {
        setLastTelegramSent(new Date());
      }
    } catch (error: any) {
      console.error("Intelligence Cycle Failed:", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        setSystemError("API Quota Reached: The system is currently rate-limited. Next auto-attempt in 1 hour.");
      } else {
        setSystemError("Engine Failure: Check system logs or API connectivity.");
      }
    } finally {
      setIsIngesting(false);
      setIsAnalyzing(false);
    }
  }, []);

  // Setup 1-Hour Auto-Refresh
  useEffect(() => {
    runIntelligenceCycle();

    timerRef.current = setInterval(() => {
      console.log("Initiating scheduled 1-hour intelligence refresh...");
      runIntelligenceCycle();
    }, REFRESH_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runIntelligenceCycle]);

  const timeSinceLastUpdate = lastUpdate ? Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
            <span className="bg-white text-black px-2 rounded">CIT</span>
            Commodity Intelligence Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">Institutional-Grade Macro Analysis & Bias Generation</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Telegram Status Display */}
          <div className="text-right border-r border-slate-800 pr-6">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Telegram Report Hub</div>
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-[10px] font-mono ${lastTelegramSent ? 'text-emerald-400' : 'text-slate-600'}`}>
                {lastTelegramSent ? `LAST: ${lastTelegramSent.toLocaleTimeString()}` : 'WAITING'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${lastTelegramSent ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Status</div>
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-xs font-mono ${systemError ? 'text-rose-500' : 'text-emerald-400'}`}>
                {isIngesting || isAnalyzing ? 'PROCESSING' : systemError ? 'RATE_LIMITED' : 'ACTIVE'}
              </span>
              <div className={`w-2 h-2 rounded-full ${isIngesting || isAnalyzing ? 'bg-indigo-500 animate-pulse' : systemError ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
            </div>
          </div>
          
          <button 
            onClick={runIntelligenceCycle}
            disabled={isIngesting || isAnalyzing}
            className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
              isIngesting || isAnalyzing 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            {isIngesting ? 'Ingesting...' : isAnalyzing ? 'Analyzing...' : 'Force Refresh'}
          </button>
        </div>
      </header>

      <main>
        {systemError && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest">Cycle Interrupted</h4>
              <p className="text-xs text-rose-500/80 font-medium">{systemError}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Asset Bias Snapshot</span>
            {lastUpdate && (
              <span className="text-[10px] text-slate-600 font-mono italic">
                {timeSinceLastUpdate === 0 ? 'Just updated' : `${timeSinceLastUpdate}m ago`}
              </span>
            )}
          </div>
          <div className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em]">
            Auto-Sync: 1 Hour Interval Active
          </div>
        </div>

        <IntelligenceMonitor 
          biases={biases} 
          isAnalyzing={isAnalyzing} 
          news={news}
          events={events}
        />
        
        <footer className="mt-12 pt-6 border-t border-slate-800/50 flex flex-col md:flex-row justify-between text-slate-600 text-[10px] uppercase font-bold tracking-widest gap-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-indigo-600" />
              Unified Ingestion (60m)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500" />
              Telegram Report Pipeline
            </div>
          </div>
          <div className="text-slate-700">
            Strict Separation Protocol v1.6.0 • Automated Intelligence
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
