import React from 'react';
import { CONFIG } from '../utils/storage';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Award, 
  X, 
  KeyRound, 
  Users, 
  Building2, 
  Check
} from 'lucide-react';

interface PrivacidadISOModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export const PrivacidadISOModal: React.FC<PrivacidadISOModalProps> = ({ abierto, onCerrar }) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0a192f] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] my-6 max-h-[92vh] overflow-y-auto space-y-6">
        
        {/* Encabezado con sello ISO */}
        <div className="flex items-start justify-between border-b border-[#1e3555] pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 tracking-wider">
                  Normas ISO/IEC 27701 e ISO/IEC 27001
                </span>
                <span className="text-[10px] text-[#94a3b8] font-semibold">
                  ENMFM • Calidad y Seguridad
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Política Institucional de Protección de Datos Personales
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Sistema Institucional de Movimiento, Salud y Bienestar (MSB)
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 text-[#94a3b8] hover:text-white rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Declaración de Alineación con Normas ISO */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-[#0a1e3f] to-indigo-950 text-white rounded-2xl space-y-2 border border-blue-500/30 shadow-sm">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-amber-300 uppercase tracking-wide">
              Marco de Cumplimiento y Certificación
            </h3>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            La <strong>{CONFIG.INSTITUCION}</strong>, a través de la <strong>{CONFIG.SUBDIRECCION}</strong> y el <strong>{CONFIG.DEPARTAMENTO}</strong>, garantiza que el tratamiento de los datos personales de estudiantes, docentes y trabajadores se rige bajo los más estrictos estándares internacionales de confidencialidad, integridad y disponibilidad:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-amber-300 block">ISO/IEC 27701:2019</span>
              <span className="text-blue-200 text-[10px]">Gestión de la Privacidad de la Información (PIMS)</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-emerald-300 block">ISO/IEC 27001:2022</span>
              <span className="text-blue-200 text-[10px]">Seguridad de la Información y Cifrado</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-blue-300 block">LGPDPPSO / ARCO</span>
              <span className="text-blue-200 text-[10px]">Ley General de Datos Personales para Sujetos Obligados</span>
            </div>
          </div>
        </div>

        {/* Principios y Medidas Técnicas Aplicadas */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Medidas Técnicas y Organizacionales de Seguridad</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-1.5">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cifrado Criptográfico SHA-256</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Los PINs y claves personales se encriptan con algoritmos hash criptográficos no reversibles (SHA-256). Ni administradores ni personal técnico pueden visualizar contraseñas en texto claro.
              </p>
            </div>

            <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-1.5">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Control de Acceso Basado en Roles (RBAC)</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Acceso estrictamente segmentado: los participantes solo visualizan su propio expediente; los encargados solo gestionan su club deportivo asignado; las directrices departamentales son auditables.
              </p>
            </div>

            <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-1.5">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Minimización y Finalidad Proporcional</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Conforme al principio ISO 27701 de minimización, únicamente se recopilan datos estrictamente indispensables para la acreditación deportiva, expedición de constancias y salud formativa.
              </p>
            </div>

            <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-1.5">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>No Transferencia ni Comercialización</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Los datos son de custodia institucional exclusiva de la ENMFM. Jamás se transfieren a terceros con fines comerciales ni ajenos a la vida académica y formativa normalista.
              </p>
            </div>
          </div>
        </div>

        {/* Finalidades del Tratamiento */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Finalidades Específicas del Tratamiento
          </h3>
          <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
            <li className="flex items-start space-x-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Gestión de inscripciones a clubes, talleres, torneos y ligas deportivas escolares.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Registro y cómputo del 85% reglamentario de asistencia para acreditación extracurricular.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Seguimiento de condición física (Course Navette, fuerza 60s, Sit & Reach e IMC) con fines exclusivamente pedagógicos de salud y bienestar.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Emisión y validación de constancias oficiales e informes ejecutivos de rendimiento institucional.</span>
            </li>
          </ul>
        </div>

        {/* Ejercicio de Derechos ARCO */}
        <div className="p-4 bg-amber-950/50 border border-amber-500/40 rounded-2xl text-xs space-y-1.5">
          <div className="font-bold text-amber-300 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            Todo usuario registrado tiene derecho a consultar, rectificar sus datos o solicitar aclaraciones presentando solicitud ante el <strong>{CONFIG.DEPARTAMENTO}</strong> o la Unidad de Transparencia de la <strong>{CONFIG.INSTITUCION}</strong>.
          </p>
        </div>

        {/* Footer del Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1e3555]">
          <div className="text-[11px] text-[#64748b] font-mono">
            Código Institucional: PIMS-ENMFM-2026 • Rev. 2.1
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
          >
            Entendido y Conforme
          </button>
        </div>

      </div>
    </div>
  );
};
