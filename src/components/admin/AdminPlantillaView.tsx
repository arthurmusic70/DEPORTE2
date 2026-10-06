import React, { useState } from 'react';
import { PlantillaDocumentoConfig } from '../../types';
import { MSBDatabase, CONFIG } from '../../utils/storage';
import { 
  generarEncabezadoInstitucionalHtml, 
  descargarDocumentoHtml, 
  imprimirHtmlDirecto,
  generarBloqueFirmasOficiales
} from '../../utils/exportDocs';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Printer, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Sparkles,
  Building,
  Image as ImageIcon,
  Check
} from 'lucide-react';

export const AdminPlantillaView: React.FC = () => {
  const [plantilla, setPlantilla] = useState<PlantillaDocumentoConfig>(() => MSBDatabase.getPlantillaDocumento());
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    MSBDatabase.savePlantillaDocumento(plantilla);
    setMensaje({ 
      tipo: 'exito', 
      texto: '✓ Plantilla institucional actualizada. Todas las constancias, cédulas e informes ejecutivos utilizarán este nuevo formato.' 
    });
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleRestablecer = () => {
    if (confirm('¿Restablecer la plantilla oficial a sus valores institucionales predeterminados?')) {
      const reset = MSBDatabase.resetPlantillaDocumento();
      setPlantilla(reset);
      setMensaje({ tipo: 'exito', texto: '✓ Plantilla institucional restablecida a los valores originales.' });
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  // Manejador de subida de logo personalizado
  const handleSubirLogo = (
    e: React.ChangeEvent<HTMLInputElement>, 
    campo: 'logoNLEducacionPersonalizado' | 'logoUnescoPersonalizado' | 'escudoNormalPersonalizado'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPlantilla(prev => ({
        ...prev,
        [campo]: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const quitarLogoPersonalizado = (campo: 'logoNLEducacionPersonalizado' | 'logoUnescoPersonalizado' | 'escudoNormalPersonalizado') => {
    setPlantilla(prev => ({
      ...prev,
      [campo]: undefined
    }));
  };

  // Generar HTML de muestra para probar descarga e impresión
  const generarMuestraDocumento = () => {
    const encabezado = generarEncabezadoInstitucionalHtml('DOCUMENTO DE MUESTRA • PLANTILLA INSTITUCIONAL', undefined, plantilla);
    const autoridades = MSBDatabase.getAutoridades();
    return `
      ${encabezado}
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="font-size: 16px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px;">
          PRUEBA DE PLANTILLA DOCUMENTO INSTITUCIONAL
        </h3>
        <p style="font-size: 12px; color: #475569; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          Este documento confirma la alineación visual del membrete oficial con el formato aprobado para la Escuela Normal "Miguel F. Martínez", Subdirección de Servicios Estudiantiles y Departamento de Deporte y Salud.
        </p>
      </div>

      <div style="margin: 20px 0; font-size: 12px; color: #334155;">
        <p><strong>Ciclo Escolar Vigente:</strong> ${plantilla.cicloEscolar}</p>
        <p><strong>Subdirección Responsable:</strong> ${plantilla.subdireccionNombre}</p>
        <p><strong>Departamento Operativo:</strong> ${plantilla.departamentoNombre}</p>
      </div>

      ${generarBloqueFirmasOficiales(autoridades)}
    `;
  };

  const handleProbarImpresion = () => {
    const html = generarMuestraDocumento();
    imprimirHtmlDirecto('Muestra_Plantilla_Documental', html);
  };

  const handleProbarDescarga = () => {
    const html = generarMuestraDocumento();
    descargarDocumentoHtml('Muestra_Plantilla_Documental', 'Muestra Plantilla Documental', html);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider">
              Control Institucional
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Base para Constancias, Cédulas e Informes
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Configuración de la Plantilla Documento</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Personaliza el membrete institucional, ciclo escolar, textos oficiales y logotipos. Los cambios se reflejarán inmediatamente en todas las descargas e impresiones.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleProbarImpresion}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>Probar Impresión</span>
          </button>

          <button
            type="button"
            onClick={handleProbarDescarga}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Descargar Muestra</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
          mensaje.tipo === 'exito' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Grid: Editor + Vista Previa en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Formulario de Configuración (7 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Textos Oficiales del Membrete</span>
            </h2>
            <button
              type="button"
              onClick={handleRestablecer}
              className="text-xs text-gray-500 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>

          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Línea 1: Nombre de la Institución
              </label>
              <input
                type="text"
                required
                value={plantilla.institucionNombre}
                onChange={(e) => setPlantilla({ ...plantilla, institucionNombre: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Línea 2: Lema Institucional
                </label>
                <input
                  type="text"
                  required
                  value={plantilla.institucionLema}
                  onChange={(e) => setPlantilla({ ...plantilla, institucionLema: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Línea 3: Ciclo Escolar
                </label>
                <input
                  type="text"
                  required
                  value={plantilla.cicloEscolar}
                  onChange={(e) => setPlantilla({ ...plantilla, cicloEscolar: e.target.value })}
                  placeholder="CICLO ESCOLAR 2026 - 2027"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Línea 4: Subdirección
                </label>
                <input
                  type="text"
                  required
                  value={plantilla.subdireccionNombre}
                  onChange={(e) => setPlantilla({ ...plantilla, subdireccionNombre: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Línea 5: Departamento
                </label>
                <input
                  type="text"
                  required
                  value={plantilla.departamentoNombre}
                  onChange={(e) => setPlantilla({ ...plantilla, departamentoNombre: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Pie de Página Oficial (Normativa ISO / Leyenda Institucional)
              </label>
              <textarea
                rows={2}
                value={plantilla.pieDePagina || ''}
                onChange={(e) => setPlantilla({ ...plantilla, pieDePagina: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Gestión de Logotipos */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Gestión y Reemplazo de Logotipos Oficiales</span>
              </h3>

              {/* Logo NL Educación */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plantilla.mostrarLogoNLEducacion}
                      onChange={(e) => setPlantilla({ ...plantilla, mostrarLogoNLEducacion: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-800">1. Logo Nuevo León Educación</span>
                  </label>
                  {plantilla.logoNLEducacionPersonalizado && (
                    <button
                      type="button"
                      onClick={() => quitarLogoPersonalizado('logoNLEducacionPersonalizado')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Restablecer Vector Original
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="subir-logo-nl"
                    accept="image/*"
                    onChange={(e) => handleSubirLogo(e, 'logoNLEducacionPersonalizado')}
                    className="hidden"
                  />
                  <label
                    htmlFor="subir-logo-nl"
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 text-xs font-semibold cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{plantilla.logoNLEducacionPersonalizado ? 'Cambiar Imagen Subida' : 'Subir Imagen Personalizada'}</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {plantilla.logoNLEducacionPersonalizado ? '✓ Imagen propia cargada' : 'Utilizando vector oficial'}
                  </span>
                </div>
              </div>

              {/* Logo UNESCO */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plantilla.mostrarLogoUnesco}
                      onChange={(e) => setPlantilla({ ...plantilla, mostrarLogoUnesco: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-800">2. Logo UNESCO Escuelas Asociadas</span>
                  </label>
                  {plantilla.logoUnescoPersonalizado && (
                    <button
                      type="button"
                      onClick={() => quitarLogoPersonalizado('logoUnescoPersonalizado')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Restablecer Vector Original
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="subir-logo-unesco"
                    accept="image/*"
                    onChange={(e) => handleSubirLogo(e, 'logoUnescoPersonalizado')}
                    className="hidden"
                  />
                  <label
                    htmlFor="subir-logo-unesco"
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 text-xs font-semibold cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{plantilla.logoUnescoPersonalizado ? 'Cambiar Imagen Subida' : 'Subir Imagen Personalizada'}</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {plantilla.logoUnescoPersonalizado ? '✓ Imagen propia cargada' : 'Utilizando vector oficial'}
                  </span>
                </div>
              </div>

              {/* Escudo Normalista */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plantilla.mostrarEscudoNormal}
                      onChange={(e) => setPlantilla({ ...plantilla, mostrarEscudoNormal: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-800">3. Escudo Centenaria y Benemérita 1870-1970</span>
                  </label>
                  {plantilla.escudoNormalPersonalizado && (
                    <button
                      type="button"
                      onClick={() => quitarLogoPersonalizado('escudoNormalPersonalizado')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Restablecer Vector Original
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="subir-escudo-normal"
                    accept="image/*"
                    onChange={(e) => handleSubirLogo(e, 'escudoNormalPersonalizado')}
                    className="hidden"
                  />
                  <label
                    htmlFor="subir-escudo-normal"
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 text-xs font-semibold cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{plantilla.escudoNormalPersonalizado ? 'Cambiar Imagen Subida' : 'Subir Escudo Personalizado'}</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {plantilla.escudoNormalPersonalizado ? '✓ Escudo propio cargado' : 'Utilizando vector oficial'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios de la Plantilla Institucional</span>
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Vista Previa Realista en Vivo (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-700" />
              <span>Vista Previa del Documento Oficial</span>
            </h2>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Formato Carta en Vivo
            </span>
          </div>

          {/* Hoja de papel simulada con sombra */}
          <div className="flex-1 bg-white border border-gray-300 rounded-2xl p-6 shadow-md overflow-hidden text-xs relative">
            
            {/* Renderizado directo del encabezado con la configuración activa */}
            <div 
              dangerouslySetInnerHTML={{ 
                __html: generarEncabezadoInstitucionalHtml('CÉDULA / CONSTANCIA / INFORME EJECUTIVO', undefined, plantilla) 
              }} 
            />

            {/* Contenido simulado */}
            <div className="space-y-3 opacity-80 pt-2 pointer-events-none select-none">
              <div className="h-4 bg-gray-100 rounded-md w-3/4 mx-auto"></div>
              <div className="h-3 bg-gray-100 rounded-md w-1/2 mx-auto"></div>
              
              <div className="grid grid-cols-3 gap-2 my-4">
                <div className="h-14 bg-blue-50/70 border border-blue-100 rounded-xl p-2"></div>
                <div className="h-14 bg-emerald-50/70 border border-emerald-100 rounded-xl p-2"></div>
                <div className="h-14 bg-purple-50/70 border border-purple-100 rounded-xl p-2"></div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-1">
                <div className="h-3 bg-gray-200 rounded-md w-full"></div>
                <div className="h-3 bg-gray-200 rounded-md w-5/6"></div>
              </div>
            </div>

            {/* Firmas oficiales en miniatura */}
            <div className="mt-6 pt-3 border-t border-gray-200 text-center grid grid-cols-2 gap-4 text-[10px] text-gray-500">
              <div>
                <div className="h-8 border-b border-gray-400 w-32 mx-auto mb-1"></div>
                <div className="font-bold text-gray-800">Sandra Nelly Martínez Cantú</div>
                <div>Turno matutino</div>
              </div>
              <div>
                <div className="h-8 border-b border-gray-400 w-32 mx-auto mb-1"></div>
                <div className="font-bold text-gray-800">Arturo Rodríguez Segovia</div>
                <div>Turno vespertino</div>
              </div>
            </div>

            {/* Pie de página dinámico */}
            <div className="mt-4 pt-2 border-t border-dotted border-gray-200 text-[9px] text-gray-400 text-center uppercase tracking-wider">
              {plantilla.pieDePagina || `${CONFIG.INSTITUCION} • Normas ISO/IEC 27701 e ISO/IEC 27001`}
            </div>

          </div>

          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Garantía de Adaptabilidad:</span>
            </div>
            <div>
              Si la institución modifica el ciclo escolar, la denominación de la subdirección o los sellos oficiales, puedes actualizarlos aquí sin necesidad de programar.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
