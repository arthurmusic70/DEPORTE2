/**
 * Utilidades para Impresión y Descarga de Documentos Oficiales
 * Compatible con iframe de AI Studio, Chrome, Edge, Firefox y móviles.
 */

import { CONFIG } from './storage';

export function generarPlantillaDocumentoHtml(titulo: string, contenidoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} - ${CONFIG.INSTITUCION}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      padding: 24px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .documento-contenedor {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    .encabezado-institucional {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .nombre-escuela {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 24px;
      font-weight: 900;
      color: #172554;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .lema-institucional {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.02em;
    }

    .departamento {
      font-size: 13px;
      font-weight: 700;
      color: #1d4ed8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }

    .titulo-documento {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 14px;
      background: #f1f5f9;
      display: inline-block;
      padding: 6px 18px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }

    .filiacion-destacada {
      text-align: center;
      margin: 24px 0;
      padding: 16px;
      background: #f8fafc;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
    }

    .nombre-participante {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      text-decoration: underline;
      text-decoration-color: #93c5fd;
      text-underline-offset: 4px;
    }

    .datos-academicos {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-top: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }

    th, td {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
    }

    .seccion-firmas {
      margin-top: 48px;
      display: flex;
      justify-content: space-around;
      text-align: center;
      font-size: 12px;
      page-break-inside: avoid;
    }

    .bloque-firma {
      width: 250px;
    }

    .linea-firma {
      border-bottom: 1px solid #64748b;
      margin-bottom: 6px;
      height: 40px;
    }

    .nombre-firmante {
      font-weight: 700;
      color: #0f172a;
    }

    .cargo-firmante {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
    }

    .barra-botones-pantalla {
      position: sticky;
      top: 12px;
      max-width: 900px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      z-index: 100;
    }

    .btn {
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-imprimir {
      background-color: #2563eb;
      color: #ffffff;
    }

    .btn-imprimir:hover {
      background-color: #1d4ed8;
    }

    .btn-descargar {
      background-color: #059669;
      color: #ffffff;
    }

    .btn-descargar:hover {
      background-color: #047857;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }

      .barra-botones-pantalla {
        display: none !important;
      }

      .documento-contenedor {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }

      @page {
        margin: 1.5cm;
      }
    }
  </style>
</head>
<body>
  <div class="barra-botones-pantalla">
    <button class="btn btn-imprimir" onclick="window.print()">
      🖨️ Imprimir / Guardar en PDF
    </button>
  </div>

  <div class="documento-contenedor">
    ${contenidoHtml}
  </div>
</body>
</html>`;
}

/**
 * Descarga directamente un archivo HTML formateado y listo para imprimir o convertir a PDF
 */
export function descargarDocumentoHtml(nombreArchivo: string, titulo: string, contenidoHtml: string): void {
  const fullHtml = generarPlantillaDocumentoHtml(titulo, contenidoHtml);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Limpiar nombre de archivo
  const safeName = nombreArchivo.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.setAttribute('download', `${safeName}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ejecuta la impresión de manera segura utilizando una ventana secundaria o iframe oculto
 * y si el navegador bloquea la acción, descarga el archivo automáticamente.
 */
export function imprimirDocumentoSeguro(titulo: string, contenidoHtml: string, nombreDescarga: string = 'Documento_Institucional'): void {
  try {
    const fullHtml = generarPlantillaDocumentoHtml(titulo, contenidoHtml);
    
    // Crear un iframe temporal oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        } catch (e) {
          console.warn('Iframe print intercepted, fallback to download:', e);
          descargarDocumentoHtml(nombreDescarga, titulo, contenidoHtml);
        }
      }, 500);
    } else {
      descargarDocumentoHtml(nombreDescarga, titulo, contenidoHtml);
    }
  } catch (err) {
    console.warn('Printing error, triggering download fallback:', err);
    descargarDocumentoHtml(nombreDescarga, titulo, contenidoHtml);
  }
}
