import React, { useState } from 'react';
import { Actividad, Identidad, InscripcionAsistencia, SesionUsuario } from '../../types';
import { MSBDatabase, CONFIG, limpiarTituloLicenciado } from '../../utils/storage';
import { ConstanciasModal, ConstanciaItem } from './ConstanciasModal';
import { InformeRendimientoModal } from './InformeRendimientoModal';
import { AutoridadesModal } from './AutoridadesModal';
import { 
  Users, 
  Calendar, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Mail, 
  FileText, 
  Search, 
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

interface AsistenciasAdminViewProps {
  usuario: SesionUsuario;
  actividades: Actividad[];
  inscripciones: InscripcionAsistencia[];
  identidades: Identidad[];
  onActualizar: () => void;
}

export const AsistenciasAdminView: React.FC<AsistenciasAdminViewProps> = ({
  usuario,
  actividades,
  inscripciones,
  identidades,
  onActualizar
}) => {
  // Actividad seleccionada (por defecto la primera actividad o 'todas')
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string>(
    actividades.length > 0 ? actividades[0].ID_actividad : 'todas'
  );
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<'todos' | 'acreditados' | 'en_riesgo'>('todos');
  
  // Modales
  const [mostrarInforme, setMostrarInforme] = useState<boolean>(false);
  const [mostrarAutoridades, setMostrarAutoridades] = useState<boolean>(false);
  const [constanciasModalConfig, setConstanciasModalConfig] = useState<{
    abierto: boolean;
    items: ConstanciaItem[];
    modo: 'individual' | 'masivo';
  }>({
    abierto: false,
    items: [],
    modo: 'individual'
  });

  // Contador de inscritos activos por actividad
  const contarInscritosPorActividad = (idAct: string): number => {
    return inscripciones.filter(ins => ins.ID_actividad === idAct && ins.Estado_inscripcion !== 'Cancelada').length;
  };

  // Filtrado de inscripciones para la tabla desplegada en la parte inferior
  const inscripcionesFiltradas = inscripciones.filter(ins => {
    if (ins.Estado_inscripcion === 'Cancelada') return false;
    if (actividadSeleccionada !== 'todas' && ins.ID_actividad !== actividadSeleccionada) return false;
    
    const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, ins.ID_actividad);
    if (filtroEstatus === 'acreditados' && !stats.validada) return false;
    if (filtroEstatus === 'en_riesgo' && stats.validada) return false;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const alumno = identidades.find(i => i.id === ins.ID_participante);
      const act = actividades.find(a => a.ID_actividad === ins.ID_actividad);
      const nombreCompleto = `${alumno?.nombre || ''} ${alumno?.apellidos || ''}`.toLowerCase();
      const matricula = (alumno?.id || '').toLowerCase();
      const folio = ins.ID_registro.toLowerCase();
      const club = (act?.Nombre || '').toLowerCase();
      if (!nombreCompleto.includes(q) && !matricula.includes(q) && !folio.includes(q) && !club.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Preparar todas las constancias validadas para emisión masiva
  const obtenerConstanciasAcreditadas = (filtroAct: string = actividadSeleccionada): ConstanciaItem[] => {
    const pool = inscripciones.filter(ins => {
      if (ins.Estado_inscripcion === 'Cancelada') return false;
      if (filtroAct !== 'todas' && ins.ID_actividad !== filtroAct) return false;
      return true;
    });

    const resultado: ConstanciaItem[] = [];
    pool.forEach(ins => {
      const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, ins.ID_actividad);
      if (stats.validada) {
        const act = actividades.find(a => a.ID_actividad === ins.ID_actividad);
        const par = identidades.find(i => i.id === ins.ID_participante);
        if (act && par) {
          resultado.push({
            actividad: act,
            participante: par,
            inscripcion: ins,
            stats
          });
        }
      }
    });

    return resultado;
  };

  const handleEmitirIndividual = (ins: InscripcionAsistencia) => {
    const act = actividades.find(a => a.ID_actividad === ins.ID_actividad);
    const par = identidades.find(i => i.id === ins.ID_participante);
    const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, ins.ID_actividad);
    if (!act || !par) return;

    setConstanciasModalConfig({
      abierto: true,
      items: [{
        actividad: act,
        participante: par,
        inscripcion: ins,
        stats
      }],
      modo: 'individual'
    });
  };

  const handleEmitirMasivo = () => {
    const acreditadas = obtenerConstanciasAcreditadas(actividadSeleccionada);
    if (acreditadas.length === 0) {
      alert('No se encontraron participantes con asistencia reglamentaria validada (>= 85%) en la selección actual.');
      return;
    }

    setConstanciasModalConfig({
      abierto: true,
      items: acreditadas,
      modo: 'masivo'
    });
  };

  const acreditadosActuales = obtenerConstanciasAcreditadas(actividadSeleccionada).length;
  const actividadActivaObj = actividades.find(a => a.ID_actividad === actividadSeleccionada);
  const totalInscritosActividadActiva = actividadSeleccionada === 'todas' 
    ? inscripciones.filter(i => i.Estado_inscripcion !== 'Cancelada').length 
    : contarInscritosPorActividad(actividadSeleccionada);

  return (
    <div className="space-y-6">
      
      {/* Barra de Acciones y Resumen para el Administrador */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-300 bg-[#1e3a8a]/40 px-2.5 py-0.5 rounded-lg border border-blue-500/40 uppercase tracking-wider">
              Control de Asistencias y Acreditaciones
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              {CONFIG.INSTITUCION}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión Nominal de Clubes y Asistencias
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Departamento de Deporte y Salud • Ciclo Semestral Activo • Mínimo 85% de asistencia para acreditación
          </p>
        </div>

        {/* Botones de Emisión Masiva, Informe y Personalización de Firmas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMostrarAutoridades(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#061426] hover:bg-[#112240] text-[#d6e3ff] text-xs font-semibold rounded-xl border border-[#1e3a8a] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Firmas y Autoridades</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarInforme(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-600/50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Informe de Rendimiento</span>
          </button>

          <button
            type="button"
            onClick={handleEmitirMasivo}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Emitir Constancias ({acreditadosActuales} Acreditadas)</span>
          </button>
        </div>
      </div>

      {/* Conjunto de Botones / Ventanas de Actividades */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-[#d6e3ff] uppercase tracking-wider">
              Clubes y Actividades Ofertadas ({actividades.length})
            </h3>
          </div>
          <span className="text-xs text-[#94a3b8]">
            Haz clic sobre una ventana para filtrar y ver inscritos abajo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Opción de botón: Ver Todos los Clubes */}
          <button
            type="button"
            onClick={() => setActividadSeleccionada('todas')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[148px] cursor-pointer ${
              actividadSeleccionada === 'todas'
                ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-500 ring-offset-2 ring-offset-[#040e1c]'
                : 'bg-[#0a192f] hover:bg-[#112240] text-white border-[#1e3a8a]/60 shadow-md hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
                  actividadSeleccionada === 'todas' ? 'bg-white/20 text-white' : 'bg-[#061426] text-[#94a3b8] border border-[#1e3a8a]/60'
                }`}>
                  TODOS LOS CLUBES
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                  actividadSeleccionada === 'todas' ? 'bg-white text-blue-950 font-black' : 'bg-[#112240] text-blue-300 border border-[#1e3a8a]'
                }`}>
                  {inscripciones.filter(i => i.Estado_inscripcion !== 'Cancelada').length} inscritos
                </span>
              </div>
              <div className="font-bold text-sm tracking-tight leading-snug text-white">
                Padrón Institucional Completo
              </div>
              <div className={`text-[11px] mt-1.5 leading-relaxed ${actividadSeleccionada === 'todas' ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
                Visualizar participantes de todas las disciplinas
              </div>
            </div>

            <div className={`text-[10px] font-semibold flex items-center justify-between pt-3 mt-3 border-t ${
              actividadSeleccionada === 'todas' ? 'border-white/20 text-blue-200' : 'border-[#1e3a8a]/40 text-[#94a3b8]'
            }`}>
              <span>{actividades.length} clubes activos</span>
              <span className="font-bold text-[#fbbf24]">{actividadSeleccionada === 'todas' ? '● Seleccionado' : 'Ver padrón →'}</span>
            </div>
          </button>

          {/* Botones / Ventanas individuales para cada Club */}
          {actividades.map((act) => {
            const numInscritos = contarInscritosPorActividad(act.ID_actividad);
            const estaSeleccionada = actividadSeleccionada === act.ID_actividad;

            return (
              <button
                key={act.ID_actividad}
                type="button"
                onClick={() => setActividadSeleccionada(act.ID_actividad)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[148px] cursor-pointer ${
                  estaSeleccionada
                    ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-500 ring-offset-2 ring-offset-[#040e1c]'
                    : 'bg-[#0a192f] hover:bg-[#112240] text-white border-[#1e3a8a]/60 shadow-md hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {/* Identificación del Club */}
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      estaSeleccionada ? 'bg-white/20 text-white' : 'bg-[#061426] text-blue-300 border border-[#1e3a8a]'
                    }`}>
                      {act.ID_actividad}
                    </span>

                    {/* Cantidad de inscritos destacada */}
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      estaSeleccionada 
                        ? 'bg-white text-blue-950 font-black' 
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-black'
                    }`}>
                      {numInscritos} {numInscritos === 1 ? 'inscrito' : 'inscritos'}
                    </span>
                  </div>

                  <div className="font-bold text-sm leading-snug break-words text-white">
                    {act.Nombre}
                  </div>

                  <div className={`text-[11px] mt-1.5 leading-relaxed break-words ${
                    estaSeleccionada ? 'text-blue-200' : 'text-[#94a3b8]'
                  }`}>
                    {act.Tipo} • {limpiarTituloLicenciado(act.Responsable_Nombre) || 'Departamento de Deportes'}
                  </div>
                </div>

                <div className={`text-[10px] font-semibold flex items-center justify-between pt-2.5 mt-2.5 border-t ${
                  estaSeleccionada ? 'border-white/20 text-blue-200' : 'border-[#1e3a8a]/40 text-[#94a3b8]'
                }`}>
                  <span className="flex items-center space-x-1 truncate mr-2">
                    <Clock className="w-3 h-3 shrink-0 text-blue-400" />
                    <span>{act.Hora_inicio} - {act.Hora_fin}</span>
                  </span>
                  <span className="font-bold shrink-0 text-[#fbbf24]">
                    {estaSeleccionada ? '● Activo' : 'Ver inscritos →'}
                  </span>
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* Despliegue de la Información Nominal */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-5">
        
        {/* Encabezado del Club Seleccionado con Detalles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e3a8a]/40 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-300 bg-[#061426] px-2.5 py-0.5 rounded-md border border-[#1e3a8a]">
                {actividadActivaObj ? actividadActivaObj.ID_actividad : 'PADRÓN GENERAL'}
              </span>
              <span className="text-sm font-bold text-white">
                {actividadActivaObj ? actividadActivaObj.Nombre : 'Todos los Clubes Institucionales'}
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/50">
                {inscripcionesFiltradas.length} {inscripcionesFiltradas.length === 1 ? 'participante mostrado' : 'participantes mostrados'}
              </span>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              {actividadActivaObj 
                ? `Encargado(a): ${limpiarTituloLicenciado(actividadActivaObj.Responsable_Nombre) || 'Departamento'} • Horario: ${actividadActivaObj.Hora_inicio} a ${actividadActivaObj.Hora_fin} hrs • Días: ${(actividadActivaObj.Dias_sesion || ['Lunes', 'Miércoles']).join(', ')}`
                : 'Mostrando participantes inscritos y su avance de asistencia reglamentaria en todos los clubes'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o matrícula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#061426] border border-[#1e3a8a] text-white placeholder-[#64748b] rounded-xl text-xs w-60 focus:ring-2 focus:ring-[#f59e0b] shadow-2xs"
              />
            </div>

            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value as any)}
              className="p-1.5 bg-[#061426] border border-[#1e3a8a] text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#f59e0b] shadow-2xs cursor-pointer"
            >
              <option value="todos">Todos los estatus ({totalInscritosActividadActiva})</option>
              <option value="acreditados">Validados (≥ 85%)</option>
              <option value="en_riesgo">En Riesgo (&lt; 85%)</option>
            </select>
          </div>
        </div>

        {/* Tabla Nominal Detallada de Participantes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3a8a]/60">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Folio / Matrícula</th>
                <th className="p-3.5 whitespace-nowrap min-w-[200px]">Participante y Sector</th>
                <th className="p-3.5 whitespace-nowrap min-w-[180px]">Club Asignado</th>
                <th className="p-3.5 text-center whitespace-nowrap">Sesiones Asistidas</th>
                <th className="p-3.5 text-center whitespace-nowrap">Asistencia Acumulada</th>
                <th className="p-3.5 text-center whitespace-nowrap">Estatus Reglamentario</th>
                <th className="p-3.5 text-right whitespace-nowrap">Constancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a8a]/30">
              {inscripcionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94a3b8]">
                    No se encontraron participantes en esta actividad con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                inscripcionesFiltradas.map((ins, idx) => {
                  const act = actividades.find(a => a.ID_actividad === ins.ID_actividad);
                  const par = identidades.find(i => i.id === ins.ID_participante);
                  const stats = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, ins.ID_actividad);

                  return (
                    <tr key={`ins-${ins.ID_registro}-${ins.ID_participante}-${ins.ID_actividad}-${idx}`} className="hover:bg-[#112240]/60 transition-colors">
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-white">{ins.ID_registro}</div>
                        <div className="text-[10px] text-[#94a3b8]">{ins.ID_participante}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white leading-snug">
                          {par ? `${par.nombre} ${par.apellidos}` : ins.ID_participante}
                        </div>
                        <div className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">
                          {par?.licenciatura || par?.sector || 'Comunidad'} {par?.semestre && `• ${par.semestre} (${par.grupo})`}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white leading-snug">{act?.Nombre || ins.ID_actividad}</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">{ins.ID_actividad}</div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-white">
                        {stats.asistidas} / {stats.totalSesiones}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="font-bold text-blue-300 text-xs">{stats.porcentaje}%</div>
                        <div className="w-20 bg-[#061426] h-1.5 rounded-full mx-auto mt-1 overflow-hidden border border-[#1e3a8a]/40">
                          <div 
                            className={`h-full ${stats.validada ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${stats.porcentaje}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {stats.validada ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Acreditado (≥85%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>En Riesgo (&lt;85%)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {stats.validada ? (
                          <button
                            onClick={() => handleEmitirIndividual(ins)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1e3a8a]/40 hover:bg-[#1e3a8a] text-blue-200 text-xs font-semibold rounded-lg border border-blue-500/40 transition-colors cursor-pointer shadow-2xs"
                            title={`Emitir constancia oficial de ${par?.nombre} para ${act?.Nombre}`}
                          >
                            <Award className="w-3.5 h-3.5 text-blue-400" />
                            <span>Constancia</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#64748b] italic">No acreditado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Constancias */}
      {constanciasModalConfig.abierto && (
        <ConstanciasModal
          items={constanciasModalConfig.items}
          modo={constanciasModalConfig.modo}
          onCerrar={() => setConstanciasModalConfig({ abierto: false, items: [], modo: 'individual' })}
        />
      )}

      {/* Modal de Informe Consolidado */}
      {mostrarInforme && (
        <InformeRendimientoModal
          actividades={actividades}
          inscripciones={inscripciones}
          identidades={identidades}
          onCerrar={() => setMostrarInforme(false)}
        />
      )}

      {/* Modal de Personalización de Autoridades */}
      {mostrarAutoridades && (
        <AutoridadesModal
          onCerrar={() => setMostrarAutoridades(false)}
          onGuardado={onActualizar}
        />
      )}

    </div>
  );
};
