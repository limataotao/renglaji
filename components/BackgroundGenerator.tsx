import React, { useState } from 'react';
import { generateGameBackground } from '../services/geminiService';
import { ImageSize } from '../types';

interface BackgroundGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onBackgroundGenerated: (url: string) => void;
}

const BackgroundGenerator: React.FC<BackgroundGeneratorProps> = ({ isOpen, onClose, onBackgroundGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const url = await generateGameBackground(prompt, size);
      if (url) {
        onBackgroundGenerated(url);
        onClose();
      } else {
        setError("Could not generate image. Try a different prompt.");
      }
    } catch (err) {
      setError("API Error: Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
            ✕
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">New Scene</h2>
        <p className="text-gray-400 text-sm mb-6">Describe where you want to toss paper. We use <strong>Nano Banana Pro</strong> to create it.</p>

        <div className="space-y-4">
            <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Prompt</label>
                <textarea 
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="e.g., A futuristic cyberpunk office with neon lights..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Resolution</label>
                <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-700">
                    {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                                size === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Scene...
                    </>
                ) : (
                    "Create Scene"
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundGenerator;