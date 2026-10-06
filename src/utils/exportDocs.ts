import { CONFIG, MSBDatabase, limpiarTituloLicenciado } from './storage';
import { 
  Identidad, 
  EvaluacionCapacidadesFisicas, 
  AutoridadesConfig, 
  Actividad, 
  InscripcionAsistencia,
  PlantillaDocumentoConfig
} from '../types';

/**
 * Logotipos oficiales vectoriales institucionales reproducidos con precisión:
 * 1. Gobierno del Estado de Nuevo León - Secretaría de Educación
 * 2. UNESCO - Red de Escuelas Asociadas
 * 3. Escudo Oficial Histórico de la Escuela Normal Centenaria y Benemérita 1870 - 1970
 */
export const SVG_LOGO_NL_EDUCACION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 52" width="130" height="42" style="display:inline-block;vertical-align:middle;"><g transform="translate(2, 3)"><path d="M 14 0 L 28 7 L 28 24 C 28 35 14 42 14 42 C 14 42 0 35 0 24 L 0 7 Z" fill="#f97316"/><path d="M 14 3 L 25 9 L 25 23 C 25 32 14 38 14 38 C 14 38 3 32 3 23 L 3 9 Z" fill="#ea580c"/><path d="M 10 13 L 10 24 L 13.5 24 L 13.5 17.5 L 17 24 L 19.5 24 L 19.5 13 L 16 13 L 16 19.5 L 12.5 13 Z" fill="#ffffff"/><circle cx="22" cy="8" r="3.5" fill="#059669"/><path d="M 20.5 8 L 23.5 8 M 22 6.5 L 22 9.5" stroke="#ffffff" stroke-width="1"/></g><text x="38" y="21" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#ea580c" letter-spacing="0.5">EDUCACIÓN</text><text x="38" y="30" font-family="'Inter', sans-serif" font-size="5.5" font-weight="700" fill="#475569" letter-spacing="0.3">GABINETE DE IGUALDAD</text><text x="38" y="37" font-family="'Inter', sans-serif" font-size="5.5" font-weight="700" fill="#475569" letter-spacing="0.3">PARA TODAS LAS PERSONAS</text></svg>`;

export const SVG_LOGO_UNESCO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 50" width="115" height="40" style="display:inline-block;vertical-align:middle;"><g transform="translate(2, 5)"><rect x="0" y="0" width="30" height="30" rx="3" fill="#0077d4"/><polygon points="4,8 15,3 26,8" fill="#ffffff"/><rect x="4" y="9" width="22" height="2" fill="#ffffff"/><rect x="5" y="12" width="2.5" height="10" fill="#ffffff"/><rect x="10.5" y="12" width="2.5" height="10" fill="#ffffff"/><rect x="16.5" y="12" width="2.5" height="10" fill="#ffffff"/><rect x="22" y="12" width="2.5" height="10" fill="#ffffff"/><rect x="3.5" y="23" width="23" height="2.5" fill="#ffffff"/></g><text x="38" y="17" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a" letter-spacing="0.4">unesco</text><text x="38" y="25" font-family="'Inter', sans-serif" font-size="5.5" font-weight="600" fill="#475569">Miembro de la Red</text><text x="38" y="32" font-family="'Inter', sans-serif" font-size="5.5" font-weight="600" fill="#475569">de Escuelas Asociadas</text></svg>`;

export const SVG_ESCUDO_NORMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 94 94" width="76" height="76" style="display:inline-block;vertical-align:middle;"><circle cx="47" cy="47" r="45" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5"/><circle cx="47" cy="47" r="40" fill="#f8fafc" stroke="#1e3a8a" stroke-width="1"/><circle cx="47" cy="47" r="30" fill="#ffffff" stroke="#d97706" stroke-width="1.2"/><text x="47" y="20" font-family="'Inter', sans-serif" font-size="5.5" font-weight="900" fill="#1e3a8a" text-anchor="middle" letter-spacing="0.5">ESCUELA CENTENARIA</text><text x="47" y="26" font-family="'Inter', sans-serif" font-size="5" font-weight="800" fill="#1e3a8a" text-anchor="middle" letter-spacing="0.5">Y BENEMÉRITA</text><polygon points="24,42 70,42 66,51 28,51" fill="#dc2626"/><text x="47" y="49" font-family="'Inter', sans-serif" font-size="6.8" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">NORMAL</text><text x="47" y="74" font-family="'Inter', sans-serif" font-size="6.5" font-weight="900" fill="#b91c1c" text-anchor="middle" letter-spacing="0.8">1870 • 1970</text><path d="M 47 28 C 44 32 50 35 47 38 C 46 35 49 32 47 28 Z" fill="#ea580c"/><polygon points="45,37 49,37 48,41 46,41" fill="#64748b"/></svg>`;

/**
 * Genera el encabezado institucional oficial base de la PLANTILLA DOCUMENTO:
 * Estructura de 3 columnas idéntica al formato institucional:
 * - Columna Izquierda: Logo Gobierno de Nuevo León Educación + UNESCO
 * - Columna Central:
 *   1. ESCUELA NORMAL “MIGUEL F. MARTÍNEZ”
 *   2. CENTENARIA Y BENEMÉRITA
 *   3. CICLO ESCOLAR 2026 - 2027
 *   4. SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES
 *   5. DEPARTAMENTO DE DEPORTE Y SALUD
 *   + Insignia de tipo de documento
 * - Columna Derecha: Escudo Circular Escuela Normal Centenaria y Benemérita
 */
export function generarEncabezadoInstitucionalHtml(
  tituloDocumento?: string, 
  fechaEmision?: string,
  plantillaPersonalizada?: Partial<PlantillaDocumentoConfig>
): string {
  const plantilla: PlantillaDocumentoConfig = { 
    ...MSBDatabase.getPlantillaDocumento(), 
    ...(plantillaPersonalizada || {}) 
  };
  const fechaHoy = fechaEmision || new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  // Logos renderizados respetando configuración y reemplazos del administrador
  const logoNLHtml = plantilla.mostrarLogoNLEducacion 
    ? (plantilla.logoNLEducacionPersonalizado 
        ? `<img src="${plantilla.logoNLEducacionPersonalizado}" alt="Educación" style="max-height: 44px; max-width: 130px; object-fit: contain;" />` 
        : SVG_LOGO_NL_EDUCACION)
    : '';

  const logoUnescoHtml = plantilla.mostrarLogoUnesco 
    ? (plantilla.logoUnescoPersonalizado 
        ? `<img src="${plantilla.logoUnescoPersonalizado}" alt="UNESCO" style="max-height: 40px; max-width: 120px; object-fit: contain;" />` 
        : SVG_LOGO_UNESCO)
    : '';

  const escudoNormalHtml = plantilla.mostrarEscudoNormal 
    ? (plantilla.escudoNormalPersonalizado 
        ? `<img src="${plantilla.escudoNormalPersonalizado}" alt="Escudo Normal" style="max-height: 76px; max-width: 76px; object-fit: contain;" />` 
        : SVG_ESCUDO_NORMAL)
    : '';

  return `
    <div class="header-institucional-plantilla" style="margin-bottom: 20px;">
      <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; margin: 0 0 14px 0 !important; padding: 0 !important; background: transparent !important;">
        <tbody>
          <tr>
            <td style="width: 24%; text-align: left; vertical-align: top; border: none !important; padding: 0 6px 0 0;">
              <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
                ${logoNLHtml}
                ${logoUnescoHtml}
              </div>
            </td>
            <td style="width: 52%; text-align: center; vertical-align: top; border: none !important; padding: 0 6px;">
              <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.25;">
                ${plantilla.institucionNombre}
              </div>
              <div style="font-size: 11.5px; font-weight: 800; color: #334155; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                ${plantilla.institucionLema}
              </div>
              <div style="font-size: 11px; font-weight: 800; color: #1e3a8a; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.8px;">
                ${plantilla.cicloEscolar}
              </div>
              <div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.6px;">
                ${plantilla.subdireccionNombre}
              </div>
              <div style="font-size: 11.5px; font-weight: 800; color: #1e3a8a; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                ${plantilla.departamentoNombre}
              </div>
              ${tituloDocumento ? `
                <div class="doc-badge" style="display: inline-block; font-size: 10.5px; font-weight: 800; color: #1e3a8a; background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 3px 12px; border-radius: 8px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.6px;">
                  ${tituloDocumento}
                </div>
              ` : ''}
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                Emisión: ${fechaHoy}
              </div>
            </td>
            <td style="width: 24%; text-align: right; vertical-align: top; border: none !important; padding: 0 0 0 6px;">
              <div style="display: flex; justify-content: flex-end; align-items: flex-start;">
                ${escudoNormalHtml}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="width: 100%; border-bottom: 2.5px solid #1e3a8a; margin-bottom: 16px;"></div>
    </div>
  `;
}

export const SVG_FIRMA_VECTOR_SANDRA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="220" height="60" style="display:inline-block;max-height:60px;max-width:220px;vertical-align:bottom;"><path d="M 22,48 C 28,32 40,14 52,18 C 60,22 48,50 68,40 C 82,34 94,18 102,32 C 108,42 116,26 128,30 C 140,34 144,18 158,24 C 170,30 178,42 198,28 M 32,52 C 78,54 138,48 218,42 M 62,16 L 62,38" fill="none" stroke="#1e3a8a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const SVG_FIRMA_VECTOR_ARTURO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="220" height="60" style="display:inline-block;max-height:60px;max-width:220px;vertical-align:bottom;"><path d="M 20,52 C 34,16 48,14 58,36 C 66,54 50,60 74,38 C 86,26 94,48 108,26 C 120,12 126,44 142,28 C 158,16 168,48 188,32 C 198,24 208,38 218,28 M 16,56 C 82,58 148,52 222,46" fill="none" stroke="#1e3a8a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Renderiza el elemento de firma evitando cajas vacías o símbolos rotos:
 * Soporta SVG nativo incrustado directamente, SVG en Base64 decodificado como vector en el DOM,
 * o PNG/JPEG Base64 limpio sin alt text ni bordes rotos en motores de impresión.
 */
function renderFirmaContenido(firmaSrc: string | undefined, defaultSvg: string): string {
  // 1. Si es imagen PNG/JPEG generada desde SignatureModal (Canvas toDataURL)
  if (firmaSrc && (firmaSrc.startsWith('data:image/png;base64,') || firmaSrc.startsWith('data:image/jpeg;base64,'))) {
    return `<div style="height: 60px; margin-bottom: -4px; display: flex; align-items: flex-end; justify-content: center; text-align: center;">
      <img src="${firmaSrc}" alt="" style="max-height: 56px; max-width: 210px; object-fit: contain; display: inline-block; vertical-align: bottom; border: 0 !important; outline: none !important;" />
    </div>`;
  }

  // 2. Si es SVG en Base64, decodificar a SVG inline puro para renderizado vectorial absoluto sin dependencia de <img>
  if (firmaSrc && firmaSrc.startsWith('data:image/svg+xml;base64,')) {
    try {
      const base64Part = firmaSrc.split(',')[1];
      const decodedSvg = typeof atob !== 'undefined' ? atob(base64Part) : '';
      if (decodedSvg.includes('<svg')) {
        return `<div style="height: 60px; margin-bottom: -4px; display: flex; align-items: flex-end; justify-content: center; text-align: center;">
          ${decodedSvg}
        </div>`;
      }
    } catch {
      // fallback to defaultSvg
    }
  }

  // 3. Si viene como fragmento SVG directo
  if (firmaSrc && (firmaSrc.startsWith('<svg') || firmaSrc.includes('<svg'))) {
    return `<div style="height: 60px; margin-bottom: -4px; display: flex; align-items: flex-end; justify-content: center; text-align: center;">
      ${firmaSrc}
    </div>`;
  }

  // 4. Vector institucional predeterminado (Sandra o Arturo) incrustado en el DOM (nunca falla ni genera cajas vacías)
  return `<div style="height: 60px; margin-bottom: -4px; display: flex; align-items: flex-end; justify-content: center; text-align: center;">
    ${defaultSvg}
  </div>`;
}

/**
 * Genera el bloque HTML estándar de firmas institucionales con los Jefes del Departamento
 * de Deporte y Salud (Turno matutino y Turno vespertino) con tabla rígida 50/50 y
 * regla anti-ruptura de página (evita páginas huérfanas o recuadros colapsados)
 */
export function generarBloqueFirmasOficiales(autoridades?: Partial<AutoridadesConfig>): string {
  const titulo = autoridades?.tituloJefatura || 'Jefes del Departamento de Deporte y Salud';
  const nombreMat = autoridades?.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú';
  const cargoMat = autoridades?.jefeMatutinoCargo || 'Turno matutino';
  const firmaMat = autoridades?.jefeMatutinoFirma;
  const nombreVesp = autoridades?.jefeVespertinoNombre || 'Arturo Rodríguez Segovia';
  const cargoVesp = autoridades?.jefeVespertinoCargo || 'Turno vespertino';
  const firmaVesp = autoridades?.jefeVespertinoFirma;

  return `
    <div class="bloque-firmas-oficiales" style="margin-top: 36px; padding-top: 18px; border-top: 1.5px solid #cbd5e1; text-align: center; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px;">
        ${titulo}
      </div>
      <table class="firmas-table" style="width: 100%; border: none !important; border-collapse: collapse !important; margin: 0 !important; padding: 0 !important; background: transparent !important;">
        <tbody>
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: bottom; border: none !important; padding: 0 16px;">
              <div style="min-height: 60px; display: block; margin: 0 auto 4px auto; text-align: center;">
                ${renderFirmaContenido(firmaMat, SVG_FIRMA_VECTOR_SANDRA)}
              </div>
              <div class="linea-firma" style="width: 210px; border-bottom: 1.5px solid #334155; margin: 0 auto 6px auto;"></div>
              <div class="font-bold" style="font-size: 12px; color: #0f172a; font-weight: 700;">${nombreMat}</div>
              <div style="color: #475569; font-size: 11px; font-weight: 500;">${cargoMat}</div>
              <div style="color: #1e3a8a; font-size: 10px; font-weight: 600; margin-top: 2px;">DEPARTAMENTO DE DEPORTE Y SALUD</div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: bottom; border: none !important; padding: 0 16px;">
              <div style="min-height: 60px; display: block; margin: 0 auto 4px auto; text-align: center;">
                ${renderFirmaContenido(firmaVesp, SVG_FIRMA_VECTOR_ARTURO)}
              </div>
              <div class="linea-firma" style="width: 210px; border-bottom: 1.5px solid #334155; margin: 0 auto 6px auto;"></div>
              <div class="font-bold" style="font-size: 12px; color: #0f172a; font-weight: 700;">${nombreVesp}</div>
              <div style="color: #475569; font-size: 11px; font-weight: 500;">${cargoVesp}</div>
              <div style="color: #1e3a8a; font-size: 10px; font-weight: 600; margin-top: 2px;">DEPARTAMENTO DE DEPORTE Y SALUD</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="font-size: 9px; color: #94a3b8; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px dotted #cbd5e1; padding-top: 6px;">
        ${MSBDatabase.getPlantillaDocumento().pieDePagina || `Documento oficial emitido bajo el Sistema de Gestión de Privacidad y Seguridad (Normas ISO/IEC 27701 e ISO/IEC 27001) • ${CONFIG.INSTITUCION}`}
      </div>
    </div>
  `;
}

/**
 * Dispara la descarga directa en el navegador de un archivo HTML autónomo estilizado listo para abrir e imprimir
 */
export function descargarDocumentoHtml(nombreArchivo: string, titulo: string, contenidoBodyHtml: string): void {
  const htmlCompleto = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} - ${CONFIG.INSTITUCION}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 44px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #1e3a8a; color: #ffffff; }
    .btn-primary:hover { background: #172554; }

    /* Tablas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    tr:last-child td { border-bottom: none; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    
    /* Tarjetas y KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 20px 0;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .kpi-title {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .kpi-desc {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }

    svg { display: inline-block; vertical-align: middle; }
    img { display: inline-block; vertical-align: bottom; border: 0 !important; outline: none !important; }
    .bloque-firmas-oficiales, .firmas-table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    @media print {
      body { background: #ffffff !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
      .print-actions { display: none !important; }
      .bloque-firmas-oficiales, .firmas-table { page-break-inside: avoid !important; break-inside: avoid !important; }
      @page { size: letter; margin: 1.2cm; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-actions">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>
    ${contenidoBodyHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlCompleto], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo.endsWith('.html') ? nombreArchivo : `${nombreArchivo}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imprime un fragmento HTML abriendo el diálogo de impresión oficial con soporte vectorial garantizado
 * Se inyecta en el DOM principal con aislamiento @media print, garantizando que funcione en cualquier
 * navegador, Mac, Chrome, Safari o iframe sin depender de sub-marcos invisibles bloqueados.
 */
export function imprimirHtmlDirecto(titulo: string, contenidoBodyHtml: string): void {
  // Limpiar contenedores previos si existiesen
  const prevContainer = document.getElementById('msb-print-container');
  if (prevContainer && document.body.contains(prevContainer)) {
    document.body.removeChild(prevContainer);
  }
  const prevModal = document.getElementById('msb-print-dialog-overlay');
  if (prevModal && document.body.contains(prevModal)) {
    document.body.removeChild(prevModal);
  }

  // 1. Crear el contenedor oficial para el motor de impresión (@media print)
  const printContainer = document.createElement('div');
  printContainer.id = 'msb-print-container';
  printContainer.className = 'msb-print-document-root';
  printContainer.innerHTML = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff !important; color: #0f172a !important; line-height: 1.5; padding: 20px; max-width: 920px; margin: 0 auto;">
      <style>
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th, td { padding: 9px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc !important; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 11px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: monospace; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin: 18px 0; }
        .kpi-card { background: #f8fafc !important; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .kpi-title { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 3px; }
        .kpi-desc { font-size: 10px; color: #475569; margin-top: 2px; }
        svg { display: inline-block; vertical-align: middle; }
        img { display: inline-block; vertical-align: bottom; border: 0 !important; outline: none !important; }
        .bloque-firmas-oficiales, .firmas-table { page-break-inside: avoid !important; break-inside: avoid !important; }
      </style>
      ${contenidoBodyHtml}
    </div>
  `;
  document.body.appendChild(printContainer);

  // 2. Activar modo de impresión en el body
  document.body.classList.add('msb-printing-active');

  // 3. Crear overlay visual amigable con botones de reintento / descarga por si el navegador bloquea diálogos nativos
  const overlay = document.createElement('div');
  overlay.id = 'msb-print-dialog-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    background: #0a192f;
    color: #ffffff;
    border: 1.5px solid #3b82f6;
    border-radius: 16px;
    padding: 14px 18px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    max-width: 90vw;
  `;
  overlay.className = 'print:hidden animate-in fade-in';
  overlay.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px;">🖨️</span>
      <div>
        <div style="font-weight: 700; color: #ffffff; font-size: 13px;">Preparando Impresión</div>
        <div style="font-size: 11px; color: #94a3b8; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${titulo}</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
      <button id="msb-btn-reintentar-print" style="padding: 6px 12px; background: #2563eb; color: #ffffff; font-weight: 600; font-size: 11px; border-radius: 8px; border: none; cursor: pointer;">
        Lanzar Impresora
      </button>
      <button id="msb-btn-descargar-print" style="padding: 6px 12px; background: #059669; color: #ffffff; font-weight: 600; font-size: 11px; border-radius: 8px; border: none; cursor: pointer;">
        Descargar HTML/PDF
      </button>
      <button id="msb-btn-cerrar-print" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 2px 6px;">
        ✕
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  const cleanup = () => {
    document.body.classList.remove('msb-printing-active');
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Botones de acción del banner
  document.getElementById('msb-btn-cerrar-print')?.addEventListener('click', cleanup);
  document.getElementById('msb-btn-reintentar-print')?.addEventListener('click', () => {
    try {
      window.print();
    } catch {
      descargarDocumentoHtml(titulo.toLowerCase().replace(/\s+/g, '_'), titulo, contenidoBodyHtml);
    }
  });
  document.getElementById('msb-btn-descargar-print')?.addEventListener('click', () => {
    descargarDocumentoHtml(titulo.toLowerCase().replace(/\s+/g, '_'), titulo, contenidoBodyHtml);
    cleanup();
  });

  // 4. Disparar el diálogo nativo de impresión tras breve retardo para asegurar que los estilos y fuentes se hidraten
  setTimeout(() => {
    try {
      window.print();
    } catch {
      // Si el navegador bloquea window.print(), ofrecer descarga automática
      descargarDocumentoHtml(titulo.toLowerCase().replace(/\s+/g, '_'), titulo, contenidoBodyHtml);
    }
  }, 350);

  // Auto-cierre del banner tras 15 segundos si no se interactúa
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      cleanup();
    }
  }, 15000);
}

/**
 * Plantilla HTML para Informe Ejecutivo Completo de Capacidades Físicas (Administrador)
 * Presenta los incrementos como porcentajes y los niveles de validación del 1 al 4:
 * 1 - Insuficiente, 2 - Básico, 3 - Satisfactorio, 4 - Destacado
 */
export function generarHtmlInformeEjecutivoAdmin(
  promedios: ReturnType<typeof import('./storage').MSBDatabase.calcularPromediosInstitucionalesFisicos>,
  evaluaciones: EvaluacionCapacidadesFisicas[],
  identidades: Identidad[],
  autoridades: AutoridadesConfig
): string {
  const encabezado = generarEncabezadoInstitucionalHtml('INFORME EJECUTIVO DE RESULTADOS Y PROMEDIOS DE CAPACIDADES FÍSICAS');

  const totalEvaluados = evaluaciones.filter(e => e.inicial && e.final).length;

  const filasParticipantes = identidades
    .filter(i => i.sector === 'Estudiante' || i.rol === 'estudiante' || i.sector === 'Docente' || i.rol === 'trabajador')
    .map((par, idx) => {
      const ev = evaluaciones.find(e => e.idParticipante === par.id);
      const tieneAmbas = !!(ev?.inicial && ev?.final);

      const puntos = ev?.puntosAsignados || 0;
      let nivelTexto = 'Nivel 1: Insuficiente';
      let badgeStyle = 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;';
      
      if (puntos === 4) {
        nivelTexto = 'Nivel 4: Destacado';
        badgeStyle = 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';
      } else if (puntos === 3) {
        nivelTexto = 'Nivel 3: Satisfactorio';
        badgeStyle = 'background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;';
      } else if (puntos === 2) {
        nivelTexto = 'Nivel 2: Básico';
        badgeStyle = 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;';
      }

      return `
        <tr>
          <td class="font-mono text-center">${idx + 1}</td>
          <td>
            <strong>${par.nombre} ${par.apellidos}</strong>
            <div style="font-size: 10px; color: #64748b;">${par.licenciatura || 'Educación Normalista'} • ${par.semestre || '5° Semestre'} (${par.grupo || 'A'}) • Matrícula: ${par.id}</div>
          </td>
          <td class="text-center font-bold" style="color: #15803d;">
            ${tieneAmbas ? `+${ev?.incrementoCourseNavette || 0}%` : (ev?.inicial ? '<span style="color:#d97706; font-size:11px;">Diagnóstico</span>' : '<span style="color:#94a3b8; font-size:11px;">Pendiente</span>')}
          </td>
          <td class="text-center font-bold" style="color: #2563eb;">
            ${tieneAmbas ? `+${ev?.incrementoFuerzaCombinada || 0}%` : (ev?.inicial ? '<span style="color:#d97706; font-size:11px;">Diagnóstico</span>' : '<span style="color:#94a3b8; font-size:11px;">Pendiente</span>')}
          </td>
          <td class="text-center font-bold" style="color: #7c3aed;">
            ${tieneAmbas ? `+${ev?.incrementoFlexibilidadPorcentaje || 0}%` : (ev?.inicial ? '<span style="color:#d97706; font-size:11px;">Diagnóstico</span>' : '<span style="color:#94a3b8; font-size:11px;">Pendiente</span>')}
          </td>
          <td class="text-center font-bold" style="color: #059669;">
            ${tieneAmbas ? `+${ev?.cambioImcPorcentaje || 0}%` : (ev?.inicial ? '<span style="color:#d97706; font-size:11px;">Diagnóstico</span>' : '<span style="color:#94a3b8; font-size:11px;">Pendiente</span>')}
          </td>
          <td class="text-center">
            ${tieneAmbas ? `
              <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; ${badgeStyle}">
                ${nivelTexto}
              </span>
            ` : '<span style="color: #d97706; font-size: 11px; font-weight: 600;">En Proceso</span>'}
          </td>
          <td class="text-center font-bold" style="font-size: 11px;">
            ${tieneAmbas && puntos >= 2 ? '<span style="color: #15803d;">✓ Acreditado</span>' : '<span style="color: #b91c1c;">En Seguimiento</span>'}
          </td>
        </tr>
      `;
    }).join('');

  return `
    ${encabezado}

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">1. Resumen Ejecutivo de Incremento de Capacidades Físicas</h3>
      <p style="font-size: 12px; color: #475569;">Consolidado institucional del avance promedio en capacidades físicas, comparando las mediciones basales diagnósticas contra las mediciones de cierre del semestre.</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
        <div class="kpi-title">Puntaje Promedio General</div>
        <div class="kpi-val" style="color: #1e3a8a;">${promedios.promedioPuntos} <span style="font-size: 13px; color: #64748b;">/ 4.0</span></div>
        <div class="kpi-desc">Nivel 3: Satisfactorio Institucional</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid #16a34a;">
        <div class="kpi-title">% Incremento Resistencia Navette</div>
        <div class="kpi-val" style="color: #16a34a;">+${promedios.promedioCourseNavette}%</div>
        <div class="kpi-desc">Test Course Navette (20m Shuttle Run)</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid #2563eb;">
        <div class="kpi-title">% Incremento Fuerza en 60s</div>
        <div class="kpi-val" style="color: #2563eb;">+${promedios.promedioFuerzaCombinada}%</div>
        <div class="kpi-desc">Cronometraje 60s (Lagartijas + Sentadillas)</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
        <div class="kpi-title">% Incremento Flexibilidad</div>
        <div class="kpi-val" style="color: #7c3aed;">+${promedios.promedioFlexibilidadPorcentaje}%</div>
        <div class="kpi-desc">Test Sit & Reach (+${promedios.promedioFlexibilidadCm} cm)</div>
      </div>
    </div>

    <!-- Escala y Distribución de Niveles Oficiales de Validación -->
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; margin: 18px 0; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
        <strong style="color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          Escala Oficial de Validación de Capacidades Físicas (Niveles 1 a 4)
        </strong>
        <span style="font-size: 11px; color: #475569;">
          Población Evaluada: <strong>${totalEvaluados} participantes</strong>
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div style="padding: 10px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 10px; border-left: 4px solid #16a34a;">
          <div style="font-size: 11px; font-weight: 800; color: #166534;">NIVEL 4: DESTACADO (4 Pts)</div>
          <div style="font-size: 18px; font-weight: 900; color: #14532d; margin-top: 2px;">
            ${promedios.distribucionNivel.destacado} <span style="font-size: 11px; font-weight: 600; color: #475569;">(${totalEvaluados > 0 ? Math.round((promedios.distribucionNivel.destacado / totalEvaluados) * 100) : 0}%)</span>
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Incremento superior al 40% en capacidades</div>
        </div>

        <div style="padding: 10px; background: #ffffff; border: 1px solid #bfdbfe; border-radius: 10px; border-left: 4px solid #2563eb;">
          <div style="font-size: 11px; font-weight: 800; color: #1e40af;">NIVEL 3: SATISFACTORIO (3 Pts)</div>
          <div style="font-size: 18px; font-weight: 900; color: #1e3a8a; margin-top: 2px;">
            ${promedios.distribucionNivel.satisfactorio} <span style="font-size: 11px; font-weight: 600; color: #475569;">(${totalEvaluados > 0 ? Math.round((promedios.distribucionNivel.satisfactorio / totalEvaluados) * 100) : 0}%)</span>
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Incremento entre 25% y 39% en capacidades</div>
        </div>

        <div style="padding: 10px; background: #ffffff; border: 1px solid #fde68a; border-radius: 10px; border-left: 4px solid #d97706;">
          <div style="font-size: 11px; font-weight: 800; color: #92400e;">NIVEL 2: BÁSICO (2 Pts)</div>
          <div style="font-size: 18px; font-weight: 900; color: #78350f; margin-top: 2px;">
            ${promedios.distribucionNivel.basico} <span style="font-size: 11px; font-weight: 600; color: #475569;">(${totalEvaluados > 0 ? Math.round((promedios.distribucionNivel.basico / totalEvaluados) * 100) : 0}%)</span>
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Incremento entre 10% y 24% en capacidades</div>
        </div>

        <div style="padding: 10px; background: #ffffff; border: 1px solid #fecaca; border-radius: 10px; border-left: 4px solid #dc2626;">
          <div style="font-size: 11px; font-weight: 800; color: #991b1b;">NIVEL 1: INSUFICIENTE (1 Pt)</div>
          <div style="font-size: 18px; font-weight: 900; color: #7f1d1d; margin-top: 2px;">
            ${promedios.distribucionNivel.insuficiente} <span style="font-size: 11px; font-weight: 600; color: #475569;">(${totalEvaluados > 0 ? Math.round((promedios.distribucionNivel.insuficiente / totalEvaluados) * 100) : 0}%)</span>
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Incremento inferior al 10% o sin mejora</div>
        </div>
      </div>
    </div>

    <div style="margin-top: 24px;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">2. Padrón Nominal y Dictamen Individual de Validación</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">#</th>
            <th>Participante y Matrícula</th>
            <th class="text-center">% Incr. Resistencia (Navette)</th>
            <th class="text-center">% Incr. Fuerza (60s)</th>
            <th class="text-center">% Incr. Flexibilidad</th>
            <th class="text-center">% Cambio IMC</th>
            <th class="text-center">Nivel de Validación (1 a 4)</th>
            <th class="text-center">Dictamen Oficial</th>
          </tr>
        </thead>
        <tbody>
          ${filasParticipantes}
        </tbody>
      </table>
    </div>

    ${generarBloqueFirmasOficiales(autoridades)}
  `;
}

/**
 * Plantilla HTML para Cédula Oficial Institucional de Evaluación Física (Entregable del participante)
 */
export function generarHtmlCedulaEvaluacionFisica(
  estudiante: Identidad,
  evaluacion: EvaluacionCapacidadesFisicas,
  autoridades: AutoridadesConfig
): string {
  const encabezado = generarEncabezadoInstitucionalHtml('CÉDULA INSTITUCIONAL DE VALORACIÓN DE CAPACIDADES FÍSICAS');

  const nivelLabel = evaluacion.puntosAsignados === 4 ? '4 Destacado' 
    : evaluacion.puntosAsignados === 3 ? '3 Satisfactorio' 
    : evaluacion.puntosAsignados === 2 ? '2 Básico' 
    : '1 Insuficiente';

  return `
    ${encabezado}

    <div style="text-align: center; margin: 16px 0 20px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Participante Evaluado(a):</div>
      <div style="font-size: 22px; font-weight: 800; color: #1e3a8a; text-decoration: underline; text-underline-offset: 4px; margin-top: 4px;">
        ${estudiante.nombre} ${estudiante.apellidos}
      </div>
      <div style="font-size: 12px; font-weight: 600; color: #334155; margin-top: 4px;">
        ${estudiante.licenciatura || 'Licenciatura en Educación Primaria'} • ${estudiante.semestre || '5° Semestre'} • ${estudiante.grupo || 'Grupo A'} • Matrícula: ${estudiante.id}
      </div>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase;">Dictamen Oficial Obtenido</div>
        <div style="font-size: 18px; font-weight: 900; color: #14532d;">Nivel ${nivelLabel} (${evaluacion.puntosAsignados} / 4 Puntos)</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #475569;">
        <div>Período: <strong>${evaluacion.periodo}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Aspecto Evaluado</th>
          <th>Instrumento / Herramienta de Evaluación</th>
          <th class="text-center">Inicial</th>
          <th class="text-center">Final</th>
          <th class="text-center">% Mejora</th>
          <th class="text-center">Nivel Obtenido</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Resistencia Cardiorrespiratoria</strong></td>
          <td style="color: #475569; font-size: 11px;">Test Course Navette (20m Shuttle Run - Paliers oficiales)</td>
          <td class="text-center font-mono">${evaluacion.inicial?.courseNavetteNivel || 0} palier</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${evaluacion.final?.courseNavetteNivel || 0} palier</td>
          <td class="text-center font-bold" style="color: #15803d;">+${evaluacion.incrementoCourseNavette || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoCourseNavette || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoCourseNavette || 0) >= 25 ? '3 Satisfactorio' : (evaluacion.incrementoCourseNavette || 0) >= 10 ? '2 Básico' : '1 Insuficiente'}</td>
        </tr>
        <tr>
          <td><strong>Fuerza Muscular: Lagartijas</strong></td>
          <td style="color: #475569; font-size: 11px;">Prueba continua de 60 segundos con cronómetro oficial</td>
          <td class="text-center font-mono">${evaluacion.inicial?.fuerzaLagartijas60s || 0} rep</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${evaluacion.final?.fuerzaLagartijas60s || 0} rep</td>
          <td class="text-center font-bold" style="color: #2563eb;">+${evaluacion.incrementoFuerzaLagartijas || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFuerzaLagartijas || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFuerzaLagartijas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Fuerza Muscular: Sentadillas</strong></td>
          <td style="color: #475569; font-size: 11px;">Prueba continua de 60 segundos con cronómetro oficial</td>
          <td class="text-center font-mono">${evaluacion.inicial?.fuerzaSentadillas60s || 0} rep</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${evaluacion.final?.fuerzaSentadillas60s || 0} rep</td>
          <td class="text-center font-bold" style="color: #2563eb;">+${evaluacion.incrementoFuerzaSentadillas || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFuerzaSentadillas || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFuerzaSentadillas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr style="background: #eff6ff;">
          <td><strong style="color: #1e3a8a;">&rarr; Fuerza Combinada en 60s</strong></td>
          <td style="color: #1e3a8a; font-size: 11px;">Ponderación unificada de tren superior e inferior</td>
          <td class="text-center font-mono">${(evaluacion.inicial?.fuerzaLagartijas60s || 0) + (evaluacion.inicial?.fuerzaSentadillas60s || 0)} rep</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${(evaluacion.final?.fuerzaLagartijas60s || 0) + (evaluacion.final?.fuerzaSentadillas60s || 0)} rep</td>
          <td class="text-center font-bold" style="color: #1e3a8a;">+${evaluacion.incrementoFuerzaCombinada || 0}%</td>
          <td class="text-center font-bold" style="color: #1e3a8a;">${(evaluacion.incrementoFuerzaCombinada || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFuerzaCombinada || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Flexibilidad Isquiosural y Tronco</strong></td>
          <td style="color: #475569; font-size: 11px;">Test Sit and Reach (Cajón graduado y cinta milimétrica en cm)</td>
          <td class="text-center font-mono">${evaluacion.inicial?.sitAndReachCm || 0} cm</td>
          <td class="text-center font-mono font-bold" style="color: #7c3aed;">${evaluacion.final?.sitAndReachCm || 0} cm</td>
          <td class="text-center font-bold" style="color: #7c3aed;">+${evaluacion.incrementoFlexibilidadCm || 0} cm (+${evaluacion.incrementoFlexibilidadPorcentaje || 0}%)</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFlexibilidadPorcentaje || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFlexibilidadPorcentaje || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Composición Corporal (IMC)</strong></td>
          <td style="color: #475569; font-size: 11px;">Báscula de bioimpedancia y estadiómetro portátil - [Peso / Estatura²]</td>
          <td class="text-center font-mono">${evaluacion.inicial?.imc || 0} kg/m²</td>
          <td class="text-center font-mono font-bold" style="color: #059669;">${evaluacion.final?.imc || 0} kg/m²</td>
          <td class="text-center font-bold" style="color: #059669;">+${evaluacion.cambioImcPorcentaje || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.cambioImcPorcentaje || 0) >= 20 ? '4 Destacado' : '3 Satisfactorio'}</td>
        </tr>
      </tbody>
    </table>

    ${generarBloqueFirmasOficiales(autoridades)}
  `;
}

/**
 * Plantilla HTML para Informe Individual de Capacidades Físicas (Estudiante, Docente, Trabajador)
 */
export function generarHtmlInformeIndividual(
  usuario: Identidad | { id: string; nombre: string; apellidos: string; licenciatura?: string; semestre?: string; grupo?: string; sector?: string },
  evaluacion: EvaluacionCapacidadesFisicas,
  autoridades: AutoridadesConfig
): string {
  const encabezado = generarEncabezadoInstitucionalHtml('INFORME INDIVIDUAL DE CONDICIÓN Y CAPACIDADES FÍSICAS');

  const nivelLabel = evaluacion.puntosAsignados === 4 ? '4 Destacado' 
    : evaluacion.puntosAsignados === 3 ? '3 Satisfactorio' 
    : evaluacion.puntosAsignados === 2 ? '2 Básico' 
    : '1 Insuficiente';

  return `
    ${encabezado}

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; margin: 14px 0;">
      <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Participante Evaluado(a):</div>
      <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">
        ${usuario.nombre} ${usuario.apellidos}
      </div>
      <div style="font-size: 12px; color: #334155; margin-top: 4px;">
        Matrícula / ID: <strong>${usuario.id}</strong> • Sector: <strong>${usuario.sector || 'Comunidad Normalista'}</strong>
      </div>
      <div style="font-size: 12px; color: #475569;">
        Filiación: <strong>${usuario.licenciatura || 'Licenciatura en Educación'}</strong> • <strong>${usuario.semestre || 'Semestre en curso'}</strong> (${usuario.grupo || 'Grupo A'})
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
        <div class="kpi-title">Dictamen Obtenido</div>
        <div class="kpi-val" style="color: #1e3a8a;">${nivelLabel}</div>
        <div class="kpi-desc">${evaluacion.puntosAsignados || 0} / 4 Puntos Oficiales</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #dc2626;">
        <div class="kpi-title">Resistencia Navette</div>
        <div class="kpi-val" style="color: #dc2626;">+${evaluacion.incrementoCourseNavette || 0}%</div>
        <div class="kpi-desc">Test Course Navette (20m)</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #2563eb;">
        <div class="kpi-title">Fuerza en 60s</div>
        <div class="kpi-val" style="color: #2563eb;">+${evaluacion.incrementoFuerzaCombinada || 0}%</div>
        <div class="kpi-desc">Cronometraje 60s (Lag + Sent)</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
        <div class="kpi-title">Flexibilidad Sit & Reach</div>
        <div class="kpi-val" style="color: #7c3aed;">+${evaluacion.incrementoFlexibilidadCm || 0} cm</div>
        <div class="kpi-desc">Mejora: +${evaluacion.incrementoFlexibilidadPorcentaje || 0}%</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Aspecto Evaluado</th>
          <th>Instrumento / Herramienta</th>
          <th class="text-center">Diagnóstico Inicial</th>
          <th class="text-center">Evaluación Final</th>
          <th class="text-center">% Mejora</th>
          <th class="text-center">Nivel Obtenido</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Resistencia Cardiorrespiratoria</strong></td>
          <td style="color: #475569; font-size: 11px;">Test Course Navette (20m Shuttle Run)</td>
          <td class="text-center font-mono">${evaluacion.inicial?.courseNavetteNivel || 0} palier</td>
          <td class="text-center font-mono font-bold">${evaluacion.final?.courseNavetteNivel || 0} palier</td>
          <td class="text-center font-bold" style="color: #15803d;">+${evaluacion.incrementoCourseNavette || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoCourseNavette || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoCourseNavette || 0) >= 25 ? '3 Satisfactorio' : (evaluacion.incrementoCourseNavette || 0) >= 10 ? '2 Básico' : '1 Insuficiente'}</td>
        </tr>
        <tr>
          <td><strong>Fuerza Muscular: Lagartijas</strong></td>
          <td style="color: #475569; font-size: 11px;">Repeticiones en 60s continuos</td>
          <td class="text-center font-mono">${evaluacion.inicial?.fuerzaLagartijas60s || 0} rep</td>
          <td class="text-center font-mono font-bold">${evaluacion.final?.fuerzaLagartijas60s || 0} rep</td>
          <td class="text-center font-bold" style="color: #2563eb;">+${evaluacion.incrementoFuerzaLagartijas || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFuerzaLagartijas || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFuerzaLagartijas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Fuerza Muscular: Sentadillas</strong></td>
          <td style="color: #475569; font-size: 11px;">Repeticiones en 60s continuos</td>
          <td class="text-center font-mono">${evaluacion.inicial?.fuerzaSentadillas60s || 0} rep</td>
          <td class="text-center font-mono font-bold">${evaluacion.final?.fuerzaSentadillas60s || 0} rep</td>
          <td class="text-center font-bold" style="color: #2563eb;">+${evaluacion.incrementoFuerzaSentadillas || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFuerzaSentadillas || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFuerzaSentadillas || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Flexibilidad Isquiosural</strong></td>
          <td style="color: #475569; font-size: 11px;">Test Sit and Reach (Cajón graduado en cm)</td>
          <td class="text-center font-mono">${evaluacion.inicial?.sitAndReachCm || 0} cm</td>
          <td class="text-center font-mono font-bold">${evaluacion.final?.sitAndReachCm || 0} cm</td>
          <td class="text-center font-bold" style="color: #7c3aed;">+${evaluacion.incrementoFlexibilidadCm || 0} cm (+${evaluacion.incrementoFlexibilidadPorcentaje || 0}%)</td>
          <td class="text-center font-bold">${(evaluacion.incrementoFlexibilidadPorcentaje || 0) >= 40 ? '4 Destacado' : (evaluacion.incrementoFlexibilidadPorcentaje || 0) >= 25 ? '3 Satisfactorio' : '2 Básico'}</td>
        </tr>
        <tr>
          <td><strong>Composición Corporal (IMC)</strong></td>
          <td style="color: #475569; font-size: 11px;">Báscula y Estadiómetro - [Peso (kg) / Estatura (m)²]</td>
          <td class="text-center font-mono">${evaluacion.inicial?.imc || 0} kg/m²</td>
          <td class="text-center font-mono font-bold">${evaluacion.final?.imc || 0} kg/m²</td>
          <td class="text-center font-bold" style="color: #059669;">+${evaluacion.cambioImcPorcentaje || 0}%</td>
          <td class="text-center font-bold">${(evaluacion.cambioImcPorcentaje || 0) >= 20 ? '4 Destacado' : '3 Satisfactorio'}</td>
        </tr>
      </tbody>
    </table>

    ${generarBloqueFirmasOficiales(autoridades)}
  `;
}

/**
 * Plantilla HTML para Constancia Oficial Normalista de Acreditación de Asistencia
 */
export function generarHtmlConstancia(
  item: { actividad: Actividad; participante: Identidad; inscripcion: InscripcionAsistencia; stats: { totalSesiones: number; asistidas: number; porcentaje: number } },
  autoridades: AutoridadesConfig
): string {
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const nombreEncargado = limpiarTituloLicenciado(item.actividad.Responsable_Nombre);

  return `
    <div style="border: 4px double #1e3a8a; padding: 28px 32px; border-radius: 16px; background: #ffffff;">
      
      ${generarEncabezadoInstitucionalHtml('CONSTANCIA DE PARTICIPACIÓN Y ACREDITACIÓN DEPORTIVA', fechaHoy)}

      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 13px; color: #475569;">El Departamento de Deporte y Salud hace constar que:</div>
        <div style="font-size: 24px; font-weight: 900; color: #0f172a; text-decoration: underline; text-underline-offset: 6px; margin: 10px 0;">
          ${item.participante.nombre} ${item.participante.apellidos}
        </div>
        <div style="font-size: 13px; color: #334155; max-width: 680px; margin: 0 auto; line-height: 1.6;">
          Ha participado activamente y cumplido satisfactoriamente con el programa del club o taller:
        </div>
        <div style="font-size: 19px; font-weight: 800; color: #1e3a8a; margin: 8px 0;">
          "${item.actividad.Nombre}" (${item.actividad.ID_actividad})
        </div>
        ${nombreEncargado ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Encargado(a): <strong>${nombreEncargado}</strong></div>` : ''}
        <div style="font-size: 12px; color: #475569;">
          Registrando un porcentaje de asistencia acumulada del <strong>${item.stats.porcentaje}%</strong> (${item.stats.asistidas} de ${item.stats.totalSesiones} sesiones), cumpliendo con el umbral reglamentario mínimo del 85%.
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-size: 11px; display: flex; justify-content: space-between; margin-top: 18px;">
        <div>Folio de Registro: <strong>${item.inscripcion.ID_registro}</strong></div>
        <div>Matrícula: <strong>${item.participante.id}</strong></div>
        <div>Emisión: <strong>${fechaHoy}</strong></div>
      </div>

      ${generarBloqueFirmasOficiales(autoridades)}
    </div>
  `;
}

/**
 * Plantilla HTML para Informe de Rendimiento y Asistencias de Club / Taller
 */
export function generarHtmlInformeRendimiento(
  actividad: Actividad,
  inscritos: { participante: Identidad; inscripcion: InscripcionAsistencia; stats: { totalSesiones: number; asistidas: number; porcentaje: number; validada: boolean } }[],
  autoridades: AutoridadesConfig
): string {
  const encabezado = generarEncabezadoInstitucionalHtml(`INFORME OFICIAL DE RENDIMIENTO Y ACREDITACIÓN DE ASISTENCIAS • ${actividad.Nombre}`);
  const nombreEncargado = limpiarTituloLicenciado(actividad.Responsable_Nombre);

  const acreditados = inscritos.filter(i => i.stats.validada).length;
  const total = inscritos.length;
  const pctAcreditacion = total > 0 ? Math.round((acreditados / total) * 100) : 0;

  const filas = inscritos.map((item, idx) => `
    <tr>
      <td class="font-mono text-center">${idx + 1}</td>
      <td class="font-mono">${item.participante.id}</td>
      <td><strong>${item.participante.nombre} ${item.participante.apellidos}</strong></td>
      <td>${item.participante.sector}</td>
      <td class="text-center font-mono">${item.stats.asistidas} / ${item.stats.totalSesiones}</td>
      <td class="text-center font-bold ${item.stats.validada ? 'color: #15803d;' : 'color: #d97706;'}">${item.stats.porcentaje}%</td>
      <td class="text-center font-bold">${item.stats.validada ? '<span style="color: #15803d;">Acreditado (&ge;85%)</span>' : '<span style="color: #b91c1c;">En Riesgo (&lt;85%)</span>'}</td>
    </tr>
  `).join('');

  return `
    ${encabezado}

    <div class="kpi-grid">
      <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
        <div class="kpi-title">Total Inscritos</div>
        <div class="kpi-val" style="color: #1e3a8a;">${total}</div>
        <div class="kpi-desc">Matrícula del Club</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #16a34a;">
        <div class="kpi-title">Acreditados (&ge;85%)</div>
        <div class="kpi-val" style="color: #16a34a;">${acreditados} <span style="font-size: 13px;">(${pctAcreditacion}%)</span></div>
        <div class="kpi-desc">Cumplen norma institucional</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
        <div class="kpi-title">Encargado Responsable</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px;">${nombreEncargado || 'Sin Asignar'}</div>
        <div class="kpi-desc">${actividad.Dias_sesion?.join(', ') || 'Horario programado'}</div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Padrón Nominal y Registro de Cumplimiento</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">#</th>
            <th>ID</th>
            <th>Nombre Completo</th>
            <th>Sector</th>
            <th class="text-center">Sesiones Asistidas</th>
            <th class="text-center">% Asistencia</th>
            <th class="text-center">Dictamen 85%</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>

    ${generarBloqueFirmasOficiales(autoridades)}
  `;
}
