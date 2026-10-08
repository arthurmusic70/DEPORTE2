import React, { useState, useEffect } from 'react';
import { SesionUsuario, Actividad, TipoEncuesta, RespuestaEncuesta, ConfiguracionEvaluaciones, Sector } from '../types';
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
  Copy,
  Check,
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
  const [guardandoFormulario, setGuardandoFormulario] = useState(false);
  const [copiadoHeader, setCopiadoHeader] = useState<string | null>(null);

  const [encuestaActiva, setEncuestaActiva] = useState<TipoEncuesta>('evaluacion_encargados');
  const [vistaAdmin, setVistaAdmin] = useState<'responder' | 'analiticas'>('responder');
  const [actividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [respuestas, setRespuestas] = useState<RespuestaEncuesta[]>(() => MSBDatabase.getRespuestasEncuestas());
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros de resultados analíticos
  const [filtroActividad, setFiltroActividad] = useState<string>('todas');
  const [filtroSector, setFiltroSector] = useState<string>('todos');

  // ================= FORMULARIO 1: EVALUACIÓN DE ENCARGADOS DEPORTIVOS =================
  const [encargadoClubId, setEncargadoClubId] = useState<string>(actividades[0]?.ID_actividad || '');
  const [preparacionExperto, setPreparacionExperto] = useState<number>(5);
  const [comunicacionEncargado, setComunicacionEncargado] = useState<number>(5);
  const [estrategiasTrabajo, setEstrategiasTrabajo] = useState<number>(5);
  const [usoRecursosMateriales, setUsoRecursosMateriales] = useState<number>(5);
  const [cumplimientoObjetivo, setCumplimientoObjetivo] = useState<number>(5);
  const [sugerenciasMejoraEncargado, setSugerenciasMejoraEncargado] = useState<string>('');

  // ================= FORMULARIO 2: SATISFACCIÓN DE SERVICIOS (15 Likert + 2 Textos) =================
  const [sectorSatisfaccion, setSectorSatisfaccion] = useState<string>(usuario.sector || 'Estudiante');
  const [ofertaVariada, setOfertaVariada] = useState<number>(5);
  const [programasSaludOrganizados, setProgramasSaludOrganizados] = useState<number>(5);
  const [difusionOportuna, setDifusionOportuna] = useState<number>(5);
  const [capacidadCuposSuficiente, setCapacidadCuposSuficiente] = useState<number>(5);
  const [mantenimientoLimpieza, setMantenimientoLimpieza] = useState<number>(5);
  const [mantenimientoPreventivo, setMantenimientoPreventivo] = useState<number>(5);
  const [iluminacionVentilacion, setIluminacionVentilacion] = useState<number>(5);
  const [accesibilidadInclusiva, setAccesibilidadInclusiva] = useState<number>(5);
  const [atencionPersonal, setAtencionPersonal] = useState<number>(5);
  const [tramitesAgiles, setTramitesAgiles] = useState<number>(5);
  const [informacionClara, setInformacionClara] = useState<number>(5);
  const [canalesComunicacion, setCanalesComunicacion] = useState<number>(5);
  const [resolucionInconformidades, setResolucionInconformidades] = useState<number>(5);
  const [promocionSaludBienestar, setPromocionSaludBienestar] = useState<number>(5);
  const [satisfaccionGeneral, setSatisfaccionGeneral] = useState<number>(5);
  const [fortalezasServicios, setFortalezasServicios] = useState<string>('');
  const [sugerenciasServicios, setSugerenciasServicios] = useState<string>('');

  // ================= FORMULARIO 3: BIENESTAR Y SALUD (10 Likert) =================
  const [sectorBienestar, setSectorBienestar] = useState<string>(usuario.sector || 'Estudiante');
  const [vidaActiva, setVidaActiva] = useState<number>(5);
  const [descansoEnergia, setDescansoEnergia] = useState<number>(5);
  const [alimentacionHidratacion, setAlimentacionHidratacion] = useState<number>(5);
  const [controlEstres, setControlEstres] = useState<number>(5);
  const [vitalidadBalance, setVitalidadBalance] = useState<number>(5);
  const [estadoAnimo, setEstadoAnimo] = useState<number>(5);
  const [sentidoPertenencia, setSentidoPertenencia] = useState<number>(5);
  const [convivenciaRespeto, setConvivenciaRespeto] = useState<number>(5);
  const [satisfaccionDepartamental, setSatisfaccionDepartamental] = useState<number>(5);
  const [recomendacionInstitucional, setRecomendacionInstitucional] = useState<number>(5);

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

  const copiarAlPortapapeles = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoHeader(label);
    setTimeout(() => setCopiadoHeader(null), 2500);
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

  // Enviar Formulario 1: Evaluación a Encargados
  const handleEnviarEvaluacionEncargado = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoFormulario(true);
    try {
      const act = actividades.find(a => a.ID_actividad === encargadoClubId);
      const prom = Number(((preparacionExperto + comunicacionEncargado + estrategiasTrabajo + usoRecursosMateriales + cumplimientoObjetivo) / 5).toFixed(1));

      const res = await MSBDatabase.guardarRespuestaEncuesta({
        tipoEncuesta: 'evaluacion_encargados',
        tituloEncuesta: 'Evaluación de Desempeño a Encargados Deportivos',
        idUsuario: 'ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        correoUsuario: '',
        sector: (usuario.sector || 'Estudiante') as Sector,
        idActividad: encargadoClubId,
        nombreActividad: act ? `${act.Nombre} (${limpiarTituloLicenciado(act.Responsable_Nombre)})` : 'Club Deportivo',
        fechaRegistro: msb_obtenerFechaHoraLocal(),
        puntuacionPromedio: prom,
        respuestas: {
          preparacionExperto,
          comunicacion: comunicacionEncargado,
          estrategias: estrategiasTrabajo,
          recursos: usoRecursosMateriales,
          cumplimientoObjetivo
        },
        comentarios: sugerenciasMejoraEncargado
      });

      if (res.ok) {
        setRespuestas(MSBDatabase.getRespuestasEncuestas());
        setMensajeExito('✓ Tu evaluación anónima al encargado deportivo ha sido guardada directamente en la pestaña oficial de la Base Maestra.');
        setSugerenciasMejoraEncargado('');
        setTimeout(() => setMensajeExito(null), 5000);
      }
    } finally {
      setGuardandoFormulario(false);
    }
  };

  // Enviar Formulario 2: Satisfacción de Servicios
  const handleEnviarSatisfaccionServicios = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoFormulario(true);
    try {
      const sum = ofertaVariada + programasSaludOrganizados + difusionOportuna + capacidadCuposSuficiente +
        mantenimientoLimpieza + mantenimientoPreventivo + iluminacionVentilacion + accesibilidadInclusiva +
        atencionPersonal + tramitesAgiles + informacionClara + canalesComunicacion +
        resolucionInconformidades + promocionSaludBienestar + satisfaccionGeneral;
      const prom = Number((sum / 15).toFixed(1));

      const res = await MSBDatabase.guardarRespuestaEncuesta({
        tipoEncuesta: 'satisfaccion_servicios',
        tituloEncuesta: 'Satisfacción de Servicios del Departamento de Deporte y Salud',
        idUsuario: 'ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        correoUsuario: '',
        sector: sectorSatisfaccion as Sector,
        idActividad: 'GENERAL',
        nombreActividad: 'Departamento de Deporte y Salud',
        fechaRegistro: msb_obtenerFechaHoraLocal(),
        puntuacionPromedio: prom,
        respuestas: {
          ofertaVariada,
          programasSaludOrganizados,
          difusionOportuna,
          capacidadCuposSuficiente,
          mantenimientoLimpieza,
          mantenimientoPreventivo,
          iluminacionVentilacion,
          accesibilidadInclusiva,
          atencionPersonal,
          tramitesAgiles,
          informacionClara,
          canalesComunicacion,
          resolucionInconformidades,
          promocionSaludBienestar,
          satisfaccionGeneral,
          fortalezas: fortalezasServicios,
          sugerencias: sugerenciasServicios
        },
        comentarios: sugerenciasServicios ? `Sugerencias: ${sugerenciasServicios} | Fortalezas: ${fortalezasServicios}` : fortalezasServicios
      });

      if (res.ok) {
        setRespuestas(MSBDatabase.getRespuestasEncuestas());
        setMensajeExito('✓ Tu encuesta anónima de satisfacción departamental ha sido registrada en la pestaña correspondiente de la Base Maestra.');
        setFortalezasServicios('');
        setSugerenciasServicios('');
        setTimeout(() => setMensajeExito(null), 5000);
      }
    } finally {
      setGuardandoFormulario(false);
    }
  };

  // Enviar Formulario 3: Percepción de Bienestar
  const handleEnviarBienestarSalud = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoFormulario(true);
    try {
      const sum = vidaActiva + descansoEnergia + alimentacionHidratacion + controlEstres + vitalidadBalance +
        estadoAnimo + sentidoPertenencia + convivenciaRespeto + satisfaccionDepartamental + recomendacionInstitucional;
      const prom = Number((sum / 10).toFixed(1));

      const res = await MSBDatabase.guardarRespuestaEncuesta({
        tipoEncuesta: 'bienestar_salud',
        tituloEncuesta: 'Percepción de Bienestar en Salud y Cultura Física',
        idUsuario: 'ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        correoUsuario: '',
        sector: sectorBienestar as Sector,
        idActividad: 'GENERAL',
        nombreActividad: 'Desarrollo Formativo y Salud Integral',
        fechaRegistro: msb_obtenerFechaHoraLocal(),
        puntuacionPromedio: prom,
        respuestas: {
          vidaActiva,
          descansoEnergia,
          alimentacionHidratacion,
          controlEstres,
          vitalidadBalance,
          estadoAnimo,
          sentidoPertenencia,
          convivenciaRespeto,
          satisfaccionDepartamental,
          recomendacionInstitucional
        },
        comentarios: ''
      });

      if (res.ok) {
        setRespuestas(MSBDatabase.getRespuestasEncuestas());
        setMensajeExito('✓ Tu encuesta anónima de bienestar y salud ha sido guardada en la pestaña oficial de la Base Maestra.');
        setTimeout(() => setMensajeExito(null), 5000);
      }
    } finally {
      setGuardandoFormulario(false);
    }
  };

  // Componente auxiliar para escala Likert 1 a 5
  const renderEscalaLikert = (
    etiqueta: string, 
    descripcion: string, 
    valor: number, 
    setValor: (n: number) => void
  ) => {
    return (
      <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-2 hover:border-[#1e3a8a] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="font-bold text-white text-xs leading-snug">{etiqueta}</div>
            {descripcion && <div className="text-[11px] text-[#94a3b8] mt-0.5">{descripcion}</div>}
          </div>
          <span className="text-xs font-bold text-cyan-300 self-start sm:self-auto bg-[#0a192f] px-2.5 py-0.5 rounded-md border border-blue-500/30 shrink-0">
            {valor} / 5 {valor === 5 ? '★ Totalmente de acuerdo' : valor === 4 ? '★ De acuerdo' : valor === 3 ? '★ Neutral' : valor === 2 ? '★ En desacuerdo' : '★ Totalmente en desacuerdo'}
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

  // Filtrado de respuestas para la pestaña analítica
  const respuestasPorTipo = respuestas.filter(r => r.tipoEncuesta === encuestaActiva);
  const respuestasFiltradas = respuestasPorTipo.filter(r => {
    const matchAct = filtroActividad === 'todas' || 
      (filtroActividad === 'GENERAL' ? (!r.idActividad || r.idActividad === 'GENERAL') : (r.idActividad === filtroActividad || (r.nombreActividad && r.nombreActividad.toLowerCase().includes(actividades.find(a => a.ID_actividad === filtroActividad)?.Nombre.toLowerCase() || ''))));
    const matchSec = filtroSector === 'todos' || r.sector === filtroSector;
    return matchAct && matchSec;
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

  // Cálculo de promedio específico para cada pregunta del formulario activo
  const calcularPromedioPregunta = (clave: string): string => {
    if (respuestasFiltradas.length === 0) return '5.0';
    const valores = respuestasFiltradas
      .map(r => r.respuestas ? Number(r.respuestas[clave]) : NaN)
      .filter(n => !isNaN(n) && n > 0 && n <= 5);
    if (valores.length === 0) return '5.0';
    return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
  };

  const estaHabilitada = MSBDatabase.estaEvaluacionHabilitada();
  const esAdmin = usuario.rol === 'administrador';

  // Guardar configuración de fechas
  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionEvaluaciones = {
      ...formConfig,
      ultimaActualizacionPor: `${usuario.nombre} ${usuario.apellidos}`,
      fechaModificacion: msb_obtenerFechaHoraLocal()
    };
    MSBDatabase.saveConfiguracionEvaluaciones(updated);
    setConfiguracion(updated);
    setAvisoAdminGuardado(true);
    setTimeout(() => {
      setAvisoAdminGuardado(false);
      setModalConfiguracion(false);
    }, 1200);
  };

  // Bloqueo si está cerrado y no es admin
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-white">
      
      {/* Barra de Control para Administrador */}
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
                  : `Los usuarios ven el estatus "Cerrado hasta final del semestre" (Fecha programada: ${configuracion.fechaHabilitacion}).`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalGuiaForms(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
              <span>Vincular Google Forms</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormConfig(configuracion);
                setModalConfiguracion(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-white" />
              <span>Programar Fecha</span>
            </button>
          </div>
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
            Plataforma institucional de evaluación docente-deportiva, satisfacción de servicios y bienestar en salud 100% empatada con Google Forms.
          </p>
        </div>

        {/* Toggle Responder / Analíticas */}
        {(usuario.rol === 'administrador' || usuario.rol === 'encargado') && (
          <div className="flex items-center bg-[#061426] p-1 rounded-2xl self-start md:self-auto border border-[#1e3555]">
            <button
              type="button"
              onClick={() => setVistaAdmin('responder')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vistaAdmin === 'responder' ? 'bg-blue-600 text-white shadow-md' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              ✍️ Responder
            </button>
            <button
              type="button"
              onClick={() => setVistaAdmin('analiticas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                vistaAdmin === 'analiticas' ? 'bg-blue-600 text-white shadow-md' : 'text-[#94a3b8] hover:text-white'
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
                FORMULARIO 1
              </span>
              <Award className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Evaluación de Encargados Deportivos
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'evaluacion_encargados' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              Preparación, comunicación, estrategias, recursos y cumplimiento del objetivo.
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
                FORMULARIO 2
              </span>
              <HeartHandshake className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Formulario de Satisfacción de Servicios
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'satisfaccion_servicios' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              15 indicadores: oferta, instalaciones, mantenimiento, trámites, atención y sugerencias.
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
                FORMULARIO 3
              </span>
              <HeartPulse className="w-4 h-4 opacity-80" />
            </div>
            <div className="font-bold text-sm leading-tight text-white">
              Formulario Bienestar y Salud Integral
            </div>
            <div className={`text-[11px] mt-1 line-clamp-2 ${encuestaActiva === 'bienestar_salud' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
              10 dimensiones: vida activa, descanso, alimentación, estrés, vitalidad y pertenencia.
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
                Instrumento de Evaluación Normalista (100% Anónimo y Confidencial)
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {encuestaActiva === 'evaluacion_encargados' && 'Evaluación de Encargados Deportivos'}
                {encuestaActiva === 'satisfaccion_servicios' && 'Formulario de Satisfacción del Departamento'}
                {encuestaActiva === 'bienestar_salud' && 'Formulario Bienestar y Salud Integral'}
              </h2>
            </div>

            <a
              href={obtenerEnlaceForm(encuestaActiva)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] hover:text-white rounded-xl text-xs font-semibold border border-[#1e3555] transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Abrir Formulario en Google Forms</span>
            </a>
          </div>

          {/* ================= FORMULARIO 1: EVALUACIÓN DE ENCARGADOS ================= */}
          {encuestaActiva === 'evaluacion_encargados' && (
            <form onSubmit={handleEnviarEvaluacionEncargado} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-blue-300 mb-1">
                  Club al que pertenece: *
                </label>
                <select
                  value={encargadoClubId}
                  onChange={(e) => setEncargadoClubId(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  {actividades.map(act => (
                    <option key={act.ID_actividad} value={act.ID_actividad} className="bg-[#061426] text-white">
                      {act.Nombre} — Responsable: {limpiarTituloLicenciado(act.Responsable_Nombre) || 'Docente asignado'}
                    </option>
                  ))}
                </select>
              </div>

              {renderEscalaLikert('1. Preparación del experto', 'Preparación del experto (tallerista, conferencista, seminarista, coordinador de actividades).', preparacionExperto, setPreparacionExperto)}
              {renderEscalaLikert('2. Comunicación con los participantes', 'Mantiene una comunicación fluida, clara, respetuosa y atiende las inquietudes del grupo.', comunicacionEncargado, setComunicacionEncargado)}
              {renderEscalaLikert('3. Estrategias y/o actividades de trabajo', 'Implementa dinámicas efectivas, entrenamientos estructurados y metodología formativa adecuada.', estrategiasTrabajo, setEstrategiasTrabajo)}
              {renderEscalaLikert('4. Uso de recursos y materiales', 'Aprovecha eficientemente el material deportivo, instalaciones y equipo disponible.', usoRecursosMateriales, setUsoRecursosMateriales)}
              {renderEscalaLikert('5. Cumplimiento del objetivo', 'Las sesiones cumplen con los propósitos deportivos, formativos y de desarrollo integral planteados.', cumplimientoObjetivo, setCumplimientoObjetivo)}

              <div>
                <label className="block font-bold text-blue-300 mb-1">
                  Sugerencias para la mejora:
                </label>
                <textarea
                  rows={3}
                  value={sugerenciasMejoraEncargado}
                  onChange={(e) => setSugerenciasMejoraEncargado(e.target.value)}
                  placeholder="Escribe aquí sugerencias concretas para fortalecer las sesiones y el trabajo del encargado..."
                  className="w-full p-3 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guardandoFormulario}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  {guardandoFormulario ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando en Base Maestra...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Evaluación de Encargado</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= FORMULARIO 2: SATISFACCIÓN DE SERVICIOS ================= */}
          {encuestaActiva === 'satisfaccion_servicios' && (
            <form onSubmit={handleEnviarSatisfaccionServicios} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  TIPO DE USUARIO: *
                </label>
                <select
                  value={sectorSatisfaccion}
                  onChange={(e) => setSectorSatisfaccion(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-purple-500"
                >
                  <option value="Estudiante" className="bg-[#061426] text-white">Estudiante Normalista</option>
                  <option value="Docente" className="bg-[#061426] text-white">Docente Normalista</option>
                  <option value="Trabajador" className="bg-[#061426] text-white">Personal Administrativo / Apoyo</option>
                  <option value="Egresado" className="bg-[#061426] text-white">Egresado Normalista</option>
                  <option value="Comunidad" className="bg-[#061426] text-white">Comunidad en General</option>
                </select>
              </div>

              {renderEscalaLikert('1. Oferta de Actividades', 'La oferta de actividades deportivas, acondicionamiento y programas de salud es variada y responde a las necesidades de la comunidad.', ofertaVariada, setOfertaVariada)}
              {renderEscalaLikert('2. Organización de Programas', 'Los programas de evaluación física, nutrición y cuidado médico-deportivo están bien organizados y son de fácil acceso.', programasSaludOrganizados, setProgramasSaludOrganizados)}
              {renderEscalaLikert('3. Difusión Oportuna', 'El Departamento difunde con oportunidad los calendarios, horarios y convocatorias de torneos y actividades.', difusionOportuna, setDifusionOportuna)}
              {renderEscalaLikert('4. Capacidad y Cupos', 'La capacidad de cupos y horarios ofertados es suficiente para atender la demanda de los usuarios.', capacidadCuposSuficiente, setCapacidadCuposSuficiente)}
              {renderEscalaLikert('5. Limpieza e Higiene de Instalaciones', 'El Departamento mantiene las instalaciones (gimnasio, cancha polivalente, sanitarios) en óptimas condiciones de limpieza e higiene.', mantenimientoLimpieza, setMantenimientoLimpieza)}
              {renderEscalaLikert('6. Mantenimiento de Equipos y Materiales', 'Existe un programa efectivo de mantenimiento preventivo y reemplazo oportuno de equipos y materiales deportivos deteriorados.', mantenimientoPreventivo, setMantenimientoPreventivo)}
              {renderEscalaLikert('7. Iluminación, Ventilación y Seguridad', 'Las áreas deportivas cuentan con iluminación, ventilación y señalización de seguridad adecuadas para la práctica.', iluminacionVentilacion, setIluminacionVentilacion)}
              {renderEscalaLikert('8. Accesibilidad e Inclusión', 'Los espacios deportivos y sus accesos cuentan con adaptaciones para personas con movilidad reducida u otras necesidades especiales.', accesibilidadInclusiva, setAccesibilidadInclusiva)}
              {renderEscalaLikert('9. Atención del Personal', 'El personal del Departamento brinda una atención amable, eficiente y respetuosa.', atencionPersonal, setAtencionPersonal)}
              {renderEscalaLikert('10. Trámites y Permisos Ágiles', 'Los trámites departamentales (inscripciones, préstamo de material, permisos) son ágiles y sencillos.', tramitesAgiles, setTramitesAgiles)}
              {renderEscalaLikert('11. Claridad de Reglamentos', 'La información sobre reglamentos y requisitos de servicio es clara, transparente y accesible.', informacionClara, setInformacionClara)}
              {renderEscalaLikert('12. Canales de Comunicación Institucional', 'Los canales de comunicación institucional (redes, cartelera, avisos digitales) mantienen informada a la comunidad con precisión.', canalesComunicacion, setCanalesComunicacion)}
              {renderEscalaLikert('13. Solución a Inconformidades', 'Las inconformidades o fallas reportadas a la administración departamental reciben una respuesta y solución oportuna.', resolucionInconformidades, setResolucionInconformidades)}
              {renderEscalaLikert('14. Promoción de Estilos de Vida Saludable', 'El Departamento de Deporte y Salud promueve de forma activa hábitos de vida saludable y bienestar psicosocial.', promocionSaludBienestar, setPromocionSaludBienestar)}
              {renderEscalaLikert('15. Satisfacción General de Gestión', 'En general, estoy satisfecho con la gestión integral y los servicios prestados por el Departamento de Deporte y Salud.', satisfaccionGeneral, setSatisfaccionGeneral)}

              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  ¿Qué fortalezas o aspectos positivos destaca de la gestión del Departamento de Deporte y Salud?
                </label>
                <textarea
                  rows={2}
                  value={fortalezasServicios}
                  onChange={(e) => setFortalezasServicios(e.target.value)}
                  placeholder="Aspectos positivos a resaltar..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  ¿Qué sugerencias concretas propone para mejorar los servicios, infraestructura o programas departamentales?
                </label>
                <textarea
                  rows={2}
                  value={sugerenciasServicios}
                  onChange={(e) => setSugerenciasServicios(e.target.value)}
                  placeholder="Sugerencias de infraestructura, nuevos talleres, horarios..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guardandoFormulario}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  {guardandoFormulario ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando en Base Maestra...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Formulario de Satisfacción</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= FORMULARIO 3: BIENESTAR Y SALUD ================= */}
          {encuestaActiva === 'bienestar_salud' && (
            <form onSubmit={handleEnviarBienestarSalud} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  TIPO DE USUARIO: *
                </label>
                <select
                  value={sectorBienestar}
                  onChange={(e) => setSectorBienestar(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-cyan-300 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="Estudiante" className="bg-[#061426] text-white">Estudiante Normalista</option>
                  <option value="Docente" className="bg-[#061426] text-white">Docente Normalista</option>
                  <option value="Trabajador" className="bg-[#061426] text-white">Personal Administrativo / Apoyo</option>
                  <option value="Egresado" className="bg-[#061426] text-white">Egresado Normalista</option>
                  <option value="Comunidad" className="bg-[#061426] text-white">Comunidad en General</option>
                </select>
              </div>

              {renderEscalaLikert('1. Mantenimiento de Vida Activa', 'Realizo actividad física o deporte de forma regular como parte de mi rutina diaria/semanal.', vidaActiva, setVidaActiva)}
              {renderEscalaLikert('2. Hábitos de Descanso y Energía', 'Considero que mis hábitos de descanso y sueño me permiten mantener suficiente energía durante mis jornadas escolares/laborales.', descansoEnergia, setDescansoEnergia)}
              {renderEscalaLikert('3. Alimentación e Hidratación', 'Tengo acceso a opciones de alimentación e hidratación saludables dentro o alrededor de la institución.', alimentacionHidratacion, setAlimentacionHidratacion)}
              {renderEscalaLikert('4. Control del Estrés y Agotamiento', 'Cuento con herramientas y apoyo para gestionar el estrés derivado de las exigencias académicas o laborales.', controlEstres, setControlEstres)}
              {renderEscalaLikert('5. Vitalidad y Balance Personal', 'Mantengo un equilibrio adecuado entre mis responsabilidades educativas/laborales y mi bienestar personal.', vitalidadBalance, setVitalidadBalance)}
              {renderEscalaLikert('6. Estado de Ánimo y Florecimiento', 'En general, me siento motivado, con ánimo positivo y con un claro sentido de desarrollo personal en la institución.', estadoAnimo, setEstadoAnimo)}
              {renderEscalaLikert('7. Sentido de Pertenencia', 'Me siento integrado y respaldado por la comunidad universitaria en las actividades deportivas y de salud.', sentidoPertenencia, setSentidoPertenencia)}
              {renderEscalaLikert('8. Convivencia Pacífica y Respeto', 'El ambiente en los espacios deportivos y de acondicionamiento es de respeto, juego limpio y libre de violencia/acoso.', convivenciaRespeto, setConvivenciaRespeto)}
              {renderEscalaLikert('9. Satisfacción Departamental', 'En general, estoy satisfecho con la contribución del Departamento de Deporte y Salud a mi calidad de vida universitaria.', satisfaccionDepartamental, setSatisfaccionDepartamental)}
              {renderEscalaLikert('10. Recomendación Institucional', 'Recomendaría a otros compañeros participar en los programas de salud, cultura física y acondicionamiento de la institución.', recomendacionInstitucional, setRecomendacionInstitucional)}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guardandoFormulario}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  {guardandoFormulario ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando en Base Maestra...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Formulario de Bienestar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* VISTA 2: RESULTADOS Y ANALÍTICAS PARA ADMINISTRADORES */}
      {vistaAdmin === 'analiticas' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 text-white">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Consolidado Departamental de Resultados
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Métricas y Analíticas de Evaluación
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Datos unificados de Plataforma y Formularios Google Forms con cálculo en tiempo real.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSincronizarConBaseMaestra}
                disabled={sincronizando}
                className="px-3.5 py-2 bg-blue-900/70 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${sincronizando ? 'animate-spin' : ''}`} />
                <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar Base Maestra'}</span>
              </button>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-[#94a3b8] font-semibold">Club:</span>
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

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-[#94a3b8] font-semibold">Sector:</span>
                <select
                  value={filtroSector}
                  onChange={(e) => setFiltroSector(e.target.value)}
                  className="p-2 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-bold text-purple-300 cursor-pointer focus:outline-none focus:border-purple-500"
                >
                  <option value="todos" className="bg-[#0a192f] text-white">-- Todos los Sectores --</option>
                  <option value="Estudiante" className="bg-[#0a192f] text-white">Estudiantes</option>
                  <option value="Docente" className="bg-[#0a192f] text-white">Docentes</option>
                  <option value="Trabajador" className="bg-[#0a192f] text-white">Administrativos/Apoyo</option>
                  <option value="Egresado" className="bg-[#0a192f] text-white">Egresados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#061426] border border-blue-500/30">
              <span className="text-[11px] font-bold text-blue-300 uppercase block">Puntuación Promedio</span>
              <div className="text-2xl font-black text-white mt-1">{promedioGeneral} <span className="text-sm font-normal text-[#94a3b8]">/ 5.0</span></div>
              <div className="text-[11px] text-cyan-300 mt-0.5">Desempeño Institucional Óptimo</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-emerald-500/30">
              <span className="text-[11px] font-bold text-emerald-300 uppercase block">Índice de Aprobación</span>
              <div className="text-2xl font-black text-white mt-1">
                {respuestasFiltradas.length > 0 ? `${((Number(promedioGeneral) / 5) * 100).toFixed(1)}%` : '100%'}
              </div>
              <div className="text-[11px] text-emerald-300 mt-0.5">Nivel de Satisfacción Positiva</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#061426] border border-purple-500/30">
              <span className="text-[11px] font-bold text-purple-300 uppercase block">Respuestas Filtradas</span>
              <div className="text-2xl font-black text-white mt-1">{respuestasFiltradas.length} <span className="text-sm font-normal text-[#94a3b8]">/ {respuestasPorTipo.length} total</span></div>
              <div className="text-[11px] text-purple-300 mt-0.5">Evaluaciones Recibidas</div>
            </div>
          </div>

          {/* Desglose Detallado Pregunta por Pregunta */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-2">
              <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Desglose Específico por Indicador del Formulario</span>
              </h3>
              <span className="text-[11px] text-[#94a3b8]">Escala 1 a 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {encuestaActiva === 'evaluacion_encargados' && [
                { key: 'preparacionExperto', label: '1. Preparación del experto (tallerista, coordinador)' },
                { key: 'comunicacion', label: '2. Comunicación con los participantes' },
                { key: 'estrategias', label: '3. Estrategias y/o actividades de trabajo' },
                { key: 'recursos', label: '4. Uso de recursos y materiales' },
                { key: 'cumplimientoObjetivo', label: '5. Cumplimiento del objetivo formativo' }
              ].map(({ key, label }) => {
                const prom = Number(calcularPromedioPregunta(key));
                return (
                  <div key={key} className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{label}</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                        ★ {prom.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <div className="w-full bg-[#0a192f] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: `${(prom / 5) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}

              {encuestaActiva === 'satisfaccion_servicios' && [
                { key: 'ofertaVariada', label: '1. Oferta variada de actividades' },
                { key: 'programasSaludOrganizados', label: '2. Programas de evaluación física y salud' },
                { key: 'difusionOportuna', label: '3. Difusión de calendarios y torneos' },
                { key: 'capacidadCuposSuficiente', label: '4. Capacidad de cupos y horarios' },
                { key: 'mantenimientoLimpieza', label: '5. Limpieza e higiene de instalaciones' },
                { key: 'mantenimientoPreventivo', label: '6. Mantenimiento y reemplazo de materiales' },
                { key: 'iluminacionVentilacion', label: '7. Iluminación, ventilación y seguridad' },
                { key: 'accesibilidadInclusiva', label: '8. Accesibilidad e inclusión en espacios' },
                { key: 'atencionPersonal', label: '9. Atención amable del personal' },
                { key: 'tramitesAgiles', label: '10. Trámites y préstamos ágiles' },
                { key: 'informacionClara', label: '11. Información clara sobre reglamentos' },
                { key: 'canalesComunicacion', label: '12. Canales de comunicación institucional' },
                { key: 'resolucionInconformidades', label: '13. Respuesta a fallas e inconformidades' },
                { key: 'promocionSaludBienestar', label: '14. Promoción de vida saludable' },
                { key: 'satisfaccionGeneral', label: '15. Satisfacción general con el Departamento' }
              ].map(({ key, label }) => {
                const prom = Number(calcularPromedioPregunta(key));
                return (
                  <div key={key} className="p-3 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white truncate pr-2" title={label}>{label}</span>
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30 shrink-0">
                        ★ {prom.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <div className="w-full bg-[#0a192f] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: `${(prom / 5) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}

              {encuestaActiva === 'bienestar_salud' && [
                { key: 'vidaActiva', label: '1. Mantenimiento de vida activa y deporte regular' },
                { key: 'descansoEnergia', label: '2. Hábitos de descanso y energía escolar/laboral' },
                { key: 'alimentacionHidratacion', label: '3. Acceso a alimentación e hidratación sana' },
                { key: 'controlEstres', label: '4. Herramientas para control del estrés' },
                { key: 'vitalidadBalance', label: '5. Equilibrio y vitalidad personal' },
                { key: 'estadoAnimo', label: '6. Estado de ánimo positivo y florecimiento' },
                { key: 'sentidoPertenencia', label: '7. Sentido de pertenencia comunitaria' },
                { key: 'convivenciaRespeto', label: '8. Convivencia pacífica y juego limpio' },
                { key: 'satisfaccionDepartamental', label: '9. Contribución a la calidad de vida' },
                { key: 'recomendacionInstitucional', label: '10. Recomendación de los programas a otros' }
              ].map(({ key, label }) => {
                const prom = Number(calcularPromedioPregunta(key));
                return (
                  <div key={key} className="p-3 bg-[#061426] rounded-2xl border border-[#1e293b] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white truncate pr-2" title={label}>{label}</span>
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                        ★ {prom.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <div className="w-full bg-[#0a192f] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${(prom / 5) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desglose por Clubes Deportivos */}
          {encuestaActiva === 'evaluacion_encargados' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-[#1e3555] pb-2">
                <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Desglose por Club Deportivo</span>
                </h3>
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
                        <span className="text-xs font-bold text-emerald-300">
                          {promNum > 0 ? `★ ${promedio} / 5.0` : 'Sin respuestas'}
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">
                          {totalRespuestas} {totalRespuestas === 1 ? 'evaluación' : 'evaluaciones'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial de Respuestas y Sugerencias de Mejora */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-2">
              <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Respuestas y Sugerencias Recibidas</span>
              </h3>
              {(filtroActividad !== 'todas' || filtroSector !== 'todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroActividad('todas');
                    setFiltroSector('todos');
                  }}
                  className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            {respuestasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-[#94a3b8] text-xs bg-[#061426] rounded-2xl border border-dashed border-[#1e3555]">
                No hay evaluaciones registradas con los filtros seleccionados.
              </div>
            ) : (
              <div className="divide-y divide-[#1e293b] border border-[#1e3555] rounded-2xl overflow-hidden bg-[#061426]">
                {respuestasFiltradas.map((item, idx) => (
                  <div key={item.idRespuesta || idx} className="p-4 space-y-2 hover:bg-[#0a192f]/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Participante Anónimo</span>
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

      {/* MODAL 1: GUÍA DE VINCULACIÓN CON GOOGLE FORMS */}
      {modalGuiaForms && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-[#0a192f] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-5 my-6 max-h-[92vh] overflow-y-auto text-white">
            
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 text-purple-300 flex items-center justify-center border border-purple-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cómo Vincular Google Forms con la Base Maestra y la Plataforma
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Estructura 1:1 con las hojas de cálculo de BASE_MAESTRA_MOVIMIENTO_SALUD_BIENESTAR 1.1
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalGuiaForms(false)}
                className="p-1.5 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#cbd5e1] leading-relaxed">
              <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-500/30 space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>¿Cómo se transfiere la información al Administrador?</span>
                </div>
                <p>
                  Tanto las encuestas respondidas directamente en esta plataforma como las contestadas a través de los Google Forms vinculados a tu hoja de cálculo <strong>BASE_MAESTRA_MOVIMIENTO_SALUD_BIENESTAR 1.1</strong> se leen y procesan de forma automática.
                </p>
              </div>

              {/* Form 1 Schema */}
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">1. Evaluación de Encargados Deportivos (Hoja: Evaluacion_Encargados)</span>
                  <button
                    type="button"
                    onClick={() => copiarAlPortapapeles("Marca temporal\tPuntuación\tCorreo \tClub al que pertenece\tPreparación del experto (tallerista, conferencista, seminarista, coordinador de actividades).\tComunicación con los participantes\tEstrategias y/o actividades de trabajo\tUso de recursos y materiales\tCumplimiento del objetivo\tSugerencias para la mejora.", "encargados")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-200 hover:bg-blue-800 text-[11px] font-semibold cursor-pointer border border-blue-500/30"
                  >
                    {copiadoHeader === 'encargados' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiadoHeader === 'encargados' ? 'Copiado' : 'Copiar encabezados'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] bg-[#0a192f] p-2 rounded-xl text-[#94a3b8] overflow-x-auto">
                  Marca temporal | Puntuación | Correo | Club al que pertenece | Preparación del experto... | Comunicación con los participantes | Estrategias y/o actividades de trabajo | Uso de recursos y materiales | Cumplimiento del objetivo | Sugerencias para la mejora.
                </div>
              </div>

              {/* Form 2 Schema */}
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">2. Formulario de Satisfacción (Hoja: Satisfaccion_Servicios)</span>
                  <button
                    type="button"
                    onClick={() => copiarAlPortapapeles("Marca temporal\tTIPO DE USUARIO\tLa oferta de actividades deportivas, acondicionamiento y programas de salud es variada y responde a las necesidades de la comunidad.\tLos programas de evaluación física, nutrición y cuidado médico-deportivo están bien organizados y son de fácil acceso.\tEl Departamento difunde con oportunidad los calendarios, horarios y convocatorias de torneos y actividades.\tLa capacidad de cupos y horarios ofertados es suficiente para atender la demanda de los usuarios.\tEl Departamento mantiene las instalaciones (gimnasio, cancha polivalente, sanitarios) en óptimas condiciones de limpieza e higiene.\tExiste un programa efectivo de mantenimiento preventivo y reemplazo oportuno de equipos y materiales deportivos deteriorados.\tLas áreas deportivas cuentan con iluminación, ventilación y señalización de seguridad adecuadas para la práctica.\tLos espacios deportivos y sus accesos cuentan con adaptaciones para personas con movilidad reducida u otras necesidades especiales.\tEl personal del Departamento brinda una atención amable, eficiente y respetuosa.\tLos trámites departamentales (inscripciones, préstamo de material, permisos) son ágiles y sencillos.\tLa información sobre reglamentos y requisitos de servicio es clara, transparente y accesible.\tLos canales de comunicación institucional (redes, cartelera, avisos digitales) mantienen informada a la comunidad con precisión.\tLas inconformidades o fallas reportadas a la administración departamental reciben una respuesta y solución oportuna.\tEl Departamento de Deporte y Salud promueve de forma activa hábitos de vida saludable y bienestar psicosocial.\tEn general, estoy satisfecho con la gestión integral y los servicios prestados por el Departamento de Deporte y Salud.\t¿Qué fortalezas o aspectos positivos destaca de la gestión del Departamento de Deporte y Salud?\t¿Qué sugerencias concretas propone para mejorar los servicios, infraestructura o programas departamentales?.", "satisfaccion")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-200 hover:bg-purple-800 text-[11px] font-semibold cursor-pointer border border-purple-500/30"
                  >
                    {copiadoHeader === 'satisfaccion' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiadoHeader === 'satisfaccion' ? 'Copiado' : 'Copiar encabezados'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] bg-[#0a192f] p-2 rounded-xl text-[#94a3b8] overflow-x-auto">
                  Marca temporal | TIPO DE USUARIO | Oferta variada | Programas de salud | Difusión | Capacidad | Instalaciones limpias | Mantenimiento preventivo | Iluminación/seguridad | Accesibilidad | Atención amable | Trámites ágiles | Información clara | Canales comunicación | Solución inconformidades | Hábitos saludables | Satisfacción general | Fortalezas | Sugerencias
                </div>
              </div>

              {/* Form 3 Schema */}
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-[#1e3555] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">3. Formulario Bienestar y Salud (Hoja: Bienestar_Salud)</span>
                  <button
                    type="button"
                    onClick={() => copiarAlPortapapeles("Marca temporal\tTIPO DE USUARIO\tMantenimiento de Vida Activa: Realizo actividad física o deporte de forma regular como parte de mi rutina diaria/semanal.\tHábitos de Descanso y Energía: Considero que mis hábitos de descanso y sueño me permiten mantener suficiente energía durante mis jornadas escolares/laborales.\tAlimentación e Hidratación: Tengo acceso a opciones de alimentación e hidratación saludables dentro o alrededor de la institución.\tControl del Estrés y Agotamiento: Cuento con herramientas y apoyo para gestionar el estrés derivado de las exigencias académicas o laborales.\tVitalidad y Balance Personal: Mantengo un equilibrio adecuado entre mis responsabilidades educativas/laborales y mi bienestar personal.\tEstado de Ánimo y Florecimiento: En general, me siento motivado, con ánimo positivo y con un claro sentido de desarrollo personal en la institución.\tSentido de Pertenencia: Me siento integrado y respaldado por la comunidad universitaria en las actividades deportivas y de salud.\tConvivencia Pacífica y Respeto: El ambiente en los espacios deportivos y de acondicionamiento es de respeto, juego limpio y libre de violencia/acoso.\tSatisfacción Departamental: En general, estoy satisfecho con la contribución del Departamento de Deporte y Salud a mi calidad de vida universitaria.\tRecomendación Institucional: Recomendaría a otros compañeros participar en los programas de salud, cultura física y acondicionamiento de la institución", "bienestar")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 text-[11px] font-semibold cursor-pointer border border-emerald-500/30"
                  >
                    {copiadoHeader === 'bienestar' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiadoHeader === 'bienestar' ? 'Copiado' : 'Copiar encabezados'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] bg-[#0a192f] p-2 rounded-xl text-[#94a3b8] overflow-x-auto">
                  Marca temporal | TIPO DE USUARIO | Vida activa | Descanso y energía | Alimentación e hidratación | Control del estrés | Vitalidad | Ánimo | Sentido de pertenencia | Convivencia pacífica | Satisfacción | Recomendación
                </div>
              </div>

              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-1">
                <div className="font-bold text-emerald-300">Paso para refrescar datos:</div>
                <p>
                  En la pestaña de <strong>Resultados</strong>, haz clic en el botón azul <strong>"Sincronizar Base Maestra"</strong>. La aplicación leerá automáticamente las respuestas de todas las hojas vinculadas y calculará las estadísticas al instante.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1e3555]">
              <button
                type="button"
                onClick={() => setModalGuiaForms(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: PROGRAMACIÓN DE APERTURA */}
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
                      Los usuarios verán "Estatus: Cerrado hasta final del semestre" hasta la fecha programada.
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
              </div>

              {/* Enlaces Google Forms */}
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-purple-500/30 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>Vincular Enlaces Google Forms</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    1. Enlace Evaluación de Encargados
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
                    2. Enlace Satisfacción de Servicios
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
                    3. Enlace Percepción de Bienestar
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
