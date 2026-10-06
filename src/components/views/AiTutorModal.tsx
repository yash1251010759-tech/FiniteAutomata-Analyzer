import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Lightbulb,
  Key,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { AutomatonDefinition } from '../../types/automata';
import {
  askGeminiTutor,
  getFallbackTutorResponse,
  getStoredApiKey,
} from '../../services/geminiService';
import { GeminiSettingsModal } from '../modals/GeminiSettingsModal';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMachine: AutomatonDefinition;
}

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}

// Lightweight, resilient Markdown renderer for theoretical explanations
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const cleanRows = tableRows.filter(r => !r.every(c => c.trim().match(/^:?-+:?$/)));
    if (cleanRows.length === 0) {
      tableRows = [];
      return;
    }
    const [header, ...body] = cleanRows;

    elements.push(
      <div key={`table-${elements.length}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-700/80 shadow-sm">
        <table className="min-w-full divide-y divide-slate-700 text-left text-xs">
          {header && (
            <thead className="bg-slate-800/90 text-cyan-300 font-semibold">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-r border-slate-700/50 last:border-r-0">
                    {renderInline(col.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/70">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-300 border-r border-slate-800/50 last:border-r-0">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
      const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/s);

      if (codeMatch && (!boldMatch || codeMatch[1].length <= boldMatch[1].length)) {
        if (codeMatch[1]) parts.push(codeMatch[1]);
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-mono text-[11px] border border-cyan-800/60 shadow-xs">
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
      } else if (boldMatch) {
        if (boldMatch[1]) parts.push(boldMatch[1]);
        parts.push(
          <strong key={keyIdx++} className="font-bold text-white">
            {boldMatch[2]}
          </strong>
        );
        remaining = boldMatch[3];
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="my-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono text-cyan-300 leading-normal shadow-inner">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.trim().slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h5 key={i} className="text-xs font-bold text-cyan-300 mt-2.5 mb-1 flex items-center gap-1.5">
          {renderInline(line.slice(5))}
        </h5>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-cyan-200 mt-3 mb-1.5 border-b border-slate-800/80 pb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-sm font-extrabold text-white mt-3.5 mb-1.5">
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().replace(/^[•\-\*]\s*/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-slate-300 pl-1">
          <span className="text-cyan-400 font-bold mt-0.5">•</span>
          <span className="flex-1">{renderInline(bulletText)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-slate-300 pl-1">
          <span className="text-cyan-400 font-semibold font-mono text-[11px] mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1">{renderInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Divider
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="my-2.5 border-slate-800" />);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-slate-300 leading-relaxed my-0.5">
        {renderInline(line)}
      </p>
    );
  }

  flushTable();

  return <div className="space-y-0.5 text-xs">{elements}</div>;
};

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  currentMachine,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => getStoredApiKey());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'tutor',
      text: `Hello! I am your **AI Automata Tutor & Advisor** powered by Gemini AI.\n\nI can answer **any theoretical question** (such as *"What is an NFA?"*, *"What is a DFA?"*, *"How does Pushdown Automata work?"*, or *"Explain the Pumping Lemma"*), guide you through step-by-step algorithms, or inspect and debug your active machine **"${currentMachine.name}"**.\n\nWhat would you like to explore today?`,
      timestamp: 'Just now',
    },
  ]);

  // Synchronize API key when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
    }
  }, [isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  // Quick query suggestions
  const suggestions = [
    'What is an NFA?',
    'What is a DFA?',
    'Difference between DFA and NFA',
    'What is a Pushdown Automaton (PDA)?',
    'What is a Turing Machine?',
    'Explain the Pumping Lemma',
    `Analyze active machine "${currentMachine.name}"`,
    'How does Subset Construction work?',
    'What makes a DFA minimal?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isThinking) return;

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsThinking(true);

    try {
      let reply = '';
      const activeKey = (apiKey || getStoredApiKey()).trim();

      if (activeKey) {
        try {
          reply = await askGeminiTutor(query, messages, currentMachine, activeKey);
        } catch (apiErr: any) {
          console.warn('Gemini API call failed, falling back to built-in knowledge base:', apiErr);
          // Fall back gracefully to built-in comprehensive response
          reply = getFallbackTutorResponse(query, currentMachine);
        }
      } else {
        reply = getFallbackTutorResponse(query, currentMachine);
      }

      const botMsg: Message = {
        id: `msg-tutor-${Date.now() + 1}`,
        sender: 'tutor',
        text: reply,
        timestamp: 'Just now',
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg-err-${Date.now() + 1}`,
        sender: 'tutor',
        text: `⚠️ Error generating answer: ${err?.message || 'Connection failed'}. Please try again.`,
        timestamp: 'Just now',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'tutor',
        text: `Chat reset! I am ready to answer your questions about DFA, NFA, PDA, Turing Machines, Grammars, or analyze your active machine **"${currentMachine.name}"**. What would you like to ask?`,
        timestamp: 'Just now',
      },
    ]);
  };

  const hasApiKey = Boolean(apiKey && apiKey.trim());

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl h-[680px] flex flex-col shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-md shadow-cyan-500/10">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Automata AI Tutor & Advisor
                  </h3>
                  {hasApiKey ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Gemini AI Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-300 rounded-lg border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Offline Knowledge
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Ask theoretical questions or get instant machine diagnostics
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  hasApiKey
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-700/60 animate-pulse'
                }`}
                title={hasApiKey ? 'Gemini API Key configured' : 'Configure Gemini API Key'}
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{hasApiKey ? 'API Key' : 'Add API Key'}</span>
              </button>

              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
                title="Close AI Tutor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-bold text-xs'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
                  }`}
                >
                  {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none font-medium'
                      : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-tl-none font-sans text-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <FormattedMessage content={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-cyan-950 text-cyan-400 border border-cyan-800/80 shadow-md">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3.5 bg-slate-950/90 border border-cyan-900/40 rounded-2xl rounded-tl-none text-slate-300 flex items-center gap-3 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-200"></span>
                  </div>
                  <span className="text-xs text-cyan-300/90 font-medium">
                    {hasApiKey ? 'Gemini AI is analyzing automata theory...' : 'Knowledge engine is retrieving explanation...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips Bar */}
          <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-thin">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Prompts:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={isThinking}
                className="px-2.5 py-1 bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl whitespace-nowrap transition-colors border border-slate-700/60 shadow-xs disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                disabled={isThinking}
                placeholder="Ask anything (e.g., 'What is NFA?', 'What is DFA?', 'Explain Pumping Lemma', or 'Analyze machine')..."
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 shadow-inner placeholder:text-slate-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isThinking}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send query"
              >
                {isThinking ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Gemini Settings Modal Integration */}
      <GeminiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentApiKey={apiKey}
        onApiKeySaved={newKey => {
          setApiKey(newKey);
          setIsSettingsOpen(false);
        }}
      />
    </>
  );
};
