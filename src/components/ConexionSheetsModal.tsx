import React, { useState } from 'react';
import { MSBDatabase, CONFIG } from '../utils/storage';
import { 
  FileSpreadsheet, 
  Wifi, 
  WifiOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  HelpCircle, 
  RefreshCw,
  Server,
  Database
} from 'lucide-react';

interface ConexionSheetsModalProps {
  onCerrar: () => void;
  onSincronizado?: () => void;
}

export const ConexionSheetsModal: React.FC<ConexionSheetsModalProps> = ({ onCerrar, onSincronizado }) => {
  const [url, setUrl] = useState<string>(MSBDatabase.getAppsScriptUrl());
  const [probando, setProbando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const isLive = MSBDatabase.isLiveConnected();

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    MSBDatabase.setAppsScriptUrl(url);
    if (url.trim()) {
      setMensaje({
        tipo: 'info',
        texto: 'URL de Google Apps Script guardada. Haz clic en "Probar conexión" o "Sincronizar" para verificar.'
      });
    } else {
      setMensaje({
        tipo: 'info',
        texto: 'Modo local restablecido. Los datos se gestionan en el navegador.'
      });
    }
  };

  const handleProbarConexion = async () => {
    setProbando(true);
    setMensaje(null);
    try {
      const res = await MSBDatabase.testGoogleSheetsConnection(url);
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: res.mensaje });
      } else {
        setMensaje({ tipo: 'error', texto: res.mensaje });
      }
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message || 'Error de conexión.' });
    } finally {
      setProbando(false);
    }
  };

  const handleSincronizar = async () => {
    setSincronizando(true);
    setMensaje(null);
    try {
      const res = await MSBDatabase.syncFromGoogleSheets();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: res.mensaje });
        if (onSincronizado) onSincronizado();
      } else {
        setMensaje({ tipo: 'error', texto: res.mensaje });
      }
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message || 'Error al sincronizar datos.' });
    } finally {
      setSincronizando(false);
    }
  };

  const snippetApiAppsScript = `// ============================================================
// AGREGAR AL FINAL DE TU GOOGLE APPS SCRIPT (.gs) PARA API WEB GLOBAL
// ============================================================
function doGet(e) {
  const ss = SpreadsheetApp.openById('${CONFIG.MASTER_SPREADSHEET_ID}');
  const action = (e && e.parameter) ? e.parameter.action : '';

  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Conectado a BASE_MAESTRA 1.1' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'obtenerTodo') {
    const actHoja = ss.getSheetByName('Actividades');
    const espHoja = ss.getSheetByName('Espacios');
    const invHoja = ss.getSheetByName('Inventario');
    const solHoja = ss.getSheetByName('Solicitudes');
    const insHoja = ss.getSheetByName('Inscripciones_Asistencia');

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      actividades: msb_getAllObjects(actHoja, msb_getHeaders(actHoja)),
      espacios: msb_getAllObjects(espHoja, msb_getHeaders(espHoja)),
      inventario: msb_getAllObjects(invHoja, msb_getHeaders(invHoja)),
      solicitudes: msb_getAllObjects(solHoja, msb_getHeaders(solHoja)),
      inscripciones: msb_getAllObjects(insHoja, msb_getHeaders(insHoja))
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'API Activa' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById('${CONFIG.MASTER_SPREADSHEET_ID}');
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === 'guardarSolicitud' && postData.solicitud) {
      const solHoja = ss.getSheetByName('Solicitudes');
      const s = postData.solicitud;
      solHoja.appendRow([
        s.ID_solicitud, s.Fecha_solicitud, s.Solicitante_ID, s.Solicitante_Nombre,
        s.Solicitante_Rol, s.Nivel_prioridad, s.Prioridad_Etiqueta, s.Tipo_solicitud,
        s.ID_recurso, s.Recurso_Nombre, s.Fecha_uso, s.Hora_inicio, s.Hora_fin,
        s.Cantidad, s.Proposito, s.Estado, s.Revisado_por_ID, s.Fecha_resolucion, s.Motivo_observaciones
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Solicitud sincronizada' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'guardarInscripcion' && postData.inscripcion) {
      const insHoja = ss.getSheetByName('Inscripciones_Asistencia');
      const ins = postData.inscripcion;
      insHoja.appendRow([
        ins.ID_registro, ins.ID_actividad, ins.ID_participante, ins.Fecha_inscripción,
        ins.Estado_inscripcion, ins.Asistencia || 'No registrada', ins.Fecha_asistencia || '', ins.Observaciones || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Inscripción sincronizada' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copiarCodigo = () => {
    navigator.clipboard.writeText(snippetApiAppsScript);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0a192f] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] my-8 space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-[#1e3555] pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isLive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
            }`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Estado de la Conexión con Google Sheets
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                BASE_MAESTRA_MOVIMIENTO_SALUD_BIENESTAR 1.1
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-full text-[#94a3b8] hover:text-white hover:bg-[#112240] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Respuesta directa a la pregunta del usuario */}
        <div className="bg-[#061426] p-4 rounded-2xl border border-[#1e3555] space-y-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2 font-bold text-white">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>¿Dónde residen los datos actualmente?</span>
          </div>
          <p className="text-[#cbd5e1] leading-relaxed text-xs">
            1. <strong>En este momento (por defecto):</strong> Los datos residen en la <strong>memoria local del navegador (<code className="bg-[#0a192f] text-cyan-300 px-1.5 py-0.5 rounded border border-[#1e3555] font-mono">localStorage</code>)</strong>, pre-cargados con la réplica exacta (1:1) de los datos y encabezados de tu hoja de cálculo institucional.
          </p>
          <p className="text-[#cbd5e1] leading-relaxed text-xs">
            2. <strong>¿Por qué no escribe directamente en Google Drive sin configurar?</strong> Por políticas de seguridad de Google, ningún sitio web externo puede acceder o modificar un Google Sheet privado sin un endpoint de Google Apps Script Web App o credenciales OAuth.
          </p>
          <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-500/40 text-xs text-blue-200 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>¡Puedes conectarlo en vivo en 2 pasos!</strong> Si publicas tu Google Apps Script como aplicación web, puedes pegar la URL abajo para que este portal lea y escriba directamente en tu Google Sheet real.
            </div>
          </div>
        </div>

        {/* Estado actual de la conexión */}
        <div className="flex items-center justify-between p-4 bg-[#061426] rounded-2xl border border-[#1e3555]">
          <div className="flex items-center space-x-3">
            {isLive ? (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
            )}
            <div>
              <div className="text-xs font-bold text-white">
                {isLive ? 'Modo En Vivo (Google Apps Script Web App Activo)' : 'Modo Local / Simulación (Estructura 1.1)'}
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                ID Maestra: <code className="text-cyan-300">{CONFIG.MASTER_SPREADSHEET_ID}</code>
              </div>
            </div>
          </div>

          <a
            href={CONFIG.URL_MASTER_SHEET}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <span>Ver Hoja Real</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
              : mensaje.tipo === 'error'
              ? 'bg-red-950/70 text-red-300 border border-red-500/40'
              : 'bg-blue-950/70 text-blue-300 border border-blue-500/40'
          }`}>
            {mensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
            {mensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* Configuración de URL de Apps Script */}
        <form onSubmit={handleGuardar} className="space-y-3">
          <label className="block text-xs font-bold text-[#d6e3ff] uppercase tracking-wider">
            URL de la Aplicación Web de Google Apps Script (/exec)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Guardar URL
            </button>
          </div>
          <p className="text-[11px] text-[#94a3b8]">
            Obtenida en Google Apps Script: <em>Implementar &gt; Administrar implementaciones &gt; URL de la aplicación web</em>.
          </p>
        </form>

        {/* Acciones de sincronización */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleProbarConexion}
            disabled={probando || !url.trim()}
            className="flex-1 py-2.5 px-3 bg-[#112240] hover:bg-[#1e3555] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-[#1e3a8a]"
          >
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>{probando ? 'Probando conexión...' : 'Probar conexión'}</span>
          </button>

          <button
            type="button"
            onClick={handleSincronizar}
            disabled={sincronizando || !url.trim()}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Descargando datos...' : 'Sincronizar datos ahora'}</span>
          </button>
        </div>

        {/* Código para habilitar en Google Apps Script */}
        <div className="border-t border-[#1e3555] pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#d6e3ff]">
              Código adicional para tu Google Apps Script (.gs) para responder a esta web:
            </span>
            <button
              type="button"
              onClick={copiarCodigo}
              className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div className="bg-[#040e1c] text-emerald-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36 border border-[#1e3555]">
            <pre>{snippetApiAppsScript}</pre>
          </div>
        </div>

      </div>
    </div>
  );
};
