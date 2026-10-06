import React, { useState } from 'react';
import { Actividad, SesionUsuario, InscripcionAsistencia } from '../types';
import { MSBDatabase, getGoogleCalendarLink, CONFIG } from '../utils/storage';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  CalendarPlus, 
  Filter, 
  Search, 
  Check, 
  ChevronRight, 
  Info,
  Camera
} from 'lucide-react';
import { GaleriaDifusion } from './GaleriaDifusion';

interface ActividadesViewProps {
  usuario: SesionUsuario;
  onActualizarDatos?: () => void;
}

export const ActividadesView: React.FC<ActividadesViewProps> = ({ usuario, onActualizarDatos }) => {
  const [actividades, setActividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [inscripciones, setInscripciones] = useState<InscripcionAsistencia[]>(MSBDatabase.getInscripciones());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal Formulario F01
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [tipoParticipacion, setTipoParticipacion] = useState<string>('Inscripción a actividad');
  const [observaciones, setObservaciones] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorF01, setErrorF01] = useState<string | null>(null);

  const recargar = () => {
    setActividades(MSBDatabase.getActividades());
    setInscripciones(MSBDatabase.getInscripciones());
    if (onActualizarDatos) onActualizarDatos();
  };

  React.useEffect(() => {
    const handleActualizar = () => {
      setActividades(MSBDatabase.getActividades());
      setInscripciones(MSBDatabase.getInscripciones());
    };
    window.addEventListener('msb_datos_actualizados', handleActualizar);
    return () => window.removeEventListener('msb_datos_actualizados', handleActualizar);
  }, []);

  // Find user's enrollment for a given activity
  const obtenerInscripcion = (idActividad: string) => {
    return inscripciones.find(
      ins => ins.ID_actividad === idActividad && ins.ID_participante === usuario.id && ins.Estado_inscripcion !== 'Cancelada'
    );
  };

  const handleInscribir = (act: Actividad) => {
    setActividadSeleccionada(act);
    setTipoParticipacion('Inscripción a actividad');
    setObservaciones('');
    setMensajeExito(null);
    setErrorF01(null);
  };

  const enviarFormularioF01 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadSeleccionada) return;

    setEnviando(true);
    setErrorF01(null);

    try {
      const res = MSBDatabase.registerActivity(
        usuario.id,
        actividadSeleccionada.ID_actividad,
        tipoParticipacion,
        observaciones
      );

      if (res.ok) {
        setMensajeExito(res.mensaje);
        recargar();
      } else {
        setErrorF01(res.mensaje);
      }
    } catch (err: any) {
      setErrorF01(err?.message || 'Error al procesar inscripción.');
    } finally {
      setEnviando(false);
    }
  };

  // Filtrado de actividades
  const actividadesFiltradas = actividades.filter(act => {
    const coincideTipo = filtroTipo === 'todos' || act.Tipo === filtroTipo;
    const coincideBusqueda = 
      act.Nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      act.Descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      act.ID_actividad.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Tarjeta de Bienvenida del Participante con Estilo Oscuro Ejecutivo */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-blue-400 tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Portal del Participante Normalista</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Bienvenido, {usuario.nombre} {usuario.apellidos}.
            </h2>
            <div className="mt-2 flex flex-wrap gap-y-1.5 gap-x-4 text-xs text-[#94a3b8]">
              <div><strong>Usuario:</strong> <span className="font-mono text-cyan-300">@{usuario.username}</span></div>
              <div><strong>ID:</strong> <span className="font-mono text-amber-300 font-semibold">{usuario.id}</span></div>
              <div><strong>Sector:</strong> <span className="text-white">{usuario.sector}</span></div>
              <div><strong>Cuenta:</strong> <span className="text-white">{usuario.tipoCuenta}</span></div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-[#061426] text-blue-300 px-4 py-2.5 rounded-2xl text-xs border border-[#1e3a8a] self-start sm:self-auto shadow-inner">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Sistema conectado con la Base Maestra de Google Sheets</span>
          </div>
        </div>
      </div>

      {/* Galería y Difusión Comunitaria */}
      <GaleriaDifusion />

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#0a192f] rounded-2xl p-4 border border-[#1e3a8a]/60 shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar actividad por nombre, ID o descripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs sm:text-sm text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-[#64748b] hidden sm:block shrink-0" />
          {['todos', 'Deportes', 'Salud', 'Bienestar', 'Pausas Activas', 'Torneo'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filtroTipo === tipo
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
              }`}
            >
              {tipo === 'todos' ? 'Todas' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Actividades Disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {actividadesFiltradas.length === 0 ? (
          <div className="col-span-full bg-[#0a192f] rounded-3xl p-10 text-center border border-[#1e3a8a]/60 text-[#94a3b8]">
            No se encontraron actividades con los filtros seleccionados.
          </div>
        ) : (
          actividadesFiltradas.map((act) => {
            const inscripcion = obtenerInscripcion(act.ID_actividad);
            const cupoOcupado = act.Cupo_ocupado || 0;
            const cupoDisponible = Math.max(0, act.Cupo - cupoOcupado);
            const porcentajeCupo = Math.min(100, Math.round((cupoOcupado / act.Cupo) * 100));

            return (
              <div 
                key={act.ID_actividad}
                className="bg-[#0a192f] rounded-3xl border border-[#1e3a8a]/60 hover:border-blue-400 shadow-xl transition-all p-5 sm:p-6 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30 mb-1.5 tracking-wider">
                        {act.Tipo}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug group-hover:text-blue-300 transition-colors">
                        {act.Nombre}
                      </h3>
                      <div className="text-[11px] text-[#64748b] font-mono mt-0.5">
                        ID: {act.ID_actividad}
                      </div>
                    </div>

                    {/* Badge de Inscripción del usuario */}
                    {inscripcion ? (
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 shadow-sm ${
                        inscripcion.Estado_inscripcion === 'Confirmada'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                        <span>{inscripcion.Estado_inscripcion === 'Confirmada' ? 'Inscrito' : 'Solicitada'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#061426] text-[#94a3b8] border border-[#1e3555] shrink-0">
                        No inscrito
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed mb-4">
                    {act.Descripcion}
                  </p>

                  {/* Metadatos: Horario, Fecha, Ubicación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#cbd5e1] mb-4 bg-[#061426] p-3.5 rounded-2xl border border-[#1e293b]">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{act.Hora_inicio} a {act.Hora_fin} hrs</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Inicio: {act.Fecha_inicio}</span>
                    </div>

                    <div className="flex items-center space-x-2 col-span-full">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{act.Espacio_Nombre || act.Espacio_ID}</span>
                    </div>
                  </div>

                  {/* Barra de Cupo */}
                  <div className="mb-4 bg-[#061426]/50 p-2.5 rounded-xl border border-[#1e293b]">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94a3b8] font-medium">Disponibilidad de cupo:</span>
                      <span className="font-bold text-white">
                        {cupoDisponible} de {act.Cupo} lugares libres
                      </span>
                    </div>
                    <div className="w-full bg-[#0d213f] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          porcentajeCupo > 85 ? 'bg-red-500' : porcentajeCupo > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${porcentajeCupo}%` }}
                      />
                    </div>
                  </div>

                  {/* Asistencia si está inscrito */}
                  {inscripcion && (
                    <div className="mb-4 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#94a3b8]">Registro: <span className="font-mono text-white">{inscripcion.ID_registro}</span></span>
                        <span className="font-medium">
                          Asistencia: <span className="font-bold text-cyan-300">{inscripcion.Asistencia}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-4 border-t border-[#1e3555] flex flex-wrap gap-2 items-center justify-between">
                  {/* Botón de Google Calendar */}
                  <a
                    href={getGoogleCalendarLink(act)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Añadir a Google Calendar"
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-[#cbd5e1] bg-[#061426] hover:bg-[#112240] hover:text-white rounded-xl border border-[#1e3555] transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Google Calendar</span>
                  </a>

                  {/* Botón de Inscripción F01 */}
                  {inscripcion ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-emerald-950/80 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 cursor-default"
                    >
                      ✓ Registrado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInscribir(act)}
                      disabled={cupoDisponible <= 0}
                      className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <span>Inscribirme (F01)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal / Dialog Oficial: Formulario 01 - Inscripción a Actividades */}
      {actividadSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] my-8 text-white">
            
            {/* Cabecera del Formulario Oficial F01 */}
            <div className="flex items-start justify-between border-b border-[#1e3555] pb-4 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Formulario 01 Oficial
                </span>
                <h3 className="text-xl font-bold text-white">
                  Inscripción a actividades
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {CONFIG.INSTITUCION} • {CONFIG.DEPARTAMENTO}
                </p>
              </div>
              <button
                onClick={() => setActividadSeleccionada(null)}
                className="p-1.5 rounded-full text-[#94a3b8] hover:text-white hover:bg-[#112240] transition-colors"
              >
                ✕
              </button>
            </div>

            {mensajeExito ? (
              <div className="p-6 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center space-y-4">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">
                  {mensajeExito}
                </h4>
                <p className="text-xs text-emerald-200">
                  Tu solicitud fue registrada en la hoja <code className="bg-emerald-900 px-1 py-0.5 rounded">Inscripciones_Asistencia</code>. El Departamento gestionará tu inscripción.
                </p>
                <button
                  type="button"
                  onClick={() => setActividadSeleccionada(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={enviarFormularioF01} className="space-y-4 text-xs sm:text-sm">
                
                {errorF01 && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-xl text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorF01}</span>
                  </div>
                )}

                {/* Sección 1: Identificación (Prellenada) */}
                <div className="bg-[#061426] p-3.5 rounded-2xl border border-[#1e293b] space-y-1.5">
                  <div className="font-semibold text-blue-300 text-xs">
                    1. Identificación del Participante
                  </div>
                  <div className="text-xs text-[#cbd5e1]">
                    <strong>Nombre:</strong> <span className="text-white">{usuario.nombre} {usuario.apellidos}</span>
                  </div>
                  <div className="text-xs text-[#cbd5e1]">
                    <strong>Sector:</strong> {usuario.sector} • <strong>Cuenta:</strong> {usuario.tipoCuenta}
                  </div>
                  <div className="text-xs text-[#cbd5e1]">
                    <strong>Correo:</strong> <span className="font-mono text-cyan-300">{usuario.correo}</span>
                  </div>
                </div>

                {/* Sección 2: Actividad */}
                <div className="space-y-3">
                  <div className="font-semibold text-blue-300 text-xs">
                    2. Actividad a inscribir
                  </div>

                  <div className="p-3 bg-[#061426] border border-blue-500/30 rounded-2xl">
                    <div className="font-bold text-white">{actividadSeleccionada.Nombre}</div>
                    <div className="text-xs text-cyan-300 mt-0.5 font-mono">
                      ID: {actividadSeleccionada.ID_actividad} • {actividadSeleccionada.Hora_inicio} a {actividadSeleccionada.Hora_fin} hrs
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                      Tipo de participación *
                    </label>
                    <select
                      value={tipoParticipacion}
                      onChange={(e) => setTipoParticipacion(e.target.value)}
                      className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Inscripción a actividad" className="bg-[#061426] text-white">Inscripción a actividad</option>
                      <option value="Solicitud de participación" className="bg-[#061426] text-white">Solicitud de participación</option>
                      <option value="Interés para futuras actividades" className="bg-[#061426] text-white">Interés para futuras actividades</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                      Observaciones o necesidades de participación
                    </label>
                    <textarea
                      rows={3}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Información adicional importante para organizar tu participación (no introducir datos médicos sensibles)."
                      className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Nota institucional */}
                <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/30 text-[11px] text-amber-200">
                  La disponibilidad de lugares y, cuando corresponda, la autorización de participación serán gestionadas por el Departamento.
                </div>

                {/* Botones */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActividadSeleccionada(null)}
                    className="flex-1 py-2.5 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl font-semibold text-xs border border-[#1e3555] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    {enviando ? (
                      <span>Registrando...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirmar inscripción</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
