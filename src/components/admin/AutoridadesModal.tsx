import React, { useState } from 'react';
import { AutoridadesConfig } from '../../types';
import { MSBDatabase } from '../../utils/storage';
import { Award, Save, CheckCircle2, UserCheck, PenTool } from 'lucide-react';
import { SignatureModal } from '../SignatureModal';

interface AutoridadesModalProps {
  onCerrar: () => void;
  onGuardado: () => void;
}

export const AutoridadesModal: React.FC<AutoridadesModalProps> = ({ onCerrar, onGuardado }) => {
  const [config, setConfig] = useState<AutoridadesConfig>(MSBDatabase.getAutoridades());
  const [guardado, setGuardado] = useState(false);
  const [mostrarFirmaModal, setMostrarFirmaModal] = useState<false | 'matutino' | 'vespertino' | 'ambos'>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    MSBDatabase.saveAutoridades(config);
    setGuardado(true);
    setTimeout(() => {
      onGuardado();
      onCerrar();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Firmas Oficiales Institucionales
              </h3>
              <p className="text-xs text-gray-500">
                Jefes del Departamento de Deporte y Salud para informes y constancias
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full cursor-pointer"
          >
            ✕
          </button>
        </div>

        {guardado && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ Firmas oficiales actualizadas y sincronizadas en todos los informes y constancias.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-gray-700 font-bold mb-1">Título Institucional de la Jefatura *</label>
            <input
              type="text"
              required
              value={config.tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
              onChange={(e) => setConfig({ ...config, tituloJefatura: e.target.value })}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-600"
              placeholder="Jefes del Departamento de Deporte y Salud"
            />
          </div>

          {/* Firma 1: Turno Matutino */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
            <div className="font-bold text-blue-900 text-xs flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Línea de Firma 1 (Turno Matutino)</span>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={config.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}
                onChange={(e) => setConfig({ ...config, jefeMatutinoNombre: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                placeholder="Sandra Nelly Martínez Cantú"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Turno / Cargo *</label>
              <input
                type="text"
                required
                value={config.jefeMatutinoCargo || 'Turno matutino'}
                onChange={(e) => setConfig({ ...config, jefeMatutinoCargo: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                placeholder="Turno matutino"
              />
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-blue-100">
              <div className="text-[11px] text-gray-500">
                {config.jefeMatutinoFirma ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">✓ Firma digital cargada</span>
                ) : (
                  <span>Sin firma virtual personalizada</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMostrarFirmaModal('matutino')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Trazar / Cambiar Firma</span>
              </button>
            </div>
          </div>

          {/* Firma 2: Turno Vespertino */}
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
            <div className="font-bold text-purple-900 text-xs flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>Línea de Firma 2 (Turno Vespertino)</span>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={config.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}
                onChange={(e) => setConfig({ ...config, jefeVespertinoNombre: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                placeholder="Arturo Rodríguez Segovia"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Turno / Cargo *</label>
              <input
                type="text"
                required
                value={config.jefeVespertinoCargo || 'Turno vespertino'}
                onChange={(e) => setConfig({ ...config, jefeVespertinoCargo: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                placeholder="Turno vespertino"
              />
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-purple-100">
              <div className="text-[11px] text-gray-500">
                {config.jefeVespertinoFirma ? (
                  <span className="text-purple-700 font-bold flex items-center gap-1">✓ Firma digital cargada</span>
                ) : (
                  <span>Sin firma virtual personalizada</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMostrarFirmaModal('vespertino')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 cursor-pointer shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Trazar / Cambiar Firma</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Firmas</span>
            </button>
          </div>

        </form>

        {/* Modal de Firma Virtual */}
        {mostrarFirmaModal && (
          <SignatureModal
            abierto={!!mostrarFirmaModal}
            rolObjetivo={mostrarFirmaModal === 'matutino' ? 'matutino' : mostrarFirmaModal === 'vespertino' ? 'vespertino' : 'ambos'}
            onCerrar={() => setMostrarFirmaModal(false)}
            onFirmaGuardada={(updated) => {
              setConfig(updated);
              setMostrarFirmaModal(false);
            }}
          />
        )}

      </div>
    </div>
  );
};
