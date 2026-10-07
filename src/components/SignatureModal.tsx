import React, { useRef, useState, useEffect } from 'react';
import { AutoridadesConfig } from '../types';
import { MSBDatabase, FIRMA_DEMO_SANDRA, FIRMA_DEMO_ARTURO, comprimirImagenBase64 } from '../utils/storage';
import { PenTool, CheckCircle2, RotateCcw, Sparkles, X, Check } from 'lucide-react';

interface SignatureModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onFirmaGuardada: (autoridadesActualizadas: AutoridadesConfig) => void;
  rolObjetivo?: 'matutino' | 'vespertino' | 'ambos';
}

export const FirmaVectorPreview: React.FC<{ firma?: string; tipo: 'matutino' | 'vespertino' }> = ({ firma, tipo }) => {
  if (firma && (firma.startsWith('data:image/png;base64,') || firma.startsWith('data:image/jpeg;base64,'))) {
    return (
      <div className="h-12 flex items-center justify-center -mb-2">
        <img src={firma} alt="" className="max-h-12 max-w-44 object-contain border-0 outline-none" />
      </div>
    );
  }

  if (firma && firma.startsWith('data:image/svg+xml;base64,')) {
    try {
      const decoded = atob(firma.split(',')[1]);
      if (decoded.includes('<svg')) {
        return (
          <div 
            className="h-12 flex items-center justify-center -mb-2 [&>svg]:h-12 [&>svg]:max-w-44" 
            dangerouslySetInnerHTML={{ __html: decoded }} 
          />
        );
      }
    } catch {
      // fallback
    }
  }

  if (firma && (firma.startsWith('<svg') || firma.includes('<svg'))) {
    return (
      <div 
        className="h-12 flex items-center justify-center -mb-2 [&>svg]:h-12 [&>svg]:max-w-44" 
        dangerouslySetInnerHTML={{ __html: firma }} 
      />
    );
  }

  if (tipo === 'matutino') {
    return (
      <div className="h-12 flex items-center justify-center -mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" className="h-12 max-w-44">
          <path d="M 22,48 C 28,32 40,14 52,18 C 60,22 48,50 68,40 C 82,34 94,18 102,32 C 108,42 116,26 128,30 C 140,34 144,18 158,24 C 170,30 178,42 198,28 M 32,52 C 78,54 138,48 218,42 M 62,16 L 62,38" fill="none" stroke="#1e3a8a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-12 flex items-center justify-center -mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" className="h-12 max-w-44">
        <path d="M 20,52 C 34,16 48,14 58,36 C 66,54 50,60 74,38 C 86,26 94,48 108,26 C 120,12 126,44 142,28 C 158,16 168,48 188,32 C 198,24 208,38 218,28 M 16,56 C 82,58 148,52 222,46" fill="none" stroke="#1e3a8a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const SignatureModal: React.FC<SignatureModalProps> = ({
  abierto,
  onCerrar,
  onFirmaGuardada,
  rolObjetivo = 'ambos'
}) => {
  const [autoridades, setAutoridades] = useState<AutoridadesConfig>(MSBDatabase.getAutoridades());
  const [autoridadActiva, setAutoridadActiva] = useState<'matutino' | 'vespertino'>(
    rolObjetivo === 'vespertino' ? 'vespertino' : 'matutino'
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (abierto) {
      const auth = MSBDatabase.getAutoridades();
      setAutoridades(auth);
      setTimeout(() => {
        cargarFirmaEnCanvas(autoridadActiva, auth);
      }, 100);
    }
  }, [abierto, autoridadActiva]);

  const cargarFirmaEnCanvas = (tipo: 'matutino' | 'vespertino', authData: AutoridadesConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar línea base de firma suave
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 25);
    ctx.lineTo(canvas.width - 20, canvas.height - 25);
    ctx.stroke();

    const firmaSrc = tipo === 'matutino' ? authData.jefeMatutinoFirma : authData.jefeVespertinoFirma;
    if (firmaSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (canvas.width - 220) / 2, (canvas.height - 70) / 2, 220, 70);
      };
      img.src = firmaSrc;
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleLimpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redibujar guía
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 25);
    ctx.lineTo(canvas.width - 20, canvas.height - 25);
    ctx.stroke();
  };

  const handleRestaurarPredefinida = () => {
    const demo = autoridadActiva === 'matutino' ? FIRMA_DEMO_SANDRA : FIRMA_DEMO_ARTURO;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, (canvas.width - 220) / 2, (canvas.height - 70) / 2, 220, 70);
    };
    img.src = demo;
  };

  const handleGuardarFirmaActual = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawDataUrl = canvas.toDataURL('image/png');
    // Comprimir firma para que nunca exceda los límites de celda de Google Sheets
    const dataUrl = await comprimirImagenBase64(rawDataUrl, 400, 0.75);

    const updated: AutoridadesConfig = {
      ...autoridades,
      [autoridadActiva === 'matutino' ? 'jefeMatutinoFirma' : 'jefeVespertinoFirma']: dataUrl
    };

    await MSBDatabase.saveAutoridades(updated);
    setAutoridades(updated);
    setMensajeExito(`✓ Firma virtual de ${autoridadActiva === 'matutino' ? autoridades.jefeMatutinoNombre : autoridades.jefeVespertinoNombre} guardada y respaldada en la Base Maestra.`);

    setTimeout(() => {
      setMensajeExito(null);
      onFirmaGuardada(updated);
    }, 1000);
  };

  if (!abierto) return null;

  const nombreActual = autoridadActiva === 'matutino' 
    ? autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'
    : autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia';

  const cargoActual = autoridadActiva === 'matutino'
    ? autoridades.jefeMatutinoCargo || 'Turno matutino'
    : autoridades.jefeVespertinoCargo || 'Turno vespertino';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
      <div className="bg-[#0a192f] text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#1e3a8a] space-y-5 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-[#1e3555] pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-950/80 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Firma Virtual y Digital de Documentos
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Estampa o actualiza la firma manuscrita para constancias e informes oficiales
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#94a3b8] hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de éxito */}
        {mensajeExito && (
          <div className="p-3 bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Selector de Autoridad a Firmar */}
        <div>
          <label className="block text-xs font-bold text-[#d6e3ff] mb-2 uppercase tracking-wider">
            Selecciona la Autoridad a Firmar:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setAutoridadActiva('matutino');
                cargarFirmaEnCanvas('matutino', autoridades);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                autoridadActiva === 'matutino'
                  ? 'bg-blue-950/80 border-blue-500 text-white ring-2 ring-blue-500/40'
                  : 'bg-[#061426] hover:bg-[#112240] border-[#1e3555] text-[#94a3b8]'
              }`}
            >
              <div className="text-[10px] font-bold text-blue-400 uppercase">Jefatura Matutina</div>
              <div className="font-bold text-xs truncate mt-0.5 text-white">{autoridades.jefeMatutinoNombre || 'Sandra Nelly Martínez Cantú'}</div>
              <div className="text-[11px] text-[#94a3b8]">{autoridades.jefeMatutinoCargo || 'Turno matutino'}</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAutoridadActiva('vespertino');
                cargarFirmaEnCanvas('vespertino', autoridades);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                autoridadActiva === 'vespertino'
                  ? 'bg-purple-950/80 border-purple-500 text-white ring-2 ring-purple-500/40'
                  : 'bg-[#061426] hover:bg-[#112240] border-[#1e3555] text-[#94a3b8]'
              }`}
            >
              <div className="text-[10px] font-bold text-purple-400 uppercase">Jefatura Vespertina</div>
              <div className="font-bold text-xs truncate mt-0.5 text-white">{autoridades.jefeVespertinoNombre || 'Arturo Rodríguez Segovia'}</div>
              <div className="text-[11px] text-[#94a3b8]">{autoridades.jefeVespertinoCargo || 'Turno vespertino'}</div>
            </button>
          </div>
        </div>

        {/* Lienzo de Firma Digital Interactiva */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#d6e3ff]">
              Traza la firma con el ratón o pantalla táctil:
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleLimpiarCanvas}
                className="inline-flex items-center space-x-1 text-[#94a3b8] hover:text-red-400 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Borrar trazo</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleRestaurarPredefinida}
                className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rúbrica oficial</span>
              </button>
            </div>
          </div>

          <div className="relative border-2 border-dashed border-[#1e3a8a] hover:border-blue-400 transition-colors rounded-2xl bg-white overflow-hidden p-1 shadow-inner">
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 bg-transparent cursor-crosshair touch-none"
            />
            <div className="absolute bottom-2 left-4 text-[10px] text-gray-500 pointer-events-none">
              Línea de firma de: <strong>{nombreActual}</strong> ({cargoActual})
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1e3555]">
          <span className="text-[11px] text-[#94a3b8]">
            La firma se vinculará en todos los documentos descargables e imprimibles.
          </span>

          <div className="flex items-center space-x-2 self-end">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 bg-[#112240] hover:bg-[#1e3555] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGuardarFirmaActual}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Estampar y Guardar Firma</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
