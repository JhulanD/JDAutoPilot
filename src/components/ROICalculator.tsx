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
import autoTable from "jspdf-autotable";
import { GoogleGenAI } from "@google/genai";
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
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

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

  const generatePDF = (isDownload = false, customAiAnalysis?: any) => {
    const doc = new jsPDF() as any;
    const brandColor: [number, number, number] = [255, 77, 0]; // Brand Orange #ff4d00
    const analysis = customAiAnalysis || aiAnalysis;

    // --- PAGE 1: EXECUTIVE SUMMARY ---
    // Header
    doc.setFillColor(21, 23, 29); // Brand Dark
    doc.rect(0, 0, 210, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("JDAutoPilot - ROI Report", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const preparedBy = `Confidential | Prepared For: ${name ? name : "Valued Agency Owner"} (${email})`;
    doc.text(preparedBy, 20, 38);

    // Context / Intro
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PHASE 1: CURRENT SYSTEM EFFICIENCY AUDIT", 20, 60);

    autoTable(doc, {
      startY: 65,
      head: [["SYSTEM METRIC", "CURRENT STATE"]],
      body: [
        ["AGENCY TEAM SIZE", `${metrics.teamSize} PROFESSIONALS`],
        ["AVERAGE BILLABLE RATE", `$${metrics.hourlyRate}/HR`],
        ["ADMIN/MANUAL OVERHEAD", `${metrics.manualHoursPerPerson} HOURS/PERSON/MONTH`],
        ["ACTIVE CLIENT LOAD", `${metrics.clientCount} CLIENTS`]
      ],
      headStyles: { fillColor: brandColor, fontSize: 10, cellPadding: 5 },
      bodyStyles: { fontSize: 10, cellPadding: 5 },
      theme: "striped"
    });

    const impactY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("PHASE 2: PROJECTED AUTOMATION LEVERAGE", 20, impactY);

    autoTable(doc, {
      startY: impactY + 5,
      head: [["OUTPUT VARIABLE", "PROJECTED GROWTH"]],
      body: [
        ["MONTHLY HOURS RECOVERED", `${results.hoursSaved} HOURS`],
        ["MONTHLY COST REDUCTION", `$${results.monthlySavings.toLocaleString()}`],
        ["ANNUAL PROFIT INCREASE", `$${results.annualSavings.toLocaleString()}`],
        ["NET SYSTEM ROI", `${results.roi}%`]
      ],
      headStyles: { fillColor: [40, 40, 40], fontSize: 10, cellPadding: 5 },
      bodyStyles: { fontSize: 10, cellPadding: 5, fontStyle: 'bold' },
      theme: "grid"
    });

    // Strategy Note (Page 1 bottom)
    const noteY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const strategyNote = "The metrics above indicate a system-wide vulnerability to manual friction. Without structural automation, your agency scales by increasing overhead, effectively capping your profit margins.";
    const splitNote = doc.splitTextToSize(strategyNote, 170);
    doc.text(splitNote, 20, noteY);

    // --- PAGE 2: THE VULNERABILITY (PAIN & AGITATION) ---
    doc.addPage();
    doc.setFillColor(21, 23, 29);
    doc.rect(0, 0, 210, 20, "F");
    
    doc.setTextColor(255, 77, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("VULNERABILITY ASSESSMENT & RISK ANALYSIS", 20, 13);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text("SECTION A: CORE FRICTION POINTS", 20, 40);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const painText = analysis?.pain || `Your agency is currently suffering from massive profit leakage, with ${metrics.teamSize} team members losing ${metrics.manualHoursPerPerson} hours each per month to manual, non-billable labor. This equates to an annual drain of $${results.annualSavings.toLocaleString()} in potential revenue.`;
    
    const renderParagraph = (text: string, startY: number) => {
      const sentences = text.split('. ').filter(s => s.trim().length > 0);
      let currentY = startY;
      sentences.forEach((sentence) => {
        const cleanSentence = sentence.trim().endsWith('.') ? sentence.trim() : sentence.trim() + '.';
        const lines = doc.splitTextToSize(cleanSentence, 170);
        
        if (cleanSentence.includes('$')) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        
        doc.text(lines, 20, currentY);
        currentY += (lines.length * 5) + 6;
      });
      return currentY;
    };

    const nextSectionY = renderParagraph(painText, 48);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const agitationTitleY = Math.max(nextSectionY + 10, 110);
    doc.text("SECTION B: THE COST OF INACTION", 20, agitationTitleY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const agitateText = analysis?.agitation || "Delaying the deployment of automated infrastructure is costing you valuable hours and profit daily. While competitors automate delivery, you are paying high-level talent to perform low-level administrative tasks.";
    const agitateEndY = renderParagraph(agitateText, agitationTitleY + 8);
    
    // Visual divider
    doc.setDrawColor(255, 77, 0);
    doc.setLineWidth(0.5);
    const dividerY = Math.max(agitateEndY + 10, 185);
    doc.line(20, dividerY, 190, dividerY);

    doc.setFont("helvetica", "bold");
    doc.text("ANNUAL OPPORTUNITY COST:", 20, dividerY + 10);
    doc.setFontSize(22);
    doc.setTextColor(255, 77, 0);
    doc.text(`$${results.annualSavings.toLocaleString()}`, 20, dividerY + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`EQUATING TO approx. $${(results.annualSavings / 365).toFixed(2)} / DAY IN LOST LEVERAGE`, 20, dividerY + 28);

    // --- PAGE 3: THE PROTOCOL (SOLUTION & ROADMAP) ---
    doc.addPage();
    doc.setFillColor(21, 23, 29);
    doc.rect(0, 0, 210, 20, "F");
    
    doc.setTextColor(255, 77, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DEPLOYMENT PROTOCOL: AUTOMATION ROADMAP", 20, 13);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text("STRATEGIC SOLUTION & SYSTEM ARCHITECTURE", 20, 40);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const solutionText = analysis?.solution || "We propose a multi-layered automation stack designed to remove the bottleneck of manual client reporting and project management.";
    renderParagraph(solutionText, 48);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("IMMEDIATE DEPLOYMENT STEPS", 20, 140);

    autoTable(doc, {
      startY: 145,
      head: [["ID", "ACTION ITEM", "PRIORITY"]],
      body: [
        ["01", "ELIMINATE MANUAL DATA EXTRACTION", "CRITICAL"],
        ["02", "DEPLOY AUTO-CLIENT REPORTING V1", "HIGH"],
        ["03", "CENTRALIZE SYSTEM OPERATING LOGIC", "HIGH"],
        ["04", "SCALABLE WORKFLOW REPLICATION", "MEDIUM"]
      ],
      headStyles: { fillColor: brandColor, fontSize: 10 },
      theme: "striped"
    });

    // Final CTA Box
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFillColor(255, 77, 0);
    doc.rect(20, finalY, 170, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AUTHORIZE FULL SYSTEM AUDIT", 30, finalY + 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Lock in these profit increases with a detailed technical deep dive.", 30, finalY + 25);
    doc.textWithLink("BOOK A PERSONALIZED GROWTH AUDIT ->", 30, finalY + 38, { url: "https://cal.com/jdautopilot/15min" });

    // Footer on last page
    doc.setFillColor(21, 23, 29);
    doc.rect(0, 277, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("JDAutoPilot - Scale with Logic. Not Headcount.", 105, 288, { align: "center" });

    if (isDownload) {
      doc.save(`JDAUTOPILOT-ROIREPORT-${email || "PREVIEW"}.pdf`);
    }

    return doc.output("datauristring");
  };

  const handleFullReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const path = 'leads';
    try {
      // Step 1: Generate AI Intelligence (Gemini)
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = `
        Act as a top-tier Agency Automation Consultant (JDAutoPilot). 
        Analyze these agency metrics:
        Team Size: ${metrics.teamSize}
        Hourly Rate: $${metrics.hourlyRate}
        Manual Hours/Person: ${metrics.manualHoursPerPerson}
        Client Count: ${metrics.clientCount}
        Projected Savings: $${results.annualSavings}/year
        
        Using the PAS (Pain, Agitate, Solution) framework, write a 3-part strategic analysis for a professional ROI report.
        
        Part 1 (Currently Losing): Focus on the burnout and profit leakage of $${results.annualSavings.toLocaleString()} annual profit drain. Explain how manual labor is a hidden tax on their growth.
        Part 2 (The Escalation): Explain exactly why growing without automation is a dangerous trap. Talk about how every new client currently makes the agency MORE fragile.
        Part 3 (The Protocol): Describe a sophisticated automation solution where systems handle the admin so the team can focus on strategy.
        
        CRITICAL: Each part should consist of 3-4 clear, impactful sentences. Each sentence should stand alone as a powerful statement. Mention the specific annual savings of $${results.annualSavings.toLocaleString()} in the analysis.
        
        Return ONLY a JSON object:
        {
          "pain": "...",
          "agitation": "...",
          "solution": "..."
        }
      `;

      let reportAnalysis = {
        pain: "Critical system friction detected. Manual scaling is capping profit margins.",
        agitation: "Opportunity cost is growing daily. Your team is spending high-value time on repetitive admin tasks.",
        solution: "Immediate deployment of automated data bridges and client reporting protocols is required."
      };

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        reportAnalysis = JSON.parse(text);
        setAiAnalysis(reportAnalysis);
      } catch (aiErr) {
        console.error("Gemini AI Report gen failed, using fallback:", aiErr);
      }

      // Step 2: Build PDF with IA
      const pdfDataUri = generatePDF(false, reportAnalysis);

      // Step 3: Store Lead
      await addDoc(collection(db, path), {
        name,
        email,
        source: 'roi_calculator',
        details: {
          metrics,
          results,
          aiAnalysis: reportAnalysis
        },
        createdAt: serverTimestamp()
      });
      
      // Step 4: Dispatch via backend
      try {
        await fetch('/api/roi-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, metrics, results, pdf: pdfDataUri })
        });
      } catch (err) {
        console.error("ROI report email dispatch failed:", err);
      }

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
                  <form onSubmit={handleFullReport} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input 
                          required
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name" 
                          className="w-full bg-black/40 border border-white/10 text-white p-4 pl-12 rounded-sm focus:outline-none focus:border-brand-orange transition-colors"
                        />
                      </div>
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
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="cta-button w-full bg-brand-orange text-white font-black px-8 py-5 rounded-sm flex items-center justify-center gap-3 transition-all transform disabled:opacity-50 group text-sm uppercase"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <>GENERATE & SEND FULL REPORT <ArrowRight className="arrow-icon w-5 h-5" /></>}
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
