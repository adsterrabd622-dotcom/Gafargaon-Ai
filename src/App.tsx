/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Code, 
  BookOpen, 
  MessageSquare,
  Plus,
  Trash2,
  Github,
  Menu,
  X,
  Terminal,
  ChevronRight,
  Command,
  LayoutGrid
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./lib/utils";
import { chatWithGeminiStream, Message } from "./services/gemini";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    const newMessages: Message[] = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let assistantText = "";
      setMessages(prev => [...prev, { role: "model", text: "" }]);
      
      const stream = chatWithGeminiStream(newMessages.slice(0, -1), userMessage, controller.signal);
      
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        assistantText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "model", text: assistantText };
          return updated;
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Chat error:", error);
      let errorMessage = "দুঃখিত, একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।";
      
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("exhausted") || errorStr.includes("rate_limit") || errorStr.includes("too many requests")) {
        errorMessage = "আপনার Gemini API লিমিট শেষ হয়ে গেছে। দয়া করে ১ মিনিট পর আবার চেষ্টা করুন।";
      } else if (errorStr.includes("401") || errorStr.includes("invalid_api_key") || errorStr.includes("api_key_invalid") || errorStr.includes("authentication") || errorStr.includes("unauthorized")) {
        errorMessage = "আপনার Gemini API Key-টি সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে। দয়া করে Vercel Settings থেকে GEMINI_API_KEY সেট করুন।";
      } else if (errorStr.includes("model is overloaded") || errorStr.includes("503") || errorStr.includes("service unavailable")) {
        errorMessage = "গুগল সার্ভার এখন অনেক ব্যস্ত। দয়া করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      } else if (!process.env.GEMINI_API_KEY) {
        errorMessage = "কোনো Gemini API Key পাওয়া যায়নি! দয়া করে Vercel-এ GEMINI_API_KEY সেট করুন।";
      } else {
        errorMessage = `দুঃখিত, একটি সমস্যা হয়েছে। এরর: ${error.message || "Unknown Error"}`;
      }
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: "model", 
          text: errorMessage 
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-50 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 rotate-3 transition-transform hover:rotate-0">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">Gafargaon AI</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local Guide v1.0</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <button
            onClick={clearChat}
            className="flex items-center justify-between w-full p-4 mb-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold text-sm">New Chat</span>
            </div>
            <div className="bg-white/10 px-2 py-1 rounded-md text-[10px] font-mono opacity-50">
              ⌘ N
            </div>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4 px-2">
              History
            </div>
            {messages.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 opacity-70" />
                  <span className="font-medium">Current Session</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 space-y-3">
                <LayoutGrid className="w-8 h-8 opacity-20" />
                <span className="text-xs font-medium italic">No recent activity</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Developer</div>
              <div className="text-sm font-bold text-slate-900">SAKIB HOSSAIN</div>
            </div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600"
            >
              <Github className="w-4 h-4" />
              Source Code
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white lg:rounded-l-[40px] shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="h-16 sm:h-20 border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-100">
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">Gafargaon AI</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Command className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-[9px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
              <span className="hidden xs:inline">Active Now</span>
              <span className="xs:hidden">Live</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-0 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 sm:space-y-10">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-600 rounded-[28px] sm:rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-200 relative group"
                >
                  <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-white group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-slate-900 rounded-full flex items-center justify-center border-2 sm:border-4 border-white">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  </div>
                </motion.div>
                
                <div className="space-y-3 sm:space-y-4 px-4">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                    Gafargaon <span className="text-emerald-600">AI.</span>
                  </h1>
                  <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-lg font-medium leading-relaxed">
                    গফরগাঁওয়ের ইতিহাস, শিক্ষা, মানচিত্র এবং সকল তথ্য জানতে আমাকে জিজ্ঞাসা করুন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl px-4">
                  {[
                    { icon: BookOpen, label: "ইতিহাস", desc: "গফরগাঁওয়ের প্রাচীন ইতিহাস ও ঐতিহ্য", color: "bg-blue-50 text-blue-600 border-blue-100" },
                    { icon: LayoutGrid, label: "পরিসংখ্যান", desc: "আয়তন, জনসংখ্যা ও ভৌগোলিক তথ্য", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                    { icon: Code, label: "শিক্ষা প্রতিষ্ঠান", desc: "স্কুল, কলেজ ও মাদ্রাসার তালিকা", color: "bg-purple-50 text-purple-600 border-purple-100" },
                    { icon: Sparkles, label: "দর্শনীয় স্থান", desc: "গফরগাঁওয়ের জনপ্রিয় পর্যটন কেন্দ্র", color: "bg-orange-50 text-orange-600 border-orange-100" }
                  ].map((item, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInput(item.desc)}
                      className={cn(
                        "flex items-start gap-3 sm:gap-5 p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border transition-all text-left",
                        item.color
                      )}
                    >
                      <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white shadow-sm flex-shrink-0">
                        <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 mb-0.5 text-xs sm:text-base">{item.label}</div>
                        <div className="text-[10px] sm:text-xs opacity-70 font-medium leading-relaxed line-clamp-1 sm:line-clamp-2">{item.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 sm:gap-5 lg:gap-8",
                    msg.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-slate-100",
                    msg.role === "user" ? "bg-slate-900" : "bg-emerald-600"
                  )}>
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "flex-1 min-w-0 space-y-2 sm:space-y-3",
                    msg.role === "user" ? "text-right" : ""
                  )}>
                    <div className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
                      {msg.role === "user" ? "User" : "Gafargaon AI"}
                    </div>
                    <div className={cn(
                      "inline-block max-w-full text-left",
                      msg.role === "user" 
                        ? "message-bubble-user px-4 py-3 sm:px-6 sm:py-4" 
                        : "message-bubble-model p-4 sm:p-6"
                    )}>
                      {msg.role === "user" ? (
                        <p className="text-sm sm:text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="markdown-body text-sm sm:text-base">
                          <Markdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user" || (messages[messages.length - 1]?.role === "model" && !messages[messages.length - 1]?.text)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-5 lg:gap-8"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-100">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Gafargaon AI</div>
                  <div className="message-bubble-model px-6 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="typing-dot" style={{ animationDelay: "0s" }} />
                      <div className="typing-dot" style={{ animationDelay: "0.2s" }} />
                      <div className="typing-dot" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold animate-pulse">তথ্য খোঁজা হচ্ছে...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 lg:p-10 bg-transparent relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              layout
              className="glass relative flex items-end gap-2 sm:gap-3 bg-white/90 border border-white/50 rounded-[28px] sm:rounded-[32px] p-1.5 sm:p-2 pr-2 sm:pr-3 focus-within:border-emerald-500/40 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-emerald-200/30 transition-all duration-500"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="গফরগাঁও সম্পর্কে কিছু জিজ্ঞাসা করুন..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-[15px] font-medium py-3 sm:py-4 px-4 sm:px-6 resize-none max-h-[200px] placeholder:text-slate-400 text-slate-700"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isLoading ? stopGeneration : handleSend}
                disabled={!input.trim() && !isLoading}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center flex-shrink-0 shadow-lg mb-1",
                  isLoading 
                    ? "bg-red-500 text-white shadow-red-200 hover:bg-red-600" 
                    : input.trim() 
                      ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700" 
                      : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                )}
              >
                {isLoading ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>
            </motion.div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 px-4">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gafargaon AI v1.0</span>
              <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developed By SAKIB HOSSAIN</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
