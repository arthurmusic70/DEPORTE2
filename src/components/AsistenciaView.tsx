import React, { useState } from 'react';
import { SesionUsuario, InscripcionAsistencia, Actividad } from '../types';
import { MSBDatabase, CONFIG } from '../utils/storage';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Award, 
  AlertCircle, 
  Printer, 
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  Percent,
  Check,
  XCircle,
  HelpCircle,
  Lock,
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { descargarDocumentoHtml, imprimirHtmlDirecto, generarHtmlConstancia } from '../utils/exportDocs';
import { FirmaVectorPreview } from './SignatureModal';

interface AsistenciaViewProps {
  usuario: SesionUsuario;
  onIrAPruebasFisicas?: () => void;
}

export const AsistenciaView: React.FC<AsistenciaViewProps> = ({ usuario, onIrAPruebasFisicas }) => {
  const [inscripciones, setInscripciones] = useState<InscripcionAsistencia[]>(MSBDatabase.getInscripciones());
  const [actividades, setActividades] = useState<Actividad[]>(MSBDatabase.getActividades());
  const [constanciaActiva, setConstanciaActiva] = useState<{ act: Actividad; ins: InscripcionAsistencia; stats: any } | null>(null);
  const [actividadesExpandidas, setActividadesExpandidas] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const handleActualizar = () => {
      setInscripciones(MSBDatabase.getInscripciones());
      setActividades(MSBDatabase.getActividades());
    };
    window.addEventListener('msb_datos_actualizados', handleActualizar);
    return () => window.removeEventListener('msb_datos_actualizados', handleActualizar);
  }, []);

  // Filtrar inscripciones del usuario actual
  const misInscripciones = inscripciones.filter(i => i.ID_participante === usuario.id);

  const getActividad = (idActividad: string) => {
    return actividades.find(a => a.ID_actividad === idActividad);
  };

  const toggleExpandir = (idActividad: string) => {
    setActividadesExpandidas(prev => ({
      ...prev,
      [idActividad]: !prev[idActividad]
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Encabezado */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Control de Asistencia del Alumno / Usuario
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#061426] text-[#94a3b8] border border-[#1e3555]">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Modo Consulta (Solo Lectura)</span>
            </span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Mi registro de asistencia y acreditación
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Consulta puntual de sesiones, promedio acumulado y verificación del 85% reglamentario.
          </p>
        </div>

        {/* Criterio del 85% */}
        <div className="bg-[#061426] p-3.5 rounded-2xl border border-[#1e3a8a] flex items-center space-x-3 text-xs shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-blue-600/30 shrink-0">
            85%
          </div>
          <div>
            <div className="font-bold text-white">Umbral de Acreditación</div>
            <div className="text-cyan-300 text-[11px]">Mínimo reglamentario para validar y emitir constancia</div>
          </div>
        </div>
      </div>

      {/* Banner de Acceso a Pruebas de Capacidades Físicas (Formulario e Informe Individual) */}
      <div className="bg-gradient-to-r from-blue-950 via-[#0a1e3f] to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Dumbbell className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-cyan-200">
                Formulario Individual Integrado
              </span>
              <span className="text-xs text-blue-200/80">Semestre 2026-1</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Evaluación de Capacidades Físicas (Medición Inicial y Final)
            </h3>
            <p className="text-xs text-blue-100/80 max-w-2xl">
              Registra de manera individual tus resultados en Course Navette, fuerza (lagartijas y sentadillas 60s), flexibilidad Sit & Reach y composición corporal IMC para consultar tu informe resumido de desempeño.
            </p>
          </div>
        </div>

        {onIrAPruebasFisicas && (
          <button
            onClick={onIrAPruebasFisicas}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span>Ir a Mis Pruebas Físicas</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Lista de Registros de Asistencia */}
      {misInscripciones.length === 0 ? (
        <div className="bg-[#0a192f] rounded-3xl p-10 text-center border border-[#1e3a8a]/60 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#061426] text-[#64748b] flex items-center justify-center mx-auto border border-[#1e3555]">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            No tienes actividades registradas
          </h3>
          <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
            Inscríbete a los talleres deportivos o pausas activas para comenzar a acumular registros de asistencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {misInscripciones.map((ins, idx) => {
            const actividad = getActividad(ins.ID_actividad);
            const stats = MSBDatabase.calcularEstadisticasAsistencia(usuario.id, ins.ID_actividad);
            const expandido = !!actividadesExpandidas[ins.ID_actividad];

            return (
              <div
                key={`asist-ins-${ins.ID_registro}-${ins.ID_actividad}-${idx}`}
                className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a]/60 hover:border-blue-400 shadow-xl transition-all space-y-4 text-white"
              >
                {/* Cabecera de la Actividad */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3555] pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-300">
                      Folio: {ins.ID_registro} • Actividad {ins.ID_actividad}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {actividad?.Nombre || `Actividad ${ins.ID_actividad}`}
                    </h3>
                    <div className="text-xs text-[#94a3b8] mt-0.5">
                      Encargado: {actividad?.Responsable_Nombre || 'Departamento de Deportes'} • Horario: {actividad?.Hora_inicio} a {actividad?.Hora_fin} hrs
                    </div>
                  </div>

                  {/* Porcentaje y Dictamen del 85% */}
                  <div className="flex items-center space-x-4 self-start sm:self-auto">
                    <div className="text-right">
                      <div className="text-2xl font-black text-white leading-none">
                        {stats.porcentaje}%
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-medium mt-0.5">
                        Promedio Acumulado
                      </div>
                    </div>

                    <div className="shrink-0">
                      {stats.validada ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Asistencia Validada (&ge; 85%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>No Acreditada (&lt; 85%)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métricas y Barra de Progreso */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#061426] p-4 rounded-2xl border border-[#1e293b] text-xs">
                  <div>
                    <span className="text-[#94a3b8]">Sesiones Impartidas:</span>
                    <div className="font-bold text-white text-sm mt-0.5">{stats.totalSesiones}</div>
                  </div>

                  <div>
                    <span className="text-[#94a3b8]">Asistencias Confirmadas:</span>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">{stats.asistidas}</div>
                  </div>

                  <div>
                    <span className="text-[#94a3b8]">Faltas Registradas:</span>
                    <div className="font-bold text-red-400 text-sm mt-0.5">{stats.faltas}</div>
                  </div>

                  <div>
                    <span className="text-[#94a3b8]">Justificadas:</span>
                    <div className="font-bold text-cyan-400 text-sm mt-0.5">{stats.justificadas}</div>
                  </div>

                  {/* Barra comparativa con el 85% */}
                  <div className="col-span-full pt-1">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-[#cbd5e1]">Progreso de asistencia</span>
                      <span className={stats.validada ? 'text-emerald-400' : 'text-amber-400'}>
                        {stats.porcentaje}% de 100% (Mínimo requerido: 85%)
                      </span>
                    </div>
                    <div className="w-full bg-[#0d213f] h-2.5 rounded-full overflow-hidden relative">
                      {/* Marcador del 85% */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10" 
                        style={{ left: '85%' }} 
                        title="Marca mínima del 85%"
                      />
                      <div 
                        className={`h-full rounded-full transition-all ${
                          stats.validada ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, stats.porcentaje)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones y Detalle Puntual */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpandir(ins.ID_actividad)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{expandido ? 'Ocultar historial de sesiones' : 'Ver detalle puntual de cada sesión'}</span>
                    {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Botón de constancia solo si supera el 85% */}
                  {stats.validada && actividad ? (
                    <button
                      type="button"
                      onClick={() => setConstanciaActiva({ act: actividad, ins, stats })}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Emitir Constancia Acreditada</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#64748b] italic">
                      Constancia disponible al superar el 85%
                    </span>
                  )}
                </div>

                {/* Desglose puntual sesión por sesión (Solo Lectura) */}
                {expandido && (
                  <div className="mt-3 pt-3 border-t border-[#1e3555] space-y-2 animate-in fade-in">
                    <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Historial Puntual de Sesiones Registradas por el Encargado:</span>
                      <span className="text-[11px] font-normal text-[#64748b]">Solo lectura</span>
                    </div>

                    {stats.detalleSesiones.length === 0 ? (
                      <div className="p-4 bg-[#061426] rounded-xl text-center text-xs text-[#94a3b8] border border-[#1e293b]">
                        Aún no se han abierto sesiones de asistencia para esta actividad.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stats.detalleSesiones.map((ses, idx) => (
                          <div 
                            key={ses.idSesion || idx}
                            className="p-3 bg-[#061426] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{ses.titulo}</div>
                              <div className="text-[11px] text-[#94a3b8] flex items-center space-x-2 mt-0.5">
                                <span>Fecha: <strong className="text-cyan-300">{ses.fecha}</strong></span>
                                <span>•</span>
                                <span>{ses.hora} hrs</span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              ses.estado === 'Asistió'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : ses.estado === 'Falta'
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : ses.estado === 'Justificado'
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {ses.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Constancia Institucional Oficial (Solo si supera 85%) */}
      {constanciaActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a192f] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] my-8 text-white">
            
            <div className="flex justify-between items-center pb-4 border-b border-[#1e3555]">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Constancia Institucional de Acreditación y Asistencia (&ge; 85%)
              </span>
              <button
                onClick={() => setConstanciaActiva(null)}
                className="p-1.5 rounded-full text-[#94a3b8] hover:text-white hover:bg-[#112240] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Documento oficial printable */}
            <div className="my-6 p-8 border-4 border-double border-blue-900/40 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-white text-center space-y-5 shadow-inner text-gray-900">
              
              {/* Encabezado Institucional Oficial 4 Líneas */}
              <div className="border-b-2 border-blue-900 pb-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-blue-950 uppercase">
                  ESCUELA NORMAL "MIGUEL F. MARTÍNEZ"
                </h2>
                <p className="text-sm font-bold text-gray-800 tracking-wider mt-0.5 uppercase">
                  CENTENARIA Y BENEMÉRITA
                </p>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-2">
                  SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES
                </div>
                <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mt-0.5">
                  {CONFIG.DEPARTAMENTO}
                </div>
              </div>

              <div className="py-2">
                <div className="text-sm italic font-serif text-gray-600">
                  Otorga la presente
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-gray-900 uppercase mt-1">
                  CONSTANCIA DE ASISTENCIA Y ACREDITACIÓN
                </div>
                <div className="text-sm text-gray-600 mt-2 font-medium">
                  A:
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900 underline decoration-blue-300 underline-offset-4 mt-1">
                  {usuario.nombre} {usuario.apellidos}
                </div>
                <div className="text-sm sm:text-base font-semibold text-gray-700 tracking-normal mt-1">
                  {usuario.licenciatura || 'Licenciatura en Educación Primaria'} • {usuario.semestre || '5° Semestre'}, {usuario.grupo || 'Grupo A'}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 max-w-xl mx-auto leading-relaxed">
                Por haber cumplido y superado satisfactoriamente el umbral reglamentario con un{' '}
                <strong className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {constanciaActiva.stats.porcentaje}% de asistencia
                </strong>{' '}
                (mínimo institucional del 85%) en el club o taller deportivo:
                <br />
                <span className="inline-block mt-2 font-bold text-gray-950 text-base sm:text-lg bg-blue-50/80 px-4 py-1 rounded-xl border border-blue-100">
                  {constanciaActiva.act.Nombre}
                </span>
                <br />
                <span className="text-xs text-gray-500 mt-1 block">
                  Desarrollado durante el período semestral en las instalaciones de nuestra institución.
                </span>
              </p>

              {/* Firmas Oficiales Institucionales */}
              <div className="pt-6 border-t border-gray-300 text-center">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-5">
                  {MSBDatabase.getAutoridades().tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
                </div>
                <div className="grid grid-cols-2 gap-8 text-xs text-gray-700">
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={MSBDatabase.getAutoridades().jefeMatutinoFirma} tipo="matutino" />
                    <div className="border-b-2 border-gray-600 w-44 mx-auto mb-1.5"></div>
                    <div className="font-bold text-gray-900">{MSBDatabase.getAutoridades().jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}</div>
                    <div className="text-[11px] text-gray-600">{MSBDatabase.getAutoridades().jefeMatutinoCargo || 'Turno matutino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <FirmaVectorPreview firma={MSBDatabase.getAutoridades().jefeVespertinoFirma} tipo="vespertino" />
                    <div className="border-b-2 border-gray-600 w-44 mx-auto mb-1.5"></div>
                    <div className="font-bold text-gray-900">{MSBDatabase.getAutoridades().jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}</div>
                    <div className="text-[11px] text-gray-600">{MSBDatabase.getAutoridades().jefeVespertinoCargo || 'Turno vespertino'}</div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const autoridades = MSBDatabase.getAutoridades();
                  const ins = inscripciones.find(i => i.ID_participante === usuario.id && i.ID_actividad === constanciaActiva.act.ID_actividad);
                  const html = generarHtmlConstancia({
                    actividad: constanciaActiva.act,
                    participante: {
                      id: usuario.id,
                      nombre: usuario.nombre,
                      apellidos: usuario.apellidos,
                      sector: usuario.sector,
                      correo: usuario.correo,
                      tipoCuenta: usuario.tipoCuenta,
                      estado: 'Activo',
                      consentimiento: 'Sí',
                      fechaAlta: '',
                      rol: usuario.rol,
                      username: usuario.username,
                      pinHash: ''
                    },
                    inscripcion: ins || { ID_registro: `REG-${usuario.id.replace('PAR-', '')}`, ID_actividad: constanciaActiva.act.ID_actividad, ID_participante: usuario.id, Fecha_inscripcion: '', Estado_inscripcion: 'Confirmada', Asistencia: 'Asistió', Fecha_asistencia: '', Observaciones: '' },
                    stats: constanciaActiva.stats
                  }, autoridades);

                  descargarDocumentoHtml(
                    `constancia_${usuario.id}_${constanciaActiva.act.ID_actividad}`,
                    `Constancia - ${usuario.nombre} ${usuario.apellidos}`,
                    html
                  );
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar HTML / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const autoridades = MSBDatabase.getAutoridades();
                  const ins = inscripciones.find(i => i.ID_participante === usuario.id && i.ID_actividad === constanciaActiva.act.ID_actividad);
                  const html = generarHtmlConstancia({
                    actividad: constanciaActiva.act,
                    participante: {
                      id: usuario.id,
                      nombre: usuario.nombre,
                      apellidos: usuario.apellidos,
                      sector: usuario.sector,
                      correo: usuario.correo,
                      tipoCuenta: usuario.tipoCuenta,
                      estado: 'Activo',
                      consentimiento: 'Sí',
                      fechaAlta: '',
                      rol: usuario.rol,
                      username: usuario.username,
                      pinHash: ''
                    },
                    inscripcion: ins || { ID_registro: `REG-${usuario.id.replace('PAR-', '')}`, ID_actividad: constanciaActiva.act.ID_actividad, ID_participante: usuario.id, Fecha_inscripcion: '', Estado_inscripcion: 'Confirmada', Asistencia: 'Asistió', Fecha_asistencia: '', Observaciones: '' },
                    stats: constanciaActiva.stats
                  }, autoridades);

                  imprimirHtmlDirecto(`Constancia - ${usuario.nombre} ${usuario.apellidos}`, html);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => setConstanciaActiva(null)}
                className="px-4 py-2 bg-[#061426] hover:bg-[#112240] text-[#cbd5e1] rounded-xl text-xs font-semibold border border-[#1e3555] cursor-pointer transition-colors"
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
