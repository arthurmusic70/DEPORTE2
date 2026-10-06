import React, { useState, useEffect } from 'react';
import { SesionUsuario, EvaluacionCapacidadesFisicas, MedicionFisica, SolicitudModificacionPrueba } from '../../types';
import { MSBDatabase, CONFIG } from '../../utils/storage';
import { 
  descargarDocumentoHtml, 
  imprimirHtmlDirecto, 
  generarHtmlInformeIndividual 
} from '../../utils/exportDocs';
import { 
  Activity, 
  Dumbbell, 
  HeartPulse, 
  Scale, 
  Gauge, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Printer, 
  Download,
  TrendingUp, 
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  Send,
  Lock,
  Unlock,
  Check
} from 'lucide-react';

interface ParticipantePruebasFisicasViewProps {
  usuario: SesionUsuario;
}

export const ParticipantePruebasFisicasView: React.FC<ParticipantePruebasFisicasViewProps> = ({ usuario }) => {
  const [evaluacion, setEvaluacion] = useState<EvaluacionCapacidadesFisicas | null>(null);
  const [pestanaActiva, setPestanaActiva] = useState<'informe' | 'captura_inicial' | 'captura_final'>('informe');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estados de solicitud de modificación de datos
  const [solicitudPendiente, setSolicitudPendiente] = useState<SolicitudModificacionPrueba | undefined>(undefined);
  const [tieneAutorizacion, setTieneAutorizacion] = useState<boolean>(false);
  const [mostrarModalAvisoSolicitud, setMostrarModalAvisoSolicitud] = useState<boolean>(false);
  const [motivoModificacion, setMotivoModificacion] = useState<string>('');
  const [tipoMedicionAModificar, setTipoMedicionAModificar] = useState<'inicial' | 'final' | 'ambas'>('ambas');

  // Estados de formularios para Medición Inicial y Final
  const [formInicial, setFormInicial] = useState<Partial<MedicionFisica>>({
    fecha: new Date().toISOString().substring(0, 10),
    courseNavetteNivel: 3.5,
    fuerzaLagartijas60s: 15,
    fuerzaSentadillas60s: 20,
    sitAndReachCm: 2.0,
    pesoKg: 62.0,
    estaturaCm: 165,
    imc: 22.8,
    observaciones: ''
  });

  const [formFinal, setFormFinal] = useState<Partial<MedicionFisica>>({
    fecha: new Date().toISOString().substring(0, 10),
    courseNavetteNivel: 4.8,
    fuerzaLagartijas60s: 22,
    fuerzaSentadillas60s: 30,
    sitAndReachCm: 4.5,
    pesoKg: 60.5,
    estaturaCm: 165,
    imc: 22.2,
    observaciones: ''
  });

  const cargarDatos = () => {
    const reg = MSBDatabase.getEvaluacionFisicaPorParticipante(usuario.id);
    if (reg) {
      setEvaluacion(reg);
      if (reg.inicial) setFormInicial(reg.inicial);
      if (reg.final) setFormFinal(reg.final);
    } else {
      const nuevaPlantilla: EvaluacionCapacidadesFisicas = {
        idEvaluacion: `EVA-${usuario.id.replace('PAR-', '')}`,
        idParticipante: usuario.id,
        periodo: 'Semestre 2026-1'
      };
      setEvaluacion(nuevaPlantilla);
    }

    // Verificar solicitudes de modificación
    setSolicitudPendiente(MSBDatabase.getSolicitudModificacionPendiente(usuario.id));
    setTieneAutorizacion(MSBDatabase.tieneAutorizacionModificacion(usuario.id));
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario.id]);

  const notificar = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
    cargarDatos();
  };

  // Cálculo de IMC automático para formularios
  const calcularImc = (peso?: number, estatura?: number): number => {
    if (!peso || !estatura || estatura <= 0) return 0;
    const estM = estatura / 100;
    return Number((peso / (estM * estM)).toFixed(1));
  };

  const tieneInicial = !!evaluacion?.inicial;
  const tieneFinal = !!evaluacion?.final;
  const tieneAmbas = tieneInicial && tieneFinal;

  // Acciones de Descarga e Impresión del Informe Individual
  const handleDescargarInformeIndividual = () => {
    if (!evaluacion) return;
    const autoridades = MSBDatabase.getAutoridades();
    const html = generarHtmlInformeIndividual(usuario, evaluacion, autoridades);
    descargarDocumentoHtml(
      `informe_capacidades_fisicas_${usuario.id}_${usuario.nombre.replace(/\s+/g, '_')}`,
      `Informe de Capacidades Físicas - ${usuario.nombre} ${usuario.apellidos}`,
      html
    );
    notificar('✓ Tu informe físico individual se ha descargado en formato listo para imprimir/guardar.');
  };

  const handleImprimirInformeIndividual = () => {
    if (!evaluacion) return;
    const autoridades = MSBDatabase.getAutoridades();
    const html = generarHtmlInformeIndividual(usuario, evaluacion, autoridades);
    imprimirHtmlDirecto(`Informe Físico - ${usuario.nombre} ${usuario.apellidos}`, html);
  };

  // Enviar aviso de solicitud de modificación al Administrador
  const handleEnviarSolicitudModificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoModificacion.trim()) {
      alert('Por favor describe brevemente qué datos deseas corregir o actualizar.');
      return;
    }

    const res = MSBDatabase.solicitarModificacionPrueba({
      idParticipante: usuario.id,
      tipoMedicion: tipoMedicionAModificar,
      motivo: motivoModificacion.trim()
    });

    if (res.ok) {
      setMostrarModalAvisoSolicitud(false);
      setMotivoModificacion('');
      notificar('✓ Solicitud de modificación enviada al Administrador. Recibirás respuesta para habilitar la edición.');
    } else {
      alert(res.mensaje);
    }
  };

  // Guardar medición inicial
  const handleGuardarInicial = (e: React.FormEvent) => {
    e.preventDefault();

    // Si ya tenía medición inicial previa y NO tiene autorización del admin, requerir solicitud
    if (tieneInicial && !tieneAutorizacion) {
      setTipoMedicionAModificar('inicial');
      setMostrarModalAvisoSolicitud(true);
      return;
    }

    const peso = Number(formInicial.pesoKg) || 60;
    const estatura = Number(formInicial.estaturaCm) || 165;
    const imc = calcularImc(peso, estatura);

    const medicion: MedicionFisica = {
      fecha: formInicial.fecha || new Date().toISOString().substring(0, 10),
      courseNavetteNivel: Number(formInicial.courseNavetteNivel) || 0,
      fuerzaLagartijas60s: Number(formInicial.fuerzaLagartijas60s) || 0,
      fuerzaSentadillas60s: Number(formInicial.fuerzaSentadillas60s) || 0,
      sitAndReachCm: Number(formInicial.sitAndReachCm) || 0,
      pesoKg: peso,
      estaturaCm: estatura,
      imc,
      observaciones: formInicial.observaciones || ''
    };

    const updated: EvaluacionCapacidadesFisicas = {
      ...(evaluacion || { idEvaluacion: `EVA-${usuario.id.replace('PAR-', '')}`, idParticipante: usuario.id }),
      idParticipante: usuario.id,
      periodo: evaluacion?.periodo || 'Semestre 2026-1',
      inicial: medicion
    };

    MSBDatabase.saveEvaluacionFisica(updated);
    if (tieneAutorizacion) {
      MSBDatabase.consumirAutorizacionModificacion(usuario.id);
    }
    notificar('✓ Tu medición inicial ha sido guardada exitosamente.');
    setPestanaActiva('informe');
  };

  // Guardar medición final
  const handleGuardarFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluacion?.inicial) {
      alert('Debes capturar primero tu Medición Inicial para poder contrastar el avance.');
      setPestanaActiva('captura_inicial');
      return;
    }

    // Si ya tenía medición final previa y NO tiene autorización del admin, requerir solicitud
    if (tieneFinal && !tieneAutorizacion) {
      setTipoMedicionAModificar('final');
      setMostrarModalAvisoSolicitud(true);
      return;
    }

    const peso = Number(formFinal.pesoKg) || 60;
    const estatura = Number(formFinal.estaturaCm) || 165;
    const imc = calcularImc(peso, estatura);

    const medicion: MedicionFisica = {
      fecha: formFinal.fecha || new Date().toISOString().substring(0, 10),
      courseNavetteNivel: Number(formFinal.courseNavetteNivel) || 0,
      fuerzaLagartijas60s: Number(formFinal.fuerzaLagartijas60s) || 0,
      fuerzaSentadillas60s: Number(formFinal.fuerzaSentadillas60s) || 0,
      sitAndReachCm: Number(formFinal.sitAndReachCm) || 0,
      pesoKg: peso,
      estaturaCm: estatura,
      imc,
      observaciones: formFinal.observaciones || ''
    };

    const updated: EvaluacionCapacidadesFisicas = {
      ...evaluacion,
      idParticipante: usuario.id,
      periodo: evaluacion.periodo || 'Semestre 2026-1',
      final: medicion
    };

    MSBDatabase.saveEvaluacionFisica(updated);
    if (tieneAutorizacion) {
      MSBDatabase.consumirAutorizacionModificacion(usuario.id);
    }
    notificar('✓ Tu medición final ha sido guardada y tu informe físico se ha ponderado exitosamente.');
    setPestanaActiva('informe');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Encabezado Principal del Participante (Estudiante, Docente, Trabajador, Encargado) */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl relative overflow-hidden text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-500/30 uppercase tracking-wider">
                Expediente Físico Individual • Rol: {usuario.rol.toUpperCase()}
              </span>
              <span className="text-xs text-[#94a3b8] font-medium">
                {CONFIG.INSTITUCION}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Evaluación y Avance de Capacidades Físicas
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              {usuario.nombre} {usuario.apellidos} • {usuario.licenciatura || 'Comunidad Normalista'} • {usuario.semestre || 'Período en curso'} ({usuario.grupo || 'Grupo ordinario'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => setPestanaActiva('informe')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                pestanaActiva === 'informe'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mi Informe de Desempeño</span>
            </button>

            <button
              onClick={() => setPestanaActiva('captura_inicial')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                pestanaActiva === 'captura_inicial'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Medición Inicial {tieneInicial && '✓'}</span>
            </button>

            <button
              onClick={() => setPestanaActiva('captura_final')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                pestanaActiva === 'captura_final'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Medición Final {tieneFinal && '✓'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Estado de Autorización de Modificación */}
      {tieneAutorizacion && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-emerald-200 text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-bold text-white">✓ Modificación Autorizada por el Administrador</strong>
              <span>Tiene permiso para corregir y actualizar los valores de su evaluación física. Al guardar, quedarán registrados oficialmente.</span>
            </div>
          </div>
        </div>
      )}

      {solicitudPendiente && !tieneAutorizacion && (
        <div className="p-4 bg-amber-950/80 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-amber-200 text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <strong className="block font-bold text-white">Aviso de Modificación en Trámite</strong>
              <span>Su solicitud para modificar datos está en revisión por el Administrador ({solicitudPendiente.fechaSolicitud}). Recibirá autorización en cuanto sea evaluada.</span>
            </div>
          </div>
        </div>
      )}

      {/* Notificación */}
      {mensaje && (
        <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 animate-in fade-in ${
          mensaje.tipo === 'exito' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' : 'bg-red-950/80 text-red-200 border border-red-500/40'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}

      {/* ================= VISTA 1: INFORME INDIVIDUAL DEL PARTICIPANTE ================= */}
      {pestanaActiva === 'informe' && (
        <div className="space-y-6">
          
          {!tieneAmbas ? (
            <div className="bg-[#0a192f] rounded-3xl p-8 border border-[#1e3a8a]/60 shadow-xl text-center space-y-4 text-white">
              <div className="w-14 h-14 rounded-2xl bg-[#061426] text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Info className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  Captura tus dos mediciones para generar tu Informe
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Para contrastar el avance porcentual y validar tu puntuación departamental se requiere tu <strong>Medición Inicial</strong> y tu <strong>Medición Final</strong>.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                {!tieneInicial ? (
                  <button
                    onClick={() => setPestanaActiva('captura_inicial')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                  >
                    + Contestar Medición Inicial
                  </button>
                ) : (
                  <button
                    onClick={() => setPestanaActiva('captura_final')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
                  >
                    + Contestar Medición Final de Cierre
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tarjeta Destacada de Validación Departamental con botones de Descarga e Impresión */}
              <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border ${
                evaluacion?.nivelValidado === 'Destacado'
                  ? 'bg-gradient-to-r from-emerald-950 via-[#063321] to-teal-950 border-emerald-500/40'
                  : evaluacion?.nivelValidado === 'Satisfactorio'
                  ? 'bg-gradient-to-r from-blue-950 via-[#0a274e] to-indigo-950 border-blue-500/40'
                  : evaluacion?.nivelValidado === 'Básico'
                  ? 'bg-gradient-to-r from-amber-950 via-[#3a2007] to-orange-950 border-amber-500/40'
                  : 'bg-gradient-to-r from-gray-950 via-slate-900 to-gray-950 border-gray-700'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold border border-white/20">
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>Dictamen Departamental de Capacidades Físicas</span>
                    </div>

                    <div className="flex items-baseline space-x-3">
                      <h2 className="text-2xl sm:text-3xl font-black">
                        Nivel {evaluacion?.nivelValidado?.toUpperCase()}
                      </h2>
                      <span className="text-lg sm:text-xl font-bold bg-white/20 px-3 py-0.5 rounded-xl border border-white/30">
                        {evaluacion?.puntosAsignados} / 4 Puntos
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                      {evaluacion?.nivelValidado === 'Destacado' && '¡Felicidades! Has alcanzado una mejora de al menos 40% en 4 o más dimensiones físicas reglamentarias.'}
                      {evaluacion?.nivelValidado === 'Satisfactorio' && '¡Gran avance! Has demostrado una mejora del 25% al 39% en 4 a 5 dimensiones físicas institucionales.'}
                      {evaluacion?.nivelValidado === 'Básico' && '¡Buen esfuerzo! Registras un incremento del 10% al 24% en 3 a 4 dimensiones evaluadas.'}
                      {evaluacion?.nivelValidado === 'Insuficiente' && 'Avance inicial en proceso. Te invitamos a mantener la constancia en tus actividades de salud y bienestar.'}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={handleDescargarInformeIndividual}
                      className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-blue-700" />
                      <span>Descargar Mi Informe (HTML/PDF)</span>
                    </button>

                    <button
                      onClick={handleImprimirInformeIndividual}
                      className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0a192f]/80 hover:bg-[#112240] border border-white/30 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid de las 4 Dimensiones Evaluadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Resistencia Cardiorrespiratoria */}
                <div className="bg-[#0a192f] p-5 rounded-2xl border border-[#1e3a8a]/60 shadow-xl space-y-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#061426] text-red-400 flex items-center justify-center font-bold border border-red-500/30">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded-full border border-red-500/30">
                      Course Navette
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94a3b8] font-medium block">Resistencia Cardiorrespiratoria:</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {evaluacion?.inicial?.courseNavetteNivel} &rarr; <span className="text-red-400 font-black">{evaluacion?.final?.courseNavetteNivel}</span> palier
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                    Avance: +{evaluacion?.incrementoCourseNavette}%
                  </div>
                </div>

                {/* 2. Fuerza y Resistencia Muscular Combinada */}
                <div className="bg-[#0a192f] p-5 rounded-2xl border border-[#1e3a8a]/60 shadow-xl space-y-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#061426] text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Fuerza 60s
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94a3b8] font-medium block">Fuerza Muscular Combinada:</span>
                    <div className="text-xs text-[#cbd5e1] mt-1 font-semibold">
                      Lag: {evaluacion?.inicial?.fuerzaLagartijas60s} &rarr; <strong className="text-white">{evaluacion?.final?.fuerzaLagartijas60s}</strong>
                    </div>
                    <div className="text-xs text-[#cbd5e1] font-semibold">
                      Sent: {evaluacion?.inicial?.fuerzaSentadillas60s} &rarr; <strong className="text-white">{evaluacion?.final?.fuerzaSentadillas60s}</strong>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-cyan-300 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-500/40">
                    Combinado: +{evaluacion?.incrementoFuerzaCombinada}%
                  </div>
                </div>

                {/* 3. Flexibilidad Sit and Reach */}
                <div className="bg-[#0a192f] p-5 rounded-2xl border border-[#1e3a8a]/60 shadow-xl space-y-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#061426] text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Sit & Reach
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94a3b8] font-medium block">Flexibilidad Isquiosural:</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {evaluacion?.inicial?.sitAndReachCm} &rarr; <span className="text-purple-400 font-black">{evaluacion?.final?.sitAndReachCm} cm</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-500/40">
                    +{evaluacion?.incrementoFlexibilidadCm} cm (+{evaluacion?.incrementoFlexibilidadPorcentaje}%)
                  </div>
                </div>

                {/* 4. Composición Corporal IMC */}
                <div className="bg-[#0a192f] p-5 rounded-2xl border border-[#1e3a8a]/60 shadow-xl space-y-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#061426] text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                      <Scale className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Composición IMC
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94a3b8] font-medium block">Índice de Masa Corporal:</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {evaluacion?.inicial?.imc} &rarr; <span className="text-emerald-400 font-black">{evaluacion?.final?.imc} kg/m²</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                    Avance IMC: +{evaluacion?.cambioImcPorcentaje}%
                  </div>
                </div>

              </div>

              {/* Tabla Oficial de Aspectos Evaluados, Herramientas, % de Mejora y Nivel Obtenido */}
              <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a]/60 shadow-xl space-y-4 text-white">
                <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Desglose de Capacidades Evaluadas por Dimensión
                    </h3>
                    <p className="text-xs text-[#94a3b8]">
                      Instrumentos estandarizados y porcentaje de mejora respecto a la evaluación inicial
                    </p>
                  </div>
                  <span className="text-xs font-bold text-cyan-300 bg-[#061426] px-3 py-1 rounded-xl border border-[#1e3555]">
                    Dictamen: Nivel {evaluacion?.puntosAsignados === 4 ? '4 Destacado' : evaluacion?.puntosAsignados === 3 ? '3 Satisfactorio' : evaluacion?.puntosAsignados === 2 ? '2 Básico' : '1 Insuficiente'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#061426] text-[#cbd5e1] font-bold border-b border-[#1e3555]">
                        <th className="p-3">Aspecto Evaluado</th>
                        <th className="p-3">Instrumento / Herramienta de Evaluación</th>
                        <th className="p-3 text-center">Inicial</th>
                        <th className="p-3 text-center">Final</th>
                        <th className="p-3 text-center">% Mejora</th>
                        <th className="p-3 text-center">Nivel Obtenido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      <tr className="hover:bg-[#061426]/50">
                        <td className="p-3 font-semibold text-white">Resistencia Cardiorrespiratoria</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Test Course Navette (20m Shuttle Run - Paliers oficiales)</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{evaluacion?.inicial?.courseNavetteNivel || 0} palier</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-300">{evaluacion?.final?.courseNavetteNivel || 0} palier</td>
                        <td className="p-3 text-center font-bold text-emerald-400">+{evaluacion?.incrementoCourseNavette || 0}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (evaluacion?.incrementoCourseNavette || 0) >= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            (evaluacion?.incrementoCourseNavette || 0) >= 25 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            (evaluacion?.incrementoCourseNavette || 0) >= 10 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                            'bg-gray-800 text-gray-300'
                          }`}>
                            {(evaluacion?.incrementoCourseNavette || 0) >= 40 ? '4 Destacado' : (evaluacion?.incrementoCourseNavette || 0) >= 25 ? '3 Satisfactorio' : (evaluacion?.incrementoCourseNavette || 0) >= 10 ? '2 Básico' : '1 Insuficiente'}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#061426]/50">
                        <td className="p-3 font-semibold text-white">Fuerza Muscular: Lagartijas</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Prueba continua de 60 segundos con cronómetro oficial</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{evaluacion?.inicial?.fuerzaLagartijas60s || 0} rep</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-300">{evaluacion?.final?.fuerzaLagartijas60s || 0} rep</td>
                        <td className="p-3 text-center font-bold text-cyan-400">+{evaluacion?.incrementoFuerzaLagartijas || 0}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (evaluacion?.incrementoFuerzaLagartijas || 0) >= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            (evaluacion?.incrementoFuerzaLagartijas || 0) >= 25 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {(evaluacion?.incrementoFuerzaLagartijas || 0) >= 40 ? '4 Destacado' : (evaluacion?.incrementoFuerzaLagartijas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#061426]/50">
                        <td className="p-3 font-semibold text-white">Fuerza Muscular: Sentadillas</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Prueba continua de 60 segundos con cronómetro oficial</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{evaluacion?.inicial?.fuerzaSentadillas60s || 0} rep</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-300">{evaluacion?.final?.fuerzaSentadillas60s || 0} rep</td>
                        <td className="p-3 text-center font-bold text-cyan-400">+{evaluacion?.incrementoFuerzaSentadillas || 0}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (evaluacion?.incrementoFuerzaSentadillas || 0) >= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            (evaluacion?.incrementoFuerzaSentadillas || 0) >= 25 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {(evaluacion?.incrementoFuerzaSentadillas || 0) >= 40 ? '4 Destacado' : (evaluacion?.incrementoFuerzaSentadillas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}
                          </span>
                        </td>
                      </tr>

                      <tr className="bg-blue-950/30">
                        <td className="p-3 font-bold text-cyan-200">&rarr; Fuerza Combinada en 60s</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Ponderación unificada de tren superior e inferior</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{(evaluacion?.inicial?.fuerzaLagartijas60s || 0) + (evaluacion?.inicial?.fuerzaSentadillas60s || 0)} rep</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-300">{(evaluacion?.final?.fuerzaLagartijas60s || 0) + (evaluacion?.final?.fuerzaSentadillas60s || 0)} rep</td>
                        <td className="p-3 text-center font-black text-cyan-300">+{evaluacion?.incrementoFuerzaCombinada || 0}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (evaluacion?.incrementoFuerzaCombinada || 0) >= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            (evaluacion?.incrementoFuerzaCombinada || 0) >= 25 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {(evaluacion?.incrementoFuerzaCombinada || 0) >= 40 ? '4 Destacado' : (evaluacion?.incrementoFuerzaCombinada || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#061426]/50">
                        <td className="p-3 font-semibold text-white">Flexibilidad Isquiosural y Tronco</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Test Sit and Reach (Cajón graduado y cinta milimétrica en cm)</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{evaluacion?.inicial?.sitAndReachCm || 0} cm</td>
                        <td className="p-3 text-center font-mono font-bold text-purple-300">{evaluacion?.final?.sitAndReachCm || 0} cm</td>
                        <td className="p-3 text-center font-bold text-purple-300">+{evaluacion?.incrementoFlexibilidadCm || 0} cm (+{evaluacion?.incrementoFlexibilidadPorcentaje || 0}%)</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (evaluacion?.incrementoFlexibilidadPorcentaje || 0) >= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            (evaluacion?.incrementoFlexibilidadPorcentaje || 0) >= 25 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {(evaluacion?.incrementoFlexibilidadPorcentaje || 0) >= 40 ? '4 Destacado' : (evaluacion?.incrementoFlexibilidadPorcentaje || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#061426]/50">
                        <td className="p-3 font-semibold text-white">Composición Corporal (IMC)</td>
                        <td className="p-3 text-[#94a3b8] text-[11px]">Báscula de bioimpedancia y estadiómetro - [Peso / Estatura²]</td>
                        <td className="p-3 text-center font-mono text-[#cbd5e1]">{evaluacion?.inicial?.imc || 0} kg/m²</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-300">{evaluacion?.final?.imc || 0} kg/m²</td>
                        <td className="p-3 text-center font-bold text-emerald-400">+{evaluacion?.cambioImcPorcentaje || 0}%</td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            {(evaluacion?.cambioImcPorcentaje || 0) >= 20 ? '4 Destacado' : '3 Satisfactorio'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botón para solicitar modificación de datos oficiales */}
              <div className="bg-[#061426] border border-[#1e3555] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="text-[#cbd5e1]">
                    ¿Detectaste algún error o requieres actualizar tus mediciones registradas?
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTipoMedicionAModificar('ambas');
                    setMostrarModalAvisoSolicitud(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0a192f] hover:bg-[#112240] text-cyan-300 border border-blue-500/30 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Solicitar Autorización de Modificación
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ================= VISTA 2: FORMULARIO MEDICIÓN INICIAL ================= */}
      {pestanaActiva === 'captura_inicial' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 text-white">
          <div className="border-b border-[#1e3555] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-500/30 uppercase tracking-wider">
                Paso 1 • Diagnóstico Basal
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Formulario de Medición Inicial de Capacidades Físicas
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Captura tus valores registrados al inicio del semestre por el evaluador institucional.
              </p>
            </div>

            {tieneInicial && !tieneAutorizacion && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Medición Registrada Oficialmente</span>
              </span>
            )}
          </div>

          <form onSubmit={handleGuardarInicial} className="space-y-6 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Fecha de la Medición Inicial</label>
                <input
                  type="date"
                  required
                  value={formInicial.fecha || ''}
                  onChange={(e) => setFormInicial({ ...formInicial, fecha: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">1. Test Course Navette (Palier alcanzado)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="21"
                  required
                  value={formInicial.courseNavetteNivel ?? 3.5}
                  onChange={(e) => setFormInicial({ ...formInicial, courseNavetteNivel: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-[#64748b]">Nivel de velocidad y resistencia en 20m shuttle run.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">2. Fuerza: Lagartijas en 60 segundos (rep)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formInicial.fuerzaLagartijas60s ?? 15}
                  onChange={(e) => setFormInicial({ ...formInicial, fuerzaLagartijas60s: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-[#64748b]">Repeticiones continuas en un minuto.</span>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">3. Fuerza: Sentadillas en 60 segundos (rep)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formInicial.fuerzaSentadillas60s ?? 20}
                  onChange={(e) => setFormInicial({ ...formInicial, fuerzaSentadillas60s: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-[#64748b]">Flexiones completas de rodilla en un minuto.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">4. Flexibilidad Sit and Reach (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formInicial.sitAndReachCm ?? 2.0}
                  onChange={(e) => setFormInicial({ ...formInicial, sitAndReachCm: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-[#64748b]">Centímetros de alcance en cajón de flexibilidad.</span>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">5. Peso Corporal (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formInicial.pesoKg ?? 62.0}
                  onChange={(e) => setFormInicial({ ...formInicial, pesoKg: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Estatura (cm)</label>
                <input
                  type="number"
                  required
                  value={formInicial.estaturaCm ?? 165}
                  onChange={(e) => setFormInicial({ ...formInicial, estaturaCm: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#1e3555]">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{tieneInicial && !tieneAutorizacion ? 'Solicitar Modificación' : 'Guardar Medición Inicial'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= VISTA 3: FORMULARIO MEDICIÓN FINAL ================= */}
      {pestanaActiva === 'captura_final' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a]/60 shadow-xl space-y-6 text-white">
          <div className="border-b border-[#1e3555] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-md border border-purple-500/30 uppercase tracking-wider">
                Paso 2 • Evaluación de Cierre de Semestre
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Formulario de Medición Final de Capacidades Físicas
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Captura tus valores obtenidos al cierre del semestre para contrastar el avance porcentual.
              </p>
            </div>

            {tieneFinal && !tieneAutorizacion && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Medición Final Registrada</span>
              </span>
            )}
          </div>

          <form onSubmit={handleGuardarFinal} className="space-y-6 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Fecha de la Medición Final</label>
                <input
                  type="date"
                  required
                  value={formFinal.fecha || ''}
                  onChange={(e) => setFormFinal({ ...formFinal, fecha: e.target.value })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">1. Test Course Navette (Palier final alcanzado)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="21"
                  required
                  value={formFinal.courseNavetteNivel ?? 4.8}
                  onChange={(e) => setFormFinal({ ...formFinal, courseNavetteNivel: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <span className="text-[10px] text-[#64748b]">Palier de cierre para contrastar incremento.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">2. Fuerza: Lagartijas en 60 segundos (rep final)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formFinal.fuerzaLagartijas60s ?? 22}
                  onChange={(e) => setFormFinal({ ...formFinal, fuerzaLagartijas60s: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">3. Fuerza: Sentadillas en 60 segundos (rep final)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formFinal.fuerzaSentadillas60s ?? 30}
                  onChange={(e) => setFormFinal({ ...formFinal, fuerzaSentadillas60s: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">4. Flexibilidad Sit and Reach (cm final)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formFinal.sitAndReachCm ?? 4.5}
                  onChange={(e) => setFormFinal({ ...formFinal, sitAndReachCm: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">5. Peso Corporal Final (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formFinal.pesoKg ?? 60.5}
                  onChange={(e) => setFormFinal({ ...formFinal, pesoKg: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Estatura (cm)</label>
                <input
                  type="number"
                  required
                  value={formFinal.estaturaCm ?? 165}
                  onChange={(e) => setFormFinal({ ...formFinal, estaturaCm: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#1e3555]">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{tieneFinal && !tieneAutorizacion ? 'Solicitar Modificación' : 'Guardar y Calcular Informe'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= MODAL DE AVISO Y SOLICITUD DE MODIFICACIÓN AL ADMINISTRADOR ================= */}
      {mostrarModalAvisoSolicitud && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in text-white">
            <div className="flex items-center space-x-3 border-b border-[#1e3555] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#061426] text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Aviso de Autorización de Modificación
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Departamento de Deportes y Salud
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#061426] border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
              <p className="font-semibold text-amber-300">
                ⚠️ Aviso importante al usuario:
              </p>
              <p className="leading-relaxed text-[#cbd5e1]">
                Los datos de su evaluación física se encuentran registrados en el sistema oficial. Toda modificación o corrección debe ser <strong>autorizada por el Administrador</strong> del departamento.
              </p>
              <p className="leading-relaxed text-[#cbd5e1]">
                Al enviar este aviso, le llegará la notificación al Administrador para que autorice o rechace la edición de sus datos.
              </p>
            </div>

            <form onSubmit={handleEnviarSolicitudModificacion} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Medición a Modificar</label>
                <select
                  value={tipoMedicionAModificar}
                  onChange={(e) => setTipoMedicionAModificar(e.target.value as any)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="inicial" className="bg-[#061426] text-white">Medición Inicial (Diagnóstica)</option>
                  <option value="final" className="bg-[#061426] text-white">Medición Final (Cierre)</option>
                  <option value="ambas" className="bg-[#061426] text-white">Ambas Mediciones</option>
                </select>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-bold mb-1">Motivo o justificación de la corrección</label>
                <textarea
                  required
                  rows={3}
                  value={motivoModificacion}
                  onChange={(e) => setMotivoModificacion(e.target.value)}
                  placeholder="Ej: Corrección en las repeticiones de sentadillas o aclaración en el palier de Course Navette..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setMostrarModalAvisoSolicitud(false)}
                  className="px-4 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl font-semibold border border-[#1e3555] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Aviso al Administrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
