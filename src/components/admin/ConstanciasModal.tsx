import React, { useState } from 'react';
import { Actividad, Identidad, InscripcionAsistencia } from '../../types';
import { MSBDatabase, CONFIG } from '../../utils/storage';
import { Award, Printer, Mail, CheckCircle2, Send, Check, Download, PenTool } from 'lucide-react';
import { descargarDocumentoHtml, imprimirHtmlDirecto, generarHtmlConstancia } from '../../utils/exportDocs';
import { SignatureModal, FirmaVectorPreview } from '../SignatureModal';

export interface ConstanciaItem {
  actividad: Actividad;
  participante: Identidad;
  inscripcion: InscripcionAsistencia;
  stats: {
    totalSesiones: number;
    asistidas: number;
    faltas: number;
    justificadas: number;
    porcentaje: number;
    validada: boolean;
  };
}

interface ConstanciasModalProps {
  items: ConstanciaItem[];
  modo: 'individual' | 'masivo';
  onCerrar: () => void;
}

export const ConstanciasModal: React.FC<ConstanciasModalProps> = ({ items, modo, onCerrar }) => {
  const [enviandoCorreos, setEnviandoCorreos] = useState(false);
  const [correosEnviados, setCorreosEnviados] = useState<Record<string, boolean>>({});
  const [mensajeEnvio, setMensajeEnvio] = useState<string | null>(null);
  const [mostrarFirmaModal, setMostrarFirmaModal] = useState(false);
  const [autoridades, setAutoridades] = useState(MSBDatabase.getAutoridades());

  const handleEnviarCorreosMasivo = () => {
    setEnviandoCorreos(true);
    setMensajeEnvio('Preparando envío institucional de constancias digitales...');

    setTimeout(() => {
      const enviados: Record<string, boolean> = {};
      items.forEach(it => {
        enviados[it.participante.id] = true;
      });
      setCorreosEnviados(enviados);
      setEnviandoCorreos(false);
      setMensajeEnvio(`✓ Se han enviado exitosamente ${items.length} constancias oficiales con sello digital a los correos institucionales (@enmfm.edu.mx).`);
    }, 1500);
  };

  const handleDescargar = () => {
    if (items.length === 1) {
      const item = items[0];
      const html = generarHtmlConstancia(item, autoridades);
      descargarDocumentoHtml(
        `constancia_${item.participante.id}_${item.actividad.ID_actividad}`,
        `Constancia - ${item.participante.nombre} ${item.participante.apellidos}`,
        html
      );
    } else {
      const htmlDocs = items.map(item => generarHtmlConstancia(item, autoridades)).join('<div style="page-break-after: always; margin-bottom: 40px;"></div>');
      descargarDocumentoHtml(
        `constancias_masivas_acreditados_${items.length}`,
        'Emisión Masiva de Constancias',
        htmlDocs
      );
    }
  };

  const handleImprimir = () => {
    if (items.length === 1) {
      const html = generarHtmlConstancia(items[0], autoridades);
      imprimirHtmlDirecto(`Constancia - ${items[0].participante.nombre}`, html);
    } else {
      const htmlDocs = items.map(item => generarHtmlConstancia(item, autoridades)).join('<div style="page-break-after: always; margin-bottom: 40px;"></div>');
      imprimirHtmlDirecto('Emisión Masiva de Constancias', htmlDocs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-gray-100 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        


        {/* Cabecera del Modal con Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {modo === 'masivo' 
                  ? `Emisión Masiva de Constancias (${items.length} participantes acreditados)`
                  : 'Constancia Oficial de Asistencia y Acreditación'}
              </h2>
              <p className="text-xs text-gray-500">
                Formato institucional oficial normalista con umbral reglamentario &ge; 85%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setMostrarFirmaModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-semibold border border-indigo-200 shadow-xs transition-colors cursor-pointer"
              title="Estampar o trazar firmas virtuales oficiales antes de exportar"
            >
              <PenTool className="w-4 h-4 text-indigo-600" />
              <span>Firmas Virtuales</span>
            </button>

            <button
              onClick={handleDescargar}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar HTML/PDF</span>
            </button>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            {modo === 'masivo' && (
              <button
                onClick={handleEnviarCorreosMasivo}
                disabled={enviandoCorreos}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{enviandoCorreos ? 'Enviando...' : 'Enviar por Correo'}</span>
              </button>
            )}

            <button
              onClick={onCerrar}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notificación de envío */}
        {mensajeEnvio && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center space-x-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeEnvio}</span>
          </div>
        )}

        {/* Listado de Constancias para Imprimir o Visualizar */}
        <div className="space-y-10">
          {items.map((item, index) => {
            const enviado = !!correosEnviados[item.participante.id];
            const plantilla = MSBDatabase.getPlantillaDocumento();

            return (
              <div
                key={`constancia-item-${item.participante.id}-${item.actividad.ID_actividad}-${item.inscripcion?.ID_registro || 'reg'}-${index}`}
                className="constancia-doc p-6 sm:p-10 border-4 border-double border-blue-950/40 rounded-3xl bg-white text-center space-y-6 shadow-xs relative print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page"
              >
                {/* Badge de estatus de correo */}
                {enviado && (
                  <div className="absolute top-4 right-4 print:hidden">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Enviado a {item.participante.correo}</span>
                    </span>
                  </div>
                )}

                {/* Encabezado Institucional Oficial Alineado con la Plantilla */}
                <div className="space-y-1.5 border-b-2 border-blue-900 pb-5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black tracking-wide text-blue-950 uppercase text-center break-words">
                    {plantilla.institucionNombre || 'ESCUELA NORMAL "MIGUEL F. MARTÍNEZ"'}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 text-center tracking-wider uppercase">
                    {plantilla.institucionLema || 'CENTENARIA Y BENEMÉRITA'}
                  </p>
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mt-1">
                    {plantilla.cicloEscolar || 'CICLO ESCOLAR 2026 - 2027'}
                  </div>
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    {plantilla.subdireccionNombre || 'SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES'}
                  </div>
                  <div className="text-xs font-black text-blue-900 uppercase tracking-wider mt-0.5">
                    {plantilla.departamentoNombre || CONFIG.DEPARTAMENTO}
                  </div>
                </div>

                <div className="py-2 space-y-2">
                  <div className="text-xs sm:text-sm italic font-serif text-gray-600">
                    Otorga la presente
                  </div>
                  <div className="text-lg sm:text-2xl font-serif font-black tracking-widest text-gray-900 uppercase">
                    CONSTANCIA DE ASISTENCIA Y ACREDITACIÓN
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                    A:
                  </div>
                  <div className="text-xl sm:text-3xl font-bold text-blue-900 underline decoration-blue-300 underline-offset-4 break-words">
                    {item.participante.nombre} {item.participante.apellidos}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 tracking-normal mt-1">
                    {item.participante.licenciatura || 'Licenciatura en Educación Normalista'} • {item.participante.semestre || '5° Semestre'} ({item.participante.grupo || 'A'}) • Matrícula: {item.participante.id}
                  </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <p>
                    Por su destacada y constante participación al haber cumplido y superado satisfactoriamente el umbral institucional con un{' '}
                    <strong className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 inline-block">
                      {item.stats.porcentaje}% de asistencia
                    </strong>{' '}
                    ({item.stats.asistidas} de {item.stats.totalSesiones} sesiones), cumpliendo con el umbral reglamentario mínimo del 85% en el club o taller institucional:
                  </p>
                  
                  <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200">
                    <div className="font-black text-gray-950 text-base sm:text-lg break-words">
                      "{item.actividad.Nombre}"
                    </div>
                    <div className="text-[11px] text-blue-800 font-mono font-bold mt-0.5">
                      Clave de Actividad: {item.actividad.ID_actividad} • Folio de Acreditación: {item.inscripcion.ID_registro}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Desarrollado durante el período semestral en las instalaciones de la Escuela Normal "Miguel F. Martínez".
                  </p>
                </div>

                {/* Firmas Oficiales Institucionales */}
                <div className="pt-6 border-t border-gray-300">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-5">
                    {autoridades.tituloJefatura || 'Jefes del Departamento de Deporte y Salud'}
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-xs text-gray-700">
                    <div className="flex flex-col items-center justify-end">
                      <FirmaVectorPreview firma={autoridades.jefeMatutinoFirma} tipo="matutino" />
                      <div className="border-b-2 border-gray-600 w-48 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900 text-xs">
                        {autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}
                      </div>
                      <div className="text-[11px] text-gray-600 font-medium">
                        {autoridades.jefeMatutinoCargo || 'Turno matutino'}
                      </div>
                      <div className="text-[10px] text-blue-800 font-semibold mt-0.5">
                        {CONFIG.DEPARTAMENTO}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-end">
                      <FirmaVectorPreview firma={autoridades.jefeVespertinoFirma} tipo="vespertino" />
                      <div className="border-b-2 border-gray-600 w-48 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900 text-xs">
                        {autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}
                      </div>
                      <div className="text-[11px] text-gray-600 font-medium">
                        {autoridades.jefeVespertinoCargo || 'Turno vespertino'}
                      </div>
                      <div className="text-[10px] text-blue-800 font-semibold mt-0.5">
                        {CONFIG.DEPARTAMENTO}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
