import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Sparkles, ExternalLink, X } from 'lucide-react';
import { testGeminiApiKey, setStoredApiKey, clearStoredApiKey } from '../../services/geminiService';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onApiKeySaved: (newKey: string) => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onApiKeySaved,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(currentApiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter a key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKeyInput.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    setStoredApiKey(trimmed);
    onApiKeySaved(trimmed);
    onClose();
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKeyInput('');
    onApiKeySaved('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <span>Gemini AI Engine Settings</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Configure your Google Gemini API key for advanced natural language automata synthesis
            </p>
          </div>
        </div>

        {/* Description / Instructions */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-300">
          <div className="font-semibold text-slate-200">How to get a free API Key:</div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>
              Go to{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 underline underline-offset-2"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Click <b>"Create API key"</b> (free tier available).</li>
            <li>Copy and paste your key below.</li>
          </ol>
          <div className="text-[11px] text-slate-500 pt-1">
            🔒 <b>Privacy:</b> Your key is stored in your browser's local storage and sent exclusively to Google's official Gemini API.
          </div>
        </div>

        {/* Key Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Gemini API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => {
                setApiKeyInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              className="w-full pl-4 pr-11 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Test Connection Result */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="leading-tight">{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || !apiKeyInput.trim()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {isTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Test Connection</span>
            </button>

            {currentApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
              >
                Clear Key
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
