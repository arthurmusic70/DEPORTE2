import React, { useState } from 'react';
import { SesionUsuario } from '../types';
import { CONFIG } from '../utils/storage';
import { 
  Grid, 
  ExternalLink, 
  Calendar, 
  Table, 
  FolderGit2, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  Activity, 
  Box, 
  CheckCircle2,
  SlidersHorizontal,
  Database,
  ClipboardCheck,
  Dumbbell
} from 'lucide-react';
import { MSBDatabase } from '../utils/storage';
import { SelloInstitucional } from './SelloInstitucional';
import { UserAvatarBadge } from './UserAvatarBadge';

interface GoogleHeaderProps {
  usuario: SesionUsuario | null;
  onLogout: () => void;
  vistaActiva: 'actividades' | 'solicitudes' | 'asistencia' | 'pruebas_fisicas' | 'evaluaciones' | 'departamento' | 'encargado';
  onCambiarVista: (vista: 'actividades' | 'solicitudes' | 'asistencia' | 'pruebas_fisicas' | 'evaluaciones' | 'departamento' | 'encargado') => void;
  onAbrirDiagnostico: () => void;
  onAbrirConexionSheets: () => void;
}

export const GoogleHeader: React.FC<GoogleHeaderProps> = ({
  usuario,
  onLogout,
  vistaActiva,
  onCambiarVista,
  onAbrirDiagnostico,
  onAbrirConexionSheets
}) => {
  const [menuGoogleAbierto, setMenuGoogleAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  const isLive = MSBDatabase.isLiveConnected();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a192f] text-white border-b border-[#1e3555] shadow-lg">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo y Nombre Institucional con Sello Oficial */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <SelloInstitucional className="w-9 h-9 sm:w-11 sm:h-11 hover:scale-105 transition-transform cursor-pointer drop-shadow-md" />
            <div className="leading-tight">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white tracking-tight text-xs sm:text-sm lg:text-base whitespace-nowrap">
                  Movimiento, Salud y Bienestar
                </span>
                {usuario?.rol === 'administrador' && (
                  <button
                    onClick={onAbrirConexionSheets}
                    title="Configurar conexión con Google Sheets 1.1"
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      isLive 
                        ? 'bg-[#061426] text-[#10b981] border border-[#10b981]/50 hover:bg-[#10b981]/20' 
                        : 'bg-[#061426] text-[#fbbf24] border border-[#f59e0b]/50 hover:bg-[#f59e0b]/20'
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    <span>{isLive ? '🟢 Sheets 1.1' : 'Conectar Sheets'}</span>
                  </button>
                )}
              </div>
              <div className="hidden xl:block text-[11px] text-[#94a3b8] font-medium truncate max-w-[220px]">
                {CONFIG.INSTITUCION}
              </div>
            </div>
          </div>

          {/* Menú de navegación principal: TEXTO SIEMPRE VISIBLE EN TODOS LOS TAMAÑOS */}
          {usuario && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 mx-2 overflow-x-auto no-scrollbar shrink">
              <button
                onClick={() => onCambiarVista('actividades')}
                title="Mis actividades deportivas y formativas"
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  vistaActiva === 'actividades'
                    ? 'bg-[#1e3a8a] text-white border border-[#3b82f6]/40 shadow-xs'
                    : 'text-[#d6e3ff] hover:text-white hover:bg-[#112240]'
                }`}
              >
                <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-xs whitespace-nowrap">Mis actividades</span>
              </button>

              <button
                onClick={() => onCambiarVista('solicitudes')}
                title="Solicitar espacio o material (Formulario 02)"
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  vistaActiva === 'solicitudes'
                    ? 'bg-[#1e3a8a] text-white border border-[#3b82f6]/40 shadow-xs'
                    : 'text-[#d6e3ff] hover:text-white hover:bg-[#112240]'
                }`}
              >
                <Box className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-semibold text-xs whitespace-nowrap">Solicitudes</span>
              </button>

              <button
                onClick={() => onCambiarVista('asistencia')}
                title="Mi asistencia reglamentaria y constancias"
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  vistaActiva === 'asistencia'
                    ? 'bg-[#1e3a8a] text-white border border-[#3b82f6]/40 shadow-xs'
                    : 'text-[#d6e3ff] hover:text-white hover:bg-[#112240]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs whitespace-nowrap">Mi asistencia</span>
              </button>

              <button
                onClick={() => onCambiarVista('pruebas_fisicas')}
                title="Pruebas de Capacidades Físicas (Fase 2)"
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  vistaActiva === 'pruebas_fisicas'
                    ? 'bg-[#1e3a8a] text-white border border-[#3b82f6]/40 shadow-xs'
                    : 'text-[#d6e3ff] hover:text-white hover:bg-[#112240]'
                }`}
              >
                <Dumbbell className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-xs whitespace-nowrap">Pruebas Físicas</span>
              </button>

              <button
                onClick={() => onCambiarVista('evaluaciones')}
                title="Evaluaciones del Departamento de Deporte y Salud"
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  vistaActiva === 'evaluaciones'
                    ? 'bg-[#064e3b] text-emerald-200 border border-[#10b981]/50 shadow-xs'
                    : 'text-[#d6e3ff] hover:text-white hover:bg-[#112240]'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs whitespace-nowrap">Evaluaciones</span>
              </button>

              {/* Consola: ÚNICAMENTE visible para el rol Administrador */}
              {usuario.rol === 'administrador' && (
                <button
                  onClick={() => onCambiarVista('departamento')}
                  title="Consola de Control Departamental"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    vistaActiva === 'departamento'
                      ? 'bg-gradient-to-r from-amber-950 to-amber-900 text-amber-200 border-amber-500 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-[#061426] text-amber-300 border-amber-500/40 hover:bg-[#112240] hover:text-amber-100 hover:border-amber-400'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-xs whitespace-nowrap">Consola Admin</span>
                </button>
              )}

              {/* Panel de Encargado: ÚNICAMENTE visible para el rol Encargado */}
              {usuario.rol === 'encargado' && (
                <button
                  onClick={() => onCambiarVista('encargado')}
                  title="Gestión de Club y Asistencias"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    vistaActiva === 'encargado'
                      ? 'bg-[#581c87] text-purple-200 border border-purple-400/50 shadow-xs'
                      : 'text-purple-300 hover:bg-[#112240] hover:text-white'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-xs whitespace-nowrap">Gestión Club</span>
                </button>
              )}
            </nav>
          )}

          {/* Lado derecho: Acceso a Google Apps (si es admin) y Avatar de Usuario con dropdown */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto">
            
            {/* Waffle Google Apps Menu (9 puntos): Administradores */}
            {usuario?.rol === 'administrador' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setMenuGoogleAbierto(!menuGoogleAbierto);
                    setPerfilAbierto(false);
                  }}
                  title="Grid de Selección Google Apps y Enlaces Institucionales"
                  className="p-2 rounded-xl text-[#94a3b8] hover:bg-[#112240] hover:text-amber-300 border border-transparent hover:border-[#1e3a8a] transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Google Apps y Enlaces"
                >
                  <Grid className="w-5 h-5 text-amber-300" />
                </button>

                {menuGoogleAbierto && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMenuGoogleAbierto(false)} 
                    />
                    <div 
                      className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-3 w-80 max-w-[calc(100vw-1rem)] bg-[#0a192f] rounded-2xl shadow-2xl border border-[#1e3a8a] py-3 px-4 z-50 text-white animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setMenuGoogleAbierto(false)}
                    >
                      <div className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider mb-2.5 px-1">
                        Ecosistema Google Institucional
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={CONFIG.URL_MASTER_SHEET}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-[#112240] transition-all text-center group border border-transparent hover:border-[#1e3a8a]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                            <Table className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-white leading-tight">Base Maestra</span>
                          <span className="text-[10px] text-[#94a3b8]">Sheets 1.1</span>
                        </a>

                        <button
                          onClick={() => {
                            setMenuGoogleAbierto(false);
                            onCambiarVista('evaluaciones');
                          }}
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-[#112240] transition-all text-center group border border-transparent hover:border-[#1e3a8a] cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-white leading-tight">Evaluaciones</span>
                          <span className="text-[10px] text-[#94a3b8]">Forms Oficiales</span>
                        </button>

                        <a
                          href="https://calendar.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-[#112240] transition-all text-center group border border-transparent hover:border-[#1e3a8a]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-white leading-tight">Calendar</span>
                          <span className="text-[10px] text-[#94a3b8]">Agenda</span>
                        </a>

                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-[#112240] transition-all text-center group border border-transparent hover:border-[#1e3a8a]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                            <FolderGit2 className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-white leading-tight">Google Drive</span>
                          <span className="text-[10px] text-[#94a3b8]">Expedientes</span>
                        </a>

                        <button
                          onClick={onAbrirDiagnostico}
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-[#112240] transition-all text-center group col-span-2 border border-transparent hover:border-[#1e3a8a] cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-white leading-tight">Diagnóstico Apps Script</span>
                          <span className="text-[10px] text-[#94a3b8]">Verificar estado</span>
                        </button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1e3555] text-center">
                        <span className="text-[10px] text-[#94a3b8]">
                          Entorno seguro Google Workspace
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Perfil de Usuario con Avatar circular estándar Google */}
            {usuario ? (
              <div className="relative flex items-center">
                <button
                  onClick={() => {
                    setPerfilAbierto(!perfilAbierto);
                    setMenuGoogleAbierto(false);
                  }}
                  title={`Perfil de ${usuario.nombre} (@${usuario.username})`}
                  className="p-1 rounded-full hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Perfil de usuario"
                >
                  <UserAvatarBadge usuario={usuario} size="sm" />
                </button>

                {/* Menú Desplegable de Perfil */}
                {perfilAbierto && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setPerfilAbierto(false)} 
                    />
                    <div 
                      className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-80 max-w-[calc(100vw-1rem)] bg-[#0a192f] rounded-2xl shadow-2xl border border-[#1e3a8a] py-3.5 px-4 z-50 text-white animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="flex items-center space-x-3 pb-3 border-b border-[#1e3555]">
                        <UserAvatarBadge usuario={usuario} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {usuario.nombre} {usuario.apellidos}
                          </p>
                          <p className="text-xs text-[#94a3b8] truncate font-mono">
                            {usuario.correo}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#112240] text-[#fbbf24] border border-[#f59e0b]/40 uppercase tracking-wide">
                            {usuario.sector} • ID: {usuario.id}
                          </span>
                        </div>
                      </div>

                      <div className="py-2.5 text-xs text-[#d6e3ff] space-y-1.5">
                        <div className="flex justify-between py-0.5">
                          <span className="text-[#94a3b8]">Usuario institucional:</span>
                          <span className="font-mono font-bold text-white">@{usuario.username}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-[#94a3b8]">Tipo de cuenta:</span>
                          <span className="font-semibold text-white">{usuario.tipoCuenta}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-[#94a3b8]">Perfil / Rol:</span>
                          <span className="font-bold text-[#fbbf24] capitalize">{usuario.rol}</span>
                        </div>
                        {usuario.licenciatura && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[#94a3b8]">Filiación:</span>
                            <span className="text-white text-[11px] truncate max-w-[170px]">{usuario.licenciatura}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-[#1e3555]">
                        <button
                          onClick={() => {
                            setPerfilAbierto(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold text-red-300 hover:text-white bg-red-950/80 hover:bg-red-900 border border-red-700/60 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span>Cerrar sesión institucional</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#94a3b8] font-medium px-2 py-1 bg-[#112240] rounded-md border border-[#1e3555]">
                Sesión no iniciada
              </div>
            )}
          </div>
        </div>

        {/* Barra de navegación secundaria para pantallas pequeñas (< md) */}
        {usuario && (
          <div className="md:hidden flex overflow-x-auto py-2 px-1 space-x-1.5 border-t border-[#1e3555] no-scrollbar">
            <button
              onClick={() => onCambiarVista('actividades')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                vistaActiva === 'actividades' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#d6e3ff] bg-[#061426]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Mis actividades</span>
            </button>
            <button
              onClick={() => onCambiarVista('solicitudes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                vistaActiva === 'solicitudes' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#d6e3ff] bg-[#061426]'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>Solicitudes</span>
            </button>
            <button
              onClick={() => onCambiarVista('asistencia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                vistaActiva === 'asistencia' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#d6e3ff] bg-[#061426]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mi asistencia</span>
            </button>
            <button
              onClick={() => onCambiarVista('pruebas_fisicas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                vistaActiva === 'pruebas_fisicas' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#d6e3ff] bg-[#061426]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
              <span>Pruebas Físicas</span>
            </button>
            <button
              onClick={() => onCambiarVista('evaluaciones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                vistaActiva === 'evaluaciones' ? 'bg-[#064e3b] text-emerald-200 shadow-xs' : 'text-[#d6e3ff] bg-[#061426]'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evaluaciones</span>
            </button>
            {usuario.rol === 'administrador' && (
              <button
                onClick={() => onCambiarVista('departamento')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  vistaActiva === 'departamento' ? 'bg-[#78350f] text-amber-200 border border-amber-500' : 'text-[#fbbf24] bg-[#061426]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Consola Admin</span>
              </button>
            )}
            {usuario.rol === 'encargado' && (
              <button
                onClick={() => onCambiarVista('encargado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  vistaActiva === 'encargado' ? 'bg-[#581c87] text-purple-200 border border-purple-400/50' : 'text-purple-300 bg-[#061426]'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Gestión Club</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
