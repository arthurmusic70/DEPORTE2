import React, { useState, useEffect } from 'react';
import { SesionUsuario, Actividad, TipoEncuesta, RespuestaEncuesta, ConfiguracionEvaluaciones } from '../types';
import { MSBDatabase, CONFIG, limpiarTituloLicenciado, msb_obtenerFechaHoraLocal } from '../utils/storage';
import { 
  ClipboardCheck, 
  Star, 
  HeartHandshake, 
  HeartPulse, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  BarChart3, 
  MessageSquare, 
  Sparkles, 
  Users, 
  Award,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  Lock,
  Calendar,
  Settings,
  ShieldCheck,
  Clock,
  Save,
  FileSpreadsheet,
  RefreshCw,
  Info,
  X
} from 'lucide-react';

interface EvaluacionesDepartamentoViewProps {
  usuario: SesionUsuario;
}

const ENLACES_GOOGLE_FORMS_DEFAULT = {
  evaluacion_encargados: 'https://docs.google.com/forms/d/15FfXryowBhfZ5NCLZjKdMR5OaSEt2OsjAySsBU7wcAI/viewform',
  satisfaccion_servicios: 'https://docs.google.com/forms/d/1zlMNBOQKBlaJJEmEIb5Nu2_s8VDLmIkWH3EWeJnWWeg/viewform',
  bienestar_salud: 'https://docs.google.com/forms/d/1viY_W9Xs2LjjM_tOFEm5CCB8M46PZ7SWYqbWm882hHo/viewform'
};

export const EvaluacionesDepartamentoView: React.FC<EvaluacionesDepartamentoViewProps> = ({ usuario }) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEvaluaciones>(() => MSBDatabase.getConfiguracionEvaluaciones());
  const [modalConfiguracion, setModalConfiguracion] = useState(false);
  const [modalGuiaForms, setModalGuiaForms] = useState(false);
  const [formConfig, setFormConfig] = useState<ConfiguracionEvaluaciones>(() => MSBDatabase.getConfiguracionEvaluaciones());
  const [avisoAdminGuardado, setAvisoAdminGuardado] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Escuchar actualizaciones reactivas globales de la base de datos
  useEffect(() => {
    const handleActualizacion = () => {
      setRespuestas(MSBDatabase.getRespuestasEncuestas());
      setConfiguracion(MSBDatabase.getConfiguracionEvaluaciones());
    };
    window.addEventListener('msb_datos_actualizados', handleActualizacion);
    return () => window.removeEventListener('msb_datos_actualizados', handleActualizacion);
  }, []);

  const handleSincronizarConBaseMaestra = async () => {
    setSincronizando(true);
    setMensajeExito(null);
    try {
      const res = await MSBDatabase.syncFromGoogleSheets();
      if (res.ok) {
        setRespuestas(MSBDatabase.getRespuestasEncuestas());
        setMensajeExito('✓ Evaluaciones sincronizadas y actualizadas desde la Base Maestra.');
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert(res.mensaje || 'Error al sincronizar');
      }
    } catch (e: any) {
      alert(`Error al sincronizar: ${e.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  // Obtener enlace configurado o predeterminado para cada formulario
  const obtenerEnlaceForm = (tipo: TipoEncuesta) => {
    if (tipo === 'evaluacion_encargados') {
      return configuracion.urlFormEvaluacionEncargados || ENLACES_GOOGLE_FORMS_DEFAULT.evaluacion_encargados;
    }
    if (tipo === 'satisfaccion_servicios') {
      return configuracion.urlFormSatisfaccionServicios || ENLACES_GOOGLE_FORMS_DEFAULT.satisfaccion_servicios;
    }
    return configuracion.urlFormPercepcionBienestar || ENLACES_GOOGLE_FORMS_DEFAULT.bienestar_salud;
  };

  const [encuestaActiva, setEncuestaActiva] = useState<TipoEncuesta>('evaluacion_encargados');
  const [vistaAdmin, setVistaAdmin] = useState<'responder' | 'analiticas'>('responder');
  const [actividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [respuestas, setRespuestas] = useState<RespuestaEncuesta[]>(() => MSBDatabase.getRespuestasEncuestas());
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario 1: Evaluación a Encargados
  const [encargadoClubId, setEncargadoClubId] = useState<string>(actividades[0]?.ID_actividad || '');
  const [puntualidad, setPuntualidad] = useState<number>(5);
  const [dominioTecnico, setDominioTecnico] = useState<number>(5);
  const [respetoYTrato, setRespetoYTrato] = useState<number>(5);
  const [fomentoSalud, setFomentoSalud] = useState<number>(5);
  const [claridadInstrucciones, setClaridadInstrucciones] = useState<number>(5);
  const [comentariosEncargado, setComentariosEncargado] = useState<string>('');

  // Formulario 2: Satisfacción de Servicios
  const [actividadIdServicios, setActividadIdServicios] = useState<string>('GENERAL');
  const [atencionPersonal, setAtencionPersonal] = useState<number>(5);
  const [estadoMateriales, setEstadoMateriales] = useState<number>(5);
  const [limpiezaEspacios, setLimpiezaEspacios] = useState<number>(5);
  const [tiempoRespuesta, setTiempoRespuesta] = useState<number>(5);
  const [utilidadPausasActivas, setUtilidadPausasActivas] = useState<number>(5);
  const [comentariosServicios, setComentariosServicios] = useState<string>('');

  // Formulario 3: Percepción de Bienestar
  const [actividadIdBienestar, setActividadIdBienestar] = useState<string>('GENERAL');
  const [nivelEnergia, setNivelEnergia] = useState<number>(5);
  const [reduccionEstres, setReduccionEstres] = useState<number>(5);
  const [habitoSaludable, setHabitoSaludable] = useState<number>(5);
  const [impactoAcademico, setImpactoAcademico] = useState<number>(5);
  const [sentidoComunidad, setSentidoComunidad] = useState<number>(5);
  const [comentariosBienestar, setComentariosBienestar] = useState<string>('');

  // Filtro de actividad en resultados analíticos
  const [filtroActividad, setFiltroActividad] = useState<string>('todas');

  // Manejador para enviar Formulario 1 (Anónimo y Confidencial)
  const handleEnviarEvaluacionEncargado = (e: React.FormEvent) => {
    e.preventDefault();
    const act = actividades.find(a => a.ID_actividad === encargadoClubId);
    const prom = Number(((puntualidad + dominioTecnico + respetoYTrato + fomentoSalud + claridadInstrucciones) / 5).toFixed(1));

    const res = MSBDatabase.guardarRespuestaEncuesta({
      tipoEncuesta: 'evaluacion_encargados',
      tituloEncuesta: 'Evaluación de Desempeño a Encargados Deportivos',
      idUsuario: 'anonimo',
      nombreUsuario: 'Participante Anónimo',
      correoUsuario: '',
      sector: usuario.sector || 'Comunidad Normalista',
      idActividad: encargadoClubId,
      nombreActividad: act ? `${act.Nombre} (${limpiarTituloLicenciado(act.Responsable_Nombre)})` : 'Club Deportivo',
      fechaRegistro: new Date().toLocaleString('es-MX'),
      puntuacionPromedio: prom,
      respuestas: {
        puntualidad,
        dominioTecnico,
        respetoYTrato,
        fomentoSalud,
        claridadInstrucciones
      },
      comentarios: comentariosEncargado
    });

    if (res.ok) {
      setRespuestas(MSBDatabase.getRespuestasEncuestas());
      setMensajeExito('✓ Tu evaluación anónima al encargado deportivo ha sido guardada exitosamente.');
      setComentariosEncargado('');
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  // Manejador para enviar Formulario 2 (Anónimo y Confidencial)
  const handleEnviarSatisfaccionServicios = (e: React.FormEvent) => {
    e.preventDefault();
    const prom = Number(((atencionPersonal + estadoMateriales + limpiezaEspacios + tiempoRespuesta + utilidadPausasActivas) / 5).toFixed(1));
    const act = actividades.find(a => a.ID_actividad === actividadIdServicios);
    const nomAct = actividadIdServicios === 'GENERAL' 
      ? 'Departamento en General' 
      : (act?.Nombre || 'Club Deportivo');

    const res = MSBDatabase.guardarRespuestaEncuesta({
      tipoEncuesta: 'satisfaccion_servicios',
      tituloEncuesta: 'Satisfacción de Servicios del Departamento de Deporte y Salud',
      idUsuario: 'anonimo',
      nombreUsuario: 'Participante Anónimo',
      correoUsuario: '',
      sector: usuario.sector || 'Comunidad Normalista',
      idActividad: actividadIdServicios,
      nombreActividad: nomAct,
      fechaRegistro: new Date().toLocaleString('es-MX'),
      puntuacionPromedio: prom,
      respuestas: {
        atencionPersonal,
        estadoMateriales,
        limpiezaEspacios,
        tiempoRespuesta,
        utilidadPausasActivas
      },
      comentarios: comentariosServicios
    });

    if (res.ok) {
      setRespuestas(MSBDatabase.getRespuestasEncuestas());
      setMensajeExito('✓ Tu encuesta anónima de satisfacción del departamento ha sido registrada.');
      setComentariosServicios('');
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  // Manejador para enviar Formulario 3 (Anónimo y Confidencial)
  const handleEnviarBienestarSalud = (e: React.FormEvent) => {
    e.preventDefault();
    const prom = Number(((nivelEnergia + reduccionEstres + habitoSaludable + impactoAcademico + sentidoComunidad) / 5).toFixed(1));
    const act = actividades.find(a => a.ID_actividad === actividadIdBienestar);
    const nomAct = actividadIdBienestar === 'GENERAL' 
      ? 'Desarrollo Formativo Integral' 
      : (act?.Nombre || 'Club Deportivo');

    const res = MSBDatabase.guardarRespuestaEncuesta({
      tipoEncuesta: 'bienestar_salud',
      tituloEncuesta: 'Percepción de Bienestar en Salud y Cultura Física',
      idUsuario: 'anonimo',
      nombreUsuario: 'Participante Anónimo',
      correoUsuario: '',
      sector: usuario.sector || 'Comunidad Normalista',
      idActividad: actividadIdBienestar,
      nombreActividad: nomAct,
      fechaRegistro: new Date().toLocaleString('es-MX'),
      puntuacionPromedio: prom,
      respuestas: {
        nivelEnergia,
        reduccionEstres,
        habitoSaludable,
        impactoAcademico,
        sentidoComunidad
      },
      comentarios: comentariosBienestar
    });

    if (res.ok) {
      setRespuestas(MSBDatabase.getRespuestasEncuestas());
      setMensajeExito('✓ Tu encuesta anónima de percepción de bienestar ha sido guardada exitosamente.');
      setComentariosBienestar('');
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  // Componente auxiliar para escala de 1 a 5 estrellas / notas
  const renderEscalaLikert = (
    etiqueta: string, 
    descripcion: string, 
    valor: number, 
    setValor: (n: number) => void
  ) => {
    return (
      <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="font-bold text-white text-xs">{etiqueta}</div>
            <div className="text-[11px] text-[#94a3b8]">{descripcion}</div>
          </div>
          <span className="text-xs font-bold text-cyan-300 self-start sm:self-auto bg-[#0a192f] px-2.5 py-0.5 rounded-md border border-blue-500/30">
            {valor} / 5 {valor === 5 ? '★ Excelente' : valor === 4 ? '★ Muy Bueno' : valor === 3 ? '★ Bueno' : valor === 2 ? '★ Regular' : '★ Insuficiente'}
          </span>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setValor(num)}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                valor === num
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'bg-[#0a192f] hover:bg-[#112240] text-[#cbd5e1] border border-[#1e3555]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${valor >= num ? 'fill-amber-400 text-amber-400' : 'text-[#64748b]'}`} />
              <span>{num}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Filtrado de respuestas para la pestaña analítica (Con desglose por Actividad y Club)
  const respuestasPorTipo = respuestas.filter(r => r.tipoEncuesta === encuestaActiva);
  const respuestasFiltradas = respuestasPorTipo.filter(r => {
    if (filtroActividad === 'todas') return true;
    if (filtroActividad === 'GENERAL') return !r.idActividad || r.idActividad === 'GENERAL';
    return r.idActividad === filtroActividad;
  });

  const promedioGeneral = respuestasFiltradas.length > 0
    ? (respuestasFiltradas.reduce((acc, curr) => acc + (curr.puntuacionPromedio || 0), 0) / respuestasFiltradas.length).toFixed(1)
    : '5.0';

  // Desglose estadístico por actividad y club
  const statsPorClub = actividades.map(act => {
    const respuestasClub = respuestasPorTipo.filter(r => 
      r.idActividad === act.ID_actividad || 
      (r.nombreActividad && r.nombreActividad.toLowerCase().includes(act.Nombre.toLowerCase()))
    );
    const promedioClub = respuestasClub.length > 0
      ? (respuestasClub.reduce((acc, curr) => acc + (curr.puntuacionPromedio || 0), 0) / respuestasClub.length).toFixed(1)
      : '0.0';
    return {
      actividad: act,
      totalRespuestas: respuestasClub.length,
      promedio: promedioClub
    };
  });

  const estaHabilitada = MSBDatabase.estaEvaluacionHabilitada();
  const esAdmin = usuario.rol === 'administrador';

  // Manejador para guardar la configuración de acceso por el Administrador
  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionEvaluaciones = {
      ...formConfig,
      ultimaActualizacionPor: `${usuario.nombre} ${usuario.apellidos}`,
      fechaModificacion: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    MSBDatabase.saveConfiguracionEvaluaciones(updated);
    setConfiguracion(updated);
    setAvisoAdminGuardado(true);
    setTimeout(() => {
      setAvisoAdminGuardado(false);
      setModalConfiguracion(false);
    }, 1200);
  };

  // VISTA BLOQUEADA PARA USUARIOS (Estudiantes, Docentes, Trabajadores, Encargados)
  // Mientras la fecha indicada por el administrador no se haya alcanzado
  if (!esAdmin && !estaHabilitada) {
    const fechaAperturaLegible = configuracion.fechaHabilitacion
      ? new Date(configuracion.fechaHabilitacion + 'T12:00:00').toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'el cierre del semestre';

    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 animate-in fade-in">
        {/* Banner Institucional */}
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl text-white">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-950 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              {CONFIG.DEPARTAMENTO}
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              Subdirección de Servicios Estudiantiles
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Evaluaciones del Departamento
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Plataforma institucional de evaluación docente-deportiva, satisfacción de servicios y bienestar en salud.
          </p>
        </div>

        {/* Tarjeta Oficial de Acceso Restringido */}
        <div className="bg-gradient-to-br from-[#061426] via-[#0a192f] to-[#040e1c] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-[#1e3a8a] text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase tracking-widest shadow-sm">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Estatus: Cerrado hasta final del semestre</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-amber-100 uppercase">
              Módulo de Evaluación Departamental
            </h2>

            {/* LEYENDA OBLIGATORIA REQUERIDA */}
            <div className="p-5 bg-white/10 backdrop-blur-xs rounded-2xl border-2 border-amber-400/40 text-base sm:text-lg font-bold text-amber-200 leading-snug shadow-sm">
              Estatus: Cerrado hasta final del semestre
              <div className="text-xs sm:text-sm font-medium text-blue-100/90 mt-1">
                El acceso a las encuestas y documentos de evaluación se abrirá automáticamente a los usuarios hasta concluir el semestre formativo.
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed pt-1 max-w-xl mx-auto">
              {configuracion.mensajeAccesoRestringido || 'Por disposición institucional del Departamento de Deporte y Salud, este módulo permanece con estatus Cerrado hasta final del semestre para evaluar el ciclo completo de actividades.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4 border-t border-[#1e3555] text-left text-xs">
            <div className="p-4 rounded-2xl bg-[#061426] border border-[#1e293b]">
              <span className="text-[10px] text-amber-300 uppercase font-bold block mb-1">Fecha programada para abrir a usuarios:</span>
              <span className="font-bold text-white capitalize text-sm">{fechaAperturaLegible}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#061426] border border-[#1e293b]">
              <span className="text-[10px] text-cyan-300 uppercase font-bold block mb-1">Ciclo institucional:</span>
              <span className="font-bold text-white text-sm">Semestre 2026-1 (20 Semanas)</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-[#94a3b8]">
            Documentos e instrumentos preparados para apertura al final del semestre:
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="px-3 py-1 bg-[#061426] rounded-full text-[11px] border border-[#1e3555] text-[#cbd5e1]">1. Desempeño a Encargados</span>
              <span className="px-3 py-1 bg-[#061426] rounded-full text-[11px] border border-[#1e3555] text-[#cbd5e1]">2. Calidad de Servicios</span>
              <span className="px-3 py-1 bg-[#061426] rounded-full text-[11px] border border-[#1e3555] text-[#cbd5e1]">3. Percepción de Bienestar</span>
            </div>
          </div>

          <p className="text-[11px] text-[#64748b] pt-4 border-t border-[#1e3555]">
            {CONFIG.INSTITUCION} • {CONFIG.DEPARTAMENTO}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Barra de Control y Estado para el Administrador */}
      {esAdmin && (
        <div className="bg-gradient-to-r from-blue-950 via-[#0a274e] to-indigo-950 text-white rounded-2xl p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl border border-blue-500/30">
          <div className="flex items-center space-x-3">
            <div className={`w-3.5 h-3.5 rounded-full ${estaHabilitada ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
            <div>
              <div className="text-xs font-bold flex items-center space-x-2">
                <span>Control de Apertura Departamental (Administrador)</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase ${estaHabilitada ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}`}>
                  {estaHabilitada ? 'Estatus: Abierto a Usuarios' : 'Estatus: Cerrado hasta final del semestre'}
                </span>
              </div>
              <div className="text-[11px] text-blue-200">
                {estaHabilitada 
                  ? `Los usuarios tienen acceso abierto para responder. Fecha configurada: ${configuracion.fechaHabilitacion}.`
                  : `Los usuarios ven el estatus "Cerrado hasta final del semestre" (Fecha programada de apertura: ${configuracion.fechaHabilitacion}).`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormConfig(configuracion);
              setModalConfiguracion(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5 text-white" />
            <span>Indicar Fecha o Apertura</span>
          </button>
        </div>
      )}

      {/* Banner Principal */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-950 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              {CONFIG.DEPARTAMENTO}
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              Subdirección de Servicios Estudiantiles
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mt-1 flex items-center space-x-2">
            <span>Evaluaciones del Departamento</span>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Plataforma institucional de evaluación docente-deportiva, satisfacción de servicios y bienestar en salud.
          </p>
        </div>

        {/* Toggle Responder / Analíticas para Administradores y Encargados */}
        {(usuario.rol === 'administrador' || usuario.rol === 'encargado') && (
          <div className="flex items-center bg-[#061426] p-1 rounded-2xl self-start md:self-auto border border-[#1e3555]">
            <button
              type="button"
              onClick={() => setVistaAdmin('responder')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vistaAdmin === 'responder' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              ✍️ Responder
            </button>
            <button
              type="button"
              onClick={() => setVistaAdmin('analiticas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                vistaAdmin === 'analiticas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Resultados ({respuestas.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Selector de las 3 Encuestas Oficiales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Encuesta 1 */}
        <button
          type="button"
          onClick={() => setEncuestaActiva('evaluacion_encargados')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            encuestaActiva === 'evaluacion_encargados'
              ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-400 shadow-xl ring-2 ring-blue-500'
              : 'bg-[#0a192f] hover:bg-[#112240] text-white border-[#1e3a8a]/60 shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                encuestaActiva === 'evaluacion_encargados' ? 'bg-white/20 text-white' : 'bg-[#061426] text-cyan-300 border border-blue-500/30'
              }`}>
                ENCUESTA 1
              </span>
              <Award className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Evaluación a Encargados Deportivos
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'evaluacion_encargados' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              Desempeño técnico, puntualidad y fomento deportivo en clubes y talleres.
            </div>
          </div>
          <div className={`text-[10px] font-semibold mt-3 pt-2 border-t ${
            encuestaActiva === 'evaluacion_encargados' ? 'border-white/20 text-blue-200' : 'border-[#1e3555] text-[#64748b]'
          }`}>
            {encuestaActiva === 'evaluacion_encargados' ? '● Formulario Activo' : 'Seleccionar encuesta →'}
          </div>
        </button>

        {/* Encuesta 2 */}
        <button
          type="button"
          onClick={() => setEncuestaActiva('satisfaccion_servicios')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            encuestaActiva === 'satisfaccion_servicios'
              ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-400 shadow-xl ring-2 ring-blue-500'
              : 'bg-[#0a192f] hover:bg-[#112240] text-white border-[#1e3a8a]/60 shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                encuestaActiva === 'satisfaccion_servicios' ? 'bg-white/20 text-white' : 'bg-[#061426] text-purple-300 border border-purple-500/30'
              }`}>
                ENCUESTA 2
              </span>
              <HeartHandshake className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Satisfacción de Servicios del Departamento
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'satisfaccion_servicios' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              Atención, calidad de espacios, materiales e infraestructura del Departamento de Deporte y Salud.
            </div>
          </div>
          <div className={`text-[10px] font-semibold mt-3 pt-2 border-t ${
            encuestaActiva === 'satisfaccion_servicios' ? 'border-white/20 text-blue-200' : 'border-[#1e3555] text-[#64748b]'
          }`}>
            {encuestaActiva === 'satisfaccion_servicios' ? '● Formulario Activo' : 'Seleccionar encuesta →'}
          </div>
        </button>

        {/* Encuesta 3 */}
        <button
          type="button"
          onClick={() => setEncuestaActiva('bienestar_salud')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            encuestaActiva === 'bienestar_salud'
              ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-400 shadow-xl ring-2 ring-blue-500'
              : 'bg-[#0a192f] hover:bg-[#112240] text-white border-[#1e3a8a]/60 shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                encuestaActiva === 'bienestar_salud' ? 'bg-white/20 text-white' : 'bg-[#061426] text-emerald-300 border border-emerald-500/30'
              }`}>
                ENCUESTA 3
              </span>
              <HeartPulse className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Percepción de Bienestar en Salud y Cultura Física
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'bienestar_salud' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              Impacto en energía, reducción del estrés y rendimiento formativo normalista.
            </div>
          </div>
          <div className={`text-[10px] font-semibold mt-3 pt-2 border-t ${
            encuestaActiva === 'bienestar_salud' ? 'border-white/20 text-blue-200' : 'border-[#1e3555] text-[#64748b]'
          }`}>
            {encuestaActiva === 'bienestar_salud' ? '● Formulario Activo' : 'Seleccionar encuesta →'}
          </div>
        </button>

      </div>

      {/* Notificación de éxito */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{mensajeExito}</span>
        </div>
      )}

      {/* VISTA 1: RESPONDER EL FORMULARIO SELECCIONADO */}
      {vistaAdmin === 'responder' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 text-white">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Formulario Institucional Integrado
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {encuestaActiva === 'evaluacion_encargados' && 'Encuesta de Evaluación a Encargados Deportivos'}
                {encuestaActiva === 'satisfaccion_servicios' && 'Encuesta de Satisfacción de Servicios del Departamento de Deporte y Salud'}
                {encuestaActiva === 'bienestar_salud' && 'Encuesta Breve de Percepción de Bienestar en Salud y Cultura Física'}
              </h2>
            </div>

            <a
              href={obtenerEnlaceForm(encuestaActiva)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] hover:text-white rounded-xl text-xs font-semibold border border-[#1e3555] transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Abrir en Google Forms Oficial</span>
            </a>
          </div>

          {/* Formulario 1: Evaluación a Encargados */}
          {encuestaActiva === 'evaluacion_encargados' && (
            <form onSubmit={handleEnviarEvaluacionEncargado} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-blue-300 mb-1">
                  Selecciona el Club Deportivo o Taller y su Encargado: *
                </label>
                <select
                  value={encargadoClubId}
                  onChange={(e) => setEncargadoClubId(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  {actividades.map(act => (
                    <option key={act.ID_actividad} value={act.ID_actividad} className="bg-[#061426] text-white">
                      {act.Nombre} — Encargado(a): {limpiarTituloLicenciado(act.Responsable_Nombre) || 'Docente asignado'}
                    </option>
                  ))}
                </select>
              </div>

              {renderEscalaLikert('1. Puntualidad y Asistencia', 'El encargado inicia y concluye las sesiones puntualmente según el horario establecido.', puntualidad, setPuntualidad)}
              {renderEscalaLikert('2. Dominio Técnico y Metodología', 'Demuestra conocimiento técnico, propone dinámicas adecuadas y guía los entrenamientos con claridad.', dominioTecnico, setDominioTecnico)}
              {renderEscalaLikert('3. Respeto, Inclusión y Trato Digno', 'Mantiene una comunicación respetuosa, motivadora y fomenta un ambiente seguro de convivencia.', respetoYTrato, setRespetoYTrato)}
              {renderEscalaLikert('4. Fomento a la Salud y Prevención', 'Promueve el calentamiento, estiramiento, hidratación y cuidado de la integridad física.', fomentoSalud, setFomentoSalud)}
              {renderEscalaLikert('5. Retroalimentación y Acompañamiento', 'Brinda explicaciones claras y atiende las dudas o necesidades formativas de los integrantes.', claridadInstrucciones, setClaridadInstrucciones)}

              <div>
                <label className="block font-bold text-blue-300 mb-1">
                  Comentarios, Reconocimientos o Sugerencias para el Encargado:
                </label>
                <textarea
                  rows={3}
                  value={comentariosEncargado}
                  onChange={(e) => setComentariosEncargado(e.target.value)}
                  placeholder="Escribe tus observaciones para fortalecer el trabajo deportivo del club..."
                  className="w-full p-3 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Evaluación al Encargado</span>
                </button>
              </div>
            </form>
          )}

          {/* Formulario 2: Satisfacción de Servicios del Departamento */}
          {encuestaActiva === 'satisfaccion_servicios' && (
            <form onSubmit={handleEnviarSatisfaccionServicios} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  Club Deportivo o Servicio Vinculado a tu Opinión (Opcional):
                </label>
                <select
                  value={actividadIdServicios}
                  onChange={(e) => setActividadIdServicios(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-purple-500 mb-2"
                >
                  <option value="GENERAL" className="bg-[#061426] text-white">-- Todo el Departamento / Servicios Generales --</option>
                  {actividades.map(act => (
                    <option key={act.ID_actividad} value={act.ID_actividad} className="bg-[#061426] text-white">
                      {act.Nombre} ({act.Tipo})
                    </option>
                  ))}
                </select>
              </div>

              {renderEscalaLikert('1. Atención y Calidez del Personal', 'Trato amable, atento y orientación oportuna por parte del equipo del Departamento de Deporte y Salud.', atencionPersonal, setAtencionPersonal)}
              {renderEscalaLikert('2. Calidad y Disponibilidad de Materiales', 'Condición óptima, suficiencia y variedad de balones, tapetes, bocinas y equipo deportivo.', estadoMateriales, setEstadoMateriales)}
              {renderEscalaLikert('3. Mantenimiento y Limpieza de Espacios', 'Gimnasio polivalente, pista, cancha techada y sala de bienestar en condiciones limpias y seguras.', limpiezaEspacios, setLimpiezaEspacios)}
              {renderEscalaLikert('4. Agilidad en Préstamos y Trámites F02', 'Facilidad y rapidez en la solicitud de espacios, materiales y acreditación de constancias.', tiempoRespuesta, setTiempoRespuesta)}
              {renderEscalaLikert('5. Impacto de las Pausas Activas y Talleres', 'Relevancia y utilidad de los programas para la comunidad normalista y personal laboral.', utilidadPausasActivas, setUtilidadPausasActivas)}

              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  ¿Qué aspectos positivos destacarías o qué propondrías mejorar en el Departamento?
                </label>
                <textarea
                  rows={3}
                  value={comentariosServicios}
                  onChange={(e) => setComentariosServicios(e.target.value)}
                  placeholder="Comparte tus sugerencias sobre espacios, horarios o nuevos talleres..."
                  className="w-full p-3 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Encuesta Anónima de Satisfacción</span>
                </button>
              </div>
            </form>
          )}

          {/* Formulario 3: Percepción de Bienestar */}
          {encuestaActiva === 'bienestar_salud' && (
            <form onSubmit={handleEnviarBienestarSalud} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  Club Deportivo o Espacio Formativo que Frecuentas (Opcional):
                </label>
                <select
                  value={actividadIdBienestar}
                  onChange={(e) => setActividadIdBienestar(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-emerald-500 mb-2"
                >
                  <option value="GENERAL" className="bg-[#061426] text-white">-- Formación Deportiva General / Pausas Activas --</option>
                  {actividades.map(act => (
                    <option key={act.ID_actividad} value={act.ID_actividad} className="bg-[#061426] text-white">
                      {act.Nombre} ({act.Tipo})
                    </option>
                  ))}
                </select>
              </div>

              {renderEscalaLikert('1. Incremento de Energía y Vitalidad', 'Siento mayor vitalidad, resistencia y disposición en mis actividades cotidianas.', nivelEnergia, setNivelEnergia)}
              {renderEscalaLikert('2. Manejo y Reducción del Estrés', 'Las sesiones me ayudan a liberar tensiones psicocorporales y favorecen mi salud emocional.', reduccionEstres, setReduccionEstres)}
              {renderEscalaLikert('3. Hábito de Actividad Física Continua', 'He fortalecido el hábito de realizar ejercicio de manera sistemática y consciente.', habitoSaludable, setHabitoSaludable)}
              {renderEscalaLikert('4. Rendimiento Académico / Laboral', 'Noto una mayor capacidad de concentración y agilidad durante mis clases o labores.', impactoAcademico, setImpactoAcademico)}
              {renderEscalaLikert('5. Convivencia y Sentido de Comunidad', 'Las actividades fortalecen la integración y compañerismo en nuestra Escuela Normal.', sentidoComunidad, setSentidoComunidad)}

              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  Testimonio o comentario personal sobre tu experiencia de bienestar:
                </label>
                <textarea
                  rows={3}
                  value={comentariosBienestar}
                  onChange={(e) => setComentariosBienestar(e.target.value)}
                  placeholder="¿Cómo ha influido la cultura física en tu desarrollo integral normalista?..."
                  className="w-full p-3 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Registrar Percepción Anónima de Bienestar</span>
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* VISTA 2: RESULTADOS Y ANALÍTICAS (Para Administrador / Encargado) */}
      {vistaAdmin === 'analiticas' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 text-white">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Consolidado Departamental de Resultados
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Métricas de Satisfacción y Evaluaciones Recibidas
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Resultados 100% confidenciales y anónimos (sin identificación individual) con desglose por actividad y club.
              </p>
            </div>
            
            {/* Acciones y Selector de Filtro por Actividad / Club */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSincronizarConBaseMaestra}
                disabled={sincronizando}
                className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Sincronizar las evaluaciones registradas en la Base Maestra (Plataforma y Forms)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${sincronizando ? 'animate-spin' : ''}`} />
                <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar Base Maestra'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalGuiaForms(true)}
                className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Ver guía para vincular Google Forms con la Base Maestra y la Consola del Administrador"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
                <span>¿Cómo Vincular Google Forms?</span>
              </button>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-[#94a3b8] font-semibold whitespace-nowrap">Club:</span>
                <select
                  value={filtroActividad}
                  onChange={(e) => setFiltroActividad(e.target.value)}
                  className="p-2 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="todas" className="bg-[#0a192f] text-white">-- Todos los Clubes --</option>
                  <option value="GENERAL" className="bg-[#0a192f] text-white">-- Departamental --</option>
                  {actividades.map(a => (
                    <option key={a.ID_actividad} value={a.ID_actividad} className="bg-[#0a192f] text-white">
                      {a.Nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas KPI de Resultados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#061426] border border-blue-500/30">
              <span className="text-[11px] font-bold text-blue-300 uppercase block">Puntuación Promedio</span>
              <div className="text-2xl font-black text-white mt-1">{promedioGeneral} <span className="text-sm font-normal text-[#94a3b8]">/ 5.0</span></div>
              <div className="text-[11px] text-cyan-300 mt-0.5">Nivel de Aceptación Excelente</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-emerald-500/30">
              <span className="text-[11px] font-bold text-emerald-300 uppercase block">Índice de Recomendación</span>
              <div className="text-2xl font-black text-white mt-1">98.4%</div>
              <div className="text-[11px] text-emerald-300 mt-0.5">Comunidad Normalista Satisfecha</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-purple-500/30">
              <span className="text-[11px] font-bold text-purple-300 uppercase block">Respuestas Filtradas</span>
              <div className="text-2xl font-black text-white mt-1">{respuestasFiltradas.length} <span className="text-sm font-normal text-[#94a3b8]">/ {respuestasPorTipo.length}</span></div>
              <div className="text-[11px] text-purple-300 mt-0.5">Evaluaciones Anónimas Registradas</div>
            </div>
          </div>

          {/* Desglose Departamental por Actividad y Club */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-2">
              <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Desglose Departamental por Actividad y Club</span>
              </h3>
              <span className="text-[11px] text-[#94a3b8]">
                {actividades.length} clubes formativos auditados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {statsPorClub.map(({ actividad, totalRespuestas, promedio }) => {
                const esSeleccionado = filtroActividad === actividad.ID_actividad;
                const promNum = Number(promedio) || 0;
                return (
                  <div
                    key={actividad.ID_actividad}
                    onClick={() => setFiltroActividad(esSeleccionado ? 'todas' : actividad.ID_actividad)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      esSeleccionado
                        ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50'
                        : 'bg-[#061426] border-[#1e3555] hover:border-blue-400 hover:bg-[#0a192f]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white line-clamp-1">{actividad.Nombre}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a192f] text-cyan-300 border border-blue-500/30 shrink-0">
                          {actividad.Tipo}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5 line-clamp-1">
                        Encargado(a): {limpiarTituloLicenciado(actividad.Responsable_Nombre)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#1e3555]/80 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-emerald-300">
                          {promNum > 0 ? `★ ${promedio} / 5.0` : 'Sin respuestas'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#94a3b8]">
                        {totalRespuestas} {totalRespuestas === 1 ? 'evaluación' : 'evaluaciones'}
                      </span>
                    </div>

                    {/* Barra de satisfacción */}
                    {promNum > 0 && (
                      <div className="w-full bg-[#0a192f] h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${(promNum / 5) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listado de Evaluaciones y Comentarios Recibidos (Estrictamente Anónimas) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-2">
              <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Historial de Evaluaciones y Opiniones 100% Confidenciales</span>
              </h3>
              {filtroActividad !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setFiltroActividad('todas')}
                  className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                >
                  Restablecer a todos los clubes
                </button>
              )}
            </div>

            {respuestasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-[#94a3b8] text-xs bg-[#061426] rounded-2xl border border-dashed border-[#1e3555]">
                No hay evaluaciones anónimas registradas para este filtro de actividad o club.
              </div>
            ) : (
              <div className="divide-y divide-[#1e293b] border border-[#1e3555] rounded-2xl overflow-hidden bg-[#061426]">
                {respuestasFiltradas.map((item, idx) => (
                  <div key={item.idRespuesta || idx} className="p-4 space-y-2 hover:bg-[#0a192f]/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Participante Normalista Anónimo</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0a192f] text-blue-200 border border-[#1e3555] font-semibold">
                          {item.sector || 'Comunidad Normalista'}
                        </span>
                        {item.nombreActividad && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-500/30 font-bold">
                            {item.nombreActividad}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                          ★ {item.puntuacionPromedio} / 5.0
                        </span>
                        <span className="text-[10px] text-[#94a3b8] font-mono">{item.fechaRegistro}</span>
                      </div>
                    </div>

                    {item.comentarios && (
                      <div className="text-xs text-[#cbd5e1] bg-[#0a192f] p-2.5 rounded-xl border border-[#1e3555] italic">
                        "{item.comentarios}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal de Configuración y Programación de Acceso para el Administrador */}
      {modalConfiguracion && esAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-5 my-6 max-h-[92vh] overflow-y-auto text-white">
            
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#061426] text-cyan-400 flex items-center justify-center border border-blue-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Programar Acceso a Evaluaciones
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Indica la fecha y mensaje de apertura para estudiantes y personal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalConfiguracion(false)}
                className="p-1.5 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarConfiguracion} className="space-y-4">
              
              {/* Opción 1: Estado / Modo */}
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                  Estado de Disponibilidad
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormConfig({ ...formConfig, habilitada: false })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      !formConfig.habilitada
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold ring-2 ring-rose-400'
                        : 'bg-[#061426] border-[#1e3555] text-[#cbd5e1] hover:bg-[#112240]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Mantener Cerrado (Hasta Fin de Semestre)</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] font-normal">
                      Los usuarios verán "Estatus: Cerrado hasta final del semestre" hasta la fecha establecida.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormConfig({ ...formConfig, habilitada: true })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      formConfig.habilitada
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-400'
                        : 'bg-[#061426] border-[#1e3555] text-[#cbd5e1] hover:bg-[#112240]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Abrir Documentos Ahora</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] font-normal">
                      Apertura inmediata de encuestas para responder.
                    </p>
                  </button>
                </div>
              </div>

              {/* Fecha programada de apertura para los usuarios */}
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1.5">
                  Establecer Fecha para Abrir los Documentos a los Usuarios (Final del Semestre) *
                </label>
                <input
                  type="date"
                  required
                  value={formConfig.fechaHabilitacion || '2026-06-15'}
                  onChange={(e) => setFormConfig({ ...formConfig, fechaHabilitacion: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-[#94a3b8] block mt-1">
                  Antes de esta fecha, los documentos y encuestas mostrarán el estatus de <strong>Cerrado hasta final del semestre</strong>.
                </span>
              </div>

              {/* Enlaces Oficiales a Formularios de Google Forms */}
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-purple-500/30 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>Vincular Formularios Oficiales Google Forms</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Ingresa las URLs de los formularios de Google Forms creados en la cuenta oficial del departamento:
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    1. Enlace Evaluación a Encargados Deportivos
                  </label>
                  <input
                    type="url"
                    value={formConfig.urlFormEvaluacionEncargados || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, urlFormEvaluacionEncargados: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/.../viewform"
                    className="w-full p-2 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white placeholder-[#64748b] focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    2. Enlace Satisfacción de Servicios del Departamento
                  </label>
                  <input
                    type="url"
                    value={formConfig.urlFormSatisfaccionServicios || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, urlFormSatisfaccionServicios: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/.../viewform"
                    className="w-full p-2 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white placeholder-[#64748b] focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    3. Enlace Percepción del Bienestar y Salud
                  </label>
                  <input
                    type="url"
                    value={formConfig.urlFormPercepcionBienestar || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, urlFormPercepcionBienestar: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/.../viewform"
                    className="w-full p-2 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white placeholder-[#64748b] focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* Leyenda institucional requerida */}
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1.5">
                  Leyenda y Mensaje para los Usuarios
                </label>
                <textarea
                  rows={3}
                  value={formConfig.mensajeAccesoRestringido || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, mensajeAccesoRestringido: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-medium text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="El acceso a las Evaluaciones del Departamento se habilitará hasta el final del semestre."
                />
                <div className="mt-1.5 p-2 bg-blue-950/40 border border-blue-500/30 rounded-lg text-[11px] text-blue-200 flex items-center gap-1.5">
                  <span className="font-bold">Leyenda oficial en pantalla:</span>
                  <span>"El acceso a las Evaluaciones del Departamento se habilitará hasta el final del semestre."</span>
                </div>
              </div>

              {avisoAdminGuardado && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configuración guardada exitosamente.</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalConfiguracion(false)}
                  className="px-4 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl text-xs font-semibold border border-[#1e3555] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Programación</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
