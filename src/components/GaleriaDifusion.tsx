import React, { useState, useEffect, useRef } from 'react';
import { ImagenActividad } from '../types';
import { MSBDatabase, CONFIG } from '../utils/storage';
import { 
  Camera, 
  Calendar, 
  Tag, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Heart,
  Share2,
  ZoomIn,
  Video,
  Play,
  Maximize2,
  Minimize2,
  Volume2,
  Film,
  RotateCcw
} from 'lucide-react';

interface GaleriaDifusionProps {
  tituloSeccion?: string;
  subtituloSeccion?: string;
}

export const GaleriaDifusion: React.FC<GaleriaDifusionProps> = ({
  tituloSeccion = 'Difusión y Momentos de Vida Deportiva Normalista',
  subtituloSeccion = 'Galería comunitaria de torneos, talleres, pausas activas y cultura física en la Escuela Normal Miguel F. Martínez.'
}) => {
  const [fotos, setFotos] = useState<ImagenActividad[]>(() => MSBDatabase.getGaleriaActividades());
  const [filtroActividad, setFiltroActividad] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fotos' | 'videos'>('todos');
  const [fotoSeleccionada, setFotoSeleccionada] = useState<ImagenActividad | null>(null);
  
  // Video en reproducción activa dentro del espacio de la galería
  const [videoActivo, setVideoActivo] = useState<ImagenActividad | null>(null);
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false);
  
  const videoPlayerContainerRef = useRef<HTMLDivElement>(null);

  // Sincronización en tiempo real cuando se publica o elimina contenido
  useEffect(() => {
    const handleActualizar = () => {
      setFotos(MSBDatabase.getGaleriaActividades());
    };
    window.addEventListener('storage', handleActualizar);
    window.addEventListener('msb_galeria_actualizada', handleActualizar);
    return () => {
      window.removeEventListener('storage', handleActualizar);
      window.removeEventListener('msb_galeria_actualizada', handleActualizar);
    };
  }, []);

  // Listener para estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setEsPantallaCompleta(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Función para activar pantalla completa
  const handleToggleFullscreen = () => {
    if (!videoPlayerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      if (videoPlayerContainerRef.current.requestFullscreen) {
        videoPlayerContainerRef.current.requestFullscreen().catch(err => {
          console.warn('Error al solicitar pantalla completa:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Error al salir de pantalla completa:', err);
        });
      }
    }
  };

  if (fotos.length === 0) {
    return null;
  }

  // Actividades únicas presentes en la galería
  const actividadesUnicas = Array.from(
    new Set(fotos.map(f => f.actividadNombre || 'General').filter(Boolean))
  );

  // Filtrado por actividad y por tipo (fotos/videos)
  const fotosFiltradas = fotos.filter(f => {
    if (filtroActividad !== 'todas' && (f.actividadNombre || 'General') !== filtroActividad) {
      return false;
    }
    if (filtroTipo === 'fotos' && f.tipoMedio === 'video') return false;
    if (filtroTipo === 'videos' && f.tipoMedio !== 'video') return false;
    return true;
  });

  const totalVideos = fotos.filter(f => f.tipoMedio === 'video').length;
  const totalFotos = fotos.filter(f => f.tipoMedio !== 'video').length;

  return (
    <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a]/60 shadow-xl space-y-5">
      
      {/* Encabezado de la Galería */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-950/80 text-amber-300 border border-amber-500/30 tracking-wider">
              Comunidad Normalista en Acción
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              {CONFIG.DEPARTAMENTO}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>{tituloSeccion}</span>
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {subtituloSeccion}
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs font-semibold text-cyan-300 bg-[#061426] px-3 py-1.5 rounded-xl border border-blue-500/30">
            📸 {totalFotos} fotos
          </span>
          {totalVideos > 0 && (
            <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-500/40 flex items-center space-x-1">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>{totalVideos} videos</span>
            </span>
          )}
        </div>
      </div>

      {/* Barra de Filtros: Filtro por tipo de medio (Fotos/Videos) + Filtro por Actividad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Selector de Medio */}
        <div className="flex items-center space-x-1.5 bg-[#061426] p-1 rounded-xl border border-[#1e3555] shrink-0 self-start">
          <button
            type="button"
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filtroTipo === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Todos ({fotos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('fotos')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              filtroTipo === 'fotos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Fotos ({totalFotos})</span>
          </button>
          {totalVideos > 0 && (
            <button
              type="button"
              onClick={() => setFiltroTipo('videos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filtroTipo === 'videos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3 text-purple-300" />
              <span>Videos ({totalVideos})</span>
            </button>
          )}
        </div>

        {/* Filtros por Actividad */}
        {actividadesUnicas.length > 1 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setFiltroActividad('todas')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroActividad === 'todas'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
              }`}
            >
              Todas las Actividades
            </button>
            {actividadesUnicas.map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => setFiltroActividad(act)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filtroActividad === act
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-[#061426] text-[#94a3b8] hover:bg-[#112240] hover:text-white border border-[#1e3555]'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= REPRODUCTOR DE VIDEO DESPLEGADO EN EL ESPACIO DE LA GALERÍA ================= */}
      {videoActivo && (
        <div 
          ref={videoPlayerContainerRef}
          className="bg-black rounded-3xl overflow-hidden border-2 border-purple-500/60 shadow-2xl animate-in fade-in transition-all relative flex flex-col"
        >
          {/* Barra de control superior del reproductor en la galería */}
          <div className="bg-[#061426]/95 backdrop-blur-md px-4 py-3 border-b border-[#1e3555] flex items-center justify-between z-20">
            <div className="flex items-center space-x-2.5 truncate mr-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40 uppercase flex items-center space-x-1 shrink-0">
                <Video className="w-3 h-3" />
                <span>Video en Reproducción</span>
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {videoActivo.titulo}
              </h3>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Botón oficial de Pantalla Completa */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white text-xs font-bold rounded-xl border border-purple-500/40 transition-colors cursor-pointer"
                title="Ver video en pantalla completa"
              >
                {esPantallaCompleta ? <Minimize2 className="w-4 h-4 text-purple-300" /> : <Maximize2 className="w-4 h-4 text-purple-300" />}
                <span className="hidden sm:inline">{esPantallaCompleta ? 'Salir' : 'Pantalla Completa'}</span>
              </button>

              {/* Botón para cerrar y volver al mosaico de fotos */}
              <button
                type="button"
                onClick={() => setVideoActivo(null)}
                className="p-1.5 bg-[#0a192f] hover:bg-[#112240] text-gray-400 hover:text-white rounded-xl border border-[#1e3555] transition-colors cursor-pointer"
                title="Cerrar reproductor y volver a la galería de fotos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Reproducción de Video (Ocupa el espacio visual de la galería) */}
          <div className="relative w-full aspect-video sm:h-[480px] bg-black flex items-center justify-center overflow-hidden">
            {videoActivo.tipoVideo === 'youtube' || videoActivo.tipoVideo === 'vimeo' ? (
              <iframe
                src={videoActivo.videoUrl}
                title={videoActivo.titulo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                src={videoActivo.videoUrl}
                poster={videoActivo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Tu navegador no soporta la reproducción directa de este formato de video.
              </video>
            )}
          </div>

          {/* Información y detalles al pie del reproductor */}
          <div className="bg-[#0a192f] p-4 sm:p-5 border-t border-[#1e3555] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[11px] text-cyan-300">
                <span className="font-semibold">{videoActivo.actividadNombre || 'General'}</span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-[#94a3b8]">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>{videoActivo.fecha}</span>
                </span>
                <span>•</span>
                <span className="text-purple-300 font-medium">{videoActivo.autor || 'ENMFM'}</span>
              </div>
              {videoActivo.descripcion && (
                <p className="text-xs text-[#cbd5e1] max-w-3xl leading-relaxed">
                  {videoActivo.descripcion}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setVideoActivo(null)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-center shrink-0 shadow-lg shadow-blue-600/30"
            >
              <span>Volver al Mosaico de Fotografías</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= CUADRÍCULA DE FOTOGRAFÍAS Y VIDEOS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotosFiltradas.map((item) => {
          const esVideo = item.tipoMedio === 'video';
          const esElVideoActivo = videoActivo?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (esVideo) {
                  setVideoActivo(item);
                  // Scroll suave hacia el espacio del reproductor si no está visible
                  if (videoPlayerContainerRef.current) {
                    videoPlayerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                } else {
                  setFotoSeleccionada(item);
                }
              }}
              className={`group relative bg-[#061426] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border flex flex-col justify-end min-h-[220px] ${
                esElVideoActivo 
                  ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]' 
                  : esVideo 
                    ? 'border-purple-500/40 hover:border-purple-400' 
                    : 'border-[#1e3a8a]/60 hover:border-blue-400'
              }`}
            >
              {/* Imagen o portada de fondo */}
              <img
                src={item.url}
                alt={item.titulo}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';
                }}
              />

              {/* Botón flotante central de Play para videos */}
              {esVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-12 h-12 rounded-full bg-purple-600/90 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-2xl border border-purple-300/50 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 ml-0.5 fill-current" />
                  </div>
                </div>
              )}

              {/* Gradiente oscuro superior e inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/40 pointer-events-none"></div>

              {/* Badge superior: tipo de medio y destacada */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                <div className="flex items-center space-x-1.5">
                  {esVideo ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/50 flex items-center space-x-1 backdrop-blur-xs shadow-md">
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0a192f]/90 text-cyan-300 backdrop-blur-xs border border-blue-500/30">
                      {item.actividadNombre || 'Actividad Normalista'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {item.destacada && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-amber-950 flex items-center space-x-1 shadow-md">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Destacada</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de ampliar en hover para fotos */}
              {!esVideo && (
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-xs p-1.5 rounded-full text-white z-10">
                  <ZoomIn className="w-4 h-4" />
                </div>
              )}

              {/* Información al pie de la foto/video */}
              <div className="relative p-3.5 space-y-1 text-white z-10">
                <div className="text-[10px] text-cyan-300 flex items-center space-x-1.5 font-medium">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>{item.fecha}</span>
                  {esVideo && (
                    <>
                      <span>•</span>
                      <span className="text-purple-300 font-bold uppercase tracking-wider text-[9px]">Reproducir en Galería</span>
                    </>
                  )}
                </div>
                <h3 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 transition-colors ${esVideo ? 'text-purple-200 group-hover:text-white' : 'text-white group-hover:text-cyan-300'}`}>
                  {item.titulo}
                </h3>
                {item.descripcion && (
                  <p className="text-[11px] text-[#cbd5e1] line-clamp-1 font-normal opacity-90">
                    {item.descripcion}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL LIGHTBOX DE FOTO EN ALTA RESOLUCIÓN ================= */}
      {fotoSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-[#0a192f] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#1e3a8a] my-6 max-h-[92vh] flex flex-col text-white">
            
            {/* Header del Lightbox */}
            <div className="flex items-center justify-between p-4 border-b border-[#1e3555] bg-[#061426]">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-950 text-cyan-300 border border-blue-500/30 uppercase">
                  {fotoSeleccionada.actividadNombre || 'Difusión Institucional'}
                </span>
                <span className="text-xs text-[#94a3b8] font-medium">
                  {fotoSeleccionada.fecha}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFotoSeleccionada(null)}
                className="p-1.5 text-[#94a3b8] hover:text-white rounded-full cursor-pointer hover:bg-[#112240] transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagen Principal */}
            <div className="relative bg-black flex items-center justify-center max-h-[55vh] overflow-hidden">
              <img
                src={fotoSeleccionada.url}
                alt={fotoSeleccionada.titulo}
                className="max-h-[55vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Información Detallada */}
            <div className="p-5 sm:p-6 space-y-3 bg-[#0a192f] overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {fotoSeleccionada.titulo}
                  </h3>
                  <div className="text-xs text-blue-300 font-medium mt-0.5">
                    {fotoSeleccionada.autor || 'Departamento de Deporte y Salud • ENMFM'}
                  </div>
                </div>

                {fotoSeleccionada.destacada && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40 shrink-0 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Publicación Destacada</span>
                  </span>
                )}
              </div>

              {fotoSeleccionada.descripcion && (
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed bg-[#061426] p-3.5 rounded-2xl border border-[#1e293b]">
                  {fotoSeleccionada.descripcion}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#1e3555] text-[11px] text-[#94a3b8]">
                <span>{CONFIG.INSTITUCION} • {CONFIG.SISTEMA}</span>
                <button
                  type="button"
                  onClick={() => setFotoSeleccionada(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-end sm:self-auto shadow-lg shadow-blue-600/30"
                >
                  Cerrar Visualización
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
