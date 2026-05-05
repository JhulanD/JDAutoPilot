import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Layout, 
  Mail, 
  Layers, 
  X, 
  User, 
  FileDown, 
  ChevronRight, 
  MonitorCheck, 
  Calendar,
  ArrowUpRight,
  Sun,
  Moon
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import Chatbot from "./components/Chatbot";
import ROICalculator from "./components/ROICalculator";

const Modal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const path = 'leads';
    
    // Optimistic success for better UX speed
    onSuccess();
    
    try {
      await addDoc(collection(db, path), {
        ...formData,
        source: 'vault_modal',
        createdAt: serverTimestamp()
      });

      // Send confirmation email via backend
      try {
        const response = await fetch('/api/send-vault-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, name: formData.name })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Vault access failed");
        console.log("Vault access email success:", data);
      } catch (err) {
        console.error("Email trigger failed:", err);
      }
    } catch (error) {
      console.error("Firestore error:", error);
      // We don't want to break the success state for the user if tracking fails
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-brand-dark border border-white/10 rounded-xl p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-brand-orange w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white tracking-tight mb-2">Claim Your Blueprints</h3>
              <p className="text-sm text-[#9CA3AF]">Access 3 custom n8n templates to automate your agency outreach and start scaling.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 block">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                  <input 
                    required
                    type="text" 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-brand-orange/50 focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 block">Your Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input 
                    required
                    type="email" 
                    placeholder="john@gmail.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-brand-orange/50 focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="cta-button w-full py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-sm transition-all duration-300 transform hover:shadow-2xl rounded-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isSubmitting ? 'PROCESSING...' : <span>SECURE ACCESS</span>}
                {!isSubmitting && <ArrowRight className="arrow-icon w-5 h-5" />}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SuccessState = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-brand-dark border border-brand-orange/30 rounded-xl p-10 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black uppercase text-white tracking-tighter mb-4">Vault Unlocked</h3>
          <p className="text-[#9CA3AF] mb-10 leading-relaxed">The n8n automation blueprints are ready for deployment. Your exclusive assets are below.</p>
          
          <div className="grid gap-4 mb-10 text-left">
            {[
              "1 - Lead Qualifier",
              "2 - Telegram Bot Powered Booking",
              "3 - Webform Automation"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-lg">
                <FileDown className="w-5 h-5 text-brand-orange" />
                <span className="text-sm font-medium text-white">{item}</span>
              </div>
            ))}
          </div>

          <a 
            href="https://www.notion.so/JDAutoPilot-3496964a0266807d8cb6f61290e02095?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button w-full py-5 bg-brand-orange text-white font-black uppercase tracking-widest text-sm transition-all duration-300 transform hover:shadow-2xl rounded-sm mb-6 flex items-center justify-center gap-3"
          >
            ENTER THE VAULT
            <ArrowRight className="arrow-icon w-5 h-5" />
          </a>

          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold">
            Close Panel
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
        const id = anchor.getAttribute('href')?.substring(1);
        if (id) {
          const element = document.getElementById(id);
          if (element) {
            e.preventDefault();
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL hash without jumping
            window.history.pushState(null, '', `#${id}`);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'newsletter'>('templates');

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [heroVariant, setHeroVariant] = useState<number>(0);

  const HERO_VARIANTS = [
    <>Blueprint for <br/><span className="text-brand-orange">Agentic Workflows.</span></>,
    <>Scale Your Agency <br/><span className="text-brand-orange">With AI Systems.</span></>,
    <>Automate Your Growth <br/><span className="text-brand-orange">While You Sleep.</span></>,
    <>Precision Systems for <br/><span className="text-brand-orange">Elite Agencies.</span></>
  ];

  useEffect(() => {
    // A/B Testing logic
    const savedVariant = localStorage.getItem('hero_variant');
    if (savedVariant !== null) {
      setHeroVariant(parseInt(savedVariant, 10));
    } else {
      const randomVariant = Math.floor(Math.random() * HERO_VARIANTS.length);
      localStorage.setItem('hero_variant', randomVariant.toString());
      setHeroVariant(randomVariant);
      
      // Potential tracking hook
      console.log(`[AB TEST] Assigned headline variant ${randomVariant}`);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const heroImage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
        label: "Morning Protocol Active"
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
        label: "Mid-Day Peak Cycle"
      };
    }
    if (hour >= 18 && hour < 22) {
      return {
        url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
        label: "Evening Optimization"
      };
    }
    return {
      url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
      label: "Night Ops Mode"
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    const path = 'leads';
    try {
      await addDoc(collection(db, path), {
        email: newsletterEmail,
        source: 'newsletter_footer',
        createdAt: serverTimestamp()
      });

      // Send confirmation email via backend
      try {
        const res = await fetch('/api/send-vault-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newsletterEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Newsletter email failed");
        console.log("Newsletter email success:", data);
      } catch (err) {
        console.error("Email trigger failed:", err);
      }

      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleVaultAccess = () => setIsModalOpen(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const slideUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      } 
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-[#F3F4F6] font-sans selection:bg-brand-orange/30 selection:text-brand-orange hero-mask relative overflow-x-hidden">
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); setIsSuccess(true); }}
      />
      <SuccessState isOpen={isSuccess} onClose={() => setIsSuccess(false)} />

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-brand-dark/90 backdrop-blur-md h-20">
        <div className="max-w-7xl mx-auto px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tighter uppercase transition-transform hover:scale-105 duration-300">
              JD<span className="text-brand-orange">AutoPilot</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CA3AF]">
            <a href="#templates" className="hover:text-white transition-colors font-bold uppercase tracking-widest text-[12px]">Free Templates</a>
            <a href="#newsletter" className="hover:text-white transition-colors font-bold uppercase tracking-widest text-[12px]">Newsletter</a>
            <a href="#audit" className="hover:text-brand-orange transition-colors font-bold uppercase tracking-widest text-[12px] bg-brand-orange/10 px-3 py-1 rounded border border-brand-orange/20">Free Growth Audit</a>
            <div className="h-5 w-[1px] bg-white/10 mx-2"></div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-white/5 transition-colors text-white"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-brand-dark" />}
            </button>
            <span className="text-white text-[12px] font-bold uppercase tracking-widest opacity-80 underline decoration-brand-orange decoration-2 underline-offset-4">Elite AI Consultancy</span>
          </div>
        </div>
      </nav>      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="pt-40 pb-20 px-12 max-w-7xl mx-auto min-h-[calc(100vh-96px)] flex items-center"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-[84px] font-normal leading-[0.9] tracking-tighter mb-8 uppercase text-white drop-shadow-2xl">
              {HERO_VARIANTS[heroVariant]}
            </motion.h1>
            <motion.div variants={itemVariants} className="mb-12 space-y-4 max-w-lg">
              <div className="flex items-center gap-3 text-[#9CA3AF] text-xl font-light leading-tight">
                <Layers className="w-5 h-5 text-brand-orange shrink-0" />
                <span>Not prompts—systems.</span>
              </div>
              <div className="flex items-start gap-3 text-[#9CA3AF] text-xl font-light leading-tight">
                <Zap className="w-5 h-5 text-brand-orange shrink-0 mt-1" />
                <span>Use battle-tested templates to automate growth across marketing, sales, and operations.</span>
              </div>
              <div className="flex items-center gap-3 text-[#9CA3AF] text-xl font-light leading-tight">
                <Calendar className="w-5 h-5 text-brand-orange shrink-0" />
                <span>Updated weekly so you’re always one step ahead.</span>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8 items-center">
              <button 
                onClick={handleVaultAccess}
                className="cta-button bg-brand-orange text-white font-bold py-5 px-10 rounded-sm tracking-tight text-sm uppercase transition-all duration-300 transform hover:shadow-2xl flex items-center gap-3 group"
              >
                Access the Vault
                <ArrowRight className="arrow-icon w-5 h-5" />
              </button>
              
              <div className="flex items-center -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/100/100`}
                    className="w-10 h-10 rounded-full border-2 border-brand-dark"
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="pl-6 text-[10px] font-bold text-gray-500 uppercase flex flex-col">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-brand-orange text-xs leading-none">★</span>)}
                  </div>
                  Join 1,200+ elite founders
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            variants={itemVariants} 
            className="relative group w-full lg:h-full lg:flex lg:items-center lg:justify-end"
          >
            <div className="absolute -inset-6 bg-brand-orange/15 rounded-3xl blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <motion.div 
              className="relative w-full aspect-square lg:h-full lg:max-h-[600px] rounded-2xl overflow-hidden border border-white/10 vault-glow"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.img 
                src={heroImage.url} 
                className="w-full h-full object-cover" 
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
                alt="JDAutoPilot Lead Magnet"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                <div className="w-12 h-1 bg-brand-orange mb-3"></div>
                <div className="text-white font-black text-2xl uppercase tracking-tighter">{heroImage.label}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <ROICalculator />

      {/* Magnet Sections - Stay Ahead */}
      <section className="py-32 bg-brand-dark/50" id="templates">
        <div className="max-w-7xl mx-auto px-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[72px] font-normal leading-[75px] tracking-tighter uppercase mb-16 text-white"
          >
            Stay Ahead with Weekly <span className="text-brand-orange">AI Updates</span> <br/>& New Automation Templates.
          </motion.h2>

          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-md mb-8 max-w-md mx-auto">
              <button 
                onClick={() => setActiveTab('templates')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${activeTab === 'templates' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Free Templates
              </button>
              <button 
                disabled
                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all text-gray-500/40 cursor-not-allowed relative group"
              >
                <span className="group-hover:opacity-0 transition-opacity">AI Newsletter</span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black tracking-tighter text-brand-orange">Coming Soon</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeTab === 'templates' ? (
                  <motion.div 
                    key="templates"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="grid md:grid-cols-2 gap-8 items-center bg-[#15171d] border border-white/10 rounded-xl p-4 md:p-12 text-left"
                  >
                    <div>
                      <motion.h3 variants={slideUpVariants} className="text-3xl font-black uppercase text-white mb-6">Template Library</motion.h3>
                      <motion.p variants={slideUpVariants} className="text-[#9CA3AF] mb-8 leading-relaxed italic">Ready-to-deploy logic for high-intensity agency operations. No coding required.</motion.p>
                      <motion.ul 
                        variants={staggerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-4 mb-10 text-sm"
                      >
                        {[
                          "Lead Scraping Automation",
                          "Personalized Video Outreach",
                          "Multi-Channel Reply Detection",
                          "Slack Lead Instant Alerts"
                        ].map((item, idx) => (
                          <motion.li key={idx} variants={slideUpVariants} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-brand-orange" /> {item}
                          </motion.li>
                        ))}
                      </motion.ul>
                      <motion.button 
                         variants={slideUpVariants}
                         onClick={handleVaultAccess}
                         className="cta-button bg-brand-orange text-white py-4 px-8 rounded-sm font-bold uppercase tracking-widest text-sm transition-all duration-300 transform hover:shadow-2xl flex items-center gap-3"
                      >
                        Browse all templates
                        <ArrowRight className="arrow-icon w-5 h-5" />
                      </motion.button>
                    </div>
                    <div className="bg-brand-dark/50 border border-white/5 rounded-lg p-8 aspect-video flex items-center justify-center relative overflow-hidden">
                       <Layout className="w-32 h-32 text-brand-orange/10 absolute -rotate-12" />
                       <div className="relative z-10 grid grid-cols-2 gap-4 w-full">
                          <div className="h-24 bg-white/5 rounded border border-white/10 overflow-hidden relative group/chamber">
                            <img src="https://images.unsplash.com/photo-1551288049-bbbda536339a?w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-70 filter grayscale group-hover/chamber:grayscale-0 group-hover/chamber:opacity-100 transition-all duration-700" alt="Bot Logic Workflow" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 group-hover/chamber:bg-transparent transition-colors duration-500"></div>
                          </div>
                          <div className="h-24 bg-white/5 rounded border border-white/10 overflow-hidden relative group/chamber">
                            <img src="https://images.unsplash.com/photo-1586282391129-59a998fd034c?w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-70 filter grayscale group-hover/chamber:grayscale-0 group-hover/chamber:opacity-100 transition-all duration-700" alt="Process Flow Diagram" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 group-hover/chamber:bg-transparent transition-colors duration-500"></div>
                          </div>
                          <div className="h-24 bg-white/10 rounded border border-brand-orange/30 overflow-hidden relative group/chamber">
                            <img src="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-80 filter grayscale group-hover/chamber:grayscale-0 group-hover/chamber:opacity-100 transition-all duration-700" alt="Nodal Automation" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-brand-orange/5 group-hover/chamber:bg-transparent transition-colors duration-500"></div>
                          </div>
                          <div className="h-24 bg-white/5 rounded border border-white/10 overflow-hidden relative group/chamber">
                            <img src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-70 filter grayscale group-hover/chamber:grayscale-0 group-hover/chamber:opacity-100 transition-all duration-700" alt="Technical Integration" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 group-hover/chamber:bg-transparent transition-colors duration-500"></div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="newsletter"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="grid md:grid-cols-2 gap-8 items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 md:p-12 text-left text-white"
                  >
                    <div>
                      <motion.h3 variants={slideUpVariants} className="text-3xl font-black uppercase mb-6">JD AI Newsletter</motion.h3>
                      <motion.p variants={slideUpVariants} className="text-gray-400 mb-8 leading-relaxed font-medium">Every week, we drop actionable AI insights, new plug-and-play automations, and behind-the-scenes looks at how top level teams scale.</motion.p>
                      <motion.ul 
                        variants={staggerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-4 mb-10 text-sm font-bold"
                      >
                        {[
                          "Actionable Business Insights",
                          "Stay Ahead of the Curve",
                          "Instant Access to New Templates"
                        ].map((item, idx) => (
                          <motion.li key={idx} variants={slideUpVariants} className="flex items-center gap-3">
                            <MonitorCheck className="w-5 h-5 text-brand-orange" /> {item}
                          </motion.li>
                        ))}
                      </motion.ul>
                      <motion.a 
                         variants={slideUpVariants}
                         href="#newsletter" 
                         className="cta-button bg-brand-orange text-white py-4 px-8 rounded-sm font-bold uppercase tracking-widest text-sm flex items-center gap-3 shadow-lg transition-all transform hover:shadow-lg w-fit"
                      >
                        Sign up for free
                        <ArrowRight className="arrow-icon w-5 h-5" />
                      </motion.a>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 flex flex-col justify-between aspect-[4/3] border border-white/10 shadow-xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 blur-3xl"></div>
                       <div className="w-full h-full border-2 border-white/10 border-dashed rounded-md flex items-center justify-center p-8 relative z-10">
                          <div className="text-center">
                            <Mail className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Next Drop: Monday 09:00 AM</div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Build? Section (Audit CTA) */}
      <section id="audit" className="py-32 px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-20 grid lg:grid-cols-2 gap-16 items-center overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-orange/10 blur-[120px] -ml-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-6 leading-none">Ready to Build Yours? <br/><span className="text-brand-orange">Start Now.</span></h2>
            <p className="text-gray-400 text-xl font-medium leading-relaxed mb-10 max-w-md">
              You don’t need to hire. <br/>
              You don’t need to raise. <br/>
              You need leverage. <br/><br/>
              JDAutoPilot gives you the tools, playbooks, and growth systems to go from idea → execution → revenue — fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://cal.com/jdautopilot/15min"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button bg-brand-orange text-white font-bold py-5 px-10 rounded-sm tracking-tight text-sm uppercase flex items-center gap-3 transition-all duration-300 transform hover:shadow-2xl group"
              >
                Book Custom Audit <ArrowRight className="arrow-icon w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px] aspect-[1/1.4] bg-white rounded-lg shadow-[20px_20px_80px_rgba(0,0,0,0.15)] overflow-hidden transform rotate-6 border-[20px] border-white">
              <div className="h-full w-full bg-gradient-to-br from-[#1e222a] via-[#15171d] to-black p-8 flex flex-col justify-between text-white border-l-[10px] border-brand-orange/40 relative">
                <div className="flex justify-between items-start">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-orange">JDAutoPilot</div>
                  <div className="px-2 py-1 bg-white text-black font-black text-[10px] rounded-sm uppercase flex items-center gap-1 shadow-md">
                     <Zap className="w-3 h-3 text-brand-orange" /> Free
                  </div>
                </div>
                <div>
                   <h4 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">The Ultimate Pack</h4>
                   <p className="text-[10px] uppercase font-bold text-gray-400">14+ AI Agents for sales & marketing</p>
                </div>
                <div className="grid grid-cols-4 gap-2 opacity-80">
                   {[
                     { name: 'n8n', color: 'bg-red-500' },
                     { name: 'M.', color: 'bg-indigo-600' },
                     { name: 'OA', color: 'bg-emerald-600' },
                     { name: 'CL', color: 'bg-amber-700' },
                     { name: 'SL', color: 'bg-sky-400' },
                     { name: 'ZP', color: 'bg-orange-600' },
                     { name: 'NT', color: 'bg-white text-black' },
                     { name: 'AT', color: 'bg-blue-600' }
                   ].map((tool, i) => (
                     <div key={i} className={`h-6 w-6 ${tool.color} rounded flex items-center justify-center text-[7px] font-black tracking-tighter ${tool.name !== 'NT' ? 'text-white' : ''}`}>{tool.name}</div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Newsletter / CTA Footer Section */}
      <section id="newsletter" className="pt-[160px] pb-[160px] pl-[61px] pr-12 border-t border-white/5 bg-gradient-to-b from-brand-dark to-black overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-5xl md:text-[80px] mb-6 tracking-tighter font-normal text-white uppercase">JOIN THE <span className="text-brand-orange underline decoration-brand-orange/40">ELITE.</span></h2>
            <p className="text-[#9CA3AF] text-[24px] font-light leading-relaxed max-w-2xl mx-auto">
              Every Monday, we drop one high-impact automation tactic that saved our clients 20+ hours a week. No fluff. Just logic.
            </p>
          </motion.div>
          <motion.form
            onSubmit={handleNewsletterSubmit}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto p-1 bg-white/5 backdrop-blur-md rounded-md border border-white/10 focus-within:border-brand-orange/50 transition-all focus-within:ring-4 focus-within:ring-brand-orange/10"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input 
                required
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter Your Email" 
                className="w-full bg-transparent py-4 pl-12 pr-4 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubscribed}
              className={`cta-button font-black px-10 py-4 rounded-sm transition-all duration-300 transform hover:shadow-2xl flex items-center gap-3 whitespace-nowrap text-sm ${isSubscribed ? 'bg-green-500 text-white' : 'bg-brand-orange text-white'}`}
            >
              {isSubscribed ? 'INTEL SECURED' : <span>GET INTEL</span>}
              {!isSubscribed && <ArrowRight className="arrow-icon w-5 h-5" />}
            </button>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800/20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
          <div>© 2026 JDAUTOPILOT. ALL SYSTEMS GO.</div>
          <div className="flex gap-8">
            <a href="https://x.com/JDAutoPilot" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">Twitter</a>
            <a href="https://www.linkedin.com/in/jhulandey/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">LinkedIn</a>
            <a href="mailto:jhulandey.ai@gmail.com" className="hover:text-brand-orange transition-colors">Contact</a>
          </div>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
}
