import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare, Maximize2 } from 'lucide-react';
import { GeminiChatView } from '../../pages/gemini/GeminiChatView.tsx';

interface GeminiFloatingWidgetProps {
  onNavigateToFullChat?: () => void;
}

export const GeminiFloatingWidget: React.FC<GeminiFloatingWidgetProps> = ({
  onNavigateToFullChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Expanded Popup Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[560px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold tracking-tight">Apex AI Assistant</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-400/30">
                Gemini 3
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onNavigateToFullChat && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToFullChat();
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Open Full Screen Chat"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded View */}
          <div className="flex-1 overflow-hidden">
            <GeminiChatView isEmbedded={true} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
        title="Open Apex AI Copilot"
      >
        <div className="relative">
          <Bot className="w-5 h-5" />
          <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="text-xs font-bold hidden sm:inline tracking-tight">Ask Apex AI</span>
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold bg-white/20 rounded-full">
          Gemini
        </span>
      </button>
    </div>
  );
};
