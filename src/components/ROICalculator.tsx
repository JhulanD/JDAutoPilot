import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  Download,
  Mail,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function ROICalculator() {
  const [metrics, setMetrics] = useState({
    teamSize: 5,
    hourlyRate: 50,
    manualHoursPerPerson: 20,
    clientCount: 10
  });

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const results = useMemo(() => {
    const totalManualHours = metrics.teamSize * metrics.manualHoursPerPerson;
    const currentMonthlyCost = totalManualHours * metrics.hourlyRate;
    
    // AI Efficiency: We assume 70% of manual tasks can be automated
    const automationPotential = 0.7;
    const hoursSaved = totalManualHours * automationPotential;
    const monthlySavings = currentMonthlyCost * automationPotential;
    const annualSavings = monthlySavings * 12;
    
    // Service Cost (JDAutoPilot avg estimated)
    const serviceCost = 2500; 
    const roiPercentage = ((monthlySavings - serviceCost) / serviceCost) * 100;

    return {
      hoursSaved: Math.round(hoursSaved),
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      roi: Math.round(roiPercentage)
    };
  }, [metrics]);

  const generatePDF = (isDownload = false) => {
    const doc = new jsPDF() as any;
    const brandColor = [255, 77, 0]; // Brand Orange #ff4d00

    // Header
    doc.setFillColor(21, 23, 29); // Brand Dark
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("JDAUTOPILOT ROI REPORT", 20, 25);
    
    doc.setFontSize(10);
    doc.text("PREPARED FOR: " + (email || "A VALUED AGENCY OWNER"), 20, 35);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("PHASE 1: AUTOMATION POTENTIAL", 20, 60);
    
    doc.autoTable({
      startY: 65,
      head: [["METRIC", "CURRENT VALUE"]],
      body: [
        ["TEAM SIZE", metrics.teamSize],
        ["AVG HOURLY RATE", `$${metrics.hourlyRate}/HR`],
        ["MANUAL HOURS / PERSON", `${metrics.manualHoursPerPerson}HRS`],
        ["TOTAL CLIENTS", metrics.clientCount]
      ],
      headStyles: { fillColor: brandColor },
      theme: "striped"
    });

    // Results Section
    const nextY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text("PHASE 2: PROJECTED IMPACT", 20, nextY);

    doc.autoTable({
      startY: nextY + 5,
      head: [["PROJECTED OUTCOME", "IMPACT"]],
      body: [
        ["MONTHLY HOURS RECOVERY", `${results.hoursSaved} HOURS`],
        ["MONTHLY COST REDUCTION", `$${results.monthlySavings.toLocaleString()}`],
        ["ANNUAL PROFIT INCREASE", `$${results.annualSavings.toLocaleString()}`],
        ["ROI PROJECTION", `${results.roi}%`]
      ],
      headStyles: { fillColor: brandColor },
      theme: "grid"
    });

    // Call to Action
    const ctaY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFillColor(255, 77, 0);
    doc.rect(20, ctaY, 170, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("READY TO EXECUTE THIS DEPLOYMENT?", 30, ctaY + 15);
    doc.setFontSize(10);
    doc.text("Book a custom systems audit to lock in these calculations.", 30, ctaY + 25);
    
    doc.setTextColor(255, 255, 255);
    doc.textWithLink("BOOK AUDIT NOW ->", 30, ctaY + 35, { url: "https://cal.com/jdautopilot/15min" });

    if (isDownload) {
      doc.save(`ROI-Report-${email || "preview"}.pdf`);
    }

    return doc.output("datauristring");
  };

  const handleFullReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app we might store the PDF or just the lead data
    const path = 'leads';
    try {
      const pdfDataUri = generatePDF(false);

      await addDoc(collection(db, path), {
        email,
        source: 'roi_calculator',
        details: {
          metrics,
          results
        },
        createdAt: serverTimestamp()
      });
      
      // Trigger emails via backend
      fetch('/api/roi-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, metrics, results, pdf: pdfDataUri })
      }).catch(err => console.error("ROI report email failed:", err));

      fetch('/api/send-vault-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch(err => console.error("Vault access email failed:", err));

      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="roi-calculator" className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-[72px] font-normal leading-[75px] uppercase tracking-tighter text-white mb-6">
            CALCULATE YOUR <span className="text-brand-orange underline decoration-brand-orange/30">ROI.</span>
          </h2>
          <p className="text-gray-400 text-lg uppercase tracking-widest font-bold">Stop leaking profit to manual labor.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Inputs */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-sm space-y-8"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-brand-orange flex items-center justify-center rounded-sm">
                  <Calculator className="text-white w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Metrics</h3>
              </div>

              {/* Team Size Slider */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-gray-500">
                  <span className="flex items-center gap-2 text-gray-400"><Users className="w-3.5 h-3.5" /> Team Size</span>
                  <span className="text-white font-black">{metrics.teamSize} PEOPLE</span>
                </div>
                <input 
                  type="range" min="1" max="50" 
                  value={metrics.teamSize} 
                  onChange={(e) => setMetrics({...metrics, teamSize: parseInt(e.target.value)})}
                  className="w-full accent-brand-orange h-1.5 bg-white/10 rounded-full cursor-pointer"
                />
              </div>

              {/* Hourly Rate */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-gray-500">
                  <span className="flex items-center gap-2 text-gray-400"><DollarSign className="w-3.5 h-3.5" /> Avg. Hourly Rate</span>
                  <span className="text-white font-black">${metrics.hourlyRate}/HR</span>
                </div>
                <input 
                  type="range" min="20" max="250" step="5"
                  value={metrics.hourlyRate} 
                  onChange={(e) => setMetrics({...metrics, hourlyRate: parseInt(e.target.value)})}
                  className="w-full accent-brand-orange h-1.5 bg-white/10 rounded-full cursor-pointer"
                />
              </div>

              {/* Manual Hours */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-gray-500">
                  <span className="flex items-center gap-2 text-gray-400"><Clock className="w-3.5 h-3.5" /> Manual Hours / Month</span>
                  <span className="text-white font-black">{metrics.manualHoursPerPerson} HRS</span>
                </div>
                <input 
                  type="range" min="5" max="80" 
                  value={metrics.manualHoursPerPerson} 
                  onChange={(e) => setMetrics({...metrics, manualHoursPerPerson: parseInt(e.target.value)})}
                  className="w-full accent-brand-orange h-1.5 bg-white/10 rounded-full cursor-pointer"
                />
              </div>

              {/* Client Count */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-gray-500">
                   <span className="flex items-center gap-2 text-gray-400"><TrendingUp className="w-3.5 h-3.5" /> Total Clients</span>
                   <span className="text-white font-black">{metrics.clientCount} CLIENTS</span>
                </div>
                <input 
                  type="range" min="1" max="100" 
                  value={metrics.clientCount} 
                  onChange={(e) => setMetrics({...metrics, clientCount: parseInt(e.target.value)})}
                  className="w-full accent-brand-orange h-1.5 bg-white/10 rounded-full cursor-pointer"
                />
              </div>
            </div>
          </motion.div>

          {/* Results Display */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <div className="bg-brand-orange p-8 rounded-sm text-white">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Monthly Savings</div>
                 <div className="text-4xl font-black tracking-tighter">${results.monthlySavings.toLocaleString()}</div>
                 <div className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-50">+ Based on 70% Automation</div>
              </div>
              <div className="bg-white p-8 rounded-sm text-black">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-500">Annual Profit Increase</div>
                 <div className="text-4xl font-black tracking-tighter">${results.annualSavings.toLocaleString()}</div>
                 <div className="text-[10px] mt-2 font-bold uppercase tracking-widest text-brand-orange underline underline-offset-4 decoration-2">Net Gain Potential</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-sm text-white">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-gray-500">Hours Recovered / Month</div>
                 <div className="text-3xl font-black tracking-tighter text-brand-orange">{results.hoursSaved} HRS</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-sm text-white">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-gray-500">Projected Automation ROI</div>
                 <div className="text-3xl font-black tracking-tighter">{results.roi}%</div>
              </div>
            </motion.div>

            {/* Email Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-brand-orange/20 to-transparent border border-brand-orange/30 p-10 rounded-sm relative overflow-hidden"
            >
              {isSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-white w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Protocol Successful</h4>
                  <p className="text-gray-400 text-sm mb-8">Deploying PDF report to {email} now.</p>
                  <button 
                    onClick={() => generatePDF(true)}
                    className="cta-button flex items-center gap-3 mx-auto bg-white text-black font-extrabold px-8 py-4 rounded-sm transition-transform uppercase tracking-widest text-sm"
                  >
                    <Download className="arrow-icon w-4 h-4" /> Download Now
                  </button>
                </div>
              ) : (
                <>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Secure Full Intelligence Report</h4>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    We'll generate a 5-page PDF deep dive showing your exact automation roadmap and cost-saving breakdown.
                  </p>
                  <form onSubmit={handleFullReport} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your Email" 
                        className="w-full bg-black/40 border border-white/10 text-white p-4 pl-12 rounded-sm focus:outline-none focus:border-brand-orange transition-colors"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="cta-button bg-brand-orange text-white font-black px-8 py-4 rounded-sm flex items-center justify-center gap-3 transition-all transform disabled:opacity-50 group text-sm"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <>GET REPORT <ArrowRight className="arrow-icon w-5 h-5" /></>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
