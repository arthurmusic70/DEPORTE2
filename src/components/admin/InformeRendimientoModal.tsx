import React, { useState } from 'react';
import { Actividad, Identidad, InscripcionAsistencia, AutoridadesConfig } from '../../types';
import { MSBDatabase, CONFIG, limpiarTituloLicenciado } from '../../utils/storage';
import { FileText, Printer, CheckCircle2, AlertCircle, Award, Download, PenTool } from 'lucide-react';
import { 
  descargarDocumentoHtml, 
  imprimirHtmlDirecto, 
  generarEncabezadoInstitucionalHtml, 
  generarBloqueFirmasOficiales 
} from '../../utils/exportDocs';
import { SignatureModal } from '../SignatureModal';

interface InformeRendimientoModalProps {
  actividades: Actividad[];
  inscripciones: InscripcionAsistencia[];
  identidades: Identidad[];
  onCerrar: () => void;
}

export const InformeRendimientoModal: React.FC<InformeRendimientoModalProps> = ({
  actividades,
  inscripciones,
  identidades,
  onCerrar
}) => {
  const [autoridades, setAutoridades] = useState<AutoridadesConfig>(MSBDatabase.getAutoridades());
  const [mostrarFirmaModal, setMostrarFirmaModal] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const statsClubes = actividades.map((act) => {
    const insClub = inscripciones.filter(i => i.ID_actividad === act.ID_actividad && i.Estado_inscripcion !== 'Cancelada');
    let sumaPorcentajes = 0;
    let acreditados = 0;
    let maxSesiones = 0;

    insClub.forEach(ins => {
      const st = MSBDatabase.calcularEstadisticasAsistencia(ins.ID_participante, act.ID_actividad);
      sumaPorcentajes += st.porcentaje;
      if (st.validada) acreditados++;
      if (st.totalSesiones > maxSesiones) maxSesiones = st.totalSesiones;
    });

    const promedioClub = insClub.length > 0 ? Math.round(sumaPorcentajes / insClub.length) : 0;
    const enRiesgo = insClub.length - acreditados;
    const nombreEncargado = limpiarTituloLicenciado(act.Responsable_Nombre);

    return {
      act,
      nombreEncargado,
      totalInscritos: insClub.length,
      sesionesImpartidas: maxSesiones,
      promedioClub,
      acreditados,
      enRiesgo
    };
  });

  const totalInscritosGlobal = statsClubes.reduce((acc, c) => acc + c.totalInscritos, 0);
  const totalSesionesGlobal = statsClubes.reduce((acc, c) => acc + c.sesionesImpartidas, 0);
  const totalAcreditadosGlobal = statsClubes.reduce((acc, c) => acc + c.acreditados, 0);
  const totalEnRiesgoGlobal = statsClubes.reduce((acc, c) => acc + c.enRiesgo, 0);
  const promedioGeneralPonderado = totalInscritosGlobal > 0
    ? Math.round(statsClubes.reduce((acc, c) => acc + (c.promedioClub * c.totalInscritos), 0) / totalInscritosGlobal)
    : 0;

  const generarHtmlDoc = () => {
    const filasClubes = statsClubes.map((c) => {
      return `
        <tr>
          <td><strong>${c.act.Nombre}</strong> (${c.act.ID_actividad})</td>
          <td>${c.nombreEncargado || 'Departamento de Deporte y Salud'}</td>
          <td class="text-center font-bold" style="background:#f0f9ff; color:#0369a1;">${c.totalInscritos}</td>
          <td class="text-center font-bold" style="background:#fefce8; color:#a16207;">${c.sesionesImpartidas}</td>
          <td class="text-center font-bold" style="color:#1e3a8a;">${c.promedioClub}%</td>
          <td class="text-center font-bold" style="color:#15803d;">${c.acreditados}</td>
          <td class="text-center font-bold" style="color:#d97706;">${c.enRiesgo}</td>
        </tr>
      `;
    }).join('');

    const encabezado = generarEncabezadoInstitucionalHtml('INFORME CONSOLIDADO DE ASISTENCIA Y RENDIMIENTO POR CLUB');

    return `
      ${encabezado}

      <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
          <div class="kpi-title">Total Clubes Activos</div>
          <div class="kpi-val" style="color: #1e3a8a;">${actividades.length}</div>
          <div class="kpi-desc">Ciclo Semestral 2026-1</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #0284c7;">
          <div class="kpi-title">Total de Inscritos Global</div>
          <div class="kpi-val" style="color: #0284c7;">${totalInscritosGlobal}</div>
          <div class="kpi-desc">Padrón activo en actividades</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #d97706;">
          <div class="kpi-title">Sesiones Impartidas</div>
          <div class="kpi-val" style="color: #d97706;">${totalSesionesGlobal}</div>
          <div class="kpi-desc">Sesiones presenciales impartidas</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #15803d;">
          <div class="kpi-title">Acreditación General (&ge;85%)</div>
          <div class="kpi-val" style="color: #15803d;">${promedioGeneralPonderado}%</div>
          <div class="kpi-desc">${totalAcreditadosGlobal} participantes aprobados</div>
        </div>
      </div>

      <table style="margin-top: 18px;">
        <thead>
          <tr>
            <th>Club / Actividad</th>
            <th>Encargado(a) Responsable</th>
            <th class="text-center">Total Inscritos</th>
            <th class="text-center">Sesiones Impartidas</th>
            <th class="text-center">% Promedio</th>
            <th class="text-center">Acreditados (&ge;85%)</th>
            <th class="text-center">En Riesgo (&lt;85%)</th>
          </tr>
        </thead>
        <tbody>
          ${filasClubes}
        </tbody>
        <tfoot>
          <tr style="background:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
            <td colspan="2">TOTALES CONSOLIDADOS INSTITUCIONALES</td>
            <td class="text-center" style="color:#0369a1; font-size:13px;">${totalInscritosGlobal}</td>
            <td class="text-center" style="color:#a16207; font-size:13px;">${totalSesionesGlobal}</td>
            <td class="text-center" style="color:#1e3a8a; font-size:13px;">${promedioGeneralPonderado}%</td>
            <td class="text-center" style="color:#15803d; font-size:13px;">${totalAcreditadosGlobal}</td>
            <td class="text-center" style="color:#d97706; font-size:13px;">${totalEnRiesgoGlobal}</td>
          </tr>
        </tfoot>
      </table>

      ${generarBloqueFirmasOficiales(autoridades)}
    `;
  };

  const handleDescargar = () => {
    const html = generarHtmlDoc();
    descargarDocumentoHtml(
      'informe_rendimiento_asistencias_clubes_2026_1',
      'Informe Institucional de Rendimiento y Asistencia',
      html
    );
  };

  const handleImprimir = () => {
    const html = generarHtmlDoc();
    imprimirHtmlDirecto('Informe Institucional de Rendimiento y Asistencia', html);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0a192f] text-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Barra superior de acciones (oculta en print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3555] pb-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#061426] text-cyan-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Informe Institucional de Rendimiento y Asistencia
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Muestra el total de inscritos y las sesiones impartidas por club con umbral del 85%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setMostrarFirmaModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#061426] hover:bg-[#112240] text-cyan-300 rounded-xl text-xs font-semibold border border-[#1e3555] shadow-xs cursor-pointer transition-colors"
              title="Estampar o trazar firmas virtuales oficiales antes de exportar"
            >
              <PenTool className="w-4 h-4 text-cyan-400" />
              <span>Firmas Virtuales</span>
            </button>

            <button
              onClick={handleDescargar}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar HTML/PDF</span>
            </button>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onCerrar}
              className="p-2 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cajas KPI en la vista en pantalla */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
          <div className="p-3.5 bg-[#061426] rounded-2xl border border-blue-500/30">
            <span className="text-[10px] font-bold text-blue-300 uppercase block">Clubes Activos</span>
            <div className="text-xl font-black text-white mt-0.5">{actividades.length}</div>
            <div className="text-[10px] text-[#94a3b8]">Semestre 2026-1</div>
          </div>
          <div className="p-3.5 bg-[#061426] rounded-2xl border border-cyan-500/30">
            <span className="text-[10px] font-bold text-cyan-300 uppercase block">Total de Inscritos</span>
            <div className="text-xl font-black text-cyan-400 mt-0.5">{totalInscritosGlobal}</div>
            <div className="text-[10px] text-[#94a3b8]">Participantes registrados</div>
          </div>
          <div className="p-3.5 bg-[#061426] rounded-2xl border border-amber-500/30">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">Sesiones Impartidas</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">{totalSesionesGlobal}</div>
            <div className="text-[10px] text-[#94a3b8]">Sesiones concluidas</div>
          </div>
          <div className="p-3.5 bg-[#061426] rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">Acreditación (&ge;85%)</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{promedioGeneralPonderado}%</div>
            <div className="text-[10px] text-[#94a3b8]">{totalAcreditadosGlobal} acreditados</div>
          </div>
        </div>

        {/* Documento Oficial Imprimible (Lienzo Formal Blanco para Impresión Nítida) */}
        <div className="space-y-6 bg-white text-gray-950 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-md print:m-0 print:p-0 print:border-none print:shadow-none">
          
          {/* Encabezado Oficial 4 Líneas */}
          <div className="text-center border-b-2 border-blue-900 pb-5">
            <h1 className="text-xl sm:text-2xl font-serif font-black text-gray-950 uppercase tracking-wide">
              ESCUELA NORMAL "MIGUEL F. MARTÍNEZ"
            </h1>
            <p className="text-sm font-bold text-gray-800 tracking-wider mt-0.5">
              CENTENARIA Y BENEMÉRITA
            </p>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-2">
              SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES
            </div>
            <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mt-0.5">
              {CONFIG.DEPARTAMENTO}
            </div>
            <div className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-900 font-bold text-xs rounded-lg border border-blue-200 uppercase">
              DICTAMEN CONSOLIDADO DE ASISTENCIA Y RENDIMIENTO POR CLUB
            </div>
            <div className="text-[11px] text-gray-500 pt-1.5 capitalize">
              Fecha de emisión: {fechaHoy}
            </div>
          </div>

          {/* Tabla de Clubes con Total de Inscritos y Sesiones Impartidas por Club */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-300 border-collapse">
              <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                <tr>
                  <th className="p-2.5 border-r border-gray-300">Club / Actividad</th>
                  <th className="p-2.5 border-r border-gray-300">Encargado Responsable</th>
                  <th className="p-2.5 text-center border-r border-gray-300 bg-sky-50 text-sky-950">Total Inscritos</th>
                  <th className="p-2.5 text-center border-r border-gray-300 bg-amber-50 text-amber-950">Sesiones Impartidas</th>
                  <th className="p-2.5 text-center border-r border-gray-300">% Promedio</th>
                  <th className="p-2.5 text-center bg-emerald-50 text-emerald-900 border-r border-gray-300">Acreditados (&ge;85%)</th>
                  <th className="p-2.5 text-center bg-amber-50 text-amber-900">En Riesgo (&lt;85%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsClubes.map((c) => (
                  <tr key={c.act.ID_actividad} className="hover:bg-gray-50">
                    <td className="p-2.5 border-r border-gray-300">
                      <div className="font-bold text-gray-900">{c.act.Nombre}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{c.act.Tipo} ({c.act.ID_actividad})</div>
                    </td>
                    <td className="p-2.5 border-r border-gray-300 text-gray-700">
                      {c.nombreEncargado || 'Departamento de Deporte y Salud'}
                    </td>
                    <td className="p-2.5 text-center font-bold border-r border-gray-300 text-sky-900 bg-sky-50/50">
                      {c.totalInscritos}
                    </td>
                    <td className="p-2.5 text-center font-bold border-r border-gray-300 text-amber-900 bg-amber-50/50">
                      {c.sesionesImpartidas}
                    </td>
                    <td className="p-2.5 text-center font-bold text-blue-900 border-r border-gray-300">
                      {c.promedioClub}%
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/50 border-r border-gray-300">
                      {c.acreditados}
                    </td>
                    <td className="p-2.5 text-center font-bold text-amber-800 bg-amber-50/50">
                      {c.enRiesgo}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-black text-gray-950 border-t-2 border-gray-800">
                  <td colSpan={2} className="p-2.5 border-r border-gray-400 uppercase tracking-wide">
                    TOTALES CONSOLIDADOS INSTITUCIONALES
                  </td>
                  <td className="p-2.5 text-center border-r border-gray-400 text-sky-950 text-sm">
                    {totalInscritosGlobal}
                  </td>
                  <td className="p-2.5 text-center border-r border-gray-400 text-amber-950 text-sm">
                    {totalSesionesGlobal}
                  </td>
                  <td className="p-2.5 text-center border-r border-gray-400 text-blue-900 text-sm">
                    {promedioGeneralPonderado}%
                  </td>
                  <td className="p-2.5 text-center border-r border-gray-400 text-emerald-900 text-sm">
                    {totalAcreditadosGlobal}
                  </td>
                  <td className="p-2.5 text-center text-amber-900 text-sm">
                    {totalEnRiesgoGlobal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Firmas Oficiales Institucionales */}
          <div className="pt-8 border-t border-gray-300 text-center">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-6">
              {autoridades.tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
            </div>
            <div className="grid grid-cols-2 gap-10 text-center text-xs text-gray-800">
              <div className="flex flex-col items-center justify-end">
                {autoridades.jefeMatutinoFirma && (
                  <div className="h-12 flex items-center justify-center -mb-2">
                    <img src={autoridades.jefeMatutinoFirma} alt="Firma Matutino" className="max-h-12 max-w-44 object-contain" />
                  </div>
                )}
                <div className="border-b-2 border-gray-600 w-52 mx-auto mb-1.5"></div>
                <div className="font-bold text-gray-900">{autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}</div>
                <div className="text-[11px] text-gray-600">{autoridades.jefeMatutinoCargo || 'Turno matutino'}</div>
                <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
              </div>

              <div className="flex flex-col items-center justify-end">
                {autoridades.jefeVespertinoFirma && (
                  <div className="h-12 flex items-center justify-center -mb-2">
                    <img src={autoridades.jefeVespertinoFirma} alt="Firma Vespertino" className="max-h-12 max-w-44 object-contain" />
                  </div>
                )}
                <div className="border-b-2 border-gray-600 w-52 mx-auto mb-1.5"></div>
                <div className="font-bold text-gray-900">{autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}</div>
                <div className="text-[11px] text-gray-600">{autoridades.jefeVespertinoCargo || 'Turno vespertino'}</div>
                <div className="text-[10px] text-blue-800 font-semibold mt-0.5">{CONFIG.DEPARTAMENTO}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal de Firma Virtual */}
        {mostrarFirmaModal && (
          <SignatureModal
            abierto={mostrarFirmaModal}
            onCerrar={() => setMostrarFirmaModal(false)}
            onFirmaGuardada={(updated) => {
              setAutoridades(updated);
              setMostrarFirmaModal(false);
            }}
          />
        )}

      </div>
    </div>
  );
};
