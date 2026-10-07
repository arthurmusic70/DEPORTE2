import React, { useState } from 'react';
import { SesionUsuario, Solicitud, Espacio, MaterialInventario } from '../types';
import { MSBDatabase, CONFIG, calcularPrioridadSolicitud } from '../utils/storage';
import { 
  Box, 
  MapPin, 
  Package, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  History,
  Layers,
  Info,
  ShieldAlert,
  Crown,
  Check,
  X,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';

interface SolicitudesViewProps {
  usuario: SesionUsuario;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({ usuario }) => {
  const esAdmin = usuario.rol === 'administrador';
  const [espacios, setEspacios] = useState<Espacio[]>(MSBDatabase.getEspacios());
  const [inventario, setInventario] = useState<MaterialInventario[]>(MSBDatabase.getInventario());
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(MSBDatabase.getSolicitudes());
  const [vistaAdmin, setVistaAdmin] = useState<'dictamen' | 'formulario'>(esAdmin ? 'dictamen' : 'formulario');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'Pendiente' | 'Aprobada' | 'Rechazada'>('todas');
  const [solicitudDictamen, setSolicitudDictamen] = useState<Solicitud | null>(null);
  const [motivoDictamen, setMotivoDictamen] = useState<string>('');

  React.useEffect(() => {
    const handleActualizar = () => {
      setEspacios(MSBDatabase.getEspacios());
      setInventario(MSBDatabase.getInventario());
      setSolicitudes(MSBDatabase.getSolicitudes());
    };
    window.addEventListener('msb_datos_actualizados', handleActualizar);
    return () => window.removeEventListener('msb_datos_actualizados', handleActualizar);
  }, []);

  const handleResolverDirecto = (idSolicitud: string, nuevoEstado: 'Aprobada' | 'Rechazada' | 'Pendiente') => {
    MSBDatabase.updateSolicitudStatus(
      idSolicitud,
      nuevoEstado,
      nuevoEstado === 'Aprobada' 
        ? 'Aprobada conforme a disponibilidad de espacios y materiales del departamento.' 
        : nuevoEstado === 'Rechazada' 
        ? 'No disponible en el horario o recurso solicitado.' 
        : 'En espera de dictamen oficial.',
      usuario.id
    );
    setSolicitudes(MSBDatabase.getSolicitudes());
  };

  const handleGuardarDictamenModal = (nuevoEstado: 'Aprobada' | 'Rechazada') => {
    if (!solicitudDictamen) return;
    MSBDatabase.updateSolicitudStatus(
      solicitudDictamen.ID_solicitud,
      nuevoEstado,
      motivoDictamen.trim() || (nuevoEstado === 'Aprobada' ? 'Aprobada oficialmente.' : 'Rechazada por el departamento.'),
      usuario.id
    );
    setSolicitudes(MSBDatabase.getSolicitudes());
    setSolicitudDictamen(null);
    setMotivoDictamen('');
  };

  // Form State
  const [tipoSolicitud, setTipoSolicitud] = useState<'Espacio' | 'Material' | 'Espacio y material'>('Espacio');
  const [espacioId, setEspacioId] = useState<string>(espacios[0]?.ID_espacio || '');
  const [materialId, setMaterialId] = useState<string>(inventario[0]?.ID_material || '');
  const [fechaUso, setFechaUso] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('09:00');
  const [horaFin, setHoraFin] = useState<string>('11:00');
  const [cantidad, setCantidad] = useState<string>('1');
  const [actividadRelacionada, setActividadRelacionada] = useState<string>('');
  const [proposito, setProposito] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  // Para rol Administrador: selección explícita y verificación del perfil con el que solicita
  const [perfilAdminSolicitante, setPerfilAdminSolicitante] = useState<'direccion' | 'deportiva' | 'docente' | 'comunidad'>('direccion');

  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User's own requests
  const misSolicitudes = solicitudes.filter(s => s.Solicitante_ID === usuario.id);

  // Prioridad calculada en tiempo real
  const prioridadActual = calcularPrioridadSolicitud(
    usuario.rol, 
    `${actividadRelacionada} ${proposito}`,
    usuario.rol === 'administrador' ? perfilAdminSolicitante : undefined
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!fechaUso) {
      setError('Por favor indica la fecha de uso o préstamo.');
      return;
    }

    if (!proposito.trim()) {
      setError('Por favor describe el propósito de la solicitud.');
      return;
    }

    let recursoID = '';
    let recursoNombre = '';

    if (tipoSolicitud === 'Espacio') {
      const esp = espacios.find(e => e.ID_espacio === espacioId);
      recursoID = espacioId;
      recursoNombre = esp ? esp.Nombre : espacioId;
    } else if (tipoSolicitud === 'Material') {
      const mat = inventario.find(m => m.ID_material === materialId);
      recursoID = materialId;
      recursoNombre = mat ? `${mat.Nombre_material} (${cantidad} ${mat.Unidad})` : materialId;
    } else {
      const esp = espacios.find(e => e.ID_espacio === espacioId);
      const mat = inventario.find(m => m.ID_material === materialId);
      recursoID = `${espacioId} / ${materialId}`;
      recursoNombre = `${esp?.Nombre || espacioId} + ${mat?.Nombre_material || materialId} (${cantidad})`;
    }

    setEnviando(true);
    try {
      const res = await MSBDatabase.submitSolicitud({
        solicitanteID: usuario.id,
        solicitanteNombre: `${usuario.nombre} ${usuario.apellidos}`,
        solicitanteRol: usuario.rol,
        tipoSolicitud,
        recursoID,
        recursoNombre,
        fechaUso,
        horaInicio,
        horaFin,
        cantidad,
        actividadRelacionada,
        proposito,
        observaciones,
        perfilSolicitudAdmin: usuario.rol === 'administrador' ? perfilAdminSolicitante : undefined
      });

      if (res.ok) {
        setMensajeExito(res.mensaje);
        setSolicitudes(MSBDatabase.getSolicitudes());
        // Reset form
        setProposito('');
        setObservaciones('');
        setActividadRelacionada('');
      } else {
        setError(res.mensaje);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Encabezado del módulo */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Formulario 02 Oficial
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Solicitud de espacios y materiales
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
              {CONFIG.INSTITUCION} • {CONFIG.DEPARTAMENTO}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-[#061426] text-amber-300 px-4 py-2.5 rounded-2xl text-xs border border-amber-500/30 shadow-inner">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>La solicitud NO constituye una autorización automática. El Departamento revisará disponibilidad.</span>
          </div>
        </div>
      </div>

      {/* Selector de modo para Administrador: Dictamen de Solicitudes vs Generar Solicitud */}
      {esAdmin && (
        <div className="flex items-center space-x-2 border-b border-[#1e3a8a]/60 pb-3">
          <button
            onClick={() => setVistaAdmin('dictamen')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              vistaAdmin === 'dictamen'
                ? 'bg-[#1e3a8a] text-white shadow-lg border border-blue-400'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/40'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Dictamen y Aprobación Institucional F02</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold">
              {solicitudes.filter(s => s.Estado === 'Pendiente').length} pendientes
            </span>
          </button>

          <button
            onClick={() => setVistaAdmin('formulario')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              vistaAdmin === 'formulario'
                ? 'bg-[#1e3a8a] text-white shadow-lg border border-blue-400'
                : 'bg-[#0a192f] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/40'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Generar Solicitud de Espacio/Material</span>
          </button>
        </div>
      )}

      {/* VISTA ADMINISTRATIVA: DICTAMEN DE TODAS LAS SOLICITUDES */}
      {esAdmin && vistaAdmin === 'dictamen' ? (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <Box className="w-5 h-5 text-cyan-400" />
                <span>Panel de Autorización y Dictamen de Solicitudes F02</span>
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Revisa disponibilidad de espacios y materiales, aprueba o desaprueba peticiones con sincronización en tiempo real a Google Sheets.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                Total: {solicitudes.length} registros
              </span>
            </div>
          </div>

          {/* Filtros de Estado */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#1e3555]">
            {(['todas', 'Pendiente', 'Aprobada', 'Rechazada'] as const).map((est) => {
              const cant = est === 'todas' 
                ? solicitudes.length 
                : solicitudes.filter(s => s.Estado === est).length;
              return (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    filtroEstado === est
                      ? 'bg-blue-600 text-white shadow-xs border border-blue-400'
                      : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/60'
                  }`}
                >
                  <span>{est === 'todas' ? 'Todas las solicitudes' : est + 's'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filtroEstado === est ? 'bg-blue-800 text-white' : 'bg-[#112240] text-[#94a3b8]'
                  }`}>
                    {cant}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tabla de Dictamen */}
          <div className="overflow-x-auto rounded-2xl border border-[#1e3a8a]/60">
            <table className="w-full text-left text-xs text-[#d6e3ff] border-collapse">
              <thead>
                <tr className="bg-[#061426] border-b border-[#1e3a8a]/60 text-[#94a3b8] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Folio</th>
                  <th className="py-3 px-3">Prioridad</th>
                  <th className="py-3 px-3">Solicitante</th>
                  <th className="py-3 px-3">Recurso</th>
                  <th className="py-3 px-3">Fecha y Horario</th>
                  <th className="py-3 px-3">Propósito</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Dictamen y Selector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a8a]/30">
                {solicitudes
                  .filter(s => filtroEstado === 'todas' || s.Estado === filtroEstado)
                  .map((sol) => (
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
                      <div className="text-[10px] text-[#94a3b8] font-mono">{sol.Solicitante_Rol} • {sol.Solicitante_ID}</div>
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
                      <div className="flex items-center justify-end space-x-1.5 flex-nowrap">
                        {/* Selector de Estado Selector Dropdown */}
                        <select
                          value={sol.Estado}
                          onChange={(e) => handleResolverDirecto(sol.ID_solicitud, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            sol.Estado === 'Aprobada'
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                              : sol.Estado === 'Rechazada'
                              ? 'bg-red-950/90 text-red-300 border-red-500/50'
                              : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                          }`}
                          title="Selector de dictamen oficial"
                        >
                          <option value="Pendiente" className="bg-[#0a192f] text-amber-300 font-bold">⏳ Pendiente</option>
                          <option value="Aprobada" className="bg-[#0a192f] text-emerald-300 font-bold">✓ Aprobada</option>
                          <option value="Rechazada" className="bg-[#0a192f] text-red-300 font-bold">✕ Rechazada</option>
                        </select>

                        {/* Botón directo Aprobar */}
                        <button
                          onClick={() => handleResolverDirecto(sol.ID_solicitud, 'Aprobada')}
                          title="Aprobar solicitud de inmediato"
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            sol.Estado === 'Aprobada'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                          }`}
                        >
                          ✓ Aprobar
                        </button>

                        {/* Botón directo Rechazar / Desaprobar */}
                        <button
                          onClick={() => handleResolverDirecto(sol.ID_solicitud, 'Rechazada')}
                          title="Desaprobar o rechazar solicitud"
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            sol.Estado === 'Rechazada'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40'
                          }`}
                        >
                          ✕ Rechazar
                        </button>

                        {/* Botón Dictamen con Observaciones */}
                        <button
                          onClick={() => {
                            setSolicitudDictamen(sol);
                            setMotivoDictamen(sol.Motivo_observaciones || '');
                          }}
                          title="Dictamen con observaciones detalladas o condiciones"
                          className="px-2 py-1 bg-[#112240] hover:bg-[#1a3258] text-[#cbd5e1] hover:text-white rounded-lg text-xs border border-[#1e3a8a] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Observaciones...
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario Interactivo Oficial F02 */}
          <div className="lg:col-span-7 bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl text-white">
          
          <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Generar nueva solicitud</span>
          </h2>

          {mensajeExito && (
            <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-start space-x-3 text-emerald-200 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">¡Solicitud enviada con éxito!</p>
                <p className="mt-0.5">{mensajeExito}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-start space-x-3 text-red-200 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
            
            {/* SECCIÓN 1: Solicitante (Prellenado) & Verificación Explícita de Perfil para Administrador */}
            <div className="p-4 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-3">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Datos del Solicitante & Verificación de Perfil</span>
                <span className="text-[11px] text-[#64748b] font-normal">Identificación institucional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#cbd5e1]">
                <div><strong>Solicitante:</strong> <span className="text-white">{usuario.nombre} {usuario.apellidos}</span></div>
                <div><strong>ID:</strong> <span className="font-mono text-cyan-300">{usuario.id}</span></div>
                <div><strong>Sector:</strong> {usuario.sector}</div>
                <div><strong>Rol:</strong> <span className="capitalize font-semibold text-amber-300">{usuario.rol}</span></div>
              </div>

              {/* Si es Administrador: Selector explícito obligatorio del perfil con el cual solicita */}
              {usuario.rol === 'administrador' && (
                <div className="p-3 bg-blue-950/50 rounded-xl border border-blue-500/30 space-y-2">
                  <label className="block text-xs font-bold text-blue-200">
                    Verificar Perfil de Solicitud (Administrador):
                  </label>
                  <p className="text-[11px] text-[#94a3b8] leading-tight">
                    Por defecto el Administrador ejerce la autoridad de <strong>Dirección Institucional (Prioridad Total 0)</strong>. Si realiza la solicitud como docente o encargado deportivo, especifíquelo aquí:
                  </p>
                  <select
                    value={perfilAdminSolicitante}
                    onChange={(e) => setPerfilAdminSolicitante(e.target.value as any)}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="direccion" className="bg-[#061426] text-white">👑 Administrador / Dirección Institucional (Prioridad Total - Nivel 0)</option>
                    <option value="deportiva" className="bg-[#061426] text-white">⚽ Encargado Deportivo / Entrenador de Club (Prioridad 1)</option>
                    <option value="docente" className="bg-[#061426] text-white">🎓 Docente Formativo / Práctica Académica (Prioridad 2)</option>
                    <option value="comunidad" className="bg-[#061426] text-white">👥 Personal / Comunidad Normalista (Prioridad 3)</option>
                  </select>
                </div>
              )}

              {/* Indicador de Jerarquía de Prioridad Oficial */}
              <div className="pt-2 border-t border-[#1e3555]">
                <div className="flex items-center justify-between bg-[#0a192f] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="flex items-center space-x-2">
                    {prioridadActual.nivel === 0 ? <Crown className="w-4 h-4 text-amber-400" /> : <ShieldAlert className="w-4 h-4 text-cyan-400" />}
                    <span className="text-xs font-semibold text-[#cbd5e1]">Jerarquía calculada:</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    prioridadActual.nivel === 0 ? 'bg-purple-950 text-purple-200 border border-purple-500/40' :
                    prioridadActual.nivel === 1 ? 'bg-blue-950 text-blue-200 border border-blue-500/40' :
                    prioridadActual.nivel === 2 ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40' :
                    'bg-gray-800 text-gray-300 border border-gray-600'
                  }`}>
                    {prioridadActual.etiqueta}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">
                  Regla institucional: 0-Dirección (Total) &gt; 1-Deportes &gt; 2-Docentes &gt; 3-Comunidad.
                </p>
              </div>
            </div>

            {/* SECCIÓN 2: Tipo de Solicitud */}
            <div>
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                2. ¿Qué deseas solicitar? *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Espacio', 'Material', 'Espacio y material'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoSolicitud(tipo)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      tipoSolicitud === tipo
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-[#061426] border-[#1e3555] text-[#cbd5e1] hover:bg-[#112240] hover:text-white'
                    }`}
                  >
                    {tipo === 'Espacio' && <MapPin className="w-4 h-4 text-cyan-400" />}
                    {tipo === 'Material' && <Package className="w-4 h-4 text-amber-400" />}
                    {tipo === 'Espacio y material' && <Layers className="w-4 h-4 text-emerald-400" />}
                    <span>{tipo}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Espacio si aplica */}
            {(tipoSolicitud === 'Espacio' || tipoSolicitud === 'Espacio y material') && (
              <div className="space-y-1.5 p-4 bg-[#061426] rounded-2xl border border-blue-500/30">
                <label className="block text-xs font-bold text-blue-200">
                  Selecciona el Espacio Institucional *
                </label>
                <select
                  value={espacioId}
                  onChange={(e) => setEspacioId(e.target.value)}
                  className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {espacios.map((esp) => (
                    <option key={esp.ID_espacio} value={esp.ID_espacio} className="bg-[#0a192f] text-white">
                      {esp.Nombre} ({esp.Ubicacion}) — Cap. {esp.Capacidad} personas
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#94a3b8]">
                  Equipamiento: {espacios.find(e => e.ID_espacio === espacioId)?.Equipamiento}
                </p>
              </div>
            )}

            {/* Selector de Material si aplica */}
            {(tipoSolicitud === 'Material' || tipoSolicitud === 'Espacio y material') && (
              <div className="space-y-3 p-4 bg-[#061426] rounded-2xl border border-purple-500/30">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Selecciona el Material o Equipo *
                  </label>
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {inventario.map((mat) => (
                      <option key={mat.ID_material} value={mat.ID_material} className="bg-[#0a192f] text-white">
                        {mat.Nombre_material} — {mat.Cantidad_disponible} disponibles ({mat.Condicion})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Cantidad solicitada
                  </label>
                  <input
                    type="text"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej. 2 balones, 1 equipo"
                    className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 3: Fecha y Horario */}
            <div className="p-4 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-3">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                3. Fecha y Horario de Préstamo / Uso
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                  Fecha de uso *
                </label>
                <input
                  type="date"
                  required
                  value={fechaUso}
                  onChange={(e) => setFechaUso(e.target.value)}
                  className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Hora de inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Hora de término *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: Propósito */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  4. Actividad relacionada
                </label>
                <input
                  type="text"
                  value={actividadRelacionada}
                  onChange={(e) => setActividadRelacionada(e.target.value)}
                  placeholder="Ej. Taller deportivo, práctica docente, ensayo de danza o convivencia..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  Propósito o descripción de la solicitud *
                </label>
                <textarea
                  rows={3}
                  required
                  value={proposito}
                  onChange={(e) => setProposito(e.target.value)}
                  placeholder="Detalla para qué necesitas el espacio o material y quiénes participarán."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  Observaciones adicionales
                </label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Requerimientos especiales, horarios de recolección, etc."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {enviando ? (
                <span>Registrando solicitud F02...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar solicitud al Departamento</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Panel Lateral: Historial de Solicitudes Realizadas */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a]/60 shadow-xl text-white">
            <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Mis solicitudes registradas</span>
            </h2>

            {misSolicitudes.length === 0 ? (
              <div className="p-6 bg-[#061426] rounded-2xl text-center text-xs text-[#94a3b8] border border-dashed border-[#1e3555]">
                Aún no has generado solicitudes de espacios o materiales.
              </div>
            ) : (
              <div className="space-y-3">
                {misSolicitudes.map((sol) => (
                  <div
                    key={sol.ID_solicitud}
                    className="p-4 rounded-2xl border border-[#1e293b] hover:border-blue-400 transition-all bg-[#061426] text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-white">{sol.ID_solicitud}</span>
                        {sol.Prioridad_Etiqueta && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0a192f] text-cyan-300 border border-blue-500/30">
                            {sol.Prioridad_Etiqueta}
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        sol.Estado === 'Aprobada'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : sol.Estado === 'Rechazada'
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        {sol.Estado}
                      </span>
                    </div>

                    <div className="font-semibold text-white">
                      {sol.Recurso_Nombre || sol.ID_recurso}
                    </div>

                    <div className="text-[#94a3b8] space-y-0.5 text-[11px]">
                      <div>Fecha de uso: <strong className="text-white">{sol.Fecha_uso}</strong> ({sol.Hora_inicio} a {sol.Hora_fin})</div>
                      <div>Tipo: {sol.Tipo_solicitud}</div>
                      {sol.Cantidad && <div>Cantidad: {sol.Cantidad}</div>}
                    </div>

                    {sol.Motivo_observaciones && (
                      <div className="p-2.5 bg-[#0a192f] rounded-xl border border-[#1e3555] text-[11px] text-[#cbd5e1]">
                        <strong className="text-cyan-300">Dictamen Departamento:</strong> {sol.Motivo_observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información de los Espacios */}
          <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a]/60 shadow-xl text-white">
            <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3">
              Espacios disponibles en campus
            </h3>
            <div className="space-y-2.5">
              {espacios.map((esp) => (
                <div key={esp.ID_espacio} className="text-xs border-b border-[#1e3555] pb-2.5 last:border-0 last:pb-0">
                  <div className="font-semibold text-white">{esp.Nombre}</div>
                  <div className="text-[#94a3b8] text-[11px]">{esp.Ubicacion} • Capacidad: {esp.Capacidad}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      )}

      {/* Modal para Dictaminar Solicitud F02 */}
      {solicitudDictamen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                <span>Dictaminar Solicitud {solicitudDictamen.ID_solicitud}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSolicitudDictamen(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs bg-[#061426] p-3.5 rounded-xl border border-[#1e3a8a]/60 space-y-1.5 text-[#d6e3ff]">
              <div><strong className="text-white">Solicitante:</strong> {solicitudDictamen.Solicitante_Nombre} ({solicitudDictamen.Solicitante_Rol})</div>
              <div><strong className="text-white">Recurso:</strong> {solicitudDictamen.Recurso_Nombre}</div>
              <div><strong className="text-white">Fecha y Horario:</strong> {solicitudDictamen.Fecha_uso} ({solicitudDictamen.Hora_inicio} a {solicitudDictamen.Hora_fin})</div>
              <div><strong className="text-white">Propósito:</strong> {solicitudDictamen.Proposito}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d6e3ff] mb-1">
                Motivo u observaciones para el solicitante
              </label>
              <textarea
                rows={3}
                value={motivoDictamen}
                onChange={(e) => setMotivoDictamen(e.target.value)}
                placeholder="Indica condiciones de entrega, llave, recomendaciones o motivo de desaprobación."
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white placeholder-[#64748b] focus:ring-2 focus:ring-[#f59e0b] resize-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSolicitudDictamen(null)}
                className="flex-1 py-2.5 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-semibold border border-[#1e3a8a]/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleGuardarDictamenModal('Rechazada')}
                className="flex-1 py-2.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ✕ Desaprobar
              </button>
              <button
                type="button"
                onClick={() => handleGuardarDictamenModal('Aprobada')}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                ✓ Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
