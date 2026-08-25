import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Zap,
  Brain,
  Gauge,
  User,
  GraduationCap,
  Shield,
  Briefcase,
  Building2,
  HelpCircle,
  Clock,
  ArrowDown,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { api } from '../../lib/apiClient.ts';

export type GeminiModelId =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: GeminiModelId;
  systemRoleUsed?: string;
}

const MODEL_CONFIGS: {
  id: GeminiModelId;
  name: string;
  tag: string;
  description: string;
  icon: any;
  color: string;
  badgeBg: string;
}[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'General Tasks (Default)',
    description: 'Balanced speed and intelligence for general academic Q&A, explanations, and campus help.',
    icon: Sparkles,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tag: 'Complex Reasoning & STEM',
    description: 'Advanced reasoning for difficult mathematical derivations, algorithm optimization, and curriculum audits.',
    icon: Brain,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Fast & Instant Replies',
    description: 'Ultra-low latency for rapid FAQ answers, definition lookups, and schedule checks.',
    icon: Gauge,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

const ROLE_PRESETS = [
  {
    id: 'student',
    title: 'Academic Tutor & Code Mentor',
    subtitle: 'Assignments, coding help, exam revision & formulas',
    icon: GraduationCap,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suggestions: [
      'Explain Dijkstra shortest path algorithm with a TypeScript example',
      'What are the attendance requirements to qualify for Semester End Exams?',
      'Help me create a 5-day study plan for Database Management Systems',
      'How do I calculate SGPA from subject credits and grade points?',
    ],
  },
  {
    id: 'faculty',
    title: 'Faculty & Assessment Copilot',
    subtitle: 'Lesson plans, Bloom taxonomy rubrics, question banks',
    icon: GraduationCap,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    suggestions: [
      'Generate a 5-question CIE assessment for Object Oriented Programming with Bloom levels',
      'Draft a grading rubric for student final semester capstone projects',
      'Suggest active learning strategies for a 60-minute Computer Networks lecture',
      'Provide a template for Course Outcomes (CO) to Program Outcomes (PO) mapping',
    ],
  },
  {
    id: 'hod',
    title: 'Accreditation & Curriculum Strategist',
    subtitle: 'NAAC/NBA audits, syllabus modernization, faculty load',
    icon: Building2,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    suggestions: [
      'Draft an executive summary on AI & Data Science elective integration for the Board of Studies',
      'What key documents are required for NBA Criterion 3 (Course Outcomes)?',
      'Outline an agenda for the semester Department Advisory Board (DAB) meeting',
      'Strategies to improve student placement ratios in tier-1 product companies',
    ],
  },
  {
    id: 'placement_officer',
    title: 'Career & Placement Coach',
    subtitle: 'Technical interview mocks, resume audits, corporate outreach',
    icon: Briefcase,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    suggestions: [
      'Top 10 technical interview questions asked by Amazon for SDE-1 roles',
      'Draft a formal campus recruitment invitation email to Tech Mahindra HR',
      'Critique a resume bullet point for a full-stack React / Node.js developer',
      'Create an aptitude test structure covering Quantitative, Logical, and Verbal skills',
    ],
  },
  {
    id: 'admin',
    title: 'Campus Operations & Policy Assistant',
    subtitle: 'ERP workflows, institutional governance, circulars',
    icon: Shield,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    suggestions: [
      'Draft a formal notice announcing the Spring 2026 Annual Tech Symposium',
      'Standard operating procedure for emergency campus weather closures',
      'Checklist for verifying institutional transcripts and provisional degree certificates',
      'Fee concession review guidelines for merit-based student scholarships',
    ],
  },
];

interface GeminiChatViewProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({ isEmbedded = false, onClose }) => {
  const { currentUser, activeRole } = useAuth();

  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.5-flash');
  const [systemRole, setSystemRole] = useState<string>(activeRole || 'student');
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!isEmbedded);

  // Load chat history from localStorage or set initial welcome
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`cms_gemini_chat_${activeRole}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'welcome-1',
        role: 'model',
        content: `Hello **${currentUser?.name || 'there'}**! I am **Apex AI**, your intelligent multi-role campus copilot powered by Google Gemini.

I can assist you with:
- 📚 **Curriculum & Study:** Detailed code implementations, formulas, and concept explanations.
- 📝 **Assessments & Grading:** Rubrics, exam question formulation, and study guides.
- 💼 **Career & Placements:** Resume reviews, coding interview prep, and aptitude questions.
- 🏛️ **Campus Governance:** Institutional policies, attendance criteria, and accreditation workflows.

Select a specialized **Persona** or **Model** above, or pick one of the quick suggestions below to begin!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
        systemRoleUsed: activeRole,
      },
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages per role
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`cms_gemini_chat_${activeRole}`, JSON.stringify(messages));
    }
  }, [messages, activeRole]);

  // Sync role preset if auth changes
  useEffect(() => {
    if (activeRole) {
      setSystemRole(activeRole);
    }
  }, [activeRole]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build server payload with conversation history
      const res = await api.post('/gemini/chat', {
        messages: newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: selectedModel,
        systemRole: systemRole,
        userContext: {
          name: currentUser?.name,
          role: currentUser?.role || activeRole,
          department: 'Computer Science & Engineering',
          email: currentUser?.email,
        },
      });

      if (res.success && res.data) {
        const botMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: res.data.model || selectedModel,
          systemRoleUsed: systemRole,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.message || 'Failed to receive reply');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: `I encountered a connection notice: ${
          err.message || 'Unable to connect to AI server'
        }.\n\nPlease try again or switch to **Gemini 3.5 Flash** for quick general queries.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        systemRoleUsed: systemRole,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear current chat conversation history?')) {
      const initial: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          content: `Chat history cleared. How can **Apex AI** assist you with your campus work today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
          systemRoleUsed: systemRole,
        },
      ];
      setMessages(initial);
      localStorage.removeItem(`cms_gemini_chat_${activeRole}`);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activePreset = ROLE_PRESETS.find((r) => r.id === systemRole) || ROLE_PRESETS[0];

  return (
    <div className={`flex flex-col bg-slate-50 ${isEmbedded ? 'h-full' : 'h-[calc(100vh-4rem)]'} overflow-hidden`}>
      {/* Header Toolbar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 shrink-0 shadow-2xs z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                  Apex AI Copilot
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
                    Gemini 3
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500">
                Multi-turn campus intelligence with role-specific system instructions
              </p>
            </div>
          </div>

          {/* Model Selector & Actions */}
          <div className="flex items-center gap-2">
            {/* Model Selector Dropdown */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {MODEL_CONFIGS.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                    title={m.description}
                  >
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="hidden sm:inline">{m.name.replace('Gemini ', '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear History Button */}
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              title="Reset & Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {isEmbedded && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                title="Close Window"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* System Role Persona Pill Selector */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Persona:
          </span>
          {ROLE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = systemRole === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSystemRole(preset.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  isSelected
                    ? `${preset.color} border shadow-2xs font-semibold ring-1 ring-indigo-500/20`
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.title.split('&')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model & Persona Active Banner */}
      <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50/40 border-b border-indigo-100/50 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Active Model: <strong className="text-slate-800 font-semibold">{selectedModel}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            System Role: <strong className="text-slate-800 font-semibold">{activePreset.title}</strong>
          </span>
        </div>
        <span className="hidden md:inline-block text-slate-400 text-[10px]">
          Multi-turn context active ({messages.length} messages)
        </span>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-2xs ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`group relative rounded-2xl p-4 text-xs leading-relaxed max-w-[88%] sm:max-w-[80%] ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs rounded-tr-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-tl-xs'
                }`}
              >
                {/* Header info in bot bubble */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-[10px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Apex AI • {msg.modelUsed || selectedModel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Rendering */}
                {isUser ? (
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                ) : (
                  <div className="prose prose-xs max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-headings:text-xs prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-3 prose-pre:rounded-xl prose-code:font-mono prose-code:text-[11px] prose-code:bg-slate-100 prose-code:text-indigo-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-slate-900">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}

                {/* User timestamp */}
                {isUser && (
                  <div className="mt-1 text-[10px] text-indigo-200 text-right">{msg.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex items-start gap-3 mr-auto max-w-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0 flex items-center justify-center shadow-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Generating response with {selectedModel}...</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 sm:px-6 py-2 bg-slate-100/70 border-t border-slate-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Suggestions:
          </span>
          {activePreset.suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sug)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg font-medium transition-colors shrink-0 text-left truncate max-w-xs shadow-2xs hover:border-indigo-200"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <div className="p-4 sm:p-6 bg-white border-t border-slate-200/90 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative max-w-4xl mx-auto"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask Apex AI anything as ${activePreset.title.split('&')[0]} (Press Enter to send, Shift+Enter for new line)...`}
            disabled={isLoading}
            className="w-full pl-4 pr-24 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all resize-none shadow-2xs"
          />

          <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className={`p-2 rounded-lg transition-all flex items-center justify-center shadow-xs ${
                inputQuery.trim() && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-1.5 text-center text-[10px] text-slate-400">
          Apex AI utilizes Gemini API with server-side processing for verified academic & campus assistance.
        </div>
      </div>
    </div>
  );
};
