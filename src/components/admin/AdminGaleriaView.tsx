import React, { useState, useEffect } from 'react';
import { ImagenActividad, Actividad } from '../../types';
import { MSBDatabase, CONFIG } from '../../utils/storage';
import { SelloInstitucional } from '../SelloInstitucional';
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  FileImage,
  RefreshCw,
  Shield,
  Trophy,
  Award,
  RotateCcw,
  Check,
  School,
  Video,
  Play,
  Film,
  Maximize2,
  X
} from 'lucide-react';

export function parsearEnlaceVideo(rawUrl: string): { embedUrl: string; thumbnailUrl: string; tipoVideo: 'youtube' | 'vimeo' | 'directo' | 'enlace' } {
  const url = rawUrl.trim();
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      tipoVideo: 'youtube'
    };
  }
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
      tipoVideo: 'vimeo'
    };
  }
  if (url.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || url.startsWith('data:video/')) {
    return {
      embedUrl: url,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
      tipoVideo: 'directo'
    };
  }
  return {
    embedUrl: url,
    thumbnailUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    tipoVideo: 'enlace'
  };
}

export const AdminGaleriaView: React.FC = () => {
  const [fotos, setFotos] = useState<ImagenActividad[]>(() => MSBDatabase.getGaleriaActividades());
  const [actividades] = useState<Actividad[]>(() => MSBDatabase.getActividades());
  
  // Estado para gestión del Escudo / Sello
  const [escudoActual, setEscudoActual] = useState(() => MSBDatabase.getEscudoActivo());
  const [tipoEscudoSeleccionado, setTipoEscudoSeleccionado] = useState<'institucional' | 'departamento' | 'ganador' | 'personalizado'>(escudoActual.tipo);
  const [nombreEscudo, setNombreEscudo] = useState(escudoActual.nombre);
  const [urlEscudo, setUrlEscudo] = useState(escudoActual.url);
  const [previewEscudoSubido, setPreviewEscudoSubido] = useState<string | null>(null);
  const [equipoGanadorNombre, setEquipoGanadorNombre] = useState('Campeones Torneo Interescuelas 2026 - Tigres Normalistas');
  const [mensajeEscudo, setMensajeEscudo] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Tipo de medio: Imagen o Video
  const [tipoMedio, setTipoMedio] = useState<'imagen' | 'video'>('imagen');

  // Estado para nueva publicación en galería
  const [modoOrigen, setModoOrigen] = useState<'archivo' | 'url'>('archivo');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().substring(0, 10));
  const [actividadId, setActividadId] = useState<string>('ACT-001');
  const [urlImagen, setUrlImagen] = useState('');
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [archivoVideoPreview, setArchivoVideoPreview] = useState<string | null>(null);
  const [autor, setAutor] = useState('Departamento de Deporte y Salud');
  const [destacada, setDestacada] = useState(false);

  // Estado para modal de confirmación de eliminación in-app
  const [itemAEliminar, setItemAEliminar] = useState<{ id: string; titulo: string } | null>(null);

  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const handleEscudoUpdate = () => {
      setEscudoActual(MSBDatabase.getEscudoActivo());
    };
    const handleGaleriaUpdate = () => {
      setFotos(MSBDatabase.getGaleriaActividades());
    };
    window.addEventListener('msb_escudo_cambiado', handleEscudoUpdate);
    window.addEventListener('msb_galeria_actualizada', handleGaleriaUpdate);
    return () => {
      window.removeEventListener('msb_escudo_cambiado', handleEscudoUpdate);
      window.removeEventListener('msb_galeria_actualizada', handleGaleriaUpdate);
    };
  }, []);

  const recargar = () => {
    setFotos(MSBDatabase.getGaleriaActividades());
  };

  // Manejador de carga de archivo de escudo
  const handleSeleccionarArchivoEscudo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensajeEscudo({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensajeEscudo({ tipo: 'error', texto: 'La imagen excede los 5MB. Te recomendamos una imagen más ligera para optimizar la velocidad.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewEscudoSubido(dataUrl);
      setUrlEscudo(dataUrl);
      setTipoEscudoSeleccionado('personalizado');
      if (!nombreEscudo || nombreEscudo.includes('Oficial')) {
        setNombreEscudo(`Escudo Personalizado (${file.name.replace(/\.[^/.]+$/, "")})`);
      }
      setMensajeEscudo(null);
    };
    reader.readAsDataURL(file);
  };

  // Guardar cambio de Escudo
  const handleGuardarEscudo = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeEscudo(null);

    let finalUrl = urlEscudo.trim();
    let finalNombre = nombreEscudo.trim();

    if (tipoEscudoSeleccionado === 'institucional') {
      finalUrl = '/SELLO.png';
      finalNombre = 'Escudo Oficial Escuela Normal Miguel F. Martínez';
    } else if (tipoEscudoSeleccionado === 'departamento') {
      // Escudo del departamento con color y filiación
      finalUrl = urlEscudo || '/SELLO.png';
      finalNombre = 'Escudo Oficial del Departamento de Deporte y Salud';
    } else if (tipoEscudoSeleccionado === 'ganador') {
      finalNombre = `Escudo de Campeones: ${equipoGanadorNombre.trim() || 'Equipo Ganador de Torneo'}`;
      if (!finalUrl) {
        finalUrl = '/SELLO.png';
      }
    }

    if (!finalUrl) {
      setMensajeEscudo({ tipo: 'error', texto: 'Debes proporcionar una imagen válida para el escudo.' });
      return;
    }

    const res = MSBDatabase.setEscudoActivo({
      url: finalUrl,
      tipo: tipoEscudoSeleccionado,
      nombre: finalNombre
    });

    if (res.ok) {
      setEscudoActual(MSBDatabase.getEscudoActivo());
      setMensajeEscudo({ tipo: 'exito', texto: '✓ ¡Escudo actualizado con éxito en todo el proyecto y cabecera!' });
      setTimeout(() => setMensajeEscudo(null), 4000);
    } else {
      setMensajeEscudo({ tipo: 'error', texto: res.mensaje });
    }
  };

  // Restablecer escudo de fábrica
  const handleRestablecerEscudo = () => {
    if (confirm('¿Deseas restablecer el escudo al original institucional de la Escuela Normal Miguel F. Martínez?')) {
      const res = MSBDatabase.restablecerEscudoDefault();
      if (res.ok) {
        const act = MSBDatabase.getEscudoActivo();
        setEscudoActual(act);
        setTipoEscudoSeleccionado('institucional');
        setNombreEscudo(act.nombre);
        setUrlEscudo(act.url);
        setPreviewEscudoSubido(null);
        setMensajeEscudo({ tipo: 'exito', texto: '✓ Escudo restablecido al sello institucional oficial.' });
        setTimeout(() => setMensajeEscudo(null), 4000);
      }
    }
  };

  // Manejador de carga de archivo de imagen para la galería
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen excede los 8MB. Te recomendamos una imagen más ligera para optimizar la velocidad.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArchivoPreview(dataUrl);
      setUrlImagen(dataUrl);
      setMensaje(null);
    };
    reader.readAsDataURL(file);
  };

  // Manejador de carga de archivo de video directo
  const handleSeleccionarArchivoVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de video válido (MP4, WebM, MOV).' });
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'El archivo supera los 80MB. Te recomendamos alojarlo en YouTube/Drive y usar la opción de vínculo de plataforma.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArchivoVideoPreview(dataUrl);
      setVideoUrlInput(dataUrl);
      setMensaje(null);
    };
    reader.readAsDataURL(file);
  };

  const handlePublicarContenido = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!titulo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Debes proporcionar un título representativo para la publicación.' });
      return;
    }

    const actividadElegida = actividades.find(a => a.ID_actividad === actividadId);
    const nombreAct = actividadId === 'GENERAL' 
      ? 'Difusión General / Institucional' 
      : (actividadElegida?.Nombre || 'Actividad Deportiva');

    if (tipoMedio === 'video') {
      const rawVideo = (modoOrigen === 'archivo' ? archivoVideoPreview : videoUrlInput)?.trim();
      if (!rawVideo) {
        setMensaje({ tipo: 'error', texto: 'Debes subir un archivo de video o ingresar el enlace URL / vínculo de la plataforma.' });
        return;
      }

      const parsed = parsearEnlaceVideo(rawVideo);
      const thumbnailPoster = (archivoPreview || urlImagen || parsed.thumbnailUrl)?.trim();

      const res = MSBDatabase.agregarImagenActividad({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        actividadId,
        actividadNombre: nombreAct,
        url: thumbnailPoster,
        autor: autor.trim() || 'Departamento de Deporte y Salud',
        destacada,
        tipoMedio: 'video',
        videoUrl: parsed.embedUrl,
        tipoVideo: parsed.tipoVideo
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: '✓ Video publicado exitosamente en la galería comunitaria.' });
        recargar();
        setTitulo('');
        setDescripcion('');
        setVideoUrlInput('');
        setArchivoVideoPreview(null);
        setUrlImagen('');
        setArchivoPreview(null);
        setDestacada(false);
        setTimeout(() => setMensaje(null), 4000);
      }
    } else {
      const imgFinal = (modoOrigen === 'archivo' ? archivoPreview : urlImagen)?.trim();
      if (!imgFinal) {
        setMensaje({ tipo: 'error', texto: 'Debes seleccionar un archivo de imagen o ingresar un enlace URL.' });
        return;
      }

      const res = MSBDatabase.agregarImagenActividad({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        actividadId,
        actividadNombre: nombreAct,
        url: imgFinal,
        autor: autor.trim() || 'Departamento de Deporte y Salud',
        destacada,
        tipoMedio: 'imagen'
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: res.mensaje });
        recargar();
        setTitulo('');
        setDescripcion('');
        setUrlImagen('');
        setArchivoPreview(null);
        setDestacada(false);
        setTimeout(() => setMensaje(null), 4000);
      }
    }
  };

  const handleEliminar = (id: string, nom: string) => {
    // Abre el modal interactivo in-app garantizando ejecución libre de bloqueos de sandbox
    setItemAEliminar({ id, titulo: nom });
  };

  const ejecutarEliminacionDefinitiva = () => {
    if (!itemAEliminar) return;
    const res = MSBDatabase.eliminarImagenActividad(itemAEliminar.id);
    recargar();
    setMensaje({ tipo: 'exito', texto: `✓ "${itemAEliminar.titulo}" retirado exitosamente de la galería comunitaria.` });
    setItemAEliminar(null);
    setTimeout(() => setMensaje(null), 4000);
  };

  return (
    <div className="space-y-8 text-white">
      
      {/* Banner Principal del Administrador en Stitch Dark */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Consola del Administrador
            </span>
            <span className="text-xs text-blue-200/70 font-medium">
              Difusión en Tiempo Real & Gestión de Imagen Institucional
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2 tracking-tight">
            <Camera className="w-7 h-7 text-cyan-400" />
            <span>Galería, Difusión y Escudo Oficial</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
            Personaliza el escudo oficial del sistema (escudo institucional, departamento o equipo campeón de torneo) y difunde momentos formativos de la comunidad normalista.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-[#061426] p-3.5 rounded-2xl border border-blue-500/30 text-blue-200 shrink-0 self-start md:self-auto">
          <div>
            <div className="font-black text-base text-white">{fotos.length}</div>
            <div className="text-[11px] text-[#94a3b8]">Fotos en carrusel</div>
          </div>
          <div className="h-8 w-px bg-[#1e3555]"></div>
          <div>
            <div className="font-black text-base text-amber-400">{fotos.filter(f => f.destacada).length}</div>
            <div className="text-[11px] text-[#94a3b8]">Destacadas</div>
          </div>
        </div>
      </div>

      {/* ================= SECCIÓN 1: GESTIÓN DE ESCUDO E ICONO DEL SISTEMA ================= */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-8 border border-[#1e3a8a] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#061426] text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Personalización de Identidad Visual
              </div>
              <h2 className="text-lg font-bold text-white">
                Gestor del Escudo Oficial e Ícono del Sistema
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRestablecerEscudo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#061426] hover:bg-[#112240] text-blue-200 hover:text-white rounded-xl text-xs font-semibold border border-[#1e3555] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restablecer Original</span>
            </button>
          </div>
        </div>

        {mensajeEscudo && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
            mensajeEscudo.tipo === 'exito' 
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' 
              : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
          }`}>
            {mensajeEscudo.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{mensajeEscudo.texto}</span>
          </div>
        )}

        <form onSubmit={handleGuardarEscudo} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna 1 y 2: Selección y carga de escudo */}
          <div className="lg:col-span-2 space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                Selecciona la Identidad o Tipo de Escudo a Mostrar:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Escudo Institucional */}
                <button
                  type="button"
                  onClick={() => {
                    setTipoEscudoSeleccionado('institucional');
                    setUrlEscudo('/SELLO.png');
                    setNombreEscudo('Escudo Oficial Escuela Normal Miguel F. Martínez');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                    tipoEscudoSeleccionado === 'institucional'
                      ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50 text-white'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:bg-[#112240] hover:text-white'
                  }`}
                >
                  <School className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-white">Escudo Institucional Oficial</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">Sello Centenaria y Benemérita ENMFM</div>
                  </div>
                </button>

                {/* Opción 2: Escudo del Departamento de Deporte */}
                <button
                  type="button"
                  onClick={() => {
                    setTipoEscudoSeleccionado('departamento');
                    setNombreEscudo('Escudo Oficial del Departamento de Deporte y Salud');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                    tipoEscudoSeleccionado === 'departamento'
                      ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50 text-white'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:bg-[#112240] hover:text-white'
                  }`}
                >
                  <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-white">Escudo del Departamento</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">Deporte, Salud y Cultura Física Normalista</div>
                  </div>
                </button>

                {/* Opción 3: Escudo del Equipo Ganador de Torneo */}
                <button
                  type="button"
                  onClick={() => {
                    setTipoEscudoSeleccionado('ganador');
                    setNombreEscudo(`Escudo de Campeones: ${equipoGanadorNombre}`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                    tipoEscudoSeleccionado === 'ganador'
                      ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/50 text-white'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:bg-[#112240] hover:text-white'
                  }`}
                >
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-amber-300">Equipo Ganador de Torneo</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">Homenaje al club campeón interescuelas</div>
                  </div>
                </button>

                {/* Opción 4: Subir Escudo Personalizado */}
                <button
                  type="button"
                  onClick={() => setTipoEscudoSeleccionado('personalizado')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                    tipoEscudoSeleccionado === 'personalizado'
                      ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-500/50 text-white'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:bg-[#112240] hover:text-white'
                  }`}
                >
                  <Upload className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-purple-300">Subir Escudo Personalizado</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">Carga archivo local o enlace web</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Campo adicional si se elige Equipo Ganador */}
            {tipoEscudoSeleccionado === 'ganador' && (
              <div className="p-3.5 bg-[#061426] rounded-2xl border border-amber-500/30 space-y-2">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Nombre del Equipo Ganador o Torneo Conquistado:
                </label>
                <input
                  type="text"
                  value={equipoGanadorNombre}
                  onChange={(e) => setEquipoGanadorNombre(e.target.value)}
                  placeholder="ej: Campeones Torneo Interescuelas 2026 - Tigres Normalistas"
                  className="w-full p-2.5 bg-[#0a192f] border border-[#1e3555] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-[#94a3b8]">
                  Este nombre acompañará al escudo en la barra institucional del proyecto y acreditaciones.
                </p>
              </div>
            )}

            {/* Carga de archivo para el Escudo (personalizado, ganador o departamento) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider">
                Subir Archivo de Imagen del Escudo (PNG, SVG, JPG, WebP):
              </label>

              <div className="p-4 bg-[#061426] border-2 border-dashed border-[#1e3555] hover:border-blue-400 rounded-2xl text-center space-y-2 transition-colors">
                <input
                  type="file"
                  id="input-archivo-escudo"
                  accept="image/*"
                  onChange={handleSeleccionarArchivoEscudo}
                  className="hidden"
                />
                <label
                  htmlFor="input-archivo-escudo"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-900/60 text-cyan-300 border border-blue-500/40 flex items-center justify-center shadow-lg">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-300 hover:text-white underline block">
                      Haz clic para buscar tu archivo de escudo en el equipo
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">
                      Se almacena de forma persistente y se aplica al instante en todo el proyecto
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#94a3b8] mb-1">
                  O pega una URL directa de la imagen del escudo:
                </label>
                <input
                  type="url"
                  value={urlEscudo}
                  onChange={(e) => {
                    setUrlEscudo(e.target.value);
                    if (tipoEscudoSeleccionado === 'institucional') setTipoEscudoSeleccionado('personalizado');
                  }}
                  placeholder="https://ejemplo.com/escudo-deporte.png"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Establecer como Escudo Activo</span>
              </button>
            </div>

          </div>

          {/* Columna 3: Vista Previa en Vivo del Escudo */}
          <div className="bg-[#061426] rounded-2xl p-5 border border-blue-500/30 space-y-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider border-b border-[#1e3555] pb-2 flex items-center justify-between">
                <span>Vista Previa del Escudo</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-500/30 font-mono">
                  {escudoActual.tipo}
                </span>
              </div>

              {/* Escudo en vista grande */}
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-28 h-28 rounded-2xl bg-[#0a192f] border-2 border-amber-500/50 flex items-center justify-center p-2 shadow-2xl overflow-hidden group">
                  <img
                    src={previewEscudoSubido || urlEscudo || escudoActual.url}
                    alt={escudoActual.nombre}
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/SELLO.png';
                    }}
                  />
                </div>
                
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {nombreEscudo || escudoActual.nombre}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    {CONFIG.INSTITUCION}
                  </div>
                </div>
              </div>

              {/* Muestra cómo se ve en la cabecera */}
              <div className="p-3 bg-[#0a192f] rounded-xl border border-[#1e3555] space-y-1.5">
                <span className="text-[10px] font-bold text-cyan-300 block uppercase">
                  Simulación en Barra Superior de Navegación:
                </span>
                <div className="flex items-center space-x-2 bg-[#061426] p-2 rounded-lg border border-blue-500/20">
                  <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 flex items-center justify-center shrink-0">
                    <img
                      src={previewEscudoSubido || urlEscudo || escudoActual.url}
                      alt="Icono Cabecera"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/SELLO.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-white truncate">MOVIMIENTO, SALUD Y BIENESTAR</div>
                    <div className="text-[9px] text-blue-300 truncate">Escuela Normal Miguel F. Martínez</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#94a3b8] pt-2 border-t border-[#1e3555]">
              💡 El escudo activo se replica automáticamente en la cabecera general, credenciales institucionales, reportes oficiales y cédulas físicas.
            </div>
          </div>

        </form>
      </div>

      {/* ================= SECCIÓN 2: FORMULARIO DE SUBIDA DE FOTOS PARA LA GALERÍA ================= */}
      {mensaje && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
          mensaje.tipo === 'exito' 
            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' 
            : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Grid: Formulario de Subida + Vista Previa de Foto/Video */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna 1 y 2: Formulario */}
        <div className="lg:col-span-2 bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a] shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#1e3555] pb-3">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Publicar Contenido en la Galería Comunitaria (Foto o Video)
            </h2>
          </div>

          <form onSubmit={handlePublicarContenido} className="space-y-4 text-xs">
            
            {/* 1. Selector de Tipo de Medio: Fotografía o Video */}
            <div>
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                Tipo de Contenido a Difundir
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoMedio('imagen')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                    tipoMedio === 'imagen'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white hover:bg-[#112240]'
                  }`}
                >
                  <FileImage className="w-4 h-4 shrink-0 text-cyan-300" />
                  <div>
                    <div className="font-bold text-xs text-white">📸 Fotografía</div>
                    <div className="text-[10px] text-blue-100">Archivo local o URL externa</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoMedio('video')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                    tipoMedio === 'video'
                      ? 'bg-purple-700 text-white border-purple-400 shadow-md shadow-purple-700/30'
                      : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white hover:bg-[#112240]'
                  }`}
                >
                  <Video className="w-4 h-4 shrink-0 text-amber-300" />
                  <div>
                    <div className="font-bold text-xs text-white">🎥 Video</div>
                    <div className="text-[10px] text-purple-200">Archivo o YouTube / Vimeo</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Selector de origen según el tipo */}
            {tipoMedio === 'imagen' ? (
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                  Método de Carga de la Fotografía
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModoOrigen('archivo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      modoOrigen === 'archivo'
                        ? 'bg-[#1e3a8a] text-white border-blue-400 shadow-xs'
                        : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Archivo de Imagen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoOrigen('url')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      modoOrigen === 'url'
                        ? 'bg-[#1e3a8a] text-white border-blue-400 shadow-xs'
                        : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Ingresar Enlace URL de Imagen</span>
                  </button>
                </div>

                <div className="mt-2.5">
                  {modoOrigen === 'archivo' ? (
                    <div className="p-4 bg-[#061426] border-2 border-dashed border-[#1e3555] rounded-2xl text-center space-y-2 hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="input-archivo-galeria-foto"
                        accept="image/*"
                        onChange={handleSeleccionarArchivo}
                        className="hidden"
                      />
                      <label
                        htmlFor="input-archivo-galeria-foto"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-900/60 text-cyan-300 border border-blue-500/40 flex items-center justify-center shadow-lg">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-blue-300 hover:text-white underline block">
                            Seleccionar archivo de imagen
                          </span>
                          <span className="text-[11px] text-[#94a3b8]">
                            JPG, PNG, WebP (máx. 8 MB)
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/fotografia-torneo.jpg"
                        value={urlImagen}
                        onChange={(e) => setUrlImagen(e.target.value)}
                        className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs focus:border-blue-400 text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                  Origen del Video (Directo o Plataforma)
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModoOrigen('url')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      modoOrigen === 'url'
                        ? 'bg-purple-800 text-white border-purple-400 shadow-xs'
                        : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vínculo de Plataforma (YouTube / Vimeo / Enlace)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoOrigen('archivo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      modoOrigen === 'archivo'
                        ? 'bg-purple-800 text-white border-purple-400 shadow-xs'
                        : 'bg-[#061426] border-[#1e3555] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Subir Video Directo (MP4/WebM)</span>
                  </button>
                </div>

                <div className="mt-2.5">
                  {modoOrigen === 'url' ? (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/... o https://vimeo.com/..."
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        className="w-full p-2.5 bg-[#061426] border border-purple-500/50 rounded-xl text-xs focus:border-purple-400 text-white font-mono"
                      />
                      <div className="text-[11px] text-purple-200/80 flex items-center space-x-1.5">
                        <span>💡</span>
                        <span>
                          Admite enlaces estándar de YouTube, Shorts, Vimeo o enlaces directos MP4. Se extrae automáticamente la miniatura oficial.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#061426] border-2 border-dashed border-purple-500/40 rounded-2xl text-center space-y-2 hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        id="input-archivo-galeria-video"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={handleSeleccionarArchivoVideo}
                        className="hidden"
                      />
                      <label
                        htmlFor="input-archivo-galeria-video"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-lg">
                          <Film className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-purple-300 hover:text-white underline block">
                            Seleccionar archivo de video del equipo
                          </span>
                          <span className="text-[11px] text-[#94a3b8]">
                            MP4, WebM, MOV (reproducción en línea garantizada)
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                Título de la Publicación *
              </label>
              <input
                type="text"
                required
                placeholder={tipoMedio === 'video' ? 'ej: Resumen en Video - Final de Voleibol Normalista 2026' : 'ej: Partido Semifinal de Voleibol Mixto 2026'}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-semibold focus:border-blue-400 text-white"
              />
            </div>

            {/* Actividad Asociada y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  Actividad o Taller Deportivo
                </label>
                <select
                  value={actividadId}
                  onChange={(e) => setActividadId(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-semibold focus:border-blue-400 text-cyan-300 cursor-pointer"
                >
                  <option value="GENERAL" className="bg-[#0a192f] text-white">-- Difusión General / Institucional --</option>
                  {actividades.map((a) => (
                    <option key={a.ID_actividad} value={a.ID_actividad} className="bg-[#0a192f] text-white">
                      {a.Nombre} ({a.Tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  Fecha del Registro
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-semibold focus:border-blue-400 text-white cursor-pointer"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                Descripción o Reseña Informativa
              </label>
              <textarea
                rows={2}
                placeholder="Describe la jornada, participantes, resultados o momentos clave para compartir con la comunidad normalista..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs focus:border-blue-400 text-white resize-none"
              />
            </div>

            {/* Autor y Checkbox Destacada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                  Autor / Créditos
                </label>
                <input
                  type="text"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  placeholder="Departamento de Deporte y Salud"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3555] rounded-xl text-xs focus:border-blue-400 text-white"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center space-x-2 cursor-pointer bg-[#061426] p-2.5 rounded-xl border border-amber-500/30">
                  <input
                    type="checkbox"
                    checked={destacada}
                    onChange={(e) => setDestacada(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 border-[#1e3555] bg-[#0a192f]"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center space-x-1 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Marcar como Publicación Destacada</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
                  tipoMedio === 'video'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Publicar en Galería Comunitaria</span>
              </button>
            </div>

          </form>
        </div>

        {/* Columna 3: Vista Previa en Tiempo Real */}
        <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center space-x-2 border-b border-[#1e3555] pb-3">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Vista Previa de Publicación
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {tipoMedio === 'video' ? (
              (archivoVideoPreview || videoUrlInput) ? (
                <div className="relative bg-[#061426] rounded-2xl overflow-hidden shadow-xl border border-purple-500/40 flex flex-col justify-end min-h-[260px]">
                  {(() => {
                    const raw = archivoVideoPreview || videoUrlInput;
                    const parsed = parsearEnlaceVideo(raw);
                    if (parsed.tipoVideo === 'youtube' || parsed.tipoVideo === 'vimeo') {
                      return (
                        <div className="relative h-44 w-full bg-black">
                          <iframe
                            src={parsed.embedUrl}
                            title="Vista previa video"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="relative h-44 w-full bg-black flex items-center justify-center">
                        <video
                          src={parsed.embedUrl}
                          controls
                          className="max-h-full max-w-full"
                        />
                      </div>
                    );
                  })()}

                  <div className="p-3.5 space-y-1 text-white bg-[#061426]">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
                        <Video className="w-3 h-3" />
                        <span>Video Comunitario</span>
                      </span>
                      {destacada && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-amber-950 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Destacada</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold leading-snug text-white mt-1">
                      {titulo || 'Título del video'}
                    </h4>
                    <p className="text-[11px] text-[#cbd5e1] line-clamp-2">
                      {descripcion || 'Reseña del video a difundir...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#061426] border-2 border-dashed border-[#1e3555] rounded-2xl text-[#94a3b8] text-xs space-y-2">
                  <Video className="w-8 h-8 mx-auto text-purple-400" />
                  <p>Sube un archivo de video o ingresa un enlace de YouTube/Vimeo para previsualizarlo antes de publicar.</p>
                </div>
              )
            ) : (
              (modoOrigen === 'archivo' ? archivoPreview : urlImagen) ? (
                <div className="relative bg-[#061426] rounded-2xl overflow-hidden shadow-xl border border-blue-500/30 flex flex-col justify-end min-h-[260px]">
                  <img
                    src={modoOrigen === 'archivo' ? (archivoPreview || '') : urlImagen}
                    alt="Vista previa"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30 pointer-events-none"></div>

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a192f]/90 text-cyan-300 border border-blue-500/30">
                      {actividadId === 'GENERAL' ? 'Difusión General' : 'Actividad Normalista'}
                    </span>
                    {destacada && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-amber-950 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Destacada</span>
                      </span>
                    )}
                  </div>

                  <div className="relative p-3.5 space-y-1 text-white z-10">
                    <div className="text-[10px] text-cyan-300 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{fecha}</span>
                    </div>
                    <h4 className="text-xs font-bold leading-snug text-white">
                      {titulo || 'Título de la fotografía'}
                    </h4>
                    <p className="text-[11px] text-[#cbd5e1] line-clamp-2">
                      {descripcion || 'Reseña de la actividad ilustrada...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#061426] border-2 border-dashed border-[#1e3555] rounded-2xl text-[#94a3b8] text-xs space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto text-blue-400" />
                  <p>Selecciona una imagen o ingresa una URL para ver cómo se mostrará a los alumnos y docentes.</p>
                </div>
              )
            )}
          </div>

          <div className="p-3 bg-[#061426] border border-blue-500/30 rounded-xl text-[11px] text-blue-200 leading-relaxed">
            💡 <strong>Efecto Inmediato:</strong> En cuanto hagas clic en "Publicar", el elemento aparecerá en el carrusel y galería de todos los participantes y encargados.
          </div>
        </div>

      </div>

      {/* ================= SECCIÓN 3: LISTADO Y GESTIÓN DE ELEMENTOS PUBLICADOS ================= */}
      <div className="bg-[#0a192f] rounded-3xl p-6 sm:p-7 border border-[#1e3a8a] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Elementos en Difusión Activa ({fotos.length})
            </h2>
            <p className="text-xs text-[#94a3b8]">
              Administra, visualiza o elimina imágenes, videos, firmas y sellos oficiales en la base maestra
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const auth = MSBDatabase.getAutoridades();
                const esc = MSBDatabase.getEscudoActivo();
                MSBDatabase.saveAutoridades(auth);
                MSBDatabase.setEscudoActivo(esc);
                setFotos(MSBDatabase.getGaleriaActividades());
                setMensaje({ tipo: 'exito', texto: '✓ Firmas oficiales y Sello Institucional guardados y respaldados en la galería de la Base Maestra.' });
                setTimeout(() => setMensaje(null), 4000);
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 rounded-xl border border-amber-500/40 cursor-pointer transition-all flex items-center space-x-1.5"
              title="Guardar y respaldar firmas de autoridades y sello institucional en la galería de la base maestra"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Respaldar Firmas y Sello en Galería</span>
            </button>
            <button
              type="button"
              onClick={recargar}
              className="p-2 text-cyan-300 hover:text-white bg-[#061426] hover:bg-[#112240] rounded-xl border border-[#1e3555] cursor-pointer transition-colors"
              title="Recargar galería"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {fotos.length === 0 ? (
          <div className="p-8 text-center text-[#94a3b8] text-xs bg-[#061426] rounded-2xl border border-dashed border-[#1e3555]">
            No hay elementos en la galería actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((item) => (
              <div
                key={item.id}
                className="bg-[#061426] rounded-2xl border border-[#1e3a8a]/60 overflow-hidden shadow-lg hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div className="relative h-36 bg-black overflow-hidden group">
                  <img
                    src={item.url}
                    alt={item.titulo}
                    className="w-full h-full object-contain p-1.5 bg-slate-900/60 opacity-90 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {item.tipoMedio === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg border border-purple-300/50">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                    {item.categoria === 'Firmas y Sellos Oficiales' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-cyan-300 border border-cyan-500/50 flex items-center space-x-1 shadow-md">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>Firma/Sello</span>
                      </span>
                    ) : item.tipoMedio === 'video' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/50 flex items-center space-x-1 shadow-md">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </span>
                    ) : null}
                    {item.destacada && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-amber-950 flex items-center space-x-1 shadow-md">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Destacada</span>
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-cyan-300 backdrop-blur-xs border border-blue-500/30">
                    {item.id}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-cyan-300 flex items-center space-x-1 mb-0.5">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{item.fecha}</span>
                      <span>•</span>
                      <span className="text-blue-300 font-semibold truncate">{item.actividadNombre || 'General'}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">
                      {item.titulo}
                    </h3>
                    {item.descripcion && (
                      <p className="text-[11px] text-[#cbd5e1] line-clamp-2 mt-1">
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1e3555] flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] truncate max-w-[120px]">
                      {item.autor || 'ENMFM'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleEliminar(item.id, item.titulo)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 rounded-lg border border-rose-500/40 transition-colors cursor-pointer"
                      title="Eliminar elemento"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= MODAL IN-APP DE CONFIRMACIÓN DE ELIMINACIÓN ================= */}
      {itemAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0a192f] border border-rose-500/50 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">¿Retirar elemento de la difusión comunitaria?</h3>
              <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">
                Estás a punto de eliminar definitivamente:
                <br />
                <strong className="text-white text-sm block mt-1">"{itemAEliminar.titulo}"</strong>
                <span className="text-[11px] text-rose-300/80 block mt-1">Esta acción no se puede deshacer.</span>
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="flex-1 py-2.5 px-4 bg-[#061426] hover:bg-[#112240] text-gray-300 rounded-xl text-xs font-semibold border border-[#1e3555] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacionDefinitiva}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sí, Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
