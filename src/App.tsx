/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { 
  BookOpen, 
  Send, 
  Sparkles, 
  RotateCcw, 
  GraduationCap, 
  Lightbulb, 
  FileText, 
  BrainCircuit,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type StudyMode = 'explain' | 'summarize' | 'quiz' | 'general';

const SYSTEM_INSTRUCTIONS = {
  explain: "You are Lumina, a brilliant and patient academic tutor. Your goal is to explain complex concepts in simple, intuitive terms. Use analogies, step-by-step breakdowns, and clear language. If the topic is very difficult, start with the basics and build up.",
  summarize: "You are Lumina, an expert at synthesizing information. Provide a concise, structured summary of the topic provided. Use bullet points for key takeaways and highlight essential definitions.",
  quiz: "You are Lumina, a supportive teacher. Based on the topic provided, generate 3-5 challenging but fair multiple-choice or short-answer questions to test the student's understanding. Provide the answers at the very end, hidden or clearly separated.",
  general: "You are Lumina, a smart and helpful study assistant. Answer academic questions clearly and accurately. Offer study tips and guidance whenever relevant."
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Lumina, your personal study assistant. What are we learning today? You can ask me to explain a concept, summarize a topic, or even quiz you!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<StudyMode>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-latest",
        contents: messages.concat(userMessage).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS[mode],
          temperature: 0.7,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that. Could you try rephrasing?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'assistant',
        content: "Oops! I ran into a technical glitch. Please check your connection or try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat reset! How can I help you with your studies now?",
      timestamp: new Date()
    }]);
    setMode('general');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden sm:rounded-3xl sm:my-4 sm:h-[calc(100vh-2rem)]">
      {/* Header */}
      <header className="px-6 py-4 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Lumina</h1>
            <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold">Study Assistant</p>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-black"
          title="Reset Chat"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      {/* Study Modes */}
      <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'Ask Anything', icon: Sparkles },
          { id: 'explain', label: 'Explain', icon: Lightbulb },
          { id: 'summarize', label: 'Summarize', icon: FileText },
          { id: 'quiz', label: 'Quiz Me', icon: BrainCircuit },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as StudyMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              mode === item.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105" 
                : "bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-300"
            )}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 1 && (
          <div className="grid grid-cols-1 gap-3 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Try asking about...</p>
            {[
              { title: "Photosynthesis", desc: "Explain how plants make food", mode: 'explain' },
              { title: "Quantum Physics", desc: "Summarize the basics", mode: 'summarize' },
              { title: "Calculus", desc: "Quiz me on derivatives", mode: 'quiz' },
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  setMode(suggestion.mode as StudyMode);
                  setInput(suggestion.desc);
                }}
                className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm">{suggestion.title}</h3>
                  <p className="text-xs text-indigo-600/70">{suggestion.desc}</p>
                </div>
                <ChevronRight size={16} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === 'user' ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white border border-black/5 rounded-tl-none"
              )}>
                <div className={cn(
                  "prose prose-sm max-w-none",
                  msg.role === 'user' ? "text-white" : "text-slate-800"
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <p className={cn(
                  "text-[10px] mt-2 opacity-50",
                  msg.role === 'user' ? "text-right" : "text-left"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-black/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-black/5">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              mode === 'explain' ? "What concept should I explain?" :
              mode === 'summarize' ? "Paste text or a topic to summarize..." :
              mode === 'quiz' ? "What topic should I quiz you on?" :
              "Ask me anything about your studies..."
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none max-h-32 min-h-[52px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 p-2 rounded-xl transition-all duration-200",
              input.trim() && !isLoading 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105" 
                : "text-slate-300 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
          <Sparkles size={10} /> Lumina uses AI to help you learn. Always verify important facts.
        </p>
      </footer>
    </div>
  );
}
