import React from 'react';
import { MSBDatabase, CONFIG } from '../utils/storage';
import { ShieldCheck, CheckCircle2, FileSpreadsheet, ExternalLink, RefreshCw } from 'lucide-react';

interface DiagnosticoModalProps {
  onCerrar: () => void;
}

export const DiagnosticoModal: React.FC<DiagnosticoModalProps> = ({ onCerrar }) => {
  const diagnostico = MSBDatabase.getDiagnostico();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0a192f] text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-5">
        
        <div className="flex items-start justify-between border-b border-[#1e3555] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Diagnóstico del Sistema MSB
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Equivalente a función Apps Script: <code className="text-amber-300">msb_diagnostico()</code>
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-full text-[#94a3b8] hover:text-white hover:bg-[#112240] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Lista de Verificaciones */}
        <div className="bg-[#061426] p-4 rounded-2xl border border-[#1e3555] space-y-2 font-mono text-xs">
          {diagnostico.details.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 py-0.5 text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Hojas de Cálculo Oficiales */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-[#d6e3ff] uppercase tracking-wider">
            Archivos Google Sheets Vinculados:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <a
              href={CONFIG.URL_MASTER_SHEET}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-emerald-950/40 hover:bg-emerald-950/70 rounded-xl border border-emerald-500/40 text-emerald-300 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-bold text-white">Base Maestra</div>
                <div className="text-[10px] text-emerald-400 font-mono truncate max-w-[150px]">
                  {CONFIG.MASTER_SPREADSHEET_ID}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </a>

            <a
              href={CONFIG.URL_RESPONSES_SHEET}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-purple-950/40 hover:bg-purple-950/70 rounded-xl border border-purple-500/40 text-purple-300 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-bold text-white">Respuestas Forms</div>
                <div className="text-[10px] text-purple-400 font-mono truncate max-w-[150px]">
                  {CONFIG.RESPONSE_SPREADSHEET_ID}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-400" />
            </a>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#1e3555]">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
