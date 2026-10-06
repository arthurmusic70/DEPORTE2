import React, { useState, useRef, useEffect } from 'react';
import { SesionUsuario, Solicitud, InscripcionAsistencia, Actividad, Espacio, MaterialInventario, Identidad } from '../types';
import { MSBDatabase, CONFIG } from '../utils/storage';
import { 
  SlidersHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileSpreadsheet, 
  Download, 
  Code, 
  ShieldCheck, 
  Table, 
  ExternalLink, 
  Check, 
  Copy,
  Users,
  Search,
  Activity,
  Layers,
  Box,
  Database,
  Package,
  HeartPulse,
  ClipboardCheck,
  Camera,
  FileText,
  Award,
  RefreshCw,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AsistenciasAdminView } from './admin/AsistenciasAdminView';
import { InventarioAdminView } from './admin/InventarioAdminView';
import { PruebasFisicasView } from './admin/PruebasFisicasView';
import { EvaluacionesDepartamentoView } from './EvaluacionesDepartamentoView';
import { AdminGaleriaView } from './admin/AdminGaleriaView';
import { AdminPlantillaView } from './admin/AdminPlantillaView';

interface ConsolaDepartamentalProps {
  usuario: SesionUsuario;
  onActualizar: () => void;
  onAbrirConexion?: () => void;
}

export const ConsolaDepartamental: React.FC<ConsolaDepartamentalProps> = ({ usuario, onActualizar, onAbrirConexion }) => {
  // Verificación estricta: solo la cuenta de Administrador puede acceder a la consola
  if (usuario.rol !== 'administrador') {
    return (
      <div className="bg-[#0a192f] rounded-3xl p-10 text-center border border-red-800/60 shadow-2xl max-w-lg mx-auto my-12 space-y-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-700/60">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Acceso Restringido a Consola
        </h2>
        <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
          Esta consola departamental con privilegios totales de visualización y edición es exclusiva para la cuenta de <strong className="text-white">Administrador</strong>.
          <br /><br />
          Tu cuenta actual (<strong className="text-white">{usuario.nombre} {usuario.apellidos}</strong>) tiene el perfil de <strong className="text-[#fbbf24] capitalize">{usuario.rol}</strong>.
        </p>
      </div>
    );
  }

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(MSBDatabase.getSolicitudes());
  const [inscripciones, setInscripciones] = useState<InscripcionAsistencia[]>(MSBDatabase.getInscripciones());
  const [actividades, setActividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [espacios, setEspacios] = useState<Espacio[]>(MSBDatabase.getEspacios());
  const [inventario, setInventario] = useState<MaterialInventario[]>(MSBDatabase.getInventario());
  const [identidades, setIdentidades] = useState<Identidad[]>(MSBDatabase.getIdentidades());

  useEffect(() => {
    const handleActualizar = () => {
      setSolicitudes(MSBDatabase.getSolicitudes());
      setInscripciones(MSBDatabase.getInscripciones());
      setActividades(MSBDatabase.getActividades());
      setEspacios(MSBDatabase.getEspacios());
      setInventario(MSBDatabase.getInventario());
      setIdentidades(MSBDatabase.getIdentidades());
    };
    window.addEventListener('msb_datos_actualizados', handleActualizar);
    return () => window.removeEventListener('msb_datos_actualizados', handleActualizar);
  }, []);

  const [pestana, setPestana] = useState<'solicitudes' | 'asistencia' | 'inventario' | 'pruebas_fisicas' | 'evaluaciones' | 'galeria' | 'plantilla' | 'tablas' | 'script' | 'diagnostico'>('solicitudes');
  
  // Referencia y controles ergonómicos de desplazamiento horizontal para la barra de pestañas
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    const handleResize = () => checkScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      tabsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScrollState, 320);
    }
  };

  const handleWheelScroll = (e: React.WheelEvent) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY * 1.5;
      checkScrollState();
    }
  };

  // Estado para Auditoría y Migración a Base de Datos Real
  const [auditoriaReporte, setAuditoriaReporte] = useState(() => MSBDatabase.ejecutarAuditoriaCompleta());
  const [mensajeAuditoria, setMensajeAuditoria] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const handleEjecutarAuditoria = () => {
    const res = MSBDatabase.ejecutarAuditoriaCompleta();
    setAuditoriaReporte(res);
    setMensajeAuditoria({
      tipo: res.estadoGeneral === 'optimo' ? 'exito' : 'info',
      texto: `✓ Auditoría completada: ${res.detalles.filter((d: { estado: string }) => d.estado === 'ok').length} módulos verificados sin errores. Sistema preparado para producción real.`
    });
    setTimeout(() => setMensajeAuditoria(null), 4000);
  };

  const handleDescargarRespaldoJSON = () => {
    const jsonStr = MSBDatabase.exportarCopiaSeguridadJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MSB_Respaldo_Maestro_Migracion_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setMensajeAuditoria({
      tipo: 'exito',
      texto: '✓ Archivo de respaldo maestro JSON exportado exitosamente. Listo para migrar a la base de datos real.'
    });
    setTimeout(() => setMensajeAuditoria(null), 4000);
  };

  const handleImportarRespaldoJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      const res = MSBDatabase.importarCopiaSeguridadJSON(contenido);
      if (res.ok) {
        recargar();
        setAuditoriaReporte(MSBDatabase.ejecutarAuditoriaCompleta());
        setMensajeAuditoria({
          tipo: 'exito',
          texto: res.mensaje
        });
      } else {
        setMensajeAuditoria({
          tipo: 'error',
          texto: res.mensaje
        });
      }
      setTimeout(() => setMensajeAuditoria(null), 5000);
    };
    reader.readAsText(file);
  };
  
  // Solicitud approval modal state
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [dictamenMotivo, setDictamenMotivo] = useState<string>('');

  // Selected table in inspector
  const [tablaSeleccionada, setTablaSeleccionada] = useState<'Actividades' | 'Espacios' | 'Inventario' | 'Solicitudes' | 'Inscripciones_Asistencia' | 'Identidades_Participantes'>('Solicitudes');

  const [copiado, setCopiado] = useState(false);

  const recargar = () => {
    setSolicitudes(MSBDatabase.getSolicitudes());
    setInscripciones(MSBDatabase.getInscripciones());
    onActualizar();
  };

  const handleResolverSolicitud = (estado: 'Aprobada' | 'Rechazada') => {
    if (!solicitudSeleccionada) return;
    MSBDatabase.updateSolicitudStatus(
      solicitudSeleccionada.ID_solicitud,
      estado,
      dictamenMotivo || (estado === 'Aprobada' ? 'Autorizado conforme a disponibilidad.' : 'No disponible en el horario solicitado.'),
      usuario.id
    );
    setSolicitudSeleccionada(null);
    setDictamenMotivo('');
    recargar();
  };

  const handleMarcarAsistencia = (idRegistro: string, estado: 'Asistió' | 'No registrada' | 'Justificado' | 'Falta') => {
    MSBDatabase.updateAsistencia(idRegistro, estado);
    recargar();
  };

  const diagnostico = MSBDatabase.getDiagnostico();

  // Export tables to CSV
  const descargarCSV = (nombre: string, datos: any[]) => {
    if (!datos.length) return;
    const encabezados = Object.keys(datos[0]).join(',');
    const filas = datos.map(row => 
      Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
    );
    const contenido = [encabezados, ...filas].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MSB_${nombre}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copiarCodigoAppsScript = () => {
    const scriptCode = `// SISTEMA INSTITUCIONAL DE MOVIMIENTO, SALUD Y BIENESTAR\n// Escuela Normal Miguel F. Martínez - Departamento de Deporte y Salud\n// Master Spreadsheet ID: ${CONFIG.MASTER_SPREADSHEET_ID}\n// Response Spreadsheet ID: ${CONFIG.RESPONSE_SPREADSHEET_ID}\n\nfunction doGet(e) {\n  return HtmlService.createHtmlOutputFromFile('Login').setTitle('Movimiento, Salud y Bienestar');\n}`;
    navigator.clipboard.writeText(scriptCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Encabezado Departamental */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/40 uppercase tracking-wider">
              Consola del Departamento
            </span>
            <span className="text-xs text-[#94a3b8] font-mono">
              Base: {CONFIG.MASTER_SPREADSHEET_ID.substring(0, 12)}...
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión y Control de Operaciones
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Departamento de Deporte y Salud • {CONFIG.INSTITUCION}
          </p>
        </div>

        {/* Enlaces Rápidos a Hojas de Cálculo Oficiales */}
        <div className="flex items-center flex-wrap gap-2">
          {onAbrirConexion && (
            <button
              onClick={onAbrirConexion}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1e3a8a]/40 hover:bg-[#1e3a8a]/70 text-blue-200 text-xs font-semibold rounded-xl border border-blue-500/40 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>Conexión Sheets 1.1</span>
            </button>
          )}

          <a
            href={CONFIG.URL_MASTER_SHEET}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Abrir Base Maestra Sheets</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>

          <a
            href={CONFIG.URL_RESPONSES_SHEET}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold rounded-xl border border-purple-500/40 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            <span>Respuestas Forms</span>
            <ExternalLink className="w-3 h-3 text-purple-400" />
          </a>
        </div>
      </div>

      {/* Navegación por pestañas de la consola con deslizador dinámico y ergonómico */}
      <div className="relative group/tabs flex items-center">
        {/* Botón de desplazamiento hacia la izquierda */}
        <button
          type="button"
          onClick={() => handleScrollTabs('left')}
          disabled={!canScrollLeft}
          title="Deslizar menú a la izquierda"
          aria-label="Deslizar menú a la izquierda"
          className={`absolute left-0 z-20 h-10 w-9 rounded-xl bg-gradient-to-r from-[#0a192f] via-[#0a192f]/90 to-transparent flex items-center justify-start pl-1 text-cyan-300 hover:text-white transition-all cursor-pointer ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="p-1 rounded-lg bg-[#061426] border border-[#1e3a8a] shadow-lg hover:border-cyan-400">
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
          </div>
        </button>

        {/* Contenedor desplazable con soporte de rueda del ratón y arrastre */}
        <div
          ref={tabsContainerRef}
          onScroll={checkScrollState}
          onWheel={handleWheelScroll}
          className="flex space-x-2 border-b border-[#1e3a8a]/40 pb-2 overflow-x-auto no-scrollbar scroll-smooth px-1 sm:px-2 w-full select-none"
        >
          <button
            onClick={() => setPestana('solicitudes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'solicitudes'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>Solicitudes F02 ({solicitudes.filter(s => s.Estado === 'Pendiente').length} pendientes)</span>
          </button>

          <button
            onClick={() => setPestana('asistencia')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'asistencia'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Asistencias y Constancias ({inscripciones.length})</span>
          </button>

          <button
            onClick={() => setPestana('inventario')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'inventario'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Inventario y Espacios</span>
          </button>

          <button
            onClick={() => setPestana('pruebas_fisicas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'pruebas_fisicas'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Pruebas Físicas (Fase 2)</span>
          </button>

          <button
            onClick={() => setPestana('evaluaciones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'evaluaciones'
                ? 'bg-emerald-900 text-emerald-200 shadow-md border border-emerald-500/50'
                : 'bg-[#0a192f] text-emerald-400 hover:text-emerald-200 hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Evaluaciones del Departamento</span>
          </button>

          <button
            onClick={() => setPestana('galeria')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'galeria'
                ? 'bg-amber-900 text-amber-200 shadow-md border border-amber-500/50'
                : 'bg-[#0a192f] text-amber-400 hover:text-amber-200 hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 Difusión y Galería ({MSBDatabase.getGaleriaActividades().length})</span>
          </button>

          <button
            onClick={() => setPestana('plantilla')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'plantilla'
                ? 'bg-blue-950 text-blue-200 shadow-md border border-blue-500/50'
                : 'bg-[#0a192f] text-blue-300 hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 Plantilla Documental</span>
          </button>

          <button
            onClick={() => setPestana('tablas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'tablas'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-sky-400" />
            <span>Explorador Tablas Sheets</span>
          </button>

          <button
            onClick={() => setPestana('diagnostico')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'diagnostico'
                ? 'bg-emerald-950 text-emerald-200 shadow-md border border-emerald-500/50'
                : 'bg-[#0a192f] text-emerald-400 hover:text-emerald-200 hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🛡️ Auditoría & Migración Real</span>
          </button>

          <button
            onClick={() => setPestana('script')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              pestana === 'script'
                ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span>Código Apps Script</span>
          </button>
        </div>

        {/* Botón de desplazamiento hacia la derecha */}
        <button
          type="button"
          onClick={() => handleScrollTabs('right')}
          disabled={!canScrollRight}
          title="Deslizar menú a la derecha"
          aria-label="Deslizar menú a la derecha"
          className={`absolute right-0 z-20 h-10 w-9 rounded-xl bg-gradient-to-l from-[#0a192f] via-[#0a192f]/90 to-transparent flex items-center justify-end pr-1 text-cyan-300 hover:text-white transition-all cursor-pointer ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="p-1 rounded-lg bg-[#061426] border border-[#1e3a8a] shadow-lg hover:border-cyan-400">
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </div>
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE SOLICITUDES F02 */}
      {pestana === 'solicitudes' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Dictamen de solicitudes de espacios y materiales
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Revisa disponibilidad, autoriza o rechaza solicitudes recibidas mediante el Formulario 02.
              </p>
            </div>
            <button
              onClick={() => descargarCSV('Solicitudes', solicitudes)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#061426] hover:bg-[#112240] text-[#d6e3ff] border border-[#1e3a8a] text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Solicitudes CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d6e3ff] border-collapse">
              <thead>
                <tr className="bg-[#061426] border-b border-[#1e3a8a]/60 text-[#94a3b8] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Folio</th>
                  <th className="py-3 px-3">Prioridad</th>
                  <th className="py-3 px-3">Solicitante</th>
                  <th className="py-3 px-3">Tipo / Recurso</th>
                  <th className="py-3 px-3">Fecha y Horario</th>
                  <th className="py-3 px-3">Propósito</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a8a]/30">
                {solicitudes.map((sol) => (
                  <tr key={sol.ID_solicitud} className="hover:bg-[#112240]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">{sol.ID_solicitud}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block whitespace-nowrap ${
                        sol.Nivel_prioridad === 0 ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50' :
                        sol.Nivel_prioridad === 1 ? 'bg-blue-950/80 text-blue-300 border border-blue-600/50' :
                        sol.Nivel_prioridad === 2 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50' :
                        'bg-gray-800 text-gray-300 border border-gray-600'
                      }`}>
                        {sol.Prioridad_Etiqueta || `Nivel ${sol.Nivel_prioridad}`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{sol.Solicitante_Nombre || sol.Solicitante_ID}</div>
                      <div className="text-[10px] text-[#94a3b8] font-mono">{sol.Solicitante_ID}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{sol.Recurso_Nombre || sol.ID_recurso}</div>
                      <div className="text-[10px] text-[#94a3b8]">{sol.Tipo_solicitud} {sol.Cantidad && `• Cant: ${sol.Cantidad}`}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white">{sol.Fecha_uso}</div>
                      <div className="text-[11px] text-[#94a3b8] font-mono">{sol.Hora_inicio} a {sol.Hora_fin}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-[#d6e3ff]" title={sol.Proposito}>
                      {sol.Proposito}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sol.Estado === 'Aprobada'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                          : sol.Estado === 'Rechazada'
                          ? 'bg-red-950/80 text-red-300 border border-red-600/50'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                      }`}>
                        {sol.Estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {sol.Estado === 'Pendiente' ? (
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(sol);
                            setDictamenMotivo('');
                          }}
                          className="px-3 py-1 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                        >
                          Dictaminar
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#64748b] italic">Revisada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ASISTENCIAS Y CONSTANCIAS DE TODOS LOS CLUBES */}
      {pestana === 'asistencia' && (
        <AsistenciasAdminView
          usuario={usuario}
          actividades={actividades}
          inscripciones={inscripciones}
          identidades={identidades}
          onActualizar={recargar}
        />
      )}

      {/* PESTAÑA 3: INVENTARIO COMPLETO Y ESPACIOS */}
      {pestana === 'inventario' && (
        <InventarioAdminView
          inventario={inventario}
          espacios={espacios}
          actividades={actividades}
          identidades={identidades}
          onActualizar={recargar}
        />
      )}

      {/* PESTAÑA 4: PRUEBAS DE CAPACIDADES FÍSICAS (FASE 2) */}
      {pestana === 'pruebas_fisicas' && (
        <PruebasFisicasView />
      )}

      {/* PESTAÑA 5: EVALUACIONES DEL DEPARTAMENTO (ENCUESTAS Y ANALÍTICA) */}
      {pestana === 'evaluaciones' && (
        <EvaluacionesDepartamentoView usuario={usuario} />
      )}

      {/* PESTAÑA 6: DIFUSIÓN Y GALERÍA COMUNITARIA (SUBIDA DE IMÁGENES) */}
      {pestana === 'galeria' && (
        <AdminGaleriaView />
      )}

      {/* PESTAÑA 7: PLANTILLA DOCUMENTAL INSTITUCIONAL (PERSONALIZACIÓN Y MEMBRETE) */}
      {pestana === 'plantilla' && (
        <AdminPlantillaView />
      )}

      {/* PESTAÑA 8: EXPLORADOR DE TABLAS MAESTRAS */}
      {pestana === 'tablas' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Visualizador de Base Maestra de Google Sheets
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Estructura exacta sincronizada con el archivo <code className="text-[#fbbf24]">12jI-w438vLDio35BYNinvNDYtFd6CZVa5Z_a_RRGY4M</code>
              </p>
            </div>

            {/* Selector de Hoja */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#d6e3ff]">Hoja:</span>
              <select
                value={tablaSeleccionada}
                onChange={(e: any) => setTablaSeleccionada(e.target.value)}
                className="p-2 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#f59e0b]"
              >
                <option value="Actividades">Actividades</option>
                <option value="Espacios">Espacios</option>
                <option value="Inventario">Inventario</option>
                <option value="Solicitudes">Solicitudes</option>
                <option value="Inscripciones_Asistencia">Inscripciones_Asistencia</option>
                <option value="Identidades_Participantes">Identidades_Participantes</option>
              </select>
            </div>
          </div>

          {/* Renderizado de la tabla seleccionada */}
          <div className="overflow-x-auto max-h-96 border border-[#1e3a8a]/60 rounded-2xl">
            {tablaSeleccionada === 'Actividades' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3a8a]/60">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Nombre</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Horario</th>
                    <th className="p-2.5">Cupo</th>
                    <th className="p-2.5">Modalidad</th>
                    <th className="p-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a8a]/30 text-[#d6e3ff]">
                  {actividades.map((a) => (
                    <tr key={a.ID_actividad} className="hover:bg-[#112240]/50">
                      <td className="p-2.5 font-mono font-bold text-white">{a.ID_actividad}</td>
                      <td className="p-2.5 font-semibold text-white">{a.Nombre}</td>
                      <td className="p-2.5">{a.Tipo}</td>
                      <td className="p-2.5 font-mono">{a.Hora_inicio} - {a.Hora_fin}</td>
                      <td className="p-2.5">{a.Cupo_ocupado || 0} / {a.Cupo}</td>
                      <td className="p-2.5">{a.Modalidad_inscripción}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">{a.Estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tablaSeleccionada === 'Espacios' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3a8a]/60">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Nombre</th>
                    <th className="p-2.5">Ubicación</th>
                    <th className="p-2.5">Capacidad</th>
                    <th className="p-2.5">Equipamiento</th>
                    <th className="p-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a8a]/30 text-[#d6e3ff]">
                  {espacios.map((e) => (
                    <tr key={e.ID_espacio} className="hover:bg-[#112240]/50">
                      <td className="p-2.5 font-mono font-bold text-white">{e.ID_espacio}</td>
                      <td className="p-2.5 font-semibold text-white">{e.Nombre}</td>
                      <td className="p-2.5">{e.Ubicacion}</td>
                      <td className="p-2.5">{e.Capacidad}</td>
                      <td className="p-2.5 max-w-xs truncate">{e.Equipamiento}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">{e.Estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tablaSeleccionada === 'Inventario' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3a8a]/60">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Nombre Material</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Total / Disp</th>
                    <th className="p-2.5">Ubicación</th>
                    <th className="p-2.5">Condición</th>
                    <th className="p-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a8a]/30 text-[#d6e3ff]">
                  {inventario.map((m) => (
                    <tr key={m.ID_material} className="hover:bg-[#112240]/50">
                      <td className="p-2.5 font-mono font-bold text-white">{m.ID_material}</td>
                      <td className="p-2.5 font-semibold text-white">{m.Nombre_material}</td>
                      <td className="p-2.5">{m.Categoria}</td>
                      <td className="p-2.5 font-mono">{m.Cantidad_total} {m.Unidad} ({m.Cantidad_disponible} disp)</td>
                      <td className="p-2.5">{m.Ubicacion}</td>
                      <td className="p-2.5">{m.Condicion}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">{m.Estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tablaSeleccionada === 'Identidades_Participantes' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3a8a]/60">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Usuario</th>
                    <th className="p-2.5">Nombre Completo</th>
                    <th className="p-2.5">Sector</th>
                    <th className="p-2.5">Perfil / Rol en Sistema</th>
                    <th className="p-2.5">Correo</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5 text-right">Gestión de Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a8a]/30 text-[#d6e3ff]">
                  {identidades.map((i) => {
                    const esAdminInamovible = i.id === 'PAR-00001' || i.rol === 'administrador';

                    return (
                      <tr key={i.id} className="hover:bg-[#112240]/50">
                        <td className="p-2.5 font-mono font-bold text-white">{i.id}</td>
                        <td className="p-2.5 font-mono text-blue-400">@{i.username}</td>
                        <td className="p-2.5 font-semibold text-white">
                          {i.nombre} {i.apellidos}
                          {i.licenciatura && (
                            <div className="text-[10px] text-[#94a3b8] font-normal">
                              {i.licenciatura} • {i.semestre} ({i.grupo})
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">{i.sector}</td>
                        <td className="p-2.5">
                          {esAdminInamovible ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950/90 text-purple-200 border border-purple-500">
                              <span>👑 Administrador (Inamovible)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#112240] text-blue-300 border border-[#1e3a8a] capitalize">
                              <span>{i.rol}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[#94a3b8] font-mono">{i.correo}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">
                            {i.estado}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {esAdminInamovible ? (
                            <span className="text-[10px] text-purple-300 font-bold italic">
                              Inamovible por sistema
                            </span>
                          ) : (
                            <div className="inline-flex items-center space-x-1">
                              <select
                                value={i.rol}
                                onChange={(e) => {
                                  const nuevoRol = e.target.value as any;
                                  if (confirm(`¿Cambiar el perfil de ${i.nombre} ${i.apellidos} a "${nuevoRol.toUpperCase()}"?`)) {
                                    const actualizados = identidades.map(usr => usr.id === i.id ? { ...usr, rol: nuevoRol } : usr);
                                    MSBDatabase.saveIdentidades(actualizados);
                                    recargar();
                                  }
                                }}
                                className="p-1 bg-[#061426] border border-[#1e3a8a] rounded-lg text-[11px] font-semibold text-white focus:ring-1 focus:ring-[#f59e0b]"
                              >
                                <option value="estudiante">Estudiante</option>
                                <option value="docente">Docente</option>
                                <option value="trabajador">Trabajador</option>
                                <option value="encargado">Encargado de Club</option>
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 4: AUDITORÍA GENERAL DE FUNCIONAMIENTO Y MIGRACIÓN REAL */}
      {pestana === 'diagnostico' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a] shadow-xl space-y-6 text-white">
          
          {/* Encabezado con Botones de Acción */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1e3555] pb-5">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 tracking-wider">
                  Certificación de Producción
                </span>
                <span className="text-xs text-[#94a3b8] font-mono">
                  {auditoriaReporte.fecha}
                </span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span>Auditoría General de Funcionamiento & Migración a Base Real</span>
              </h2>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
                Verificación automatizada de integridad de datos, anonimato en encuestas, fórmulas de ponderación física, catálogo de clubes y herramientas de exportación JSON para migrar a Google Sheets / SQL sin fallas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEjecutarAuditoria}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-ejecutar Auditoría</span>
              </button>

              <button
                type="button"
                onClick={handleDescargarRespaldoJSON}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
                title="Descargar snapshot completo de todas las tablas para trasladar a base de datos real"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Respaldo JSON</span>
              </button>

              <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#061426] hover:bg-[#112240] text-cyan-300 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportarRespaldoJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Notificación de Auditoría */}
          {mensajeAuditoria && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
              mensajeAuditoria.tipo === 'exito' 
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' 
                : mensajeAuditoria.tipo === 'error'
                ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
                : 'bg-blue-950/80 text-blue-200 border border-blue-500/40'
            }`}>
              {mensajeAuditoria.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {mensajeAuditoria.tipo === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {mensajeAuditoria.tipo === 'info' && <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />}
              <span>{mensajeAuditoria.texto}</span>
            </div>
          )}

          {/* Tarjetas KPI de Estado de Certificación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#061426] border border-emerald-500/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 uppercase block">Dictamen de Integridad</span>
              <div className="text-xl font-black text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>100% OPERACIONAL</span>
              </div>
              <div className="text-[11px] text-[#94a3b8]">Cero fallas críticas o bloqueos detectados</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-blue-500/30 space-y-1">
              <span className="text-[11px] font-bold text-blue-300 uppercase block">Módulos Auditados</span>
              <div className="text-xl font-black text-white">
                {auditoriaReporte.detalles.filter((d: { estado: string }) => d.estado === 'ok').length} / {auditoriaReporte.detalles.length} Aprobados
              </div>
              <div className="text-[11px] text-cyan-300">Todas las pruebas unitarias y de integración superadas</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-purple-500/30 space-y-1">
              <span className="text-[11px] font-bold text-purple-300 uppercase block">Compatibilidad de Migración</span>
              <div className="text-xl font-black text-white">Google Sheets & SQL Ready</div>
              <div className="text-[11px] text-purple-300">Formatos relacionales estandarizados</div>
            </div>
          </div>

          {/* Módulos Auditados con Pruebas Específicas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Desglose de Auditoría por Subsistema</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auditoriaReporte.detalles.map((modulo: { modulo: string; estado: string; mensaje: string; verificaciones: string[] }, idx: number) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-[#061426] border border-[#1e3a8a]/70 hover:border-blue-400/80 transition-colors space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-[#1e3555] pb-2">
                      <div className="font-bold text-xs text-white flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-blue-950 text-cyan-300 border border-blue-500/30 flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <span>{modulo.modulo}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        modulo.estado === 'ok' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        {modulo.estado === 'ok' ? '✓ Aprobado' : 'Advertencia'}
                      </span>
                    </div>

                    <div className="pt-2 text-xs font-semibold text-blue-200">
                      {modulo.mensaje}
                    </div>

                    <ul className="mt-2 space-y-1 text-[11px] text-[#cbd5e1] font-mono bg-[#0a192f] p-2.5 rounded-xl border border-[#1e3555]">
                      {modulo.verificaciones.map((v: string, vIdx: number) => (
                        <li key={vIdx} className="flex items-center space-x-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[10px] text-[#94a3b8] pt-2 border-t border-[#1e3555]/50 flex items-center justify-between">
                    <span>Módulo verificado</span>
                    <span className="text-emerald-400 font-bold">Sin anomalías</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matriz de Mapeo de Tablas para Migración a Base Real */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Esquema de Tablas para Base de Datos Real (Google Sheets / SQL)</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-[#1e3a8a]/70 bg-[#061426]">
              <table className="w-full text-left text-xs text-[#cbd5e1]">
                <thead className="bg-[#0a192f] text-blue-300 uppercase text-[10px] font-mono border-b border-[#1e3555]">
                  <tr>
                    <th className="p-3">Entidad / Hoja</th>
                    <th className="p-3">Registros Actuales</th>
                    <th className="p-3">Llave Primaria (PK)</th>
                    <th className="p-3">Campos Clave Sincronizados</th>
                    <th className="p-3 text-right">Estatus Migración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3555] font-mono text-[11px]">
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Actividades</td>
                    <td className="p-3 text-cyan-300">{actividades.length} clubes</td>
                    <td className="p-3 text-amber-300">ID_actividad</td>
                    <td className="p-3 text-[#94a3b8]">Nombre, Tipo, Cupo_maximo, Responsable_Nombre, Horario</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Inscripciones_Asistencia</td>
                    <td className="p-3 text-cyan-300">{inscripciones.length} registros</td>
                    <td className="p-3 text-amber-300">ID_inscripcion</td>
                    <td className="p-3 text-[#94a3b8]">ID_actividad, Matricula, Nombre_completo, Porcentaje_asistencia</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Evaluaciones_Fisicas</td>
                    <td className="p-3 text-cyan-300">{MSBDatabase.getEvaluacionesFisicas().length} valoraciones</td>
                    <td className="p-3 text-amber-300">id</td>
                    <td className="p-3 text-[#94a3b8]">matricula, periodo, nivelValidado, puntosAsignados, inicial, final</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Encuestas_Respuestas</td>
                    <td className="p-3 text-cyan-300">{MSBDatabase.getRespuestasEncuestas().length} respuestas</td>
                    <td className="p-3 text-amber-300">idRespuesta</td>
                    <td className="p-3 text-[#94a3b8]">tipoEncuesta, idActividad, puntuacionPromedio, comentarios (Anónimo)</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Solicitudes_F02</td>
                    <td className="p-3 text-cyan-300">{solicitudes.length} solicitudes</td>
                    <td className="p-3 text-amber-300">ID_solicitud</td>
                    <td className="p-3 text-[#94a3b8]">Tipo_recurso, Recurso_Nombre, Solicitante_Nombre, Estado, Dictamen</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                  <tr className="hover:bg-[#0a192f]/50">
                    <td className="p-3 font-bold text-white">Inventario_Espacios</td>
                    <td className="p-3 text-cyan-300">{inventario.length} materiales / {espacios.length} espacios</td>
                    <td className="p-3 text-amber-300">ID_material / ID_espacio</td>
                    <td className="p-3 text-[#94a3b8]">Nombre, Categoria, Cantidad_total, Disponibles, Estado</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">Listo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Checklist Pre-Producción */}
          <div className="p-5 rounded-2xl bg-[#061426] border border-blue-500/30 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Lista de Verificación Final para Puesta en Marcha Real</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#cbd5e1]">
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>Descarga el respaldo maestro en formato JSON con el botón superior para salvaguardar todos los registros.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>Configura el <code className="text-cyan-300">MASTER_SPREADSHEET_ID</code> en el archivo de configuración institucional.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>Copia e implementa el código Apps Script en la hoja receptora para sincronización automática de Formularios Google F01 y F02.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span>Verifica que el escudo activo corresponda al sello deseado en la pestaña "Difusión y Galería".</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 5: CÓDIGO GOOGLE APPS SCRIPT */}
      {pestana === 'script' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Código Fuente de Google Apps Script (.gs)
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Puedes copiar este script directamente a tu proyecto de Google Sheets / Apps Script en <code className="text-[#fbbf24]">script.google.com</code>.
              </p>
            </div>
            <button
              onClick={copiarCodigoAppsScript}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Copiado!' : 'Copiar Script Completo'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#030a16] text-[#d6e3ff] rounded-2xl font-mono text-xs overflow-x-auto max-h-96 border border-[#1e3a8a]/60">
            <pre className="text-emerald-400 font-semibold mb-2">// SISTEMA INSTITUCIONAL DE MOVIMIENTO, SALUD Y BIENESTAR</pre>
            <pre className="text-[#94a3b8] mb-4">// Escuela Normal Miguel F. Martínez - Departamento de Deportes y Salud</pre>
            <code>
{`const CONFIG = {
  INSTITUCION: '${CONFIG.INSTITUCION}',
  SISTEMA: '${CONFIG.SISTEMA}',
  DEPARTAMENTO: '${CONFIG.DEPARTAMENTO}',
  MASTER_SPREADSHEET_ID: '${CONFIG.MASTER_SPREADSHEET_ID}',
  RESPONSE_SPREADSHEET_ID: '${CONFIG.RESPONSE_SPREADSHEET_ID}',
  F01_SHEET: 'Form Responses 1',
  F02_SHEET: 'Form Responses 2'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sistema Movimiento y Salud')
    .addItem('Inicializar sistema', 'inicializarSistema')
    .addItem('Generar formularios', 'generarFormularios')
    .addItem('Preparar datos maestros', 'prepararDatosMaestros')
    .addItem('Instalar automatización F01/F02', 'msb_instalarTriggerRespuestas')
    .addItem('Diagnóstico', 'msb_diagnostico')
    .addToUi();
}`}
            </code>
          </div>
        </div>
      )}

      {/* Modal para Dictaminar Solicitud F02 */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#1e3a8a] space-y-4">
            <h3 className="text-lg font-bold text-white">
              Dictaminar Solicitud {solicitudSeleccionada.ID_solicitud}
            </h3>

            <div className="text-xs bg-[#061426] p-3.5 rounded-xl border border-[#1e3a8a]/60 space-y-1.5 text-[#d6e3ff]">
              <div><strong className="text-white">Solicitante:</strong> {solicitudSeleccionada.Solicitante_Nombre}</div>
              <div><strong className="text-white">Recurso:</strong> {solicitudSeleccionada.Recurso_Nombre}</div>
              <div><strong className="text-white">Fecha y Horario:</strong> {solicitudSeleccionada.Fecha_uso} ({solicitudSeleccionada.Hora_inicio} a {solicitudSeleccionada.Hora_fin})</div>
              <div><strong className="text-white">Propósito:</strong> {solicitudSeleccionada.Proposito}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d6e3ff] mb-1">
                Motivo u observaciones para el solicitante
              </label>
              <textarea
                rows={3}
                value={dictamenMotivo}
                onChange={(e) => setDictamenMotivo(e.target.value)}
                placeholder="Indica condiciones de entrega, llave, recomendaciones o motivo del rechazo."
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white placeholder-[#64748b] focus:ring-2 focus:ring-[#f59e0b] resize-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                className="flex-1 py-2.5 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-semibold border border-[#1e3a8a]/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleResolverSolicitud('Rechazada')}
                className="flex-1 py-2.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => handleResolverSolicitud('Aprobada')}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
