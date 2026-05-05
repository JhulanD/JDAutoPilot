import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { X, Mail, User, Clock, Tag, ExternalLink, ShieldCheck, Download, FileJson, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Lead {
  id: string;
  name?: string;
  email: string;
  source: string;
  createdAt: any;
  details?: any;
}

const AdminLeads = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportToJSON = (data: any, fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    downloadFile(jsonString, `${fileName}.json`, "application/json");
  };

  const exportToCSV = (data: Lead[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = ["ID", "Name", "Email", "Source", "Date", "Details"];
    const rows = data.map(lead => [
      lead.id,
      lead.name || "Anonymous",
      lead.email,
      lead.source,
      lead.createdAt?.toDate().toISOString() || "N/A",
      lead.details ? JSON.stringify(lead.details).replace(/"/g, '""') : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => `"${value}"`).join(","))
    ].join("\n");

    downloadFile(csvContent, `${fileName}.csv`, "text/csv");
  };

  useEffect(() => {
    if (!isOpen) return;

    const path = 'leads';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = [];
      snapshot.forEach((doc) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-white/40 backdrop-blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl bg-white border border-gray-200 rounded-3xl flex flex-col h-[85vh] overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.1)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center border border-brand-orange/20">
                <ShieldCheck className="text-brand-orange w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Intelligence Dashboard
                  <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Audit</span>
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">JDAutoPilot Internal Operations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                <button 
                  onClick={() => exportToJSON(leads, `JDAUTOPILOT_ALL_LEADS_${new Date().toISOString().split('T')[0]}`)}
                  className="px-4 py-2 text-[10px] font-black uppercase text-gray-500 hover:text-brand-orange hover:bg-white rounded-lg transition-all flex items-center gap-2"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  JSON
                </button>
                <div className="w-px h-4 bg-gray-200 self-center mx-1" />
                <button 
                  onClick={() => exportToCSV(leads, `JDAUTOPILOT_ALL_LEADS_${new Date().toISOString().split('T')[0]}`)}
                  className="px-4 py-2 text-[10px] font-black uppercase text-gray-500 hover:text-brand-orange hover:bg-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && leads.length > 0 && (
            <div className="grid grid-cols-4 border-b border-gray-100">
               <div className="p-6 border-r border-gray-100 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-gray-900">{leads.length}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Intelligence</div>
               </div>
               <div className="p-6 border-r border-gray-100 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-brand-orange">{leads.filter(l => l.source === 'roi_calculator').length}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ROI Audits</div>
               </div>
               <div className="p-6 border-r border-gray-100 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-blue-500">{leads.filter(l => l.source === 'vault_access' || l.source === 'blueprint_vault').length}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vault Leads</div>
               </div>
               <div className="p-6 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-green-500">{leads.filter(l => l.source === 'newsletter_footer').length}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Subscribers</div>
               </div>
            </div>
          )}

          {/* Leads Table */}
          <div className="flex-1 overflow-auto p-8 bg-gray-50/30">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-mono text-sm tracking-widest animate-pulse">
                SYNCING AGENTIC DATASTREAM...
              </div>
            ) : leads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm">
                   <Mail className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-bold uppercase text-xs tracking-widest">Silence on the network.</p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-3">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400">
                  <div className="col-span-1 flex justify-center">ID</div>
                  <div className="col-span-4 pl-4">Lead Identity</div>
                  <div className="col-span-3">System Source</div>
                  <div className="col-span-2">Time Delta</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                {leads.map((lead, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={lead.id}
                    className="grid grid-cols-12 gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-orange/30 hover:shadow-xl hover:shadow-brand-orange/5 transition-all items-center group relative overflow-hidden"
                  >
                    <div className="col-span-1 flex justify-center">
                       <span className="text-gray-200 font-black italic">{leads.length - idx}</span>
                    </div>
                    <div className="col-span-4 flex items-center gap-4 pl-4 border-l border-gray-100">
                      <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 group-hover:bg-brand-orange/10 group-hover:text-brand-orange group-hover:border-brand-orange/20 transition-all duration-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="max-w-[200px]">
                        <div className="text-gray-900 font-bold text-sm truncate uppercase tracking-tight">{lead.name || 'ANONYMOUS'}</div>
                        <div className="text-gray-400 text-xs truncate font-medium">{lead.email}</div>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-500 group-hover:bg-white transition-all">
                        <Tag className="w-3 h-3 text-brand-orange" />
                        {lead.source}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-gray-400 text-[11px] font-medium">
                      <Clock className="w-3.5 h-3.5 opacity-50" />
                      {lead.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) || 'QUEUED'}
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => exportToJSON(lead, `LEAD_${lead.email}_${lead.id}`)}
                        className="p-3 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100 hover:text-gray-900 transition-all"
                        title="Export JSON"
                      >
                        <FileJson className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => exportToCSV([lead], `LEAD_${lead.email}_${lead.id}`)}
                        className="p-3 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100 hover:text-gray-900 transition-all"
                        title="Export CSV"
                      >
                        <Database className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-5 border-t border-gray-100 bg-white text-[10px] uppercase font-bold text-gray-300 flex justify-between items-center px-12 tracking-widest">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
               <span>System Secure: Verified Admin Access</span>
            </div>
            <span>Protocol Intelligence: {leads.length} Unified Records</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminLeads;
