import React, { useState } from 'react';
import { MaterialInventario, Espacio, Actividad, Identidad } from '../../types';
import { MSBDatabase } from '../../utils/storage';
import { 
  Package, 
  MapPin, 
  Activity, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface InventarioAdminViewProps {
  inventario: MaterialInventario[];
  espacios: Espacio[];
  actividades: Actividad[];
  identidades: Identidad[];
  onActualizar: () => void;
}

export const InventarioAdminView: React.FC<InventarioAdminViewProps> = ({
  inventario,
  espacios,
  actividades,
  identidades,
  onActualizar
}) => {
  const [seccion, setSeccion] = useState<'materiales' | 'espacios' | 'actividades' | 'encargados'>('materiales');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estados de Modales
  const [modalMaterial, setModalMaterial] = useState<{ abierto: boolean; item: Partial<MaterialInventario> | null; esNuevo: boolean }>({
    abierto: false,
    item: null,
    esNuevo: false
  });

  const [modalEspacio, setModalEspacio] = useState<{ abierto: boolean; item: Partial<Espacio> | null; esNuevo: boolean }>({
    abierto: false,
    item: null,
    esNuevo: false
  });

  const [modalActividad, setModalActividad] = useState<{ abierto: boolean; item: Partial<Actividad> | null; esNuevo: boolean }>({
    abierto: false,
    item: null,
    esNuevo: false
  });

  const [modalEncargado, setModalEncargado] = useState<{ abierto: boolean; item: Partial<Identidad> | null; esNuevo: boolean }>({
    abierto: false,
    item: null,
    esNuevo: false
  });

  const notificar = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
    onActualizar();
  };

  // Filtrado de materiales
  const materialesFiltrados = inventario.filter(m => {
    if (filtroCategoria !== 'todas' && m.Categoria !== filtroCategoria) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        m.Nombre_material.toLowerCase().includes(q) ||
        m.ID_material.toLowerCase().includes(q) ||
        m.Ubicacion.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtrado de espacios
  const espaciosFiltrados = espacios.filter(e => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        e.Nombre.toLowerCase().includes(q) ||
        e.ID_espacio.toLowerCase().includes(q) ||
        e.Ubicacion.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtrado de actividades
  const actividadesFiltradas = actividades.filter(a => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        a.Nombre.toLowerCase().includes(q) ||
        a.ID_actividad.toLowerCase().includes(q) ||
        (a.Responsable_Nombre || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Lista de encargados y docentes
  const encargadosYDocentes = identidades.filter(i => 
    i.rol === 'encargado' || i.rol === 'docente' || i.rol === 'administrador'
  ).filter(i => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        `${i.nombre} ${i.apellidos}`.toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q) ||
        i.correo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ===================== CRUD MATERIALES =====================
  const handleGuardarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMaterial.item?.Nombre_material) return;

    const id = modalMaterial.item.ID_material || `MAT-${String(inventario.length + 1).padStart(3, '0')}`;
    const materialCompleto: MaterialInventario = {
      ID_material: id,
      Nombre_material: modalMaterial.item.Nombre_material.trim(),
      Categoria: modalMaterial.item.Categoria || 'Balones',
      Cantidad_total: Number(modalMaterial.item.Cantidad_total) || 1,
      Cantidad_disponible: Number(modalMaterial.item.Cantidad_disponible) || 1,
      Unidad: modalMaterial.item.Unidad || 'Piezas',
      Ubicacion: modalMaterial.item.Ubicacion || 'Almacén de Deportes',
      Condicion: modalMaterial.item.Condicion || 'Excelente',
      Responsable_ID: modalMaterial.item.Responsable_ID || 'PAR-00001',
      Estado: modalMaterial.item.Estado || 'Disponible',
      Observaciones: modalMaterial.item.Observaciones || ''
    };

    MSBDatabase.saveMaterial(materialCompleto);
    setModalMaterial({ abierto: false, item: null, esNuevo: false });
    notificar(`✓ Material ${id} guardado exitosamente.`);
  };

  const handleBajaMaterial = (id: string) => {
    const mat = inventario.find(m => m.ID_material === id);
    if (!mat) return;
    const accion = confirm(`¿Desea dar de baja administrativa el material ${mat.Nombre_material} (${id})?\n\n- Aceptar: Marcar como estatus 'Baja' y retirar de disponibilidad.\n- Cancelar: Mantener como está.`);
    if (accion) {
      const updated: MaterialInventario = {
        ...mat,
        Estado: 'Baja',
        Cantidad_disponible: 0,
        Observaciones: `${mat.Observaciones ? mat.Observaciones + ' • ' : ''}Baja patrimonial: ${new Date().toLocaleDateString('es-MX')}`
      };
      MSBDatabase.saveMaterial(updated);
      notificar(`✓ Material ${id} dado de baja en el inventario.`);
    }
  };

  const handleMovimientoStock = (id: string, delta: number, motivo: string = 'Ajuste de inventario') => {
    const mat = inventario.find(m => m.ID_material === id);
    if (!mat) return;
    const nuevaTotal = Math.max(0, mat.Cantidad_total + delta);
    const nuevaDisp = Math.max(0, mat.Cantidad_disponible + delta);
    const updated: MaterialInventario = {
      ...mat,
      Cantidad_total: nuevaTotal,
      Cantidad_disponible: nuevaDisp,
      Estado: nuevaDisp > 0 ? (mat.Estado === 'Baja' ? 'Disponible' : mat.Estado) : 'Baja',
      Observaciones: `${mat.Observaciones ? mat.Observaciones + ' • ' : ''}${delta > 0 ? 'Alta' : 'Baja'} de ${Math.abs(delta)} ${mat.Unidad} (${motivo})`
    };
    MSBDatabase.saveMaterial(updated);
    notificar(`✓ Movimiento registrado: ${delta > 0 ? '+' : ''}${delta} ${mat.Unidad} en ${mat.Nombre_material}.`);
  };

  // ===================== CRUD ESPACIOS =====================
  const handleGuardarEspacio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEspacio.item?.Nombre) return;

    const id = modalEspacio.item.ID_espacio || `ESP-${String(espacios.length + 1).padStart(3, '0')}`;
    const espacioCompleto: Espacio = {
      ID_espacio: id,
      Nombre: modalEspacio.item.Nombre.trim(),
      Ubicacion: modalEspacio.item.Ubicacion || 'Edificio Central',
      Capacidad: Number(modalEspacio.item.Capacidad) || 30,
      Equipamiento: modalEspacio.item.Equipamiento || 'Equipamiento básico deportivo',
      Accesibilidad: modalEspacio.item.Accesibilidad || 'Acceso general',
      Responsable_ID: modalEspacio.item.Responsable_ID || 'PAR-00001',
      Estado: modalEspacio.item.Estado || 'Disponible',
      Observaciones: modalEspacio.item.Observaciones || ''
    };

    MSBDatabase.saveEspacio(espacioCompleto);
    setModalEspacio({ abierto: false, item: null, esNuevo: false });
    notificar(`✓ Espacio ${id} (${espacioCompleto.Nombre}) guardado exitosamente.`);
  };

  const handleBajaEspacio = (id: string) => {
    const esp = espacios.find(e => e.ID_espacio === id);
    if (!esp) return;
    if (confirm(`¿Desea dar de baja la instalación ${esp.Nombre} (${id})? Se cambiará su estado a 'Baja'.`)) {
      const updated: Espacio = {
        ...esp,
        Estado: 'Baja',
        Observaciones: `${esp.Observaciones ? esp.Observaciones + ' • ' : ''}Baja de instalación registrada el ${new Date().toLocaleDateString('es-MX')}`
      };
      MSBDatabase.saveEspacio(updated);
      notificar(`✓ Instalación ${id} dada de baja.`);
    }
  };

  // ===================== CRUD ACTIVIDADES =====================
  const handleGuardarActividad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalActividad.item?.Nombre) return;

    const id = modalActividad.item.ID_actividad || `ACT-${String(actividades.length + 1).padStart(3, '0')}`;
    const responsable = identidades.find(i => i.id === modalActividad.item?.Responsable_ID);

    const actividadCompleta: Actividad = {
      ID_actividad: id,
      Nombre: modalActividad.item.Nombre.trim(),
      Descripcion: modalActividad.item.Descripcion || '',
      Tipo: modalActividad.item.Tipo || 'Deportes',
      Responsable_ID: modalActividad.item.Responsable_ID || 'PAR-00001',
      Responsable_Nombre: responsable ? `${responsable.nombre} ${responsable.apellidos}` : 'Departamento de Deportes',
      Fecha_inicio: modalActividad.item.Fecha_inicio || '2026-09-01',
      Hora_inicio: modalActividad.item.Hora_inicio || '15:00',
      Fecha_fin: modalActividad.item.Fecha_fin || '2026-12-15',
      Hora_fin: modalActividad.item.Hora_fin || '16:30',
      Dias_sesion: modalActividad.item.Dias_sesion && modalActividad.item.Dias_sesion.length > 0 ? modalActividad.item.Dias_sesion : ['Lunes', 'Miércoles'],
      Cupo: Number(modalActividad.item.Cupo) || 25,
      Cupo_ocupado: modalActividad.item.Cupo_ocupado || 0,
      Modalidad_inscripción: modalActividad.item.Modalidad_inscripción || 'Libre',
      Requiere_autorización: modalActividad.item.Requiere_autorización || 'No',
      Espacio_ID: modalActividad.item.Espacio_ID || 'ESP-001',
      Espacio_Nombre: espacios.find(esp => esp.ID_espacio === modalActividad.item?.Espacio_ID)?.Nombre || 'Instalación Normalista',
      Estado: modalActividad.item.Estado || 'Activa',
      Fecha_publicación: modalActividad.item.Fecha_publicación || new Date().toISOString().substring(0, 10),
      Observaciones: modalActividad.item.Observaciones || ''
    };

    MSBDatabase.saveActividad(actividadCompleta);
    setModalActividad({ abierto: false, item: null, esNuevo: false });
    notificar(`✓ Actividad ${id} (${actividadCompleta.Nombre}) guardada exitosamente.`);
  };

  const handleBajaActividad = (id: string) => {
    const act = actividades.find(a => a.ID_actividad === id);
    if (!act) return;
    if (confirm(`¿Confirma dar de baja o cancelar la actividad/club ${act.Nombre} (${id})?`)) {
      const updated: Actividad = {
        ...act,
        Estado: 'Cancelada',
        Observaciones: `${act.Observaciones ? act.Observaciones + ' • ' : ''}Baja de club el ${new Date().toLocaleDateString('es-MX')}`
      };
      MSBDatabase.saveActividad(updated);
      notificar(`✓ Actividad ${id} dada de baja.`);
    }
  };

  // ===================== CRUD ENCARGADOS =====================
  const handleGuardarEncargado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEncargado.item?.nombre || !modalEncargado.item?.apellidos) {
      alert('Por favor ingrese el nombre y apellidos del encargado.');
      return;
    }

    if (modalEncargado.esNuevo) {
      // Alta de nuevo encargado institucional
      const nuevoId = `PAR-${String(identidades.length + 1).padStart(5, '0')}`;
      const usernameGenerado = modalEncargado.item.username || 
        `${modalEncargado.item.nombre.toLowerCase().replace(/\s+/g, '')}.${modalEncargado.item.apellidos.toLowerCase().split(' ')[0]}`;
      const correoGenerado = modalEncargado.item.correo || `${usernameGenerado}@enmfm.edu.mx`;

      const nuevoEncargado: Identidad = {
        id: nuevoId,
        username: usernameGenerado,
        pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // PIN default 1234
        nombre: modalEncargado.item.nombre.trim(),
        apellidos: modalEncargado.item.apellidos.trim(),
        sector: 'Docente',
        correo: correoGenerado,
        tipoCuenta: 'Institucional',
        estado: modalEncargado.item.estado || 'Activo',
        consentimiento: 'Sí',
        fechaAlta: new Date().toISOString(),
        rol: modalEncargado.item.rol || 'encargado',
        actividadAsignadaId: modalEncargado.item.actividadAsignadaId || undefined,
        observaciones: modalEncargado.item.observaciones || 'Encargado registrado por la Administración'
      };

      MSBDatabase.saveIdentidad(nuevoEncargado);

      // Si se asignó a un club, sincronizar la actividad
      if (nuevoEncargado.actividadAsignadaId) {
        const act = actividades.find(a => a.ID_actividad === nuevoEncargado.actividadAsignadaId);
        if (act) {
          act.Responsable_ID = nuevoEncargado.id;
          act.Responsable_Nombre = `${nuevoEncargado.nombre} ${nuevoEncargado.apellidos}`;
          MSBDatabase.saveActividad(act);
        }
      }

      setModalEncargado({ abierto: false, item: null, esNuevo: false });
      notificar(`✓ Nuevo encargado ${nuevoEncargado.nombre} ${nuevoEncargado.apellidos} dado de alta.`);
      return;
    }

    // Edición de encargado existente
    if (!modalEncargado.item.id) return;
    const identidadExistente = identidades.find(i => i.id === modalEncargado.item?.id);
    if (!identidadExistente) return;

    const updated: Identidad = {
      ...identidadExistente,
      nombre: modalEncargado.item.nombre || identidadExistente.nombre,
      apellidos: modalEncargado.item.apellidos || identidadExistente.apellidos,
      correo: modalEncargado.item.correo || identidadExistente.correo,
      username: modalEncargado.item.username || identidadExistente.username,
      rol: modalEncargado.item.rol || identidadExistente.rol,
      actividadAsignadaId: modalEncargado.item.actividadAsignadaId || undefined,
      estado: modalEncargado.item.estado || identidadExistente.estado,
      observaciones: modalEncargado.item.observaciones || identidadExistente.observaciones
    };

    MSBDatabase.saveIdentidad(updated);

    // Sincronizar el Responsable_ID en la actividad asignada
    if (updated.actividadAsignadaId) {
      const act = actividades.find(a => a.ID_actividad === updated.actividadAsignadaId);
      if (act) {
        act.Responsable_ID = updated.id;
        act.Responsable_Nombre = `${updated.nombre} ${updated.apellidos}`;
        MSBDatabase.saveActividad(act);
      }
    }

    setModalEncargado({ abierto: false, item: null, esNuevo: false });
    notificar(`✓ Encargado ${updated.nombre} ${updated.apellidos} actualizado exitosamente.`);
  };

  const handleBajaEncargado = (id: string) => {
    const enc = identidades.find(i => i.id === id);
    if (!enc) return;
    if (confirm(`¿Confirma dar de baja / desvincular a ${enc.nombre} ${enc.apellidos} como encargado?`)) {
      const updated: Identidad = {
        ...enc,
        actividadAsignadaId: undefined,
        estado: 'Inactivo',
        observaciones: `${enc.observaciones ? enc.observaciones + ' • ' : ''}Baja de encargado el ${new Date().toLocaleDateString('es-MX')}`
      };
      MSBDatabase.saveIdentidad(updated);
      notificar(`✓ Encargado ${enc.nombre} ${enc.apellidos} dado de baja.`);
    }
  };

  const totalPiezas = inventario.reduce((acc, m) => acc + m.Cantidad_total, 0);
  const piezasDisponibles = inventario.reduce((acc, m) => acc + m.Cantidad_disponible, 0);

  return (
    <div className="space-y-6 text-white">
      
      {/* Selector de Sección del Inventario Institucional */}
      <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-500/40 uppercase tracking-wider">
              Control Patrimonial y Operativo
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">
              Altas, bajas y edición autorizada para Administradores
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión de Inventario, Espacios, Clubes y Encargados
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Administra altas, bajas, condiciones, ubicaciones y la asignación de responsables para cada actividad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#061426] p-1.5 rounded-2xl border border-[#1e3555]">
          <button
            onClick={() => setSeccion('materiales')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              seccion === 'materiales' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#94a3b8] hover:text-white hover:bg-[#112240]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Materiales ({inventario.length})</span>
          </button>

          <button
            onClick={() => setSeccion('espacios')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              seccion === 'espacios' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#94a3b8] hover:text-white hover:bg-[#112240]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Espacios ({espacios.length})</span>
          </button>

          <button
            onClick={() => setSeccion('actividades')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              seccion === 'actividades' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-[#94a3b8] hover:text-white hover:bg-[#112240]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Actividades ({actividades.length})</span>
          </button>

          <button
            onClick={() => setSeccion('encargados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              seccion === 'encargados' ? 'bg-[#581c87] text-purple-200 shadow-xs border border-purple-400/40' : 'text-[#94a3b8] hover:text-white hover:bg-[#112240]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Encargados ({encargadosYDocentes.length})</span>
          </button>
        </div>
      </div>

      {/* Notificación de acción */}
      {mensaje && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/50' : 'bg-red-950/60 text-red-300 border border-red-600/50'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* SECCIÓN 1: MATERIALES E INVENTARIO */}
      {seccion === 'materiales' && (
        <div className="space-y-4">
          
          {/* Métricas y botón de alta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
              <div className="bg-[#0a192f] p-4 rounded-2xl border border-[#1e3a8a] shadow-xs">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase">Tipos de Artículos</div>
                <div className="text-xl font-bold text-white mt-0.5">{inventario.length} tipos</div>
              </div>
              <div className="bg-[#0a192f] p-4 rounded-2xl border border-[#1e3a8a] shadow-xs">
                <div className="text-[11px] font-semibold text-blue-400 uppercase">Stock Total</div>
                <div className="text-xl font-bold text-blue-300 mt-0.5">{totalPiezas} piezas</div>
              </div>
              <div className="bg-[#0a192f] p-4 rounded-2xl border border-[#1e3a8a] shadow-xs col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase">Disponibles</div>
                <div className="text-xl font-bold text-emerald-300 mt-0.5">{piezasDisponibles} piezas</div>
              </div>
            </div>

            <button
              onClick={() => setModalMaterial({
                abierto: true,
                esNuevo: true,
                item: {
                  ID_material: `MAT-${String(inventario.length + 1).padStart(3, '0')}`,
                  Nombre_material: '',
                  Categoria: 'Balones',
                  Cantidad_total: 10,
                  Cantidad_disponible: 10,
                  Unidad: 'Piezas',
                  Ubicacion: 'Bodega de Deportes',
                  Condicion: 'Excelente',
                  Estado: 'Disponible',
                  Observaciones: ''
                }
              })}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Alta de Material</span>
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-[#0a192f] rounded-2xl p-4 border border-[#1e3a8a] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#94a3b8]" />
              <span className="text-xs font-semibold text-[#d6e3ff]">Categoría:</span>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-2 bg-[#061426] border border-[#1e3555] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todas">Todas las categorías</option>
                <option value="Balones">Balones</option>
                <option value="Entrenamiento">Entrenamiento</option>
                <option value="Salud y Medición">Salud y Medición</option>
                <option value="Sonido y Eventos">Sonido y Eventos</option>
                <option value="Recreativo">Recreativo</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar material o ubicación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#061426] border border-[#1e3555] rounded-xl text-xs text-white placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabla de Materiales con Edición y Baja */}
          <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3555]">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre del Material</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-center">Cant. Total</th>
                  <th className="p-3 text-center">Disponible</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3 text-center">Condición</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3555]/60">
                {materialesFiltrados.map((m) => (
                  <tr key={m.ID_material} className="hover:bg-[#112240] transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-300">{m.ID_material}</td>
                    <td className="p-3 font-semibold text-white">{m.Nombre_material}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#112240] text-blue-200 border border-blue-500/30">
                        {m.Categoria}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-[#d6e3ff]">{m.Cantidad_total} {m.Unidad}</td>
                    <td className="p-3 text-center font-bold text-emerald-400">{m.Cantidad_disponible} {m.Unidad}</td>
                    <td className="p-3 text-[#94a3b8]">{m.Ubicacion}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.Condicion === 'Excelente' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40' : 'bg-blue-950/70 text-blue-300 border border-blue-500/40'
                      }`}>
                        {m.Condicion}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.Estado === 'Disponible' 
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          : m.Estado === 'Baja'
                          ? 'bg-red-950/70 text-red-300 border border-red-500/40'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                      }`}>
                        {m.Estado}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleMovimientoStock(m.ID_material, 1, 'Alta administrativa')}
                          title="Dar de alta 1 unidad (sumar al inventario)"
                          className="px-1.5 py-0.5 text-[11px] font-bold bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 rounded border border-emerald-500/40 transition-colors cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleMovimientoStock(m.ID_material, -1, 'Baja por desgaste o ajuste')}
                          title="Dar de baja 1 unidad (restar del inventario)"
                          className="px-1.5 py-0.5 text-[11px] font-bold bg-amber-950/60 text-amber-300 hover:bg-amber-900 rounded border border-amber-500/40 transition-colors cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => setModalMaterial({ abierto: true, item: { ...m }, esNuevo: false })}
                          title="Editar datos del material"
                          className="p-1.5 text-blue-400 hover:bg-[#112240] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBajaMaterial(m.ID_material)}
                          title="Dar de baja administrativa del inventario"
                          className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SECCIÓN 2: ESPACIOS E INSTALACIONES */}
      {seccion === 'espacios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalEspacio({
                abierto: true,
                esNuevo: true,
                item: {
                  ID_espacio: `ESP-${String(espacios.length + 1).padStart(3, '0')}`,
                  Nombre: '',
                  Ubicacion: 'Instalaciones Normalistas',
                  Capacidad: 50,
                  Equipamiento: '',
                  Accesibilidad: 'Rampa y acceso libre',
                  Estado: 'Disponible',
                  Observaciones: ''
                }
              })}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Alta de Espacio</span>
            </button>
          </div>

          <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3555]">
                <tr>
                  <th className="p-3">ID Espacio</th>
                  <th className="p-3">Nombre de la Instalación</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3 text-center">Capacidad Máxima</th>
                  <th className="p-3">Equipamiento Principal</th>
                  <th className="p-3">Accesibilidad</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3555]/60">
                {espaciosFiltrados.map((e) => (
                  <tr key={e.ID_espacio} className="hover:bg-[#112240] transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-300">{e.ID_espacio}</td>
                    <td className="p-3 font-bold text-white">{e.Nombre}</td>
                    <td className="p-3 text-[#94a3b8]">{e.Ubicacion}</td>
                    <td className="p-3 text-center font-bold text-blue-300">{e.Capacidad} personas</td>
                    <td className="p-3 text-[#94a3b8] max-w-xs">{e.Equipamiento}</td>
                    <td className="p-3 text-gray-400 text-[11px]">{e.Accesibilidad}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        e.Estado === 'Disponible' 
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                      }`}>
                        {e.Estado}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex space-x-1">
                        <button
                          onClick={() => setModalEspacio({ abierto: true, item: { ...e }, esNuevo: false })}
                          title="Editar espacio"
                          className="p-1.5 text-blue-400 hover:bg-[#112240] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBajaEspacio(e.ID_espacio)}
                          title="Dar de baja espacio"
                          className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: ACTIVIDADES Y CLUBES OFERTADOS */}
      {seccion === 'actividades' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalActividad({
                abierto: true,
                esNuevo: true,
                item: {
                  ID_actividad: `ACT-${String(actividades.length + 1).padStart(3, '0')}`,
                  Nombre: '',
                  Descripcion: '',
                  Tipo: 'Deportes',
                  Responsable_ID: 'PAR-00004',
                  Hora_inicio: '15:00',
                  Hora_fin: '16:30',
                  Dias_sesion: ['Lunes', 'Miércoles'],
                  Cupo: 30,
                  Espacio_ID: 'ESP-001',
                  Modalidad_inscripción: 'Libre',
                  Requiere_autorización: 'No',
                  Estado: 'Activa',
                  Observaciones: ''
                }
              })}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Alta de Actividad / Club</span>
            </button>
          </div>

          <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3555]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Club / Actividad</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Encargado Responsable</th>
                  <th className="p-3">Horario y Días</th>
                  <th className="p-3 text-center">Cupo Ocupado</th>
                  <th className="p-3">Espacio</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3555]/60">
                {actividadesFiltradas.map((a) => (
                  <tr key={a.ID_actividad} className="hover:bg-[#112240] transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-300">{a.ID_actividad}</td>
                    <td className="p-3 font-bold text-white">{a.Nombre}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/70 text-blue-300 border border-blue-500/40">
                        {a.Tipo}
                      </span>
                    </td>
                    <td className="p-3 text-[#d6e3ff] font-medium">{a.Responsable_Nombre || 'Departamento'}</td>
                    <td className="p-3 text-[#94a3b8]">
                      <div>{a.Hora_inicio} a {a.Hora_fin} hrs</div>
                      <div className="text-[10px] text-gray-400">{a.Dias_sesion?.join(', ') || 'Programados'}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-white">
                      {a.Cupo_ocupado || 0} / {a.Cupo}
                    </td>
                    <td className="p-3 text-[#94a3b8]">{a.Espacio_Nombre || a.Espacio_ID}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                        {a.Estado}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex space-x-1">
                        <button
                          onClick={() => setModalActividad({ abierto: true, item: { ...a }, esNuevo: false })}
                          title="Editar actividad"
                          className="p-1.5 text-blue-400 hover:bg-[#112240] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBajaActividad(a.ID_actividad)}
                          title="Dar de baja actividad"
                          className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: LISTA DE ENCARGADOS Y ASIGNACIÓN DE CLUBES */}
      {seccion === 'encargados' && (
        <div className="bg-[#0a192f] rounded-3xl p-6 border border-[#1e3a8a] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3555] pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Padrón de Encargados y Responsables de Club
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Vincula y asigna a cada docente o instructor la actividad deportiva o taller de bienestar que tiene a su cargo.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-[#94a3b8]">
                {encargadosYDocentes.length} usuarios operativos
              </span>
              <button
                onClick={() => setModalEncargado({
                  abierto: true,
                  esNuevo: true,
                  item: {
                    nombre: '',
                    apellidos: '',
                    correo: '',
                    username: '',
                    rol: 'encargado',
                    estado: 'Activo',
                    observaciones: 'Encargado de club deportivo'
                  }
                })}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Alta de Encargado</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#061426] text-[#94a3b8] font-bold border-b border-[#1e3555]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Usuario / Correo</th>
                  <th className="p-3">Rol en Plataforma</th>
                  <th className="p-3">Club / Actividad Asignada</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3555]/60">
                {encargadosYDocentes.map((enc) => {
                  const actAsignada = actividades.find(a => a.ID_actividad === enc.actividadAsignadaId);

                  return (
                    <tr key={enc.id} className="hover:bg-[#112240] transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-300">{enc.id}</td>
                      <td className="p-3 font-semibold text-white">
                        {enc.nombre} {enc.apellidos}
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-white font-semibold">@{enc.username}</div>
                        <div className="text-[10px] text-[#94a3b8]">{enc.correo}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          enc.rol === 'administrador'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : enc.rol === 'encargado'
                            ? 'bg-purple-950/70 text-purple-300 border border-purple-500/40'
                            : 'bg-blue-950/70 text-blue-300 border border-blue-500/40'
                        }`}>
                          {enc.rol.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        {actAsignada ? (
                          <div className="font-semibold text-purple-300">
                            {actAsignada.Nombre} <span className="text-[10px] font-mono text-purple-400">({actAsignada.ID_actividad})</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Sin club asignado</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          enc.estado === 'Activo' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400 border border-gray-600/40'
                        }`}>
                          {enc.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => setModalEncargado({ abierto: true, item: { ...enc }, esNuevo: false })}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 rounded-lg text-xs font-semibold border border-purple-500/40 transition-colors cursor-pointer"
                            title="Editar datos y asignar club"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleBajaEncargado(enc.id)}
                            className="p-1 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Dar de baja o desvincular encargado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL MATERIAL ================= */}
      {modalMaterial.abierto && modalMaterial.item && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in zoom-in-95 text-white">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <h3 className="text-base font-bold text-white">
                {modalMaterial.esNuevo ? '+ Alta de Material en Inventario' : `Editar Material: ${modalMaterial.item.ID_material}`}
              </h3>
              <button 
                onClick={() => setModalMaterial({ abierto: false, item: null, esNuevo: false })}
                className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#112240] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Nombre del Material *</label>
                <input
                  type="text"
                  required
                  value={modalMaterial.item.Nombre_material || ''}
                  onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Nombre_material: e.target.value } })}
                  placeholder="Ej. Balón de Voleibol Molten V5M5000"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Categoría</label>
                  <select
                    value={modalMaterial.item.Categoria || 'Balones'}
                    onChange={(e: any) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Categoria: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    <option value="Balones">Balones</option>
                    <option value="Entrenamiento">Entrenamiento</option>
                    <option value="Salud y Medición">Salud y Medición</option>
                    <option value="Sonido y Eventos">Sonido y Eventos</option>
                    <option value="Recreativo">Recreativo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Unidad</label>
                  <input
                    type="text"
                    value={modalMaterial.item.Unidad || 'Piezas'}
                    onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Unidad: e.target.value } })}
                    placeholder="Piezas, Juegos, Pares..."
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Cantidad Total</label>
                  <input
                    type="number"
                    min={0}
                    value={modalMaterial.item.Cantidad_total ?? 10}
                    onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Cantidad_total: Number(e.target.value) } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Cantidad Disponible</label>
                  <input
                    type="number"
                    min={0}
                    value={modalMaterial.item.Cantidad_disponible ?? 10}
                    onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Cantidad_disponible: Number(e.target.value) } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Ubicación / Almacén</label>
                  <input
                    type="text"
                    value={modalMaterial.item.Ubicacion || ''}
                    onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Ubicacion: e.target.value } })}
                    placeholder="Bodega de Deportes..."
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Condición</label>
                  <select
                    value={modalMaterial.item.Condicion || 'Excelente'}
                    onChange={(e: any) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Condicion: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Buena">Buena</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Estatus del Material</label>
                <select
                  value={modalMaterial.item.Estado || 'Disponible'}
                  onChange={(e: any) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Estado: e.target.value } })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En préstamo">En préstamo</option>
                  <option value="En reparación">En reparación</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={modalMaterial.item.Observaciones || ''}
                  onChange={(e) => setModalMaterial({ ...modalMaterial, item: { ...modalMaterial.item, Observaciones: e.target.value } })}
                  placeholder="Detalles sobre uso, mantenimiento o proveedor..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalMaterial({ abierto: false, item: null, esNuevo: false })}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1e3555] text-white rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ESPACIO ================= */}
      {modalEspacio.abierto && modalEspacio.item && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in zoom-in-95 text-white">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <h3 className="text-base font-bold text-white">
                {modalEspacio.esNuevo ? '+ Alta de Instalación o Espacio' : `Editar Espacio: ${modalEspacio.item.ID_espacio}`}
              </h3>
              <button 
                onClick={() => setModalEspacio({ abierto: false, item: null, esNuevo: false })}
                className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#112240] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEspacio} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Nombre del Espacio *</label>
                <input
                  type="text"
                  required
                  value={modalEspacio.item.Nombre || ''}
                  onChange={(e) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Nombre: e.target.value } })}
                  placeholder="Ej. Gimnasio Polivalente"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={modalEspacio.item.Ubicacion || ''}
                    onChange={(e) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Ubicacion: e.target.value } })}
                    placeholder="Edificio Central..."
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Capacidad Máxima</label>
                  <input
                    type="number"
                    min={1}
                    value={modalEspacio.item.Capacidad ?? 50}
                    onChange={(e) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Capacidad: Number(e.target.value) } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Equipamiento Principal</label>
                <input
                  type="text"
                  value={modalEspacio.item.Equipamiento || ''}
                  onChange={(e) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Equipamiento: e.target.value } })}
                  placeholder="Duela, canastas, red, audio..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Accesibilidad</label>
                <input
                  type="text"
                  value={modalEspacio.item.Accesibilidad || ''}
                  onChange={(e) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Accesibilidad: e.target.value } })}
                  placeholder="Rampa de acceso, elevador, planta baja..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Estatus del Espacio</label>
                <select
                  value={modalEspacio.item.Estado || 'Disponible'}
                  onChange={(e: any) => setModalEspacio({ ...modalEspacio, item: { ...modalEspacio.item, Estado: e.target.value } })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Ocupado">Ocupado</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalEspacio({ abierto: false, item: null, esNuevo: false })}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1e3555] text-white rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Espacio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ACTIVIDAD ================= */}
      {modalActividad.abierto && modalActividad.item && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <h3 className="text-base font-bold text-white">
                {modalActividad.esNuevo ? '+ Alta de Actividad / Club' : `Editar Actividad: ${modalActividad.item.ID_actividad}`}
              </h3>
              <button 
                onClick={() => setModalActividad({ abierto: false, item: null, esNuevo: false })}
                className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#112240] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarActividad} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Nombre del Club o Actividad *</label>
                <input
                  type="text"
                  required
                  value={modalActividad.item.Nombre || ''}
                  onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Nombre: e.target.value } })}
                  placeholder="Ej. Taller de Voleibol Mixto"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={modalActividad.item.Descripcion || ''}
                  onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Descripcion: e.target.value } })}
                  placeholder="Propósito, dinámicas y objetivos formativos..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Tipo de Actividad</label>
                  <select
                    value={modalActividad.item.Tipo || 'Deportes'}
                    onChange={(e: any) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Tipo: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    <option value="Deportes">Deportes</option>
                    <option value="Salud">Salud</option>
                    <option value="Bienestar">Bienestar</option>
                    <option value="Pausas Activas">Pausas Activas</option>
                    <option value="Torneo">Torneo</option>
                    <option value="Recreativo">Recreativo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Encargado Responsable</label>
                  <select
                    value={modalActividad.item.Responsable_ID || 'PAR-00004'}
                    onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Responsable_ID: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    {encargadosYDocentes.map(enc => (
                      <option key={enc.id} value={enc.id}>
                        {enc.nombre} {enc.apellidos} ({enc.rol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={modalActividad.item.Hora_inicio || '15:00'}
                    onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Hora_inicio: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={modalActividad.item.Hora_fin || '16:30'}
                    onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Hora_fin: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Cupo Total</label>
                  <input
                    type="number"
                    min={1}
                    value={modalActividad.item.Cupo ?? 25}
                    onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Cupo: Number(e.target.value) } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Espacio Asignado</label>
                  <select
                    value={modalActividad.item.Espacio_ID || 'ESP-001'}
                    onChange={(e) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Espacio_ID: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    {espacios.map(esp => (
                      <option key={esp.ID_espacio} value={esp.ID_espacio}>
                        {esp.Nombre} ({esp.ID_espacio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Estatus</label>
                <select
                  value={modalActividad.item.Estado || 'Activa'}
                  onChange={(e: any) => setModalActividad({ ...modalActividad, item: { ...modalActividad.item, Estado: e.target.value } })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                >
                  <option value="Activa">Activa</option>
                  <option value="En curso">En curso</option>
                  <option value="Concluida">Concluida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalActividad({ abierto: false, item: null, esNuevo: false })}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1e3555] text-white rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Actividad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ENCARGADO / ASIGNACIÓN ================= */}
      {modalEncargado.abierto && modalEncargado.item && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a192f] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#1e3a8a] space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-[#1e3555] pb-3">
              <h3 className="text-base font-bold text-white">
                {modalEncargado.esNuevo ? '+ Alta de Nuevo Encargado de Club' : `Editar Encargado: ${modalEncargado.item.nombre || ''} ${modalEncargado.item.apellidos || ''}`}
              </h3>
              <button 
                onClick={() => setModalEncargado({ abierto: false, item: null, esNuevo: false })}
                className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#112240] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEncargado} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={modalEncargado.item.nombre || ''}
                    onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, nombre: e.target.value } })}
                    placeholder="Ej. Laura"
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={modalEncargado.item.apellidos || ''}
                    onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, apellidos: e.target.value } })}
                    placeholder="Ej. Cantú Morales"
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    value={modalEncargado.item.correo || ''}
                    onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, correo: e.target.value } })}
                    placeholder="ejemplo@enmfm.edu.mx"
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Usuario (@)</label>
                  <input
                    type="text"
                    value={modalEncargado.item.username || ''}
                    onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, username: e.target.value } })}
                    placeholder="laura.cantu"
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Club o Actividad Asignada</label>
                <select
                  value={modalEncargado.item.actividadAsignadaId || ''}
                  onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, actividadAsignadaId: e.target.value } })}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">-- Sin club asignado (solo docencia / apoyo) --</option>
                  {actividades.map(act => (
                    <option key={act.ID_actividad} value={act.ID_actividad}>
                      {act.Nombre} ({act.ID_actividad})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#94a3b8] mt-1 block">
                  El encargado podrá gestionar y tomar asistencias sincrónicas y por calendario exclusivamente de este club.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Rol en el Sistema</label>
                  <select
                    value={modalEncargado.item.rol || 'encargado'}
                    onChange={(e: any) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, rol: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="encargado">Encargado de Club</option>
                    <option value="docente">Docente</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#d6e3ff] mb-1">Estatus</label>
                  <select
                    value={modalEncargado.item.estado || 'Activo'}
                    onChange={(e: any) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, estado: e.target.value } })}
                    className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#d6e3ff] mb-1">Observaciones / Notas</label>
                <textarea
                  rows={2}
                  value={modalEncargado.item.observaciones || ''}
                  onChange={(e) => setModalEncargado({ ...modalEncargado, item: { ...modalEncargado.item, observaciones: e.target.value } })}
                  placeholder="Detalles sobre asignación o especialidad..."
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1e3555]">
                <button
                  type="button"
                  onClick={() => setModalEncargado({ abierto: false, item: null, esNuevo: false })}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1e3555] text-white rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{modalEncargado.esNuevo ? 'Crear Encargado' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
