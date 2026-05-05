import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GREETINGS = [
  "Welcome to JDAutoPilot. How can I help you automate your growth today?",
  "Ready to supercharge your agency with AI? I'm here to guide you.",
  "Hi! I'm your AI growth consultant. What part of your business shall we automate first?",
  "JDAutoPilot here. Let's build the future of your agency together. Ask me anything!",
  "Excited to help you scale! Want to see how our AI agents can save you 20+ hours a week?"
];

const ERRORS = [
  "My digital brain just had a minor glitch. Could you try asking that again?",
  "Technical hiccup! Give me another moment and try once more.",
  "Even AI gets tired sometimes. Let's try that request again, friend.",
  "Routing error in the cloud. Mind repeating that for me?"
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with a random greeting
  useEffect(() => {
    if (messages.length === 0) {
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setMessages([{ role: "model", text: randomGreeting }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Create fresh instance for every call
      const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      
      const response = await localAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, { role: "user", text: userMessage }].map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are a charismatic and high-energy AI Automation Assistant for JDAutoPilot. Your mission is to show users how AI can explode their agency's productivity and revenue. \n\nGuidelines:\n1. Be varied in your approach—sometimes focus on time-saving, other times on scalability or technical edge.\n2. Always mention the 'Agency AI Growth Vault' as the ultimate treasure trove for templates.\n3. If someone says 'hello' or 'hi', reply with a punchy, unique greeting and ask a specific question about their agency.\n4. Keep responses concise but impactful. \n5. Use tech-forward language but keep it accessible.",
        }
      });

      const modelText = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: "model", text: modelText }]);
    } catch (error) {
      console.error("Chat error:", error);
      const randomError = ERRORS[Math.floor(Math.random() * ERRORS.length)];
      setMessages(prev => [...prev, { role: "model", text: randomError }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-brand-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-brand-orange/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">AI Consultant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-brand-orange text-white rounded-tr-none' 
                      : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5">
                    <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about AI automation..."
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-brand-orange/50 transition-all font-sans"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-orange hover:text-white transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-orange/20 hover:scale-110 active:scale-95 transition-all duration-300 relative group"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white border-2 border-brand-orange rounded-full animate-bounce"></div>
        )}
      </button>
    </div>
  );
}
