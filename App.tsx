import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import ChatInterface from './components/ChatInterface';
import BackgroundGenerator from './components/BackgroundGenerator';
import { Wind } from './types';

// Default background placeholder (CSS gradient fallback in canvas)
const DEFAULT_BG = null; 

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [wind, setWind] = useState<Wind>({ speed: 0, label: 'Calm' });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBgGenOpen, setIsBgGenOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(DEFAULT_BG);

  // Update wind periodically for game difficulty
  useEffect(() => {
    const updateWind = () => {
      // Random wind between -5 and 5
      const speed = (Math.random() * 10) - 5;
      setWind({
        speed,
        label: Math.abs(speed) < 1 ? 'Calm' : Math.abs(speed) < 3 ? 'Breezy' : 'Windy'
      });
    };
    
    updateWind();
    const interval = setInterval(updateWind, 5000); // Change wind every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-900 font-sans">
      
      {/* Game Layer */}
      <GameCanvas 
        wind={wind} 
        onScoreUpdate={setScore} 
        backgroundUrl={backgroundUrl} 
      />

      {/* UI Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-4">
         {/* Tools Menu */}
         <div className="flex gap-2">
            <button 
              onClick={() => setIsBgGenOpen(true)}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white hover:bg-white/20 transition-all group relative"
              title="Change Scene"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
               <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Change Scene</span>
            </button>

            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white hover:bg-white/20 transition-all group relative"
              title="Chat Assistant"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
               </svg>
               <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">AI Chat</span>
            </button>
         </div>
      </div>

      {/* Modals & Slide-overs */}
      <BackgroundGenerator 
        isOpen={isBgGenOpen} 
        onClose={() => setIsBgGenOpen(false)} 
        onBackgroundGenerated={setBackgroundUrl}
      />

      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
      
    </div>
  );
};

export default App;