import React, { useState, useEffect } from 'react';
import { SesionUsuario } from './types';
import { MSBDatabase, CONFIG } from './utils/storage';
import { GoogleHeader } from './components/GoogleHeader';
import { LoginModal } from './components/LoginModal';
import { RegistroModal } from './components/RegistroModal';
import { ActividadesView } from './components/ActividadesView';
import { SolicitudesView } from './components/SolicitudesView';
import { AsistenciaView } from './components/AsistenciaView';
import { ConsolaDepartamental } from './components/ConsolaDepartamental';
import { PanelEncargado } from './components/PanelEncargado';
import { DiagnosticoModal } from './components/DiagnosticoModal';
import { ConexionSheetsModal } from './components/ConexionSheetsModal';
import { ParticipantePruebasFisicasView } from './components/participante/ParticipantePruebasFisicasView';
import { EvaluacionesDepartamentoView } from './components/EvaluacionesDepartamentoView';
import { PrivacidadISOModal } from './components/PrivacidadISOModal';
import { ShieldCheck, Heart, Sparkles, HelpCircle, Database, Lock } from 'lucide-react';

export default function App() {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(() => MSBDatabase.getSession());
  const [modoAutenticacion, setModoAutenticacion] = useState<'login' | 'registro'>('login');
  const [vistaActiva, setVistaActiva] = useState<'actividades' | 'solicitudes' | 'asistencia' | 'pruebas_fisicas' | 'evaluaciones' | 'departamento' | 'encargado'>('actividades');
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const [mostrarConexionSheets, setMostrarConexionSheets] = useState(false);
  const [mostrarPrivacidadISO, setMostrarPrivacidadISO] = useState(false);
  const [registroInicialUsuario, setRegistroInicialUsuario] = useState<string | null>(null);

  // Sync session on mount
  useEffect(() => {
    const ses = MSBDatabase.getSession();
    if (ses) {
      setUsuario(ses);
      if (ses.rol === 'encargado') setVistaActiva('encargado');
      else if (ses.rol === 'administrador') setVistaActiva('departamento');
    }

    // Auto-sincronizar datos desde Google Sheets en vivo
    if (MSBDatabase.isLiveConnected()) {
      MSBDatabase.syncFromGoogleSheets().catch(err => {
        console.warn('Sincronización inicial Sheets:', err);
      });
    }

    // Sincronización continua en segundo plano (cada 25s y al retomar el foco de la ventana)
    const interval = setInterval(() => {
      if (MSBDatabase.isLiveConnected()) {
        MSBDatabase.syncFromGoogleSheets().catch(() => {});
      }
    }, 25000);

    const handleFocus = () => {
      if (MSBDatabase.isLiveConnected()) {
        MSBDatabase.syncFromGoogleSheets().catch(() => {});
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLoginExitoso = (user: SesionUsuario) => {
    setUsuario(user);
    if (user.rol === 'encargado') {
      setVistaActiva('encargado');
    } else if (user.rol === 'administrador') {
      setVistaActiva('departamento');
    } else {
      setVistaActiva('actividades');
    }
  };

  const handleLogout = () => {
    MSBDatabase.clearSession();
    setUsuario(null);
    setModoAutenticacion('login');
  };

  const handleRegistroExitoso = (username: string) => {
    setRegistroInicialUsuario(username);
    setModoAutenticacion('login');
  };

  return (
    <div className="min-h-screen w-full bg-[#040e1c] text-[#f8fafc] flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Barra de Google Workspace */}
      <GoogleHeader
        usuario={usuario}
        onLogout={handleLogout}
        vistaActiva={vistaActiva}
        onCambiarVista={setVistaActiva}
        onAbrirDiagnostico={() => setMostrarDiagnostico(true)}
        onAbrirConexionSheets={() => setMostrarConexionSheets(true)}
      />

      {/* Contenido Principal con Proporción Óptima de Pantalla */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {!usuario ? (
          <div>
            {modoAutenticacion === 'login' ? (
              <LoginModal
                onLoginExitoso={handleLoginExitoso}
                onIrARegistro={() => setModoAutenticacion('registro')}
              />
            ) : (
              <RegistroModal
                onVolverALogin={() => setModoAutenticacion('login')}
                onRegistroExitoso={handleRegistroExitoso}
              />
            )}
          </div>
        ) : (
          <div>
            {vistaActiva === 'actividades' && (
              <ActividadesView usuario={usuario} />
            )}

            {vistaActiva === 'solicitudes' && (
              <SolicitudesView usuario={usuario} />
            )}

            {vistaActiva === 'asistencia' && (
              <AsistenciaView 
                usuario={usuario} 
                onIrAPruebasFisicas={() => setVistaActiva('pruebas_fisicas')} 
              />
            )}

            {vistaActiva === 'pruebas_fisicas' && (
              <ParticipantePruebasFisicasView usuario={usuario} />
            )}

            {vistaActiva === 'evaluaciones' && (
              <EvaluacionesDepartamentoView usuario={usuario} />
            )}

            {vistaActiva === 'departamento' && (
              <ConsolaDepartamental
                usuario={usuario}
                onActualizar={() => {}}
                onAbrirConexion={() => setMostrarConexionSheets(true)}
              />
            )}

            {vistaActiva === 'encargado' && (
              <PanelEncargado usuario={usuario} />
            )}
          </div>
        )}
      </main>

      {/* Modal Diagnóstico */}
      {mostrarDiagnostico && (
        <DiagnosticoModal onCerrar={() => setMostrarDiagnostico(false)} />
      )}

      {/* Modal Conexión Google Sheets */}
      {mostrarConexionSheets && (
        <ConexionSheetsModal
          onCerrar={() => setMostrarConexionSheets(false)}
          onSincronizado={() => window.location.reload()}
        />
      )}

      {/* Footer Institucional Google Workspace */}
      <footer className="w-full bg-[#0a192f] border-t border-[#1e3555] py-6 text-xs text-[#94a3b8]">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-semibold text-white">
              {CONFIG.SISTEMA}
            </div>
            <div className="text-[#94a3b8]">
              {CONFIG.INSTITUCION} • {CONFIG.DEPARTAMENTO}
            </div>
          </div>

          {/* Sello Explícito de Protección de Datos Personales ISO */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMostrarPrivacidadISO(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#112240] hover:bg-[#162846] text-[#10b981] border border-[#10b981]/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Consultar Política Institucional de Datos Personales bajo Normas ISO"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
              <span>Protección de Datos • Normas ISO/IEC 27701 e ISO/IEC 27001</span>
            </button>
          </div>

          {usuario?.rol === 'administrador' ? (
            <div className="flex items-center space-x-4 flex-wrap justify-center text-[#94a3b8]">
              <button
                onClick={() => setMostrarConexionSheets(true)}
                className="hover:text-blue-400 transition-colors flex items-center space-x-1"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Conexión Base 1.1</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setMostrarDiagnostico(true)}
                className="hover:text-emerald-400 transition-colors flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diagnóstico</span>
              </button>
              <span>•</span>
              <a
                href={CONFIG.URL_MASTER_SHEET}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Google Sheets Base Maestra
              </a>
            </div>
          ) : (
            <div className="text-[11px] text-[#64748b]">
              Portal Oficial de Deportes, Salud y Bienestar Normalista
            </div>
          )}
        </div>
      </footer>

      {/* Modal Institucional de Privacidad y Normas ISO */}
      <PrivacidadISOModal
        abierto={mostrarPrivacidadISO}
        onCerrar={() => setMostrarPrivacidadISO(false)}
      />

    </div>
  );
}
