import React, { useState } from 'react';
import { MSBDatabase, CONFIG } from '../../utils/storage';
import { Identidad, EvaluacionCapacidadesFisicas, MedicionFisica, SolicitudModificacionPrueba, Actividad, InscripcionAsistencia } from '../../types';
import { 
  descargarDocumentoHtml, 
  imprimirHtmlDirecto, 
  generarHtmlInformeEjecutivoAdmin, 
  generarHtmlCedulaEvaluacionFisica 
} from '../../utils/exportDocs';
import { FirmaVectorPreview } from '../SignatureModal';
import { 
  Activity, 
  Dumbbell, 
  HeartPulse, 
  Scale, 
  Gauge, 
  Award, 
  CheckCircle2, 
  Search, 
  Info, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Calendar,
  AlertCircle,
  Printer,
  Download,
  FileText,
  TrendingUp,
  Sparkles,
  Users,
  ChevronRight,
  ShieldAlert,
  Check,
  XCircle,
  Clock,
  Layers,
  Filter
} from 'lucide-react';

export const PruebasFisicasView: React.FC = () => {
  const [identidades] = useState<Identidad[]>(MSBDatabase.getIdentidades());
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionCapacidadesFisicas[]>(MSBDatabase.getEvaluacionesFisicas());
  const [solicitudesMod, setSolicitudesMod] = useState<SolicitudModificacionPrueba[]>(MSBDatabase.getSolicitudesModificacionPruebas());
  const [actividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [inscripciones] = useState<InscripcionAsistencia[]>(MSBDatabase.getInscripciones());
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroActividad, setFiltroActividad] = useState<string>('todas');
  const [pestanaSeccion, setPestanaSeccion] = useState<'informe' | 'solicitudes'>('informe');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Modal para ver informe ejecutivo consolidado
  const [modalInformeEjecutivo, setModalInformeEjecutivo] = useState<boolean>(false);

  // Modal para captura o edición de evaluación de capacidades físicas por el administrador
  const [modalEdicion, setModalEdicion] = useState<{
    abierto: boolean;
    estudiante: Identidad | null;
    evaluacion: Partial<EvaluacionCapacidadesFisicas> | null;
    subpestana: 'inicial' | 'final' | 'filiacion';
  }>({
    abierto: false,
    estudiante: null,
    evaluacion: null,
    subpestana: 'inicial'
  });

  // Modal de Cédula Entregable / Imprimible de Evaluación Física Oficial
  const [modalCedula, setModalCedula] = useState<{
    abierto: boolean;
    estudiante: Identidad | null;
    evaluacion: EvaluacionCapacidadesFisicas | null;
  }>({
    abierto: false,
    estudiante: null,
    evaluacion: null
  });

  const recargarEvaluaciones = () => {
    setEvaluaciones(MSBDatabase.getEvaluacionesFisicas());
    setSolicitudesMod(MSBDatabase.getSolicitudesModificacionPruebas());
  };

  const notificar = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
    recargarEvaluaciones();
  };

  // Calcular IMC automático
  const calcularImc = (peso?: number, estatura?: number): number => {
    if (!peso || !estatura || estatura <= 0) return 0;
    const estM = estatura / 100;
    return Number((peso / (estM * estM)).toFixed(1));
  };

  // Cifras generales calculadas para el Administrador
  const promedios = MSBDatabase.calcularPromediosInstitucionalesFisicos();
  const autoridades = MSBDatabase.getAutoridades();
  const solicitudesPendientes = solicitudesMod.filter(s => s.estado === 'Pendiente');

  // Filtrado de estudiantes y participantes inscritos (con soporte de filtro por Club / Actividad)
  const participantes = identidades.filter(i => 
    i.sector === 'Estudiante' || i.rol === 'estudiante' || i.sector === 'Docente' || i.rol === 'trabajador'
  ).filter(i => {
    // 1. Filtrado por Actividad / Club Deportivo
    if (filtroActividad !== 'todas') {
      const inscritoEnActividad = inscripciones.some(
        ins => ins.ID_actividad === filtroActividad && ins.ID_participante === i.id
      );
      if (!inscritoEnActividad) return false;
    }

    // 2. Búsqueda por texto (nombre, id, licenciatura)
    const matchBusqueda = `${i.nombre} ${i.apellidos} ${i.id} ${i.licenciatura || ''}`.toLowerCase().includes(busqueda.toLowerCase());
    if (!matchBusqueda) return false;

    // 3. Filtro por Nivel de Aptitud Física
    if (filtroNivel !== 'todos') {
      const ev = evaluaciones.find(e => e.idParticipante === i.id);
      if (!ev) return filtroNivel === 'pendiente';
      if (filtroNivel === 'evaluados') return !!(ev.inicial && ev.final);
      if (filtroNivel === 'pendiente') return !(ev.inicial && ev.final);
      return ev.nivelValidado?.toLowerCase() === filtroNivel.toLowerCase();
    }
    return true;
  });

  // Estadísticas específicas para el Club / Actividad seleccionado
  const actividadSeleccionada = actividades.find(a => a.ID_actividad === filtroActividad);
  const inscritosEnClub = filtroActividad === 'todas'
    ? inscripciones
    : inscripciones.filter(ins => ins.ID_actividad === filtroActividad);

  const participantesDelClub = identidades.filter(i =>
    inscritosEnClub.some(ins => ins.ID_participante === i.id)
  );

  const evaluacionesDelClub = evaluaciones.filter(ev =>
    participantesDelClub.some(p => p.id === ev.idParticipante)
  );

  const evaluadosCompletosClub = evaluacionesDelClub.filter(ev => ev.inicial && ev.final);
  const promedioAvanceClubNavette = evaluadosCompletosClub.length > 0
    ? Number((evaluadosCompletosClub.reduce((acc, ev) => acc + (ev.incrementoCourseNavette || 0), 0) / evaluadosCompletosClub.length).toFixed(1))
    : 0;
  const promedioAvanceClubLagartijas = evaluadosCompletosClub.length > 0
    ? Number((evaluadosCompletosClub.reduce((acc, ev) => acc + (ev.incrementoFuerzaLagartijas || 0), 0) / evaluadosCompletosClub.length).toFixed(1))
    : 0;
  const promedioAvanceClubFlex = evaluadosCompletosClub.length > 0
    ? Number((evaluadosCompletosClub.reduce((acc, ev) => acc + (ev.incrementoFlexibilidadPorcentaje || 0), 0) / evaluadosCompletosClub.length).toFixed(1))
    : 0;

  // Acciones de Descarga e Impresión del Informe Ejecutivo
  const handleDescargarInformeEjecutivo = () => {
    const html = generarHtmlInformeEjecutivoAdmin(promedios, evaluaciones, identidades, autoridades);
    descargarDocumentoHtml(
      'informe_ejecutivo_capacidades_fisicas_2026_1',
      'Informe Ejecutivo de Capacidades Físicas',
      html
    );
    notificar('✓ Informe Ejecutivo descargado exitosamente en formato HTML / PDF listo.');
  };

  const handleImprimirInformeEjecutivo = () => {
    const html = generarHtmlInformeEjecutivoAdmin(promedios, evaluaciones, identidades, autoridades);
    imprimirHtmlDirecto('Informe Ejecutivo de Capacidades Físicas', html);
  };

  // Acciones de Descarga e Impresión de la Cédula
  const handleDescargarCedula = (est: Identidad, ev: EvaluacionCapacidadesFisicas) => {
    const html = generarHtmlCedulaEvaluacionFisica(est, ev, autoridades);
    descargarDocumentoHtml(
      `cedula_evaluacion_fisica_${est.id}_${est.nombre.replace(/\s+/g, '_')}`,
      `Cédula Física - ${est.nombre} ${est.apellidos}`,
      html
    );
    notificar(`✓ Cédula oficial de ${est.nombre} descargada.`);
  };

  const handleImprimirCedula = (est: Identidad, ev: EvaluacionCapacidadesFisicas) => {
    const html = generarHtmlCedulaEvaluacionFisica(est, ev, autoridades);
    imprimirHtmlDirecto(`Cédula Física - ${est.nombre} ${est.apellidos}`, html);
  };

  // Abrir modal de edición
  const handleAbrirEdicion = (est: Identidad) => {
    const evExistente = evaluaciones.find(e => e.idParticipante === est.id);
    
    const evBase: Partial<EvaluacionCapacidadesFisicas> = evExistente ? { ...evExistente } : {
      idEvaluacion: `EVA-${est.id.replace('PAR-', '')}`,
      idParticipante: est.id,
      periodo: 'Semestre 2026-1',
      inicial: {
        fecha: new Date().toISOString().substring(0, 10),
        courseNavetteNivel: 3.5,
        fuerzaLagartijas60s: 15,
        fuerzaSentadillas60s: 20,
        sitAndReachCm: 2.0,
        pesoKg: 62.0,
        estaturaCm: 165,
        imc: 22.8,
        observaciones: 'Evaluación diagnóstica inicial.'
      },
      final: {
        fecha: new Date().toISOString().substring(0, 10),
        courseNavetteNivel: 4.8,
        fuerzaLagartijas60s: 22,
        fuerzaSentadillas60s: 30,
        sitAndReachCm: 4.5,
        pesoKg: 60.5,
        estaturaCm: 165,
        imc: 22.2,
        observaciones: 'Evaluación final de cierre de semestre.'
      }
    };

    setModalEdicion({
      abierto: true,
      estudiante: est,
      evaluacion: evBase,
      subpestana: 'inicial'
    });
  };

  // Guardar evaluación desde el administrador
  const handleGuardarEvaluacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEdicion.evaluacion || !modalEdicion.estudiante) return;

    // Actualizar también la filiación académica del participante
    const estudianteActualizado: Identidad = {
      ...modalEdicion.estudiante,
      licenciatura: modalEdicion.estudiante.licenciatura?.trim() || 'Licenciatura en Educación Primaria',
      semestre: modalEdicion.estudiante.semestre?.trim() || '5° Semestre',
      grupo: modalEdicion.estudiante.grupo?.trim() || 'Grupo A'
    };
    MSBDatabase.saveIdentidad(estudianteActualizado);

    // Asegurar IMC calculado en inicial y final si existen
    const inicial = modalEdicion.evaluacion.inicial ? {
      ...modalEdicion.evaluacion.inicial,
      imc: calcularImc(modalEdicion.evaluacion.inicial.pesoKg, modalEdicion.evaluacion.inicial.estaturaCm)
    } : undefined;

    const final = modalEdicion.evaluacion.final ? {
      ...modalEdicion.evaluacion.final,
      imc: calcularImc(modalEdicion.evaluacion.final.pesoKg, modalEdicion.evaluacion.final.estaturaCm)
    } : undefined;

    const evaluacionParaGuardar: EvaluacionCapacidadesFisicas = {
      ...(modalEdicion.evaluacion as EvaluacionCapacidadesFisicas),
      idEvaluacion: modalEdicion.evaluacion.idEvaluacion || `EVA-${modalEdicion.estudiante.id.replace('PAR-', '')}`,
      idParticipante: modalEdicion.estudiante.id,
      periodo: modalEdicion.evaluacion.periodo || 'Semestre 2026-1',
      inicial,
      final
    };

    MSBDatabase.saveEvaluacionFisica(evaluacionParaGuardar);
    setModalEdicion({ abierto: false, estudiante: null, evaluacion: null, subpestana: 'inicial' });
    notificar(`✓ Evaluación física de ${modalEdicion.estudiante.nombre} ${modalEdicion.estudiante.apellidos} guardada y ponderada exitosamente.`);
  };

  const handleEliminarEvaluacion = (idEvaluacion: string, nombreAlumno: string) => {
    if (confirm(`¿Confirma eliminar la evaluación física institucional de ${nombreAlumno}?`)) {
      MSBDatabase.deleteEvaluacionFisica(idEvaluacion);
      notificar(`✓ Evaluación física de ${nombreAlumno} eliminada.`);
    }
  };

  // Autorización de modificaciones solicitadas por usuarios
  const handleResolverSolicitudMod = (solicitud: SolicitudModificacionPrueba, accion: 'Autorizada' | 'Rechazada') => {
    const res = MSBDatabase.resolverSolicitudModificacionPrueba(
      solicitud.idSolicitudMod,
      accion,
      accion === 'Autorizada' 
        ? 'Modificación autorizada por la Administración para actualización de mediciones.' 
        : 'Modificación rechazada por la Administración.'
    );
    if (res.ok) {
      notificar(`✓ Solicitud de ${solicitud.nombreParticipante} ha sido ${accion.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-6 text-white">
      
      {/* Encabezado Departamental del Módulo con botones listos para descargar e imprimir */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/40 uppercase tracking-wider">
              Evaluaciones Físicas • Fase 2
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              {CONFIG.INSTITUCION}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Cédula de Capacidades Físicas
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Departamento de Deporte y Salud • Medición Inicial Diagnóstica vs. Medición Final Semestral
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setModalInformeEjecutivo(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#061426] hover:bg-[#112240] text-cyan-300 text-xs font-semibold rounded-xl border border-[#1e3555] transition-colors cursor-pointer"
          >
            <span>Ver Informe Ejecutivo</span>
          </button>
          <button
            onClick={handleDescargarInformeEjecutivo}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe PDF</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Administrador: Informe General vs Solicitudes de Modificación */}
      <div className="flex items-center space-x-2 border-b border-[#1e3555] pb-2">
        <button
          onClick={() => setPestanaSeccion('informe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            pestanaSeccion === 'informe'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3555]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Informe y Padrón de Evaluaciones ({participantes.length})</span>
        </button>

        <button
          onClick={() => setPestanaSeccion('solicitudes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            pestanaSeccion === 'solicitudes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-[#0a192f] text-[#94a3b8] hover:text-white hover:bg-[#112240] border border-[#1e3555]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Avisos de Modificación de Usuarios</span>
          {solicitudesPendientes.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {solicitudesPendientes.length}
            </span>
          )}
        </button>
      </div>

      {/* Notificación */}
      {mensaje && (
        <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 animate-in fade-in ${
          mensaje.tipo === 'exito' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' : 'bg-red-950/80 text-red-200 border border-red-500/40'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}

      {/* ================= SECCIÓN 1: INFORME GENERAL Y PADRÓN NOMINAL ================= */}
      {pestanaSeccion === 'informe' && (
        <div className="space-y-6">
          
          {/* ================= RESUMEN DEL AVANCE PORCENTUAL GLOBAL ================= */}
          <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/40 uppercase tracking-wider">
                    Resumen Ejecutivo Institucional
                  </span>
                  <span className="text-xs text-[#94a3b8] font-medium">
                    {promedios.totalEvaluados} participantes con ciclo completo contrastado
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Cifra General del Promedio de Todos los Participantes Inscritos
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  Promedio ponderado del avance porcentual entre la medición inicial y la medición final en las 4 dimensiones evaluadas.
                </p>
              </div>

              <div className="bg-[#061426] border border-blue-500/40 p-3.5 rounded-2xl text-center shrink-0 shadow-inner">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                  Puntaje Promedio General
                </span>
                <div className="text-2xl font-black text-white">
                  {promedios.promedioPuntos} <span className="text-sm font-semibold text-[#94a3b8]">/ 4 Puntos</span>
                </div>
                <span className="text-[11px] font-bold text-cyan-300">
                  {promedios.promedioPuntos >= 3.5 ? 'Nivel Destacado' : promedios.promedioPuntos >= 2.5 ? 'Nivel Satisfactorio' : promedios.promedioPuntos >= 1.5 ? 'Nivel Básico' : 'Nivel Insuficiente'}
                </span>
              </div>
            </div>

            {/* Grid de KPIs Globales con Porcentajes de Avance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Resistencia Cardiorrespiratoria (Course Navette) */}
              <div className="p-4 bg-[#061426] rounded-2xl border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Course Navette
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94a3b8] font-medium block">Promedio Incremento Resistencia:</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    +{promedios.promedioCourseNavette}%
                  </div>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-tight">
                  Aumento en el nivel o palier alcanzado en el test de 20m shuttle run entre inicio y cierre.
                </p>
              </div>

              {/* 2. Fuerza Muscular Combinada (60 segundos) */}
              <div className="p-4 bg-[#061426] rounded-2xl border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Fuerza en 60s
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94a3b8] font-medium block">Promedio Fuerza Combinada:</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    +{promedios.promedioFuerzaCombinada}%
                  </div>
                </div>
                <div className="text-[11px] text-blue-200/90 leading-tight">
                  Lagartijas: <strong className="text-white">+{promedios.promedioLagartijas}%</strong> | Sentadillas: <strong className="text-white">+{promedios.promedioSentadillas}%</strong>
                </div>
              </div>

              {/* 3. Flexibilidad (Sit and Reach) */}
              <div className="p-4 bg-[#061426] rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Sit & Reach
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94a3b8] font-medium block">Promedio Alcance Flexibilidad:</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    +{promedios.promedioFlexibilidadCm} cm
                  </div>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-tight">
                  Ganancia neta promedio de alcance en centímetros (+{promedios.promedioFlexibilidadPorcentaje}%).
                </p>
              </div>

              {/* 4. Composición Corporal (IMC) */}
              <div className="p-4 bg-[#061426] rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Composición IMC
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94a3b8] font-medium block">Avance Composición Corporal:</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    +{promedios.promedioCambioImc}%
                  </div>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  Optimización y normalización hacia rangos saludables de IMC (18.5 - 24.9 kg/m²).
                </p>
              </div>

            </div>

            {/* Distribución por Niveles Oficiales */}
            <div className="p-4 bg-[#061426] rounded-2xl border border-[#1e3555]">
              <span className="text-xs font-bold text-cyan-300 block mb-2">
                Distribución Oficial de Participantes por Nivel de Aptitud Física:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-300 block">Destacado (4 Puntos)</span>
                  <span className="text-xl font-black text-white">{promedios.distribucionNivel.destacado}</span>
                  <span className="text-[10px] text-emerald-300 block">Mejora &ge;40% en &ge;4 dim</span>
                </div>
                <div className="bg-blue-950/60 border border-blue-500/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-bold text-blue-300 block">Satisfactorio (3 Puntos)</span>
                  <span className="text-xl font-black text-white">{promedios.distribucionNivel.satisfactorio}</span>
                  <span className="text-[10px] text-blue-300 block">Mejora 25-39% en 4-5 dim</span>
                </div>
                <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-300 block">Básico (2 Puntos)</span>
                  <span className="text-xl font-black text-white">{promedios.distribucionNivel.basico}</span>
                  <span className="text-[10px] text-amber-300 block">Mejora 10-24% en 3-4 dim</span>
                </div>
                <div className="bg-[#0a192f] border border-[#1e3555] p-2.5 rounded-xl">
                  <span className="text-[11px] font-bold text-[#94a3b8] block">Insuficiente (1 Punto)</span>
                  <span className="text-xl font-black text-white">{promedios.distribucionNivel.insuficiente}</span>
                  <span className="text-[10px] text-[#64748b] block">Mejora &lt;10%</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= TABLA NOMINAL DE EVALUACIONES FÍSICAS ================= */}
          <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a] shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Padrón de Participantes y Mediciones Contrastadas
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Filiación académica (Licenciatura, Semestre y Grupo), medición inicial vs medición final y porcentaje de avance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar participante o ID..."
                    className="pl-9 pr-3 py-1.5 bg-[#061426] border border-[#1e3555] text-white placeholder:text-[#64748b] rounded-xl text-xs w-48 sm:w-56 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filtro por Actividad / Club */}
                <select
                  value={filtroActividad}
                  onChange={(e) => setFiltroActividad(e.target.value)}
                  className="p-1.5 bg-[#061426] border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer max-w-[210px] truncate"
                  title="Filtrar resultados físicos por club o actividad"
                >
                  <option value="todas" className="bg-[#061426] text-white">Todas las Actividades ({actividades.length})</option>
                  {actividades.map((act) => (
                    <option key={act.ID_actividad} value={act.ID_actividad} className="bg-[#061426] text-amber-200">
                      ⚽ {act.Nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  className="p-1.5 bg-[#061426] border border-[#1e3555] text-cyan-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="todos" className="bg-[#061426] text-white">Todos los niveles</option>
                  <option value="evaluados" className="bg-[#061426] text-white">Con ambas mediciones</option>
                  <option value="pendiente" className="bg-[#061426] text-white">Pendientes de completar</option>
                  <option value="destacado" className="bg-[#061426] text-white">Nivel Destacado</option>
                  <option value="satisfactorio" className="bg-[#061426] text-white">Nivel Satisfactorio</option>
                  <option value="basico" className="bg-[#061426] text-white">Nivel Básico</option>
                </select>
              </div>
            </div>

            {/* Resumen de Desempeño Físico del Club Seleccionado */}
            {filtroActividad !== 'todas' && actividadSeleccionada && (
              <div className="bg-gradient-to-r from-[#061426] via-[#0d213f] to-[#061426] p-4 rounded-2xl border border-amber-500/40 shadow-lg space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e3555] pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
                      🏆
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        Resultados Físicos Filtrados por Club
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {actividadSeleccionada.Nombre} ({actividadSeleccionada.ID_actividad})
                      </h4>
                    </div>
                  </div>

                  <div className="text-xs text-[#94a3b8] flex items-center space-x-2">
                    <span>Encargado: <strong className="text-white">{actividadSeleccionada.Responsable_Nombre || 'Departamento'}</strong></span>
                    <span>•</span>
                    <span className="text-cyan-300 font-semibold">{participantesDelClub.length} inscritos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="bg-[#0a192f] p-2.5 rounded-xl border border-blue-500/30">
                    <span className="text-[10px] text-cyan-300 block font-semibold">Evaluados en Club</span>
                    <span className="text-base font-black text-white">{evaluadosCompletosClub.length} / {participantesDelClub.length}</span>
                    <span className="text-[10px] text-[#94a3b8] block">Ciclo Completo</span>
                  </div>
                  <div className="bg-[#0a192f] p-2.5 rounded-xl border border-rose-500/30">
                    <span className="text-[10px] text-rose-300 block font-semibold">Avance Course Navette</span>
                    <span className="text-base font-black text-rose-400">+{promedioAvanceClubNavette}%</span>
                    <span className="text-[10px] text-[#94a3b8] block">Resistencia Aeróbica</span>
                  </div>
                  <div className="bg-[#0a192f] p-2.5 rounded-xl border border-blue-500/30">
                    <span className="text-[10px] text-blue-300 block font-semibold">Avance Fuerza</span>
                    <span className="text-base font-black text-blue-400">+{promedioAvanceClubLagartijas}%</span>
                    <span className="text-[10px] text-[#94a3b8] block">Lagartijas 60s</span>
                  </div>
                  <div className="bg-[#0a192f] p-2.5 rounded-xl border border-purple-500/30">
                    <span className="text-[10px] text-purple-300 block font-semibold">Avance Flexibilidad</span>
                    <span className="text-base font-black text-purple-400">+{promedioAvanceClubFlex}%</span>
                    <span className="text-[10px] text-[#94a3b8] block">Sit & Reach</span>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#061426] text-cyan-300 font-bold border-b border-[#1e3555]">
                  <tr>
                    <th className="p-3">Participante, Filiación y Clubes</th>
                    <th className="p-3 text-center">Course Navette</th>
                    <th className="p-3 text-center">Fuerza en 60s (Lag + Sent)</th>
                    <th className="p-3 text-center">Flexibilidad Sit & Reach</th>
                    <th className="p-3 text-center">Composición IMC</th>
                    <th className="p-3 text-center">Dictamen y Puntos</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {participantes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#94a3b8]">
                        No se encontraron participantes que coincidan con los filtros de búsqueda o club seleccionado.
                      </td>
                    </tr>
                  ) : (
                    participantes.map((part) => {
                      const ev = evaluaciones.find(e => e.idParticipante === part.id);
                      const tieneAmbas = !!(ev?.inicial && ev?.final);
                      const clubsPart = inscripciones
                        .filter(ins => ins.ID_participante === part.id)
                        .map(ins => actividades.find(a => a.ID_actividad === ins.ID_actividad)?.Nombre)
                        .filter(Boolean);

                      return (
                        <tr key={part.id} className="hover:bg-[#112240]/50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{part.nombre} {part.apellidos}</span>
                              <span className="text-[10px] text-cyan-400 font-mono font-normal">({part.id})</span>
                            </div>
                            <div className="text-[11px] text-[#94a3b8] font-medium tracking-normal mt-0.5">
                              {part.licenciatura || 'Licenciatura en Educación Primaria'} • {part.semestre || '5° Semestre'}, {part.grupo || 'Grupo A'}
                            </div>
                            {clubsPart.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {clubsPart.map((nombreClub, cIdx) => (
                                  <span 
                                    key={`${part.id}-club-${cIdx}`}
                                    className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-[#112240] text-cyan-300 border border-[#1e3a8a]/60 truncate max-w-[170px]"
                                    title={`Inscrito en: ${nombreClub}`}
                                  >
                                    ⚽ {nombreClub}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Resistencia Course Navette */}
                          <td className="p-3 text-center">
                            {tieneAmbas ? (
                              <div>
                                <span className="text-[#cbd5e1] font-mono text-[11px]">
                                  {ev?.inicial?.courseNavetteNivel} &rarr; <strong className="text-white">{ev?.final?.courseNavetteNivel}</strong>
                                </span>
                                <div className={`text-[10px] font-bold ${
                                  (ev?.incrementoCourseNavette || 0) >= 25 ? 'text-emerald-400' : 'text-cyan-400'
                                }`}>
                                  +{(ev?.incrementoCourseNavette || 0)}%
                                </div>
                              </div>
                            ) : ev?.inicial ? (
                              <span className="text-[#94a3b8] text-[11px]">Ini: {ev.inicial.courseNavetteNivel}</span>
                            ) : (
                              <span className="text-[#64748b] italic text-[11px]">Sin registro</span>
                            )}
                          </td>

                          {/* Fuerza Muscular en 60s */}
                          <td className="p-3 text-center">
                            {tieneAmbas ? (
                              <div>
                                <div className="text-[11px] text-[#cbd5e1]">
                                  Lag: {ev?.inicial?.fuerzaLagartijas60s}&rarr;<strong className="text-white">{ev?.final?.fuerzaLagartijas60s}</strong> | Sent: {ev?.inicial?.fuerzaSentadillas60s}&rarr;<strong className="text-white">{ev?.final?.fuerzaSentadillas60s}</strong>
                                </div>
                                <div className="text-[10px] font-bold text-cyan-400">
                                  Comb: +{(ev?.incrementoFuerzaCombinada || 0)}%
                                </div>
                              </div>
                            ) : ev?.inicial ? (
                              <span className="text-[#94a3b8] text-[11px]">Lag: {ev.inicial.fuerzaLagartijas60s} | Sent: {ev.inicial.fuerzaSentadillas60s}</span>
                            ) : (
                              <span className="text-[#64748b] italic text-[11px]">Sin registro</span>
                            )}
                          </td>

                          {/* Flexibilidad Sit and Reach */}
                          <td className="p-3 text-center">
                            {tieneAmbas ? (
                              <div>
                                <span className="text-[#cbd5e1] font-mono text-[11px]">
                                  {ev?.inicial?.sitAndReachCm} &rarr; <strong className="text-white">{ev?.final?.sitAndReachCm} cm</strong>
                                </span>
                                <div className="text-[10px] font-bold text-purple-400">
                                  +{(ev?.incrementoFlexibilidadCm || 0)} cm (+{(ev?.incrementoFlexibilidadPorcentaje || 0)}%)
                                </div>
                              </div>
                            ) : ev?.inicial ? (
                              <span className="text-[#94a3b8] text-[11px]">{ev.inicial.sitAndReachCm} cm</span>
                            ) : (
                              <span className="text-[#64748b] italic text-[11px]">Sin registro</span>
                            )}
                          </td>

                          {/* Composición Corporal IMC */}
                          <td className="p-3 text-center">
                            {tieneAmbas ? (
                              <div>
                                <span className="text-[#cbd5e1] font-mono text-[11px]">
                                  {ev?.inicial?.imc} &rarr; <strong className="text-white">{ev?.final?.imc} kg/m²</strong>
                                </span>
                                <div className="text-[10px] font-bold text-emerald-400">
                                  Avance: +{(ev?.cambioImcPorcentaje || 0)}%
                                </div>
                              </div>
                            ) : ev?.inicial ? (
                              <span className="text-[#94a3b8] text-[11px]">{ev.inicial.imc} kg/m²</span>
                            ) : (
                              <span className="text-[#64748b] italic text-[11px]">Sin registro</span>
                            )}
                          </td>

                          {/* Dictamen y Puntos Oficiales */}
                          <td className="p-3 text-center">
                            {tieneAmbas ? (
                              <div className="inline-flex flex-col items-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  ev?.nivelValidado === 'Destacado'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                    : ev?.nivelValidado === 'Satisfactorio'
                                    ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                                    : ev?.nivelValidado === 'Básico'
                                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                                    : 'bg-[#061426] text-[#94a3b8] border-[#1e3555]'
                                }`}>
                                  {ev?.puntosAsignados} Pts • {ev?.nivelValidado}
                                </span>
                              </div>
                            ) : ev?.inicial ? (
                              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                                Medición inicial
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#64748b] italic">
                                Pendiente
                              </span>
                            )}
                          </td>

                          {/* Acciones del Administrador */}
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              {ev && (
                                <button
                                  onClick={() => setModalCedula({ abierto: true, estudiante: part, evaluacion: ev })}
                                  title="Ver e imprimir cédula institucional oficial"
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center space-x-1 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Cédula</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleAbrirEdicion(part)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-950 hover:bg-blue-900 text-cyan-300 border border-blue-500/40 transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{ev ? 'Editar' : '+ Capturar'}</span>
                              </button>

                              {ev && (
                                <button
                                  onClick={() => handleEliminarEvaluacion(ev.idEvaluacion, `${part.nombre} ${part.apellidos}`)}
                                  title="Eliminar evaluación física"
                                  className="p-1 text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= SECCIÓN 2: SOLICITUDES DE MODIFICACIÓN DE USUARIOS ================= */}
      {pestanaSeccion === 'solicitudes' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a] shadow-xl space-y-5">
          <div className="border-b border-[#1e3555] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/40 uppercase tracking-wider">
                  Control de Modificaciones Oficiales
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Avisos y Solicitudes de Modificación de Pruebas Físicas
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Los participantes que deseen modificar o corregir datos de su evaluación deben recibir autorización explícita del Administrador.
              </p>
            </div>

            <span className="text-xs font-bold text-[#cbd5e1] bg-[#061426] border border-[#1e3555] px-3 py-1 rounded-xl">
              {solicitudesMod.length} solicitudes registradas
            </span>
          </div>

          {solicitudesMod.length === 0 ? (
            <div className="p-8 text-center text-[#94a3b8] bg-[#061426] rounded-2xl border border-dashed border-[#1e3555]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">No hay solicitudes de modificación registradas.</p>
              <p className="text-[11px] text-[#94a3b8]">Cuando un usuario envíe un aviso para cambiar sus mediciones, aparecerá aquí para su autorización.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudesMod.map((sol) => (
                <div key={sol.idSolicitudMod} className={`p-4 rounded-2xl border transition-all ${
                  sol.estado === 'Pendiente' 
                    ? 'bg-amber-950/40 border-amber-500/50' 
                    : sol.estado === 'Autorizada'
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-[#061426] border-[#1e3555]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">{sol.idSolicitudMod}</span>
                        <span className="text-xs font-bold text-white">{sol.nombreParticipante}</span>
                        <span className="text-[11px] text-[#94a3b8]">({sol.correo})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sol.estado === 'Pendiente' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          sol.estado === 'Autorizada' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          'bg-red-950 text-red-300 border border-red-500/40'
                        }`}>
                          {sol.estado}
                        </span>
                      </div>
                      <div className="text-xs text-[#cbd5e1]">
                        <strong className="text-blue-300">Filiación:</strong> {sol.filiacion} • <strong className="text-blue-300">Tipo:</strong> {sol.tipoMedicion.toUpperCase()} • <strong className="text-blue-300">Fecha:</strong> {sol.fechaSolicitud}
                      </div>
                      <div className="text-xs text-[#cbd5e1] bg-[#061426] p-2 rounded-lg border border-[#1e3555] mt-1 italic">
                        <strong className="not-italic text-amber-300">Motivo de corrección indicado por el usuario:</strong> "{sol.motivo}"
                      </div>
                      {sol.resolucionAdmin && (
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">
                          Resolución Admin ({sol.fechaResolucion}): {sol.resolucionAdmin}
                        </div>
                      )}
                    </div>

                    {sol.estado === 'Pendiente' && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleResolverSolicitudMod(sol, 'Autorizada')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1 cursor-pointer transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Autorizar Modificación</span>
                        </button>
                        <button
                          onClick={() => handleResolverSolicitudMod(sol, 'Rechazada')}
                          className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold border border-red-700/50 flex items-center space-x-1 cursor-pointer transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL INFORME EJECUTIVO COMPLETO DEL ADMINISTRADOR ================= */}
      {modalInformeEjecutivo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-6 my-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#061426] text-cyan-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Informe Ejecutivo de Capacidades Físicas - Consola de Administrador
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Documento consolidado oficial con métricas institucionales y padrón completo
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDescargarInformeEjecutivo}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar HTML / PDF</span>
                </button>
                <button
                  onClick={handleImprimirInformeEjecutivo}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setModalInformeEjecutivo(false)}
                  className="p-2 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Vista previa visual del informe dentro del modal */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white text-gray-950 space-y-6 shadow-md">
              <div className="text-center border-b-2 border-blue-900 pb-4 space-y-1">
                <h2 className="text-2xl font-serif font-black text-blue-950 uppercase">{CONFIG.INSTITUCION}</h2>
                <div className="text-xs font-bold text-gray-600 uppercase">Centenaria y Benemérita</div>
                <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">{CONFIG.DEPARTAMENTO}</div>
                <div className="inline-block bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-md text-xs font-black uppercase mt-2">
                  INFORME EJECUTIVO DE RESULTADOS Y PROMEDIOS DE CAPACIDADES FÍSICAS (2026-1)
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Puntaje Promedio</span>
                  <span className="text-2xl font-black text-blue-950">{promedios.promedioPuntos} / 4</span>
                  <span className="text-[10px] text-blue-700 block">Nivel Satisfactorio</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[10px] font-bold text-red-800 uppercase block">Resistencia Navette</span>
                  <span className="text-2xl font-black text-red-950">+{promedios.promedioCourseNavette}%</span>
                  <span className="text-[10px] text-red-700 block">Palier alcanzado</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">Fuerza Combinada</span>
                  <span className="text-2xl font-black text-indigo-950">+{promedios.promedioFuerzaCombinada}%</span>
                  <span className="text-[10px] text-indigo-700 block">Lag + Sent en 60s</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Flexibilidad</span>
                  <span className="text-2xl font-black text-purple-950">+{promedios.promedioFlexibilidadCm} cm</span>
                  <span className="text-[10px] text-purple-700 block">Sit & Reach (+{promedios.promedioFlexibilidadPorcentaje}%)</span>
                </div>
              </div>

              {/* Firmas Oficiales */}
              <div className="pt-6 border-t border-gray-200 text-center">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-5">
                  {autoridades.tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
                </div>
                <div className="grid grid-cols-2 gap-8 text-center text-xs text-gray-700">
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={autoridades.jefeMatutinoFirma} tipo="matutino" />
                    <div className="border-b-2 border-gray-600 w-48 mx-auto mb-1.5"></div>
                    <div className="font-bold text-gray-900">{autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}</div>
                    <div className="text-[11px] text-gray-600 font-medium">{autoridades.jefeMatutinoCargo || 'Turno matutino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={autoridades.jefeVespertinoFirma} tipo="vespertino" />
                    <div className="border-b-2 border-gray-600 w-48 mx-auto mb-1.5"></div>
                    <div className="font-bold text-gray-900">{autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}</div>
                    <div className="text-[11px] text-gray-600 font-medium">{autoridades.jefeVespertinoCargo || 'Turno vespertino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
              <button
                onClick={() => setModalInformeEjecutivo(false)}
                className="px-4 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl text-xs font-semibold border border-[#1e3555] cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL DE EDICIÓN / CAPTURA POR ADMINISTRADOR ================= */}
      {modalEdicion.abierto && modalEdicion.estudiante && modalEdicion.evaluacion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a192f] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-5 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Captura y Modificación Oficial de Evaluación Física
                </h3>
                <p className="text-xs text-cyan-300">
                  {modalEdicion.estudiante.nombre} {modalEdicion.estudiante.apellidos} ({modalEdicion.estudiante.id})
                </p>
              </div>
              <button
                onClick={() => setModalEdicion({ abierto: false, estudiante: null, evaluacion: null, subpestana: 'inicial' })}
                className="p-1 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subpestañas del Modal */}
            <div className="flex space-x-2 border-b border-[#1e3555] pb-2">
              <button
                type="button"
                onClick={() => setModalEdicion({ ...modalEdicion, subpestana: 'inicial' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  modalEdicion.subpestana === 'inicial' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3555]'
                }`}
              >
                1. Medición Inicial
              </button>
              <button
                type="button"
                onClick={() => setModalEdicion({ ...modalEdicion, subpestana: 'final' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  modalEdicion.subpestana === 'final' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3555]'
                }`}
              >
                2. Medición Final
              </button>
              <button
                type="button"
                onClick={() => setModalEdicion({ ...modalEdicion, subpestana: 'filiacion' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  modalEdicion.subpestana === 'filiacion' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-[#061426] text-[#94a3b8] hover:text-white border border-[#1e3555]'
                }`}
              >
                3. Filiación del Alumno
              </button>
            </div>

            <form onSubmit={handleGuardarEvaluacion} className="space-y-4 text-xs">
              
              {/* SUBPESTAÑA 1: INICIAL */}
              {modalEdicion.subpestana === 'inicial' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Fecha de Medición Inicial</label>
                      <input
                        type="date"
                        value={modalEdicion.evaluacion.inicial?.fecha || new Date().toISOString().substring(0, 10)}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, fecha: e.target.value } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Course Navette (Palier alcanzado)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="21"
                        value={modalEdicion.evaluacion.inicial?.courseNavetteNivel ?? 3.5}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, courseNavetteNivel: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Lagartijas en 60 segundos (rep)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalEdicion.evaluacion.inicial?.fuerzaLagartijas60s ?? 15}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, fuerzaLagartijas60s: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Sentadillas en 60 segundos (rep)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalEdicion.evaluacion.inicial?.fuerzaSentadillas60s ?? 20}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, fuerzaSentadillas60s: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Sit & Reach (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={modalEdicion.evaluacion.inicial?.sitAndReachCm ?? 2.0}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, sitAndReachCm: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={modalEdicion.evaluacion.inicial?.pesoKg ?? 62}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, pesoKg: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Estatura (cm)</label>
                      <input
                        type="number"
                        value={modalEdicion.evaluacion.inicial?.estaturaCm ?? 165}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            inicial: { ...modalEdicion.evaluacion?.inicial!, estaturaCm: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 2: FINAL */}
              {modalEdicion.subpestana === 'final' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Fecha de Medición Final</label>
                      <input
                        type="date"
                        value={modalEdicion.evaluacion.final?.fecha || new Date().toISOString().substring(0, 10)}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, fecha: e.target.value } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Course Navette (Palier final)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="21"
                        value={modalEdicion.evaluacion.final?.courseNavetteNivel ?? 4.8}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, courseNavetteNivel: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Lagartijas en 60s (rep final)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalEdicion.evaluacion.final?.fuerzaLagartijas60s ?? 22}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, fuerzaLagartijas60s: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Sentadillas en 60s (rep final)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalEdicion.evaluacion.final?.fuerzaSentadillas60s ?? 30}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, fuerzaSentadillas60s: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Sit & Reach final (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={modalEdicion.evaluacion.final?.sitAndReachCm ?? 4.5}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, sitAndReachCm: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Peso final (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={modalEdicion.evaluacion.final?.pesoKg ?? 60.5}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, pesoKg: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Estatura (cm)</label>
                      <input
                        type="number"
                        value={modalEdicion.evaluacion.final?.estaturaCm ?? 165}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          evaluacion: {
                            ...modalEdicion.evaluacion,
                            final: { ...modalEdicion.evaluacion?.final!, estaturaCm: Number(e.target.value) } as MedicionFisica
                          }
                        })}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 3: FILIACIÓN */}
              {modalEdicion.subpestana === 'filiacion' && (
                <div className="space-y-3 p-4 bg-[#061426] rounded-2xl border border-blue-500/30">
                  <span className="font-bold text-cyan-300 block">Filiación Académica</span>
                  <div>
                    <label className="block text-blue-300 font-bold mb-1">Licenciatura</label>
                    <input
                      type="text"
                      value={modalEdicion.estudiante.licenciatura || ''}
                      onChange={(e) => setModalEdicion({
                        ...modalEdicion,
                        estudiante: { ...modalEdicion.estudiante!, licenciatura: e.target.value }
                      })}
                      className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="Licenciatura en Educación Primaria"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Semestre</label>
                      <input
                        type="text"
                        value={modalEdicion.estudiante.semestre || ''}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          estudiante: { ...modalEdicion.estudiante!, semestre: e.target.value }
                        })}
                        className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="5° Semestre"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 font-bold mb-1">Grupo</label>
                      <input
                        type="text"
                        value={modalEdicion.estudiante.grupo || ''}
                        onChange={(e) => setModalEdicion({
                          ...modalEdicion,
                          estudiante: { ...modalEdicion.estudiante!, grupo: e.target.value }
                        })}
                        className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="Grupo A"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalEdicion({ abierto: false, estudiante: null, evaluacion: null, subpestana: 'inicial' })}
                  className="px-4 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl font-medium cursor-pointer border border-[#1e3555] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Ponderar Resultados</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL DE CÉDULA OFICIAL ENTREGABLE ================= */}
      {modalCedula.abierto && modalCedula.estudiante && modalCedula.evaluacion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a192f] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-6 my-6 max-h-[92vh] overflow-y-auto text-white">
            
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-blue-900/60 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cédula Institucional Oficial de Evaluación Física
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Formato oficial entregable con dictamen y filiación normalista vinculada
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDescargarCedula(modalCedula.estudiante!, modalCedula.evaluacion!)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImprimirCedula(modalCedula.estudiante!, modalCedula.evaluacion!)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCedula({ abierto: false, estudiante: null, evaluacion: null })}
                  className="p-2 text-gray-400 hover:text-white rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Documento Oficial */}
            <div className="space-y-5 border border-gray-200 rounded-2xl p-6 bg-white text-gray-900 shadow-md">
              <div className="space-y-1 border-b border-blue-900/20 pb-4 text-center">
                <h1 className="text-2xl font-serif font-black text-blue-950 uppercase">{CONFIG.INSTITUCION}</h1>
                <p className="text-sm font-bold text-gray-800">Centenaria y Benemérita</p>
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">{CONFIG.DEPARTAMENTO}</div>
                <div className="text-xs font-serif font-black tracking-widest text-gray-900 uppercase pt-2">
                  CÉDULA INSTITUCIONAL DE VALORACIÓN DE CAPACIDADES FÍSICAS
                </div>
              </div>

              <div className="text-center py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluado(a):</div>
                <div className="text-2xl font-bold text-blue-900 underline decoration-blue-300 underline-offset-4 mt-1">
                  {modalCedula.estudiante.nombre} {modalCedula.estudiante.apellidos}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
                  {modalCedula.estudiante.licenciatura || 'Licenciatura en Educación Primaria'} • {modalCedula.estudiante.semestre || '5° Semestre'} • {modalCedula.estudiante.grupo || 'Grupo A'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Dictamen Oficial</span>
                  <div className="text-lg font-black text-blue-950">
                    Nivel {modalCedula.evaluacion.nivelValidado?.toUpperCase()} ({modalCedula.evaluacion.puntosAsignados} / 4 Puntos)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Período:</span>
                  <strong className="text-gray-900">{modalCedula.evaluacion.periodo}</strong>
                </div>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Dimensión de Condición Física</th>
                      <th className="p-2.5 text-center">Inicial</th>
                      <th className="p-2.5 text-center">Final</th>
                      <th className="p-2.5 text-center">Avance Porcentual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="p-2.5"><strong>1. Resistencia (Course Navette)</strong></td>
                      <td className="p-2.5 text-center font-mono">{modalCedula.evaluacion.inicial?.courseNavetteNivel} palier</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-900">{modalCedula.evaluacion.final?.courseNavetteNivel} palier</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">+{modalCedula.evaluacion.incrementoCourseNavette}%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5"><strong>2. Fuerza: Lagartijas en 60s</strong></td>
                      <td className="p-2.5 text-center font-mono">{modalCedula.evaluacion.inicial?.fuerzaLagartijas60s} rep</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-900">{modalCedula.evaluacion.final?.fuerzaLagartijas60s} rep</td>
                      <td className="p-2.5 text-center font-bold text-blue-700">+{modalCedula.evaluacion.incrementoFuerzaLagartijas}%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5"><strong>3. Fuerza: Sentadillas en 60s</strong></td>
                      <td className="p-2.5 text-center font-mono">{modalCedula.evaluacion.inicial?.fuerzaSentadillas60s} rep</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-900">{modalCedula.evaluacion.final?.fuerzaSentadillas60s} rep</td>
                      <td className="p-2.5 text-center font-bold text-blue-700">+{modalCedula.evaluacion.incrementoFuerzaSentadillas}%</td>
                    </tr>
                    <tr className="bg-blue-50/40">
                      <td className="p-2.5 font-semibold text-blue-950">&rarr; Fuerza Combinada</td>
                      <td className="p-2.5 text-center font-mono">{(modalCedula.evaluacion.inicial?.fuerzaLagartijas60s || 0) + (modalCedula.evaluacion.inicial?.fuerzaSentadillas60s || 0)} rep</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-900">{(modalCedula.evaluacion.final?.fuerzaLagartijas60s || 0) + (modalCedula.evaluacion.final?.fuerzaSentadillas60s || 0)} rep</td>
                      <td className="p-2.5 text-center font-black text-blue-800">+{modalCedula.evaluacion.incrementoFuerzaCombinada}%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5"><strong>4. Flexibilidad (Sit & Reach)</strong></td>
                      <td className="p-2.5 text-center font-mono">{modalCedula.evaluacion.inicial?.sitAndReachCm} cm</td>
                      <td className="p-2.5 text-center font-mono font-bold text-purple-900">{modalCedula.evaluacion.final?.sitAndReachCm} cm</td>
                      <td className="p-2.5 text-center font-bold text-purple-700">+{modalCedula.evaluacion.incrementoFlexibilidadCm} cm (+{modalCedula.evaluacion.incrementoFlexibilidadPorcentaje}%)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5"><strong>5. Composición (IMC)</strong></td>
                      <td className="p-2.5 text-center font-mono">{modalCedula.evaluacion.inicial?.imc} kg/m²</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-900">{modalCedula.evaluacion.final?.imc} kg/m²</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">+{modalCedula.evaluacion.cambioImcPorcentaje}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Firmas Oficiales */}
              <div className="pt-6 border-t border-gray-300 text-center">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-5">
                  {autoridades.tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
                </div>
                <div className="grid grid-cols-2 gap-8 text-center text-xs text-gray-700">
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={autoridades.jefeMatutinoFirma} tipo="matutino" />
                    <div className="border-b-2 border-gray-600 w-44 mx-auto mb-1"></div>
                    <div className="font-bold text-gray-900">{autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}</div>
                    <div className="text-[11px] text-gray-600">{autoridades.jefeMatutinoCargo || 'Turno matutino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={autoridades.jefeVespertinoFirma} tipo="vespertino" />
                    <div className="border-b-2 border-gray-600 w-44 mx-auto mb-1"></div>
                    <div className="font-bold text-gray-900">{autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}</div>
                    <div className="text-[11px] text-gray-600">{autoridades.jefeVespertinoCargo || 'Turno vespertino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
              <button
                type="button"
                onClick={() => setModalCedula({ abierto: false, estudiante: null, evaluacion: null })}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
