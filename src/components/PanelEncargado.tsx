import React, { useState } from 'react';
import { SesionUsuario, Actividad, InscripcionAsistencia, Identidad, RegistroSesionAsistencia, Espacio } from '../types';
import { MSBDatabase, limpiarTituloLicenciado } from '../utils/storage';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Save, 
  Edit3, 
  Percent, 
  Trash2,
  Settings,
  Edit2,
  X,
  Sparkles,
  Download
} from 'lucide-react';

interface PanelEncargadoProps {
  usuario: SesionUsuario;
}

export const PanelEncargado: React.FC<PanelEncargadoProps> = ({ usuario }) => {
  const [actividades, setActividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [espacios] = useState<Espacio[]>(MSBDatabase.getEspacios());
  const [identidades] = useState<Identidad[]>(MSBDatabase.getIdentidades());
  const [inscripciones, setInscripciones] = useState<InscripcionAsistencia[]>(MSBDatabase.getInscripciones());
  const [sesiones, setSesiones] = useState<RegistroSesionAsistencia[]>(MSBDatabase.getSesionesAsistencia());

  // Actividades permitidas: El encargado SOLO dispone de su propia actividad o club
  const actividadesPermitidas = usuario.rol === 'administrador'
    ? actividades
    : actividades.filter(a => a.ID_actividad === usuario.actividadAsignadaId || a.Responsable_ID === usuario.id);

  const actividadAsignada = actividadesPermitidas[0];
  const [actividadActualId, setActividadActualId] = useState<string>(actividadAsignada?.ID_actividad || '');
  const actividadActual = actividadesPermitidas.find(a => a.ID_actividad === actividadActualId) || actividadAsignada;

  // Pestaña activa dentro del panel
  const [subPestana, setSubPestana] = useState<'sincronico' | 'calendario' | 'horario'>('calendario');

  // Modal para agregar nueva sesión individual
  const [mostrarModalNuevaSesion, setMostrarModalNuevaSesion] = useState(false);
  const [nuevaSesionFecha, setNuevaSesionFecha] = useState(new Date().toISOString().substring(0, 10));
  const [nuevaSesionHora, setNuevaSesionHora] = useState(actividadActual?.Hora_inicio || '15:00');
  const [nuevaSesionTitulo, setNuevaSesionTitulo] = useState('Sesión de entrenamiento');

  // Modal para confirmación de 20 semanas
  const [mostrarModal20Semanas, setMostrarModal20Semanas] = useState(false);
  const [fechaInicioSemestre, setFechaInicioSemestre] = useState('2026-08-24');

  // Modal y estados para Gestión / Edición / Eliminación Independiente de Sesiones
  const [mostrarModalGestionSesiones, setMostrarModalGestionSesiones] = useState(false);
  const [sesionParaEditar, setSesionParaEditar] = useState<RegistroSesionAsistencia | null>(null);
  const [sesionParaEliminar, setSesionParaEliminar] = useState<RegistroSesionAsistencia | null>(null);

  // Estado para toma sincrónica
  const hoyStr = new Date().toISOString().substring(0, 10);
  const [fechaSincronica, setFechaSincronica] = useState<string>(hoyStr);
  const [horaSincronica, setHoraSincronica] = useState<string>(actividadActual?.Hora_inicio || '15:00');
  const [tituloSesion, setTituloSesion] = useState<string>('Sesión regular de entrenamiento');
  const [asistenciasSincronicas, setAsistenciasSincronicas] = useState<Record<string, 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente'>>({});

  // Estado para edición de horario del club
  const [horaInicioEdit, setHoraInicioEdit] = useState<string>(actividadActual?.Hora_inicio || '15:00');
  const [horaFinEdit, setHoraFinEdit] = useState<string>(actividadActual?.Hora_fin || '16:30');
  const [diasEdit, setDiasEdit] = useState<string[]>(actividadActual?.Dias_sesion || ['Lunes', 'Miércoles']);
  const [espacioIdEdit, setEspacioIdEdit] = useState<string>(actividadActual?.Espacio_ID || 'ESP-001');
  const [observacionesEdit, setObservacionesEdit] = useState<string>(actividadActual?.Observaciones || '');

  // Mensajes de retroalimentación
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Si no tiene club asignado
  if (!actividadActual) {
    return (
      <div className="bg-[#0a192f] rounded-3xl p-10 text-center border border-amber-500/40 shadow-xl max-w-lg mx-auto my-12 space-y-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-amber-950/80 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/50">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Sin Club o Actividad Asignada
        </h2>
        <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
          Tu cuenta de Encargado (<strong className="text-white">{limpiarTituloLicenciado(usuario.nombre)} {usuario.apellidos}</strong>) aún no tiene un club o actividad vinculada en la Base Maestra.
          <br /><br />
          Contacta al Departamento de Deportes y Salud para que te asignen tu club deportivo o taller de bienestar.
        </p>
      </div>
    );
  }

  // Participantes inscritos en esta actividad
  const inscritosEnActividad = inscripciones.filter(
    i => i.ID_actividad === actividadActual.ID_actividad && i.Estado_inscripcion !== 'Cancelada'
  );

  // Sesiones de esta actividad ordenadas cronológicamente
  const sesionesDeActividad = sesiones
    .filter(s => s.idActividad === actividadActual.ID_actividad)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Marcar a todos presentes en la toma sincrónica
  const marcarTodosPresentes = () => {
    const updated: Record<string, 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente'> = {};
    inscritosEnActividad.forEach(ins => {
      updated[ins.ID_participante] = 'Asistió';
    });
    setAsistenciasSincronicas(updated);
  };

  const handleCambiarEstadoSincronico = (participanteId: string, estado: 'Asistió' | 'Falta' | 'Justificado') => {
    setAsistenciasSincronicas(prev => ({
      ...prev,
      [participanteId]: estado
    }));
  };

  // Guardar pase de lista sincrónico
  const handleGuardarPaseLista = () => {
    if (!fechaSincronica) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona la fecha de la sesión.' });
      return;
    }

    const res = MSBDatabase.registrarSesionAsistencia(
      actividadActual.ID_actividad,
      fechaSincronica,
      horaSincronica,
      tituloSesion,
      asistenciasSincronicas
    );

    if (res.ok) {
      setMensaje({ tipo: 'exito', texto: `✓ ${res.mensaje}` });
      setSesiones(MSBDatabase.getSesionesAsistencia());
      setInscripciones(MSBDatabase.getInscripciones());
    }
  };

  // Guardar edición de horarios del club
  const handleGuardarHorarios = (e: React.FormEvent) => {
    e.preventDefault();
    const espacioObj = espacios.find(esp => esp.ID_espacio === espacioIdEdit);
    const res = MSBDatabase.actualizarHorarioActividad(actividadActual.ID_actividad, {
      horaInicio: horaInicioEdit,
      horaFin: horaFinEdit,
      dias: diasEdit,
      espacioId: espacioIdEdit,
      espacioNombre: espacioObj?.Nombre,
      observaciones: observacionesEdit
    });

    if (res.ok) {
      setMensaje({ tipo: 'exito', texto: '✓ Horario y configuración del club actualizados exitosamente.' });
      setActividades(MSBDatabase.getActividades());
    }
  };

  // Toggle de celda en la matriz calendario
  const handleToggleMatrizCelda = (idSesion: string, idParticipante: string) => {
    const sesionObj = sesiones.find(s => s.idSesion === idSesion);
    if (!sesionObj) return;

    const estadoActual = sesionObj.registros[idParticipante] || 'Pendiente';
    let nuevoEstado: 'Asistió' | 'Falta' | 'Justificado' = 'Asistió';
    if (estadoActual === 'Asistió') nuevoEstado = 'Falta';
    else if (estadoActual === 'Falta') nuevoEstado = 'Justificado';
    else if (estadoActual === 'Justificado') nuevoEstado = 'Asistió';

    const res = MSBDatabase.registrarSesionAsistencia(
      actividadActual.ID_actividad,
      sesionObj.fecha,
      sesionObj.hora,
      sesionObj.titulo || '',
      { [idParticipante]: nuevoEstado },
      idSesion
    );

    if (res.ok) {
      setSesiones(MSBDatabase.getSesionesAsistencia());
      setInscripciones(MSBDatabase.getInscripciones());
    }
  };

  // Agregar nueva sesión en la matriz calendario de forma autónoma
  const handleGuardarNuevaSesion = () => {
    if (!nuevaSesionFecha) {
      setMensaje({ tipo: 'error', texto: 'Por favor especifica una fecha válida para la sesión.' });
      return;
    }

    const res = MSBDatabase.registrarSesionAsistencia(
      actividadActual.ID_actividad,
      nuevaSesionFecha,
      nuevaSesionHora,
      nuevaSesionTitulo || `Sesión del ${nuevaSesionFecha}`,
      {}
    );

    if (res.ok) {
      setSesiones(MSBDatabase.getSesionesAsistencia());
      setMostrarModalNuevaSesion(false);
      setMensaje({ tipo: 'exito', texto: `✓ Sesión del ${nuevaSesionFecha} agregada exitosamente a la matriz (Total: ${sesionesDeActividad.length + 1} sesiones).` });
    }
  };

  // Eliminar sesión de la matriz de forma independiente sin supervisión administrativa
  const handleEliminarSesionConfirmada = () => {
    if (!sesionParaEliminar) return;
    const fecha = sesionParaEliminar.fecha;
    const res = MSBDatabase.eliminarSesionAsistencia(sesionParaEliminar.idSesion);
    if (res.ok) {
      setSesiones(MSBDatabase.getSesionesAsistencia());
      setInscripciones(MSBDatabase.getInscripciones());
      setSesionParaEliminar(null);
      setMensaje({
        tipo: 'exito',
        texto: `✓ Sesión del ${fecha} eliminada exitosamente. Matriz recalculada de forma independiente.`
      });
    }
  };

  // Guardar edición de sesión (fecha, hora, título)
  const handleActualizarSesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionParaEditar) return;
    const res = MSBDatabase.actualizarSesionAsistencia(sesionParaEditar.idSesion, {
      fecha: sesionParaEditar.fecha,
      hora: sesionParaEditar.hora,
      titulo: sesionParaEditar.titulo
    });
    if (res.ok) {
      setSesiones(MSBDatabase.getSesionesAsistencia());
      setSesionParaEditar(null);
      setMensaje({ tipo: 'exito', texto: `✓ Sesión del ${sesionParaEditar.fecha} actualizada correctamente.` });
    }
  };

  // Cargar calendario oficial de 20 semanas fechadas por sistema
  const handleCargarCalendario20Semanas = () => {
    const res = MSBDatabase.generarCalendario20Semanas(actividadActual.ID_actividad, fechaInicioSemestre);
    setSesiones(MSBDatabase.getSesionesAsistencia());
    setMostrarModal20Semanas(false);
    setMensaje({
      tipo: 'exito',
      texto: `✓ Calendario de 20 semanas del semestre generado y sincronizado (${res.length} sesiones en total).`
    });
  };

  const nombreLimpioEncargado = limpiarTituloLicenciado(usuario.nombre) + ' ' + usuario.apellidos;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner de Identificación del Encargado */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
              Perfil: Encargado de Club / Actividad
            </span>
            <span className="text-xs text-[#d6e3ff] font-medium">
              {nombreLimpioEncargado} (@{usuario.username})
            </span>
            <span className="text-[11px] font-mono text-[#fbbf24] bg-[#061426] px-2 py-0.5 rounded border border-[#1e3a8a]/60">
              ID: {actividadActual.ID_actividad}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center space-x-2">
            <span>{actividadActual.Nombre}</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#94a3b8]">
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[#d6e3ff]">{actividadActual.Hora_inicio} a {actividadActual.Hora_fin} hrs</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[#d6e3ff]">{actividadActual.Dias_sesion?.join(', ') || 'Días programados'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[#d6e3ff]">{actividadActual.Espacio_Nombre || actividadActual.Espacio_ID}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1 font-semibold text-[#fbbf24]">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{inscritosEnActividad.length} alumnos inscritos</span>
            </div>
          </div>
        </div>

        {/* Solo el Administrador puede alternar entre actividades; el Encargado solo ve la suya */}
        {usuario.rol === 'administrador' && actividadesPermitidas.length > 1 && (
          <div className="flex items-center space-x-2 self-start md:self-center">
            <span className="text-xs font-semibold text-[#d6e3ff]">Club:</span>
            <select
              value={actividadActualId}
              onChange={(e) => setActividadActualId(e.target.value)}
              className="p-2 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#f59e0b] cursor-pointer"
            >
              {actividadesPermitidas.map(a => (
                <option key={a.ID_actividad} value={a.ID_actividad}>
                  {a.Nombre} ({a.ID_actividad})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navegación por Pestañas del Encargado */}
      <div className="flex flex-wrap gap-2 border-b border-[#1e3a8a]/40 pb-2">
        <button
          onClick={() => setSubPestana('calendario')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            subPestana === 'calendario'
              ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
              : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Matriz de Calendario y Asistencias ({sesionesDeActividad.length} sesiones)</span>
        </button>

        <button
          onClick={() => setSubPestana('sincronico')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            subPestana === 'sincronico'
              ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
              : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-emerald-400" />
          <span>Pase de Lista Sincrónico (En Vivo)</span>
        </button>

        <button
          onClick={() => setSubPestana('horario')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            subPestana === 'horario'
              ? 'bg-[#1e3a8a] text-white shadow-md border border-[#3b82f6]/40'
              : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3a8a]/40'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-400" />
          <span>Configurar Horario y Espacio</span>
        </button>
      </div>

      {/* Alertas y Mensajes */}
      {mensaje && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          mensaje.tipo === 'exito' ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700' : 'bg-red-950/80 text-red-200 border-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="text-[#94a3b8] hover:text-white ml-4 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SUBPESTAÑA 1: MATRIZ CALENDARIO Y EDICIÓN INDEPENDIENTE DE SESIONES */}
      {subPestana === 'calendario' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-5">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1e3a8a]/40 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Matriz Calendario de Asistencias y Regla del 85%</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1e3a8a] text-blue-200 border border-blue-500/40">
                  {sesionesDeActividad.length} Sesiones programadas
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Como encargado, puedes <strong className="text-white">añadir o quitar sesiones de forma 100% independiente</strong> en tu matriz. Haz clic en las celdas para registrar asistencia o en los botones de columna para gestionar sesiones.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const encabezados = ['ID_Registro', 'ID_Participante', 'Nombre_Completo', 'Sector', 'Correo', 'Total_Sesiones', 'Asistidas', 'Porcentaje_Asistencia', 'Estatus_85%'];
                  const filas = inscritosEnActividad.map(ins => {
                    const alumno = identidades.find(i => i.id === ins.ID_participante);
                    const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, actividadActualId);
                    return [
                      ins.ID_registro,
                      ins.ID_participante,
                      `"${alumno?.nombre || ''} ${alumno?.apellidos || ''}"`,
                      alumno?.sector || 'Estudiante',
                      alumno?.correo || '',
                      stats.totalSesiones,
                      stats.asistidas,
                      `${stats.porcentaje}%`,
                      stats.validada ? 'Acreditado (>=85%)' : 'En Riesgo (<85%)'
                    ].join(',');
                  });
                  const csvContenido = [encabezados.join(','), ...filas].join('\n');
                  const blob = new Blob([csvContenido], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `asistencias_${actividadActual.ID_actividad}_${new Date().toISOString().substring(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-600/50 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarModalNuevaSesion(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Añadir Sesión</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarModalGestionSesiones(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#061426] hover:bg-[#112240] text-[#d6e3ff] rounded-xl text-xs font-semibold border border-[#1e3a8a] transition-colors shadow-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Gestionar / Quitar Sesiones ({sesionesDeActividad.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarModal20Semanas(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all border border-purple-500/40 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>📅 20 Semanas</span>
              </button>
            </div>
          </div>

          {/* Tabla Matriz Calendario */}
          {sesionesDeActividad.length === 0 ? (
            <div className="p-8 text-center bg-[#061426] rounded-2xl border border-dashed border-[#1e3a8a] space-y-3">
              <Calendar className="w-10 h-10 text-[#94a3b8] mx-auto" />
              <div className="font-bold text-white text-sm">No hay sesiones registradas en el calendario</div>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                Puedes añadir sesiones individuales o generar automáticamente las 20 semanas del ciclo con un solo clic.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaSesion(true)}
                  className="px-4 py-2 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-600 cursor-pointer"
                >
                  + Añadir Primera Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal20Semanas(true)}
                  className="px-4 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-600 cursor-pointer"
                >
                  Generar 20 Semanas
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#1e3a8a]/60 rounded-2xl max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#061426] text-[#94a3b8] font-bold sticky top-0 z-20 border-b border-[#1e3a8a]/60">
                  <tr>
                    <th className="p-3 bg-[#061426] sticky left-0 z-30 shadow-xs min-w-[200px] border-r border-[#1e3a8a]/60 text-white">
                      Participante
                    </th>
                    {sesionesDeActividad.map((s, idx) => (
                      <th key={s.idSesion} className="p-2 text-center min-w-[95px] border-l border-[#1e3a8a]/40 bg-[#061426] group relative">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-[#fbbf24] font-bold">#{idx + 1}</span>
                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setSesionParaEditar(s)}
                              title="Editar fecha/título de esta sesión"
                              className="p-0.5 text-blue-400 hover:text-white hover:bg-blue-900/60 rounded cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSesionParaEliminar(s)}
                              title="Quitar esta sesión de la matriz de forma independiente"
                              className="p-0.5 text-red-400 hover:text-white hover:bg-red-900/60 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-white font-bold">{s.fecha.substring(5)}</div>
                        <div className="text-[9px] text-[#94a3b8] font-normal truncate max-w-[85px] mx-auto" title={s.titulo}>
                          {s.titulo?.replace('Sesión ', 'S.') || 'Sesión'}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center border-l border-[#1e3a8a]/40 bg-[#061426] min-w-[90px] text-white">
                      Total Asist.
                    </th>
                    <th className="p-3 text-center border-l border-[#1e3a8a]/40 bg-[#0a192f] min-w-[105px] text-blue-300">
                      % Acumulado
                    </th>
                    <th className="p-3 text-center border-l border-[#1e3a8a]/40 bg-[#061426] min-w-[130px] text-emerald-300">
                      Validación (&ge;85%)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1e3a8a]/30 bg-[#0a192f]">
                  {inscritosEnActividad.map((ins, idx) => {
                    const alumno = identidades.find(i => i.id === ins.ID_participante);
                    const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, actividadActualId);

                    return (
                      <tr key={`enc-matriz-${ins.ID_registro}-${ins.ID_participante}-${actividadActualId}-${idx}`} className="hover:bg-[#112240]/60 transition-colors">
                        {/* Columna fija del Alumno */}
                        <td className="p-3 bg-[#0a192f] sticky left-0 z-10 shadow-xs border-r border-[#1e3a8a]/60">
                          <div className="font-bold text-white">{alumno?.nombre} {alumno?.apellidos}</div>
                          <div className="text-[10px] text-[#94a3b8] font-mono">{ins.ID_participante} • {alumno?.sector}</div>
                        </td>

                        {/* Celdas interactivas por fecha de sesión */}
                        {sesionesDeActividad.map((s) => {
                          const estado = s.registros[ins.ID_participante] || 'Pendiente';

                          return (
                            <td 
                              key={s.idSesion}
                              onClick={() => handleToggleMatrizCelda(s.idSesion, ins.ID_participante)}
                              title={`Clic para cambiar estado: ${alumno?.nombre} en ${s.fecha}`}
                              className="p-2 text-center border-l border-[#1e3a8a]/40 cursor-pointer hover:opacity-80 transition-opacity select-none"
                            >
                              <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                                estado === 'Asistió'
                                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/60'
                                  : estado === 'Falta'
                                  ? 'bg-red-950/90 text-red-300 border border-red-600/60'
                                  : estado === 'Justificado'
                                  ? 'bg-blue-950/90 text-blue-300 border border-blue-600/60'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}>
                                {estado === 'Asistió' ? '✓' : estado === 'Falta' ? '✗' : estado === 'Justificado' ? 'J' : '—'}
                              </span>
                            </td>
                          );
                        })}

                        {/* Total asistidas */}
                        <td className="p-3 text-center font-bold text-white border-l border-[#1e3a8a]/40 bg-[#061426]/50 font-mono">
                          {stats.asistidas} / {stats.totalSesiones}
                        </td>

                        {/* Porcentaje acumulado */}
                        <td className="p-3 text-center border-l border-[#1e3a8a]/40 bg-[#0a192f]">
                          <div className="font-bold text-blue-300 text-xs font-mono">{stats.porcentaje}%</div>
                          <div className="w-16 bg-[#061426] h-1.5 rounded-full mx-auto mt-1 overflow-hidden border border-[#1e3a8a]/40">
                            <div 
                              className={`h-full ${stats.porcentaje >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${stats.porcentaje}%` }}
                            />
                          </div>
                        </td>

                        {/* Regla del 85% de Validación Institucional */}
                        <td className="p-3 text-center border-l border-[#1e3a8a]/40 bg-[#061426]/50">
                          {stats.validada ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Validada (&ge;85%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>En Riesgo (&lt;85%)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3a8a]/60 text-[11px] text-[#94a3b8] flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="text-white">Código de marcas interactivas:</strong> <span className="text-emerald-400 font-bold">✓ Asistió</span> • <span className="text-red-400 font-bold">✗ Falta</span> • <span className="text-blue-400 font-bold">J Justificado</span> • <span className="text-gray-400">— Pendiente</span>
            </div>
            <div className="text-[#d6e3ff]">
              Usa los botones de papelera en cada columna o el gestor de sesiones para añadir o quitar sesiones cuando lo requieras.
            </div>
          </div>

        </div>
      )}

      {/* SUBPESTAÑA 2: PASE DE LISTA SINCRÓNICO */}
      {subPestana === 'sincronico' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3a8a]/40 pb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-blue-400" />
                <span>Pase de Lista Sincrónico (En Vivo)</span>
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Marca la asistencia de los participantes presentes en la sesión actual.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={marcarTodosPresentes}
                className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-600/50 transition-colors cursor-pointer"
              >
                ✓ Marcar Todos Presentes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#061426] p-4 rounded-2xl border border-[#1e3a8a]/60 text-xs">
            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Fecha de la Sesión</label>
              <input
                type="date"
                value={fechaSincronica}
                onChange={(e) => setFechaSincronica(e.target.value)}
                className="w-full p-2.5 bg-[#0a192f] border border-[#1e3a8a] text-white rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Hora de Inicio</label>
              <input
                type="time"
                value={horaSincronica}
                onChange={(e) => setHoraSincronica(e.target.value)}
                className="w-full p-2.5 bg-[#0a192f] border border-[#1e3a8a] text-white rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Título / Tema de la Sesión</label>
              <input
                type="text"
                value={tituloSesion}
                onChange={(e) => setTituloSesion(e.target.value)}
                placeholder="Ej. Fundamentos tácticos y saque"
                className="w-full p-2.5 bg-[#0a192f] border border-[#1e3a8a] text-white rounded-xl font-semibold placeholder-[#64748b]"
              />
            </div>
          </div>

          <div className="divide-y divide-[#1e3a8a]/30 border border-[#1e3a8a]/60 rounded-2xl overflow-hidden">
            {inscritosEnActividad.map((ins, idx) => {
              const alumno = identidades.find(i => i.id === ins.ID_participante);
              const estado = asistenciasSincronicas[ins.ID_participante] || 'Pendiente';

              return (
                <div key={`enc-sinc-${ins.ID_registro}-${ins.ID_participante}-${actividadActualId}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#112240]/50 transition-colors">
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">{alumno?.nombre} {alumno?.apellidos}</div>
                    <div className="text-[11px] text-[#94a3b8] font-mono">{ins.ID_participante} • {alumno?.sector} • {alumno?.correo}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCambiarEstadoSincronico(ins.ID_participante, 'Asistió')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        estado === 'Asistió' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/60'
                      }`}
                    >
                      ✓ Asistió
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarEstadoSincronico(ins.ID_participante, 'Falta')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        estado === 'Falta' ? 'bg-red-600 text-white shadow-xs' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/60'
                      }`}
                    >
                      ✗ Falta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarEstadoSincronico(ins.ID_participante, 'Justificado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        estado === 'Justificado' ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/60'
                      }`}
                    >
                      J Justificado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleGuardarPaseLista}
              className="px-6 py-2.5 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Asistencia en la Matriz</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBPESTAÑA 3: CONFIGURAR HORARIO Y ESPACIO */}
      {subPestana === 'horario' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              <span>Configuración de Horarios y Espacio del Club</span>
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Actualiza los días y horas de práctica oficial de tu club o taller formativo.
            </p>
          </div>

          <form onSubmit={handleGuardarHorarios} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={horaInicioEdit}
                  onChange={(e) => setHoraInicioEdit(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={horaFinEdit}
                  onChange={(e) => setHoraFinEdit(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Días de Sesión</label>
              <div className="flex flex-wrap gap-2">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(dia => {
                  const sel = diasEdit.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => {
                        if (sel) setDiasEdit(diasEdit.filter(d => d !== dia));
                        else setDiasEdit([...diasEdit, dia]);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        sel ? 'bg-[#1e3a8a] text-white shadow-xs border border-blue-400' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3a8a]/60'
                      }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Espacio Asignado</label>
              <select
                value={espacioIdEdit}
                onChange={(e) => setEspacioIdEdit(e.target.value)}
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold cursor-pointer"
              >
                {espacios.map(esp => (
                  <option key={esp.ID_espacio} value={esp.ID_espacio}>
                    {esp.Nombre} ({esp.ID_espacio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#d6e3ff] mb-1">Observaciones</label>
              <textarea
                rows={2}
                value={observacionesEdit}
                onChange={(e) => setObservacionesEdit(e.target.value)}
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-normal placeholder-[#64748b]"
                placeholder="Notas sobre el material o dinámica de clase..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl font-bold shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL GESTIÓN COMPLETA Y ELIMINACIÓN DE SESIONES ================= */}
      {mostrarModalGestionSesiones && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#112240] text-[#fbbf24] flex items-center justify-center border border-[#1e3a8a]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Gestor Autónomo de Sesiones de Calendario
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Añade, edita o quita sesiones de forma independiente sin supervisión administrativa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalGestionSesiones(false)}
                className="p-1 text-[#94a3b8] hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-[#061426] p-3.5 rounded-2xl border border-[#1e3a8a]/60">
              <span className="text-xs font-bold text-white">
                Total de sesiones en la matriz: {sesionesDeActividad.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalGestionSesiones(false);
                  setMostrarModalNuevaSesion(true);
                }}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-600 cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Sesión</span>
              </button>
            </div>

            <div className="divide-y divide-[#1e3a8a]/30 border border-[#1e3a8a]/60 rounded-2xl overflow-hidden max-h-[360px] overflow-y-auto">
              {sesionesDeActividad.length === 0 ? (
                <div className="p-6 text-center text-[#94a3b8] text-xs">
                  No hay sesiones en el calendario.
                </div>
              ) : (
                sesionesDeActividad.map((s, idx) => {
                  const totalMarcas = Object.keys(s.registros).length;
                  const asistencias = Object.values(s.registros).filter(v => v === 'Asistió').length;

                  return (
                    <div key={s.idSesion} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#112240]/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-[#061426] text-[#fbbf24] border border-[#1e3a8a] flex items-center justify-center font-mono font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {s.fecha} • {s.hora} hrs
                          </div>
                          <div className="text-[11px] text-[#94a3b8] truncate max-w-sm">
                            {s.titulo || 'Sesión programada'}
                          </div>
                          <div className="text-[10px] text-blue-400 font-semibold">
                            {asistencias} presentes / {totalMarcas} registros tomados
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSesionParaEditar(s);
                            setMostrarModalGestionSesiones(false);
                          }}
                          className="px-2.5 py-1.5 bg-[#1e3a8a]/40 hover:bg-[#1e3a8a] text-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer border border-blue-500/40"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSesionParaEliminar(s);
                            setMostrarModalGestionSesiones(false);
                          }}
                          className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer border border-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalGestionSesiones(false)}
                className="px-4 py-2 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-bold cursor-pointer border border-[#1e3a8a]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA EDITAR UNA SESIÓN INDIVIDUAL ================= */}
      {sesionParaEditar && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <h3 className="text-base font-bold text-white">
                Editar Datos de la Sesión
              </h3>
              <button onClick={() => setSesionParaEditar(null)} className="text-[#94a3b8] hover:text-white p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleActualizarSesion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={sesionParaEditar.fecha}
                  onChange={(e) => setSesionParaEditar({ ...sesionParaEditar, fecha: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Hora</label>
                <input
                  type="time"
                  required
                  value={sesionParaEditar.hora}
                  onChange={(e) => setSesionParaEditar({ ...sesionParaEditar, hora: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Título de la Sesión</label>
                <input
                  type="text"
                  required
                  value={sesionParaEditar.titulo}
                  onChange={(e) => setSesionParaEditar({ ...sesionParaEditar, titulo: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  onClick={() => setSesionParaEditar(null)}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl font-medium cursor-pointer border border-[#1e3a8a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN PARA QUITAR SESIÓN ================= */}
      {sesionParaEliminar && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/80 text-red-400 border border-red-700/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ¿Quitar sesión de la matriz?
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Acción autónoma del Encargado
                </p>
              </div>
            </div>

            <p className="text-xs text-[#d6e3ff] leading-relaxed">
              Estás a punto de quitar la sesión del <strong className="text-white">{sesionParaEliminar.fecha}</strong> ({sesionParaEliminar.titulo || 'Sesión'}). El cálculo de porcentajes y validación del 85% se reajustará de inmediato.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3a8a]/40">
              <button
                type="button"
                onClick={() => setSesionParaEliminar(null)}
                className="px-4 py-2 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-medium cursor-pointer border border-[#1e3a8a]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarSesionConfirmada}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sí, Quitar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA AÑADIR NUEVA SESIÓN INDIVIDUAL ================= */}
      {mostrarModalNuevaSesion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <h3 className="text-base font-bold text-white">
                Añadir Nueva Sesión a la Matriz
              </h3>
              <button onClick={() => setMostrarModalNuevaSesion(false)} className="text-[#94a3b8] hover:text-white p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Fecha de la Sesión</label>
                <input
                  type="date"
                  value={nuevaSesionFecha}
                  onChange={(e) => setNuevaSesionFecha(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Hora</label>
                <input
                  type="time"
                  value={nuevaSesionHora}
                  onChange={(e) => setNuevaSesionHora(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#d6e3ff] mb-1">Título / Tema</label>
                <input
                  type="text"
                  value={nuevaSesionTitulo}
                  onChange={(e) => setNuevaSesionTitulo(e.target.value)}
                  placeholder="Ej. Sesión técnica o partido preparatorio"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl text-xs placeholder-[#64748b]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3a8a]/40">
              <button
                type="button"
                onClick={() => setMostrarModalNuevaSesion(false)}
                className="px-4 py-2 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-medium cursor-pointer border border-[#1e3a8a]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevaSesion}
                className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                Agregar a la Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA GENERAR 20 SEMANAS ================= */}
      {mostrarModal20Semanas && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-300 border border-purple-600/50 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Calendario Semestral de 20 Semanas
                  </h3>
                  <p className="text-[11px] text-[#94a3b8]">
                    Fechado automático por sistema en coincidencia al semestre en curso
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModal20Semanas(false)}
                className="text-[#94a3b8] hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#061426] p-4 rounded-2xl border border-purple-500/30 text-xs text-[#d6e3ff] space-y-2">
              <p className="font-semibold text-[#fbbf24]">
                ¿Cómo funciona el cálculo del semestre?
              </p>
              <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                El sistema generará automáticamente las <strong className="text-white">20 semanas lectivas del semestre</strong> utilizando los días asignados a este club ({actividadActual.Dias_sesion?.join(', ') || 'Lunes y Miércoles'}). Si ya existen asistencias marcadas previamente, se conservarán íntegramente.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">
                  Fecha de Inicio del Semestre (Semana 1 - Lunes):
                </label>
                <input
                  type="date"
                  value={fechaInicioSemestre}
                  onChange={(e) => setFechaInicioSemestre(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-[#94a3b8] mt-1 block">
                  Semestre en curso: Febrero - Junio o Agosto - Diciembre (20 semanas académicas).
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3a8a]/40">
              <button
                type="button"
                onClick={() => setMostrarModal20Semanas(false)}
                className="px-4 py-2 bg-[#112240] hover:bg-[#1a3258] text-[#d6e3ff] rounded-xl text-xs font-medium cursor-pointer border border-[#1e3a8a]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCargarCalendario20Semanas}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 cursor-pointer border border-purple-500/40"
              >
                <span>Generar y Fechar 20 Semanas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
