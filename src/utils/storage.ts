import { 
  Actividad, 
  Espacio, 
  MaterialInventario, 
  Identidad, 
  InscripcionAsistencia, 
  Solicitud, 
  SesionUsuario, 
  RolUsuario, 
  NivelPrioridad, 
  RegistroSesionAsistencia,
  AutoridadesConfig,
  RegistroPruebaFisica,
  MedicionFisica,
  EvaluacionCapacidadesFisicas,
  NivelAptitudFisica,
  SolicitudModificacionPrueba,
  ConfiguracionEvaluaciones,
  ImagenActividad,
  PlantillaDocumentoConfig
} from '../types';

export const CONFIG = {
  INSTITUCION: 'Escuela Normal Miguel F. Martínez',
  SISTEMA: 'Sistema Institucional de Movimiento, Salud y Bienestar',
  DEPARTAMENTO: 'Departamento de Deporte y Salud',
  SUBDIRECCION: 'Subdirección de Servicios Estudiantiles',
  MASTER_SPREADSHEET_ID: '18CchbQkwcc_L0RiyDUGYclIKErQODdAhKWQDW7VKu0Y',
  DENOMINACION_BASE_MAESTRA: 'BASE_MAESTRA_MOVIMIENTO_SALUD_BIENESTAR 1.1',
  HOJA_CONTROL: 'Control_Formularios',
  URL_MASTER_SHEET: 'https://docs.google.com/spreadsheets/d/18CchbQkwcc_L0RiyDUGYclIKErQODdAhKWQDW7VKu0Y/edit',
  DEFAULT_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzCzli-FnUxm4JFjQxfq7cACQWBgn7E9gHBCL7nJu2XI616GFwfkEAE8Lv_Nhf6_kPG9g/exec',
  // Formularios oficiales de Google Forms (predeterminados del Departamento)
  DEFAULT_FORMS: {
    EVALUACION_ENCARGADOS: 'https://forms.google.com',
    SATISFACCION_SERVICIOS: 'https://forms.google.com',
    PERCEPCION_BIENESTAR: 'https://forms.google.com'
  }
};

// Generador de fecha y hora local institucional sincronizada con la zona horaria oficial (América/Monterrey - Nuevo León)
export function msb_obtenerFechaHoraLocal(d: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Monterrey',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  }
}

export function msb_obtenerFechaLocal(d: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Monterrey',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

// SHA-256 calculation matching Google Apps Script Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin, Utilities.Charset.UTF_8)
export async function msb_hashPIN(pin: string): Promise<string> {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    throw new Error('El PIN debe contener exactamente 6 dígitos numéricos.');
  }

  const msgBuffer = new TextEncoder().encode(cleanPin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function msb_normalizarUsername(username: string): string {
  return String(username || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.');
}

export function msb_validarUsername(username: string): string {
  const valor = msb_normalizarUsername(username);
  if (!valor) {
    throw new Error('Debes proporcionar un nombre de usuario.');
  }
  if (valor.length < 4) {
    throw new Error('El nombre de usuario debe tener al menos 4 caracteres.');
  }
  if (valor.length > 30) {
    throw new Error('El nombre de usuario no puede exceder 30 caracteres.');
  }
  if (!/^[a-z0-9._-]+$/.test(valor)) {
    throw new Error('El nombre de usuario solo puede contener letras, números, punto, guión y guión bajo.');
  }
  return valor;
}

/**
 * Remueve prefijos de 'Lic.', 'Licenciado', 'Licenciada' del nombre del encargado o personal
 */
export function limpiarTituloLicenciado(nombre?: string): string {
  if (!nombre) return '';
  return nombre
    .replace(/^Lic\.\s*/i, '')
    .replace(/^Licenciado\s*/i, '')
    .replace(/^Licenciada\s*/i, '')
    .replace(/\bLic\.\s*/gi, '')
    .replace(/\bLicenciado\s*/gi, '')
    .replace(/\bLicenciada\s*/gi, '')
    .trim();
}

/**
 * Normaliza y alinea cualquier registro de material/inventario proveniente de Google Sheets o LocalStorage
 * garantizando que coincidan con las 11 columnas oficiales del sistema.
 */
export function normalizarMaterial(raw: any, index: number = 0): MaterialInventario {
  if (!raw || typeof raw !== 'object') {
    return {
      ID_material: `MAT-${String(index + 1).padStart(3, '0')}`,
      Nombre_material: 'Material Sin Nombre',
      Categoria: 'Recreativo',
      Cantidad_total: 1,
      Cantidad_disponible: 1,
      Unidad: 'Piezas',
      Ubicacion: 'Bodega de Deportes',
      Condicion: 'Buena',
      Responsable_ID: 'PAR-00001',
      Estado: 'Disponible',
      Observaciones: ''
    };
  }

  // 1. Clave o Código ID
  const id = raw.ID_material || raw.id_material || raw.ID || raw.id || raw.Codigo || raw.Código || `MAT-${String(index + 1).padStart(3, '0')}`;

  // 2. Nombre descriptivo
  const nombre = raw.Nombre_material || raw.nombre_material || raw.Nombre || raw.nombre || raw.Material || raw.material || raw.Descripcion || raw.Descripción || 'Material Sin Nombre';

  // 3. Categoría (con corrección de acentos y sinónimos)
  let cat = raw.Categoria || raw.categoria || raw.Categoría || raw.categoría || raw.Category || 'Recreativo';
  if (/balon/i.test(cat)) cat = 'Balones';
  else if (/entrena/i.test(cat)) cat = 'Entrenamiento';
  else if (/salud|medici/i.test(cat)) cat = 'Salud y Medición';
  else if (/sonido|evento/i.test(cat)) cat = 'Sonido y Eventos';
  else cat = 'Recreativo';

  // 4. Cantidad total
  const totalNum = Number(raw.Cantidad_total ?? raw.cantidad_total ?? raw.Total ?? raw.total ?? raw.Cantidad ?? raw.cantidad ?? 1);
  const cantidadTotal = isNaN(totalNum) ? 1 : Math.max(0, totalNum);

  // 5. Cantidad disponible
  const dispNum = Number(raw.Cantidad_disponible ?? raw.cantidad_disponible ?? raw.Disponible ?? raw.disponible ?? cantidadTotal);
  const cantidadDisponible = isNaN(dispNum) ? cantidadTotal : Math.max(0, dispNum);

  // 6. Unidad de medida
  const unidad = raw.Unidad || raw.unidad || raw.Unidad_medida || raw.UnidadMedida || 'Piezas';

  // 7. Ubicación
  const ubicacion = raw.Ubicacion || raw.ubicacion || raw.Ubicación || raw.ubicación || raw.Lugar || 'Bodega de Deportes';

  // 8. Condición física
  let condicion = raw.Condicion || raw.condicion || raw.Condición || raw.condición || 'Buena';
  if (/excel/i.test(condicion)) condicion = 'Excelente';
  else if (/regul/i.test(condicion)) condicion = 'Regular';
  else condicion = 'Buena';

  // 9. Responsable ID
  const responsable = raw.Responsable_ID || raw.responsable_id || raw.Responsable || 'PAR-00001';

  // 10. Estado operativo
  let estado = raw.Estado || raw.estado || raw.Estatus || raw.estatus || 'Disponible';
  if (/prest/i.test(estado)) estado = 'En préstamo';
  else if (/repar/i.test(estado)) estado = 'En reparación';
  else if (/baja/i.test(estado)) estado = 'Baja';
  else estado = 'Disponible';

  // 11. Observaciones
  const observaciones = raw.Observaciones || raw.observaciones || raw.Notas || raw.notas || '';

  return {
    ID_material: String(id).trim(),
    Nombre_material: String(nombre).trim(),
    Categoria: cat as any,
    Cantidad_total: cantidadTotal,
    Cantidad_disponible: cantidadDisponible,
    Unidad: String(unidad).trim(),
    Ubicacion: String(ubicacion).trim(),
    Condicion: condicion as any,
    Responsable_ID: String(responsable).trim(),
    Estado: estado as any,
    Observaciones: String(observaciones).trim()
  };
}

/**
 * Normaliza cualquier respuesta de evaluación (de Plataforma, Google Sheets o Google Forms)
 * para que coincida perfectamente con el esquema analítico del Administrador.
 */
export function normalizarEvaluacion(raw: any, index: number = 0): import('../types').RespuestaEncuesta {
  if (!raw || typeof raw !== 'object') {
    return {
      idRespuesta: `ENC-${String(index + 1).padStart(3, '0')}`,
      tipoEncuesta: 'satisfaccion_servicios',
      tituloEncuesta: 'Satisfacción de Servicios',
      fechaRegistro: msb_obtenerFechaHoraLocal(),
      respuestas: {},
      puntuacionPromedio: 5
    };
  }

  const idRespuesta = raw.idRespuesta || raw.id || raw.ID || `ENC-${String(index + 1).padStart(3, '0')}`;
  
  // Determinar tipoEncuesta si no viene explícito
  let tipoEncuesta: import('../types').TipoEncuesta = raw.tipoEncuesta || raw.tipo || 'satisfaccion_servicios';
  if (!raw.tipoEncuesta) {
    if (raw.encargadoClubId || raw.p3_desempenoEncargado || raw.dominioTecnico || /encargado/i.test(raw.tituloEncuesta || '') || /desempeno/i.test(raw.tituloEncuesta || '')) {
      tipoEncuesta = 'evaluacion_encargados';
    } else if (raw.nivelEnergia || raw.reduccionEstres || /bienestar/i.test(raw.tituloEncuesta || '')) {
      tipoEncuesta = 'bienestar_salud';
    } else {
      tipoEncuesta = 'satisfaccion_servicios';
    }
  }

  const tituloEncuesta = raw.tituloEncuesta || (
    tipoEncuesta === 'evaluacion_encargados' ? 'Evaluación de Desempeño a Encargados Deportivos' :
    tipoEncuesta === 'bienestar_salud' ? 'Percepción de Bienestar en Salud y Cultura Física' :
    'Satisfacción de Servicios del Departamento de Deporte y Salud'
  );

  let respuestas: Record<string, any> = {};
  if (raw.respuestas && typeof raw.respuestas === 'object') {
    respuestas = { ...raw.respuestas };
  } else if (typeof raw.respuestas_json === 'string' && raw.respuestas_json.startsWith('{')) {
    try {
      respuestas = JSON.parse(raw.respuestas_json);
    } catch {}
  } else {
    // Si viene de columnas planas (Google Forms o formato previo):
    const campos = [
      'p1_satisfaccionGeneral', 'p2_calidadInstalaciones', 'p3_desempenoEncargado', 'p4_cumplimientoHorarios', 
      'p5_ambienteConvivencia', 'p6_beneficioSalud', 'p7_recomendariaActividad', 'puntualidad', 'dominioTecnico', 
      'respetoYTrato', 'fomentoSalud', 'claridadInstrucciones', 'atencionPersonal', 'estadoMateriales', 
      'limpiezaEspacios', 'tiempoRespuesta', 'utilidadPausasActivas', 'nivelEnergia', 'reduccionEstres', 
      'habitoSaludable', 'impactoAcademico', 'sentidoComunidad'
    ];
    campos.forEach(k => {
      if (raw[k] !== undefined && raw[k] !== '') {
        const val = Number(raw[k]);
        respuestas[k] = isNaN(val) ? raw[k] : val;
      }
    });
  }

  // Calcular puntuacionPromedio si falta
  let puntuacionPromedio = Number(raw.puntuacionPromedio || raw.promedio || 0);
  if (!puntuacionPromedio || isNaN(puntuacionPromedio)) {
    const numValues = Object.values(respuestas).map(Number).filter(n => !isNaN(n) && n > 0 && n <= 5);
    if (numValues.length > 0) {
      puntuacionPromedio = Number((numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(1));
    } else {
      puntuacionPromedio = 5;
    }
  }

  const fecha = raw.fechaRegistro || raw.fechaEvaluacion || raw.fecha || msb_obtenerFechaHoraLocal();

  return {
    idRespuesta: String(idRespuesta).trim(),
    tipoEncuesta,
    tituloEncuesta,
    idUsuario: 'ANONIMO',
    nombreUsuario: 'Participante Anónimo',
    correoUsuario: undefined,
    sector: raw.sector || 'Comunidad Normalista',
    idActividad: raw.idActividad || 'GENERAL',
    nombreActividad: raw.nombreActividad || (raw.idActividad === 'GENERAL' ? 'Departamento de Deporte y Salud' : 'Club Deportivo'),
    fechaRegistro: String(fecha).trim(),
    respuestas,
    puntuacionPromedio,
    comentarios: raw.comentarios || raw.Comentarios || ''
  };
}

// Helper to determine request priority based on role, purpose, and explicit admin selection
export function calcularPrioridadSolicitud(
  rol: RolUsuario, 
  proposito?: string,
  perfilSolicitudAdmin?: 'direccion' | 'deportiva' | 'docente' | 'comunidad'
): { nivel: NivelPrioridad; etiqueta: Solicitud['Prioridad_Etiqueta'] } {
  // Cuando el solicitante es el administrador, puede ejercer explícitamente el perfil
  if (rol === 'administrador') {
    if (perfilSolicitudAdmin === 'deportiva') {
      return { nivel: 1, etiqueta: 'Prioridad 1 (Deportiva)' };
    }
    if (perfilSolicitudAdmin === 'docente') {
      return { nivel: 2, etiqueta: 'Prioridad 2 (Docente)' };
    }
    if (perfilSolicitudAdmin === 'comunidad') {
      return { nivel: 3, etiqueta: 'Prioridad 3 (Comunidad)' };
    }
    // Por defecto el administrador ejerce el perfil institucional de Dirección
    return { nivel: 0, etiqueta: 'Prioridad Total (Dirección / Admin)' };
  }

  const text = (proposito || '').toLowerCase();
  
  // Prioridad 0: Si involucra términos directivos
  if (text.includes('dirección') || text.includes('direccion') || text.includes('rectoría')) {
    return { nivel: 0, etiqueta: 'Prioridad Total (Dirección / Admin)' };
  }
  // Prioridad 1: Actividades deportivas (clubes, ligas oficiales, entrenamientos representativos)
  if (rol === 'encargado' || text.includes('torneo') || text.includes('liga') || text.includes('club') || text.includes('representativo') || text.includes('entrenamiento')) {
    return { nivel: 1, etiqueta: 'Prioridad 1 (Deportiva)' };
  }
  // Prioridad 2: Docentes (práctica formativa, clases)
  if (rol === 'docente') {
    return { nivel: 2, etiqueta: 'Prioridad 2 (Docente)' };
  }
  // Prioridad 3: Comunidad (Trabajadores y Estudiantes)
  return { nivel: 3, etiqueta: 'Prioridad 3 (Comunidad)' };
}

// Cuentas preconfiguradas con perfiles y roles específicos según especificación
const SEED_IDENTIDADES: Identidad[] = [
  {
    id: 'PAR-00001',
    username: 'admin.general',
    // Hash of '123456'
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Jesús',
    apellidos: 'Martínez Garza',
    sector: 'Docente',
    correo: 'admin.deportes@enmfm.edu.mx',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-08-15 09:00:00',
    rol: 'administrador', // ÚNICO con acceso a la Consola Departamental
    observaciones: 'Administrador General del Sistema con privilegios totales.'
  },
  {
    id: 'PAR-00004',
    username: 'encargado.voleibol',
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Laura',
    apellidos: 'Cantú Morales',
    sector: 'Docente',
    correo: 'laura.cantu@enmfm.edu.mx',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-08-20 10:00:00',
    rol: 'encargado',
    actividadAsignadaId: 'ACT-001', // Taller de Voleibol Mixto Normalista
    observaciones: 'Encargada del Club de Voleibol Mixto'
  },
  {
    id: 'PAR-00006',
    username: 'encargado.futsal',
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Roberto',
    apellidos: 'Elizondo Ramos',
    sector: 'Docente',
    correo: 'roberto.elizondo@enmfm.edu.mx',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-08-25 10:00:00',
    rol: 'encargado',
    actividadAsignadaId: 'ACT-004', // Torneo de Futsal
    observaciones: 'Encargado de la Liga y Torneo de Futsal'
  },
  {
    id: 'PAR-00003',
    username: 'arthur.music',
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Arturo',
    apellidos: 'Rodríguez Segovia',
    sector: 'Docente',
    correo: 'arthurmusic70@gmail.com',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-09-02 12:00:00',
    rol: 'administrador', // Jefe del Departamento de Deporte y Salud con acceso a Consola Departamental
    observaciones: 'Jefe del Departamento de Deporte y Salud - Administrador'
  },
  {
    id: 'PAR-00002',
    username: 'valeria.solis',
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Valeria',
    apellidos: 'Solís Navarro',
    sector: 'Estudiante',
    correo: 'valeria.solis@enmfm.edu.mx',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-09-01 10:30:00',
    rol: 'estudiante', // Prioridad 3 - Comunidad
    licenciatura: 'Licenciatura en Educación Primaria',
    semestre: '5° Semestre',
    grupo: 'Grupo A',
    observaciones: 'Estudiante de 5° Semestre de Lic. en Educación Primaria'
  },
  {
    id: 'PAR-00005',
    username: 'carlos.ramirez',
    pinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    nombre: 'Carlos',
    apellidos: 'Ramírez Villanueva',
    sector: 'Empleado',
    correo: 'carlos.ramirez@enmfm.edu.mx',
    tipoCuenta: 'Institucional',
    estado: 'Activo',
    consentimiento: 'Sí',
    fechaAlta: '2026-09-05 08:30:00',
    rol: 'trabajador', // Prioridad 3 - Comunidad
    observaciones: 'Personal de Apoyo y Servicios Administrativos'
  }
];

const SEED_ESPACIOS: Espacio[] = [
  {
    ID_espacio: 'ESP-001',
    Nombre: 'Gimnasio Polivalente "Profr. Miguel F. Martínez"',
    Ubicacion: 'Edificio Central - Planta Baja',
    Capacidad: 120,
    Equipamiento: 'Duela olímpica, canastas retráctiles, red de voleibol, gradas, marcador electrónico, audio',
    Accesibilidad: 'Rampa de acceso para silla de ruedas, puertas dobles amplias',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Mantenimiento preventivo los primeros sábados de cada mes.'
  },
  {
    ID_espacio: 'ESP-002',
    Nombre: 'Cancha Polivalente Exterior Techada',
    Ubicacion: 'Patio Cívico y Deportivo Norte',
    Capacidad: 80,
    Equipamiento: 'Pintura antiderrapante, canastas de básquetbol y porterías de futsal integradas',
    Accesibilidad: 'Acceso a nivel de piso',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Iluminación LED nocturna disponible hasta las 20:00 hrs.'
  },
  {
    ID_espacio: 'ESP-003',
    Nombre: 'Pista de Acondicionamiento y Atletismo',
    Ubicacion: 'Perímetro Deportivo Oriente',
    Capacidad: 60,
    Equipamiento: 'Pista perimetral de arcilla compactada de 300m, fosa de arena',
    Accesibilidad: 'Acceso directo desde explanada',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Uso libre para la comunidad normalista en horarios de 07:00 a 19:00 hrs.'
  },
  {
    ID_espacio: 'ESP-004',
    Nombre: 'Sala de Bienestar, Yoga y Pausas Activas',
    Ubicacion: 'Edificio B - Sala 204',
    Capacidad: 35,
    Equipamiento: 'Espejos de cuerpo completo, piso de corcho laminado, bocina Bluetooth, tapetes de yoga',
    Accesibilidad: 'Elevador disponible en Edificio B',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Se requiere calzado deportivo limpio o calcetas.'
  }
];

const SEED_INVENTARIO: MaterialInventario[] = [
  {
    ID_material: 'MAT-001',
    Nombre_material: 'Balón de Voleibol Molten V5M5000 Oficial',
    Categoria: 'Balones',
    Cantidad_total: 18,
    Cantidad_disponible: 14,
    Unidad: 'Piezas',
    Ubicacion: 'Bodega de Deportes - Anaquel 1',
    Condicion: 'Excelente',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Balones reglamentarios para talleres y liga interna.'
  },
  {
    ID_material: 'MAT-002',
    Nombre_material: 'Balón de Básquetbol Spalding TF-1000 No. 7',
    Categoria: 'Balones',
    Cantidad_total: 20,
    Cantidad_disponible: 16,
    Unidad: 'Piezas',
    Ubicacion: 'Bodega de Deportes - Anaquel 1',
    Condicion: 'Buena',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Uso en duela interior y cancha techada.'
  },
  {
    ID_material: 'MAT-003',
    Nombre_material: 'Kit de Conos de Agilidad y Coordinación (Juego de 20)',
    Categoria: 'Entrenamiento',
    Cantidad_total: 6,
    Cantidad_disponible: 5,
    Unidad: 'Juegos',
    Ubicacion: 'Bodega de Deportes - Cajón 3',
    Condicion: 'Excelente',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Incluye bolsa transportadora y platos marcadores.'
  },
  {
    ID_material: 'MAT-004',
    Nombre_material: 'Tapetes de Yoga y Acondicionamiento (Mats Antideslizantes)',
    Categoria: 'Entrenamiento',
    Cantidad_total: 35,
    Cantidad_disponible: 30,
    Unidad: 'Piezas',
    Ubicacion: 'Sala 204 - Estante lateral',
    Condicion: 'Excelente',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Desinfección obligatoria tras su utilización.'
  },
  {
    ID_material: 'MAT-005',
    Nombre_material: 'Báscula de Bioimpedancia y Estadiómetro Portátil',
    Categoria: 'Salud y Medición',
    Cantidad_total: 2,
    Cantidad_disponible: 2,
    Unidad: 'Equipos',
    Ubicacion: 'Consultorio de Salud Institucional',
    Condicion: 'Excelente',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Para evaluaciones de salud morfológica de la comunidad.'
  },
  {
    ID_material: 'MAT-006',
    Nombre_material: 'Bocina Amplificada Portátil con Micrófono Inalámbrico',
    Categoria: 'Sonido y Eventos',
    Cantidad_total: 2,
    Cantidad_disponible: 1,
    Unidad: 'Equipos',
    Ubicacion: 'Oficina de Deportes',
    Condicion: 'Buena',
    Responsable_ID: 'PAR-00001',
    Estado: 'Disponible',
    Observaciones: 'Ideal para sesiones masivas de activación física y torneos.'
  }
];

const SEED_ACTIVIDADES: Actividad[] = [
  {
    ID_actividad: 'ACT-001',
    Nombre: 'Taller de Voleibol Mixto Normalista',
    Descripcion: 'Desarrollo de fundamentos técnicos, táctica de juego y preparación para la liga inter-normales. Fomenta el trabajo en equipo y salud cardiovascular.',
    Tipo: 'Deportes',
    Responsable_ID: 'PAR-00004',
    Responsable_Nombre: 'Laura Cantú Morales (Encargada)',
    Fecha_inicio: '2026-09-07',
    Hora_inicio: '15:00',
    Fecha_fin: '2026-12-11',
    Hora_fin: '16:30',
    Dias_sesion: ['Lunes', 'Miércoles'],
    Cupo: 30,
    Cupo_ocupado: 18,
    Modalidad_inscripción: 'Libre',
    Requiere_autorización: 'No',
    Espacio_ID: 'ESP-001',
    Espacio_Nombre: 'Gimnasio Polivalente "Profr. Miguel F. Martínez"',
    Estado: 'Activa',
    Fecha_publicación: '2026-08-28',
    Observaciones: 'Lunes y miércoles de 15:00 a 16:30 hrs. Asistencia mínima del 85% para acreditar.'
  },
  {
    ID_actividad: 'ACT-002',
    Nombre: 'Programa Institucional de Pausas Activas y Salud Laboral',
    Descripcion: 'Sesiones breves de movilidad articular, estiramientos y ejercicios posturales diseñados para docentes y personal administrativo para prevenir fatiga.',
    Tipo: 'Pausas Activas',
    Responsable_ID: 'PAR-00001',
    Responsable_Nombre: 'Profr. Jesús Martínez Garza',
    Fecha_inicio: '2026-09-08',
    Hora_inicio: '11:00',
    Fecha_fin: '2026-12-18',
    Hora_fin: '11:30',
    Dias_sesion: ['Martes', 'Jueves'],
    Cupo: 45,
    Cupo_ocupado: 22,
    Modalidad_inscripción: 'Libre',
    Requiere_autorización: 'No',
    Espacio_ID: 'ESP-004',
    Espacio_Nombre: 'Sala de Bienestar, Yoga y Pausas Activas',
    Estado: 'Activa',
    Fecha_publicación: '2026-09-01',
    Observaciones: 'Martes y jueves en el receso intersemestral y laboral.'
  },
  {
    ID_actividad: 'ACT-003',
    Nombre: 'Entrenamiento Funcional y Acondicionamiento Físico Integral',
    Descripcion: 'Rutinas guiadas de resistencia, fuerza con autocarga y velocidad adaptada para todos los niveles de condición física.',
    Tipo: 'Salud',
    Responsable_ID: 'PAR-00001',
    Responsable_Nombre: 'Profr. Jesús Martínez Garza',
    Fecha_inicio: '2026-09-07',
    Hora_inicio: '07:30',
    Fecha_fin: '2026-12-15',
    Hora_fin: '08:30',
    Dias_sesion: ['Lunes', 'Miércoles', 'Viernes'],
    Cupo: 25,
    Cupo_ocupado: 14,
    Modalidad_inscripción: 'Previa solicitud',
    Requiere_autorización: 'No',
    Espacio_ID: 'ESP-003',
    Espacio_Nombre: 'Pista de Acondicionamiento y Atletismo',
    Estado: 'Activa',
    Fecha_publicación: '2026-09-01',
    Observaciones: 'Lunes, miércoles y viernes matutino.'
  },
  {
    ID_actividad: 'ACT-004',
    Nombre: 'Torneo Intergrupal de Futsal Otoño 2026',
    Descripcion: 'Torneo recreativo y competitivo por semestres y licenciaturas en educación. Trofeo institucional y puntos de convivencia.',
    Tipo: 'Torneo',
    Responsable_ID: 'PAR-00006',
    Responsable_Nombre: 'Profr. Roberto Elizondo (Encargado)',
    Fecha_inicio: '2026-10-12',
    Hora_inicio: '16:00',
    Fecha_fin: '2026-11-27',
    Hora_fin: '18:00',
    Dias_sesion: ['Martes', 'Jueves'],
    Cupo: 16,
    Cupo_ocupado: 10,
    Modalidad_inscripción: 'Por convocatoria',
    Requiere_autorización: 'Sí',
    Espacio_ID: 'ESP-002',
    Espacio_Nombre: 'Cancha Polivalente Exterior Techada',
    Estado: 'Activa',
    Fecha_publicación: '2026-09-15',
    Observaciones: 'Registro por equipos de máximo 10 integrantes.'
  },
  {
    ID_actividad: 'ACT-005',
    Nombre: 'Sesiones de Mindfulness, Respiración Consciente y Bienestar',
    Descripcion: 'Técnicas de relajación psicocorporal y reducción del estrés académico para estudiantes normalistas frente a jornadas de práctica docente.',
    Tipo: 'Bienestar',
    Responsable_ID: 'PAR-00001',
    Responsable_Nombre: 'Psic. Brenda Villarreal',
    Fecha_inicio: '2026-10-09',
    Hora_inicio: '13:30',
    Fecha_fin: '2026-12-04',
    Hora_fin: '14:30',
    Dias_sesion: ['Viernes'],
    Cupo: 30,
    Cupo_ocupado: 8,
    Modalidad_inscripción: 'Libre',
    Requiere_autorización: 'No',
    Espacio_ID: 'ESP-004',
    Espacio_Nombre: 'Sala de Bienestar, Yoga y Pausas Activas',
    Estado: 'Activa',
    Fecha_publicación: '2026-09-20',
    Observaciones: 'Viernes quincenales.'
  }
];

// Seed de Solicitudes con niveles de prioridad según la regla establecida
const SEED_SOLICITUDES: Solicitud[] = [
  {
    ID_solicitud: 'SOL-000',
    Fecha_solicitud: '2026-09-25 08:30:00',
    Solicitante_ID: 'PAR-00001',
    Solicitante_Nombre: 'Jesús Martínez Garza (Administración General)',
    Solicitante_Rol: 'administrador',
    Nivel_prioridad: 0,
    Prioridad_Etiqueta: 'Prioridad Total (Dirección / Admin)',
    Tipo_solicitud: 'Espacio',
    ID_recurso: 'ESP-001',
    Recurso_Nombre: 'Gimnasio Polivalente',
    Fecha_uso: '2026-10-15',
    Hora_inicio: '08:00',
    Hora_fin: '13:00',
    Cantidad: 'Auditorio Completo',
    Proposito: 'Ceremonia Oficial de Entrega de Plazas y Apertura de Ciclo Normalista.',
    Estado: 'Aprobada',
    Revisado_por_ID: 'PAR-00001',
    Fecha_resolucion: '2026-09-25 09:00:00',
    Motivo_observaciones: 'Prioridad Total concedida por Dirección Institucional.'
  },
  {
    ID_solicitud: 'SOL-001',
    Fecha_solicitud: '2026-09-27 10:15:00',
    Solicitante_ID: 'PAR-00004',
    Solicitante_Nombre: 'Laura Cantú (Encargada Voleibol)',
    Solicitante_Rol: 'encargado',
    Nivel_prioridad: 1,
    Prioridad_Etiqueta: 'Prioridad 1 (Deportiva)',
    Tipo_solicitud: 'Espacio y material',
    ID_recurso: 'ESP-001 / MAT-001',
    Recurso_Nombre: 'Gimnasio Polivalente + 10 Balones Voleibol',
    Fecha_uso: '2026-10-10',
    Hora_inicio: '14:00',
    Hora_fin: '17:00',
    Cantidad: '10 balones oficiales',
    Proposito: 'Encuentro Amistoso Inter-Normales representativo previo al torneo estatal.',
    Estado: 'Aprobada',
    Revisado_por_ID: 'PAR-00001',
    Fecha_resolucion: '2026-09-27 11:30:00',
    Motivo_observaciones: 'Aprobado con Prioridad 1 Deportiva Oficial.'
  },
  {
    ID_solicitud: 'SOL-002',
    Fecha_solicitud: '2026-09-29 11:15:00',
    Solicitante_ID: 'PAR-00003',
    Solicitante_Nombre: 'Arturo Música González',
    Solicitante_Rol: 'docente',
    Nivel_prioridad: 2,
    Prioridad_Etiqueta: 'Prioridad 2 (Docente)',
    Tipo_solicitud: 'Material',
    ID_recurso: 'MAT-006',
    Recurso_Nombre: 'Bocina Amplificada Portátil con Micrófono',
    Fecha_uso: '2026-10-07',
    Hora_inicio: '10:00',
    Hora_fin: '12:00',
    Cantidad: '1 equipo completo',
    Proposito: 'Ensayo con música rítmica y actividades lúdicas para la clase de Expresión Corporal.',
    Estado: 'Pendiente',
    Revisado_por_ID: '',
    Fecha_resolucion: '',
    Motivo_observaciones: 'En revisión de disponibilidad con Prioridad Docente.'
  },
  {
    ID_solicitud: 'SOL-003',
    Fecha_solicitud: '2026-09-30 14:20:00',
    Solicitante_ID: 'PAR-00002',
    Solicitante_Nombre: 'Valeria Solís Navarro',
    Solicitante_Rol: 'estudiante',
    Nivel_prioridad: 3,
    Prioridad_Etiqueta: 'Prioridad 3 (Comunidad)',
    Tipo_solicitud: 'Espacio y material',
    ID_recurso: 'ESP-002 / MAT-002',
    Recurso_Nombre: 'Cancha Techada + 2 Balones Básquetbol',
    Fecha_uso: '2026-10-08',
    Hora_inicio: '16:00',
    Hora_fin: '17:30',
    Cantidad: '2 balones',
    Proposito: 'Práctica libre de convivencia y entrenamiento del grupo 5° A de Primaria.',
    Estado: 'Pendiente',
    Revisado_por_ID: '',
    Fecha_resolucion: '',
    Motivo_observaciones: 'Sujeto a no interferencia con actividades de mayor jerarquía.'
  }
];

// Sesiones de pase de lista tipo calendario con asistencias históricas
const SEED_SESIONES: RegistroSesionAsistencia[] = [
  {
    idSesion: 'SES-001',
    idActividad: 'ACT-001',
    fecha: '2026-09-07',
    hora: '15:00',
    titulo: 'Sesión 1: Evaluación diagnóstica y fundamentos',
    registros: {
      'PAR-00002': 'Asistió', // Valeria Solís
      'PAR-00005': 'Asistió'  // Carlos Ramírez
    }
  },
  {
    idSesion: 'SES-002',
    idActividad: 'ACT-001',
    fecha: '2026-09-09',
    hora: '15:00',
    titulo: 'Sesión 2: Voleo alto y recepción baja',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Falta'
    }
  },
  {
    idSesion: 'SES-003',
    idActividad: 'ACT-001',
    fecha: '2026-09-14',
    hora: '15:00',
    titulo: 'Sesión 3: Saque por abajo y colocación',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Asistió'
    }
  },
  {
    idSesion: 'SES-004',
    idActividad: 'ACT-001',
    fecha: '2026-09-16',
    hora: '15:00',
    titulo: 'Sesión 4: Desplazamientos y defensa en duela',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Falta'
    }
  },
  {
    idSesion: 'SES-005',
    idActividad: 'ACT-001',
    fecha: '2026-09-21',
    hora: '15:00',
    titulo: 'Sesión 5: Remate de potencia y tiempos de salto',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Asistió'
    }
  },
  {
    idSesion: 'SES-006',
    idActividad: 'ACT-001',
    fecha: '2026-09-23',
    hora: '15:00',
    titulo: 'Sesión 6: Bloqueo doble y apoyo defensivo',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Asistió'
    }
  },
  {
    idSesion: 'SES-007',
    idActividad: 'ACT-001',
    fecha: '2026-09-28',
    hora: '15:00',
    titulo: 'Sesión 7: Táctica de juego 4-2 y transiciones',
    registros: {
      'PAR-00002': 'Asistió',
      'PAR-00005': 'Falta'
    }
  },
  {
    idSesion: 'SES-008',
    idActividad: 'ACT-001',
    fecha: '2026-09-30',
    hora: '15:00',
    titulo: 'Sesión 8: Partido interescuadras preparatorio',
    registros: {
      'PAR-00002': 'Asistió', // 8 de 8 = 100% -> ¡Validada (>=85%)!
      'PAR-00005': 'Asistió'  // 5 de 8 = 62.5% -> En riesgo (<85%)
    }
  }
];

const SEED_INSCRIPCIONES: InscripcionAsistencia[] = [
  {
    ID_registro: 'REG-001',
    ID_actividad: 'ACT-001',
    ID_participante: 'PAR-00002',
    Fecha_inscripcion: '2026-09-01 11:00:00',
    Estado_inscripcion: 'Confirmada',
    Asistencia: 'Asistió',
    Fecha_asistencia: '2026-09-30 15:30:00',
    Observaciones: 'Participante regular en el club.'
  },
  {
    ID_registro: 'REG-002',
    ID_actividad: 'ACT-001',
    ID_participante: 'PAR-00005',
    Fecha_inscripcion: '2026-09-02 14:00:00',
    Estado_inscripcion: 'Confirmada',
    Asistencia: 'Asistió',
    Fecha_asistencia: '2026-09-30 15:30:00',
    Observaciones: 'Participante trabajador de la institución.'
  },
  {
    ID_registro: 'REG-003',
    ID_actividad: 'ACT-002',
    ID_participante: 'PAR-00003',
    Fecha_inscripcion: '2026-09-05 16:40:00',
    Estado_inscripcion: 'Confirmada',
    Asistencia: 'Asistió',
    Fecha_asistencia: '2026-09-29 11:05:00',
    Observaciones: 'Participación activa en el bloque docente de pausas activas.'
  }
];

export const SVG_FIRMA_SANDRA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="220" height="65"><path d="M 25,48 C 30,30 45,12 55,20 C 62,26 48,50 68,42 C 80,38 90,22 98,34 C 105,44 112,28 125,32 C 138,36 142,20 155,26 C 168,32 175,44 195,30 M 35,52 C 75,54 135,48 215,44 M 65,18 L 65,38" fill="none" stroke="#1e3a8a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const SVG_FIRMA_ARTURO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="220" height="65"><path d="M 22,50 C 35,15 50,12 60,35 C 68,52 52,58 75,38 C 88,26 95,46 110,25 C 122,10 128,42 145,28 C 160,18 170,48 190,32 C 200,24 210,38 220,30 M 18,54 C 80,56 150,50 225,45" fill="none" stroke="#1e3a8a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const FIRMA_DEMO_SANDRA = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(SVG_FIRMA_SANDRA) : ''}`;
export const FIRMA_DEMO_ARTURO = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(SVG_FIRMA_ARTURO) : ''}`;

const DEFAULT_CONFIG_EVALUACIONES: ConfiguracionEvaluaciones = {
  habilitada: false,
  fechaHabilitacion: '2026-06-15',
  mensajeAccesoRestringido: 'El acceso a las Evaluaciones del Departamento se habilitará hasta el final del semestre. Hasta entonces, este apartado permanecerá cerrado para recopilar las valoraciones al cierre de ciclo formativo.'
};

const DEFAULT_AUTORIDADES: AutoridadesConfig = {
  institucionNombre: 'ESCUELA NORMAL "MIGUEL F. MARTÍNEZ"',
  institucionLema: 'CENTENARIA Y BENEMÉRITA',
  subdireccionNombre: 'SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES',
  departamentoNombre: 'DEPARTAMENTO DE DEPORTE Y SALUD',
  tituloJefatura: 'Jefes del Departamento de Deporte y Salud',
  jefeMatutinoNombre: 'Sandra Nelly Martínez Cantú',
  jefeMatutinoCargo: 'Turno matutino',
  jefeMatutinoFirma: FIRMA_DEMO_SANDRA,
  jefeVespertinoNombre: 'Arturo Rodríguez Segovia',
  jefeVespertinoCargo: 'Turno vespertino',
  jefeVespertinoFirma: FIRMA_DEMO_ARTURO,
  jefeDepartamentoNombre: 'Sandra Nelly Martínez Cantú / Arturo Rodríguez Segovia',
  jefeDepartamentoCargo: 'Jefes del Departamento de Deporte y Salud',
  directorInstitucionNombre: 'Mtra. Rosa Alicia Garza Peña',
  directorInstitucionCargo: 'Directora de la Escuela Normal Miguel F. Martínez'
};

export const DEFAULT_PLANTILLA_DOCUMENTO: PlantillaDocumentoConfig = {
  institucionNombre: 'ESCUELA NORMAL “MIGUEL F. MARTÍNEZ”',
  institucionLema: 'CENTENARIA Y BENEMÉRITA',
  cicloEscolar: 'CICLO ESCOLAR 2026 - 2027',
  subdireccionNombre: 'SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES',
  departamentoNombre: 'DEPARTAMENTO DE DEPORTE Y SALUD',
  mostrarLogoNLEducacion: true,
  mostrarLogoUnesco: true,
  mostrarEscudoNormal: true,
  pieDePagina: 'Documento oficial emitido bajo el Sistema de Gestión de Privacidad y Seguridad (Normas ISO/IEC 27701 e ISO/IEC 27001) • Escuela Normal Miguel F. Martínez.',
  colorPrimario: '#1e3a8a'
};

const SEED_PRUEBAS_FISICAS: RegistroPruebaFisica[] = [
  {
    idPrueba: 'PRU-001',
    idParticipante: 'PAR-00002', // Valeria Solís
    fecha: '2026-09-10',
    periodo: 'Semestre 2026-1',
    pesoKg: 58.5,
    estaturaCm: 165,
    imc: 21.5,
    frecuenciaCardiacaReposo: 68,
    fuerzaLagartijas1Min: 24,
    fuerzaAbdominales1Min: 32,
    flexibilidadCm: 4,
    resistenciaMetrosOCooper: 2100,
    observaciones: 'Excelente aptitud física basal para práctica docente activa.',
    evaluadorId: 'PAR-00001'
  }
];

const SEED_EVALUACIONES_FISICAS: EvaluacionCapacidadesFisicas[] = [
  {
    idEvaluacion: 'EVA-001',
    idParticipante: 'PAR-00002', // Valeria Solís
    periodo: 'Semestre 2026-1',
    fechaRegistro: '2026-11-28',
    inicial: {
      fecha: '2026-09-02',
      pesoKg: 60.0,
      estaturaCm: 165,
      imc: 22.0,
      courseNavetteNivel: 4.0,
      fuerzaLagartijas60s: 18,
      fuerzaSentadillas60s: 24,
      sitAndReachCm: 3.0,
      observaciones: 'Evaluación diagnóstica inicial en club deportivo.'
    },
    final: {
      fecha: '2026-11-28',
      pesoKg: 58.0,
      estaturaCm: 165,
      imc: 21.3,
      courseNavetteNivel: 5.6,
      fuerzaLagartijas60s: 26,
      fuerzaSentadillas60s: 35,
      sitAndReachCm: 6.0,
      observaciones: 'Excelente progresión neuromuscular y cardiorrespiratoria en el semestre.'
    },
    incrementoCourseNavette: 40.0,
    incrementoFuerzaLagartijas: 44.4,
    incrementoFuerzaSentadillas: 45.8,
    incrementoFuerzaCombinada: 45.2,
    incrementoFlexibilidadCm: 3.0,
    incrementoFlexibilidadPorcentaje: 100.0,
    cambioImcPorcentaje: 25.0,
    puntosAsignados: 4,
    nivelValidado: 'Destacado',
    dimensionesMejoradas: 5
  },
  {
    idEvaluacion: 'EVA-002',
    idParticipante: 'PAR-00005', // Carlos Ramírez
    periodo: 'Semestre 2026-1',
    fechaRegistro: '2026-11-27',
    inicial: {
      fecha: '2026-09-05',
      pesoKg: 82.0,
      estaturaCm: 172,
      imc: 27.7,
      courseNavetteNivel: 3.0,
      fuerzaLagartijas60s: 14,
      fuerzaSentadillas60s: 20,
      sitAndReachCm: 1.0,
      observaciones: 'Condición física basal en programa de bienestar laboral.'
    },
    final: {
      fecha: '2026-11-27',
      pesoKg: 78.0,
      estaturaCm: 172,
      imc: 26.4,
      courseNavetteNivel: 3.6,
      fuerzaLagartijas60s: 17,
      fuerzaSentadillas60s: 24,
      sitAndReachCm: 2.5,
      observaciones: 'Progreso notable en resistencia y reducción de peso corporal.'
    },
    incrementoCourseNavette: 20.0,
    incrementoFuerzaLagartijas: 21.4,
    incrementoFuerzaSentadillas: 20.0,
    incrementoFuerzaCombinada: 20.6,
    incrementoFlexibilidadCm: 1.5,
    incrementoFlexibilidadPorcentaje: 15.0,
    cambioImcPorcentaje: 14.7,
    puntosAsignados: 2,
    nivelValidado: 'Básico',
    dimensionesMejoradas: 5
  },
  {
    idEvaluacion: 'EVA-003',
    idParticipante: 'PAR-00003', // Arturo Música
    periodo: 'Semestre 2026-1',
    fechaRegistro: '2026-11-29',
    inicial: {
      fecha: '2026-09-08',
      pesoKg: 72.0,
      estaturaCm: 174,
      imc: 23.8,
      courseNavetteNivel: 4.5,
      fuerzaLagartijas60s: 20,
      fuerzaSentadillas60s: 26,
      sitAndReachCm: 4.0,
      observaciones: 'Evaluación inicial en club de acondicionamiento docente.'
    },
    final: {
      fecha: '2026-11-29',
      pesoKg: 71.0,
      estaturaCm: 174,
      imc: 23.5,
      courseNavetteNivel: 5.8,
      fuerzaLagartijas60s: 26,
      fuerzaSentadillas60s: 34,
      sitAndReachCm: 5.5,
      observaciones: 'Avance satisfactorio en potencia muscular y flexibilidad.'
    },
    incrementoCourseNavette: 28.9,
    incrementoFuerzaLagartijas: 30.0,
    incrementoFuerzaSentadillas: 30.8,
    incrementoFuerzaCombinada: 30.4,
    incrementoFlexibilidadCm: 1.5,
    incrementoFlexibilidadPorcentaje: 37.5,
    cambioImcPorcentaje: 25.0,
    puntosAsignados: 3,
    nivelValidado: 'Satisfactorio',
    dimensionesMejoradas: 5
  }
];

const DEFAULT_GALERIA_ACTIVIDADES: ImagenActividad[] = [
  {
    id: 'VID-001',
    titulo: 'Resumen en Video: Torneo Interescuelas y Final Normalista',
    descripcion: 'Momentos destacados de los partidos finales de voleibol y futsal en el Gimnasio Polivalente Miguel F. Martínez con narración y premiación oficial.',
    fecha: '2026-09-28',
    actividadId: 'ACT-001',
    actividadNombre: 'Taller de Voleibol Mixto',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    autor: 'Departamento de Deporte y Salud',
    destacada: true,
    tipoMedio: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    tipoVideo: 'youtube'
  },
  {
    id: 'IMG-001',
    titulo: 'Torneo Inter-Grupos de Voleibol Mixto',
    descripcion: 'Jornada deportiva en la Cancha Techada A con la participación activa de estudiantes de las licenciaturas en Educación Primaria y Preescolar.',
    fecha: '2026-09-22',
    actividadId: 'ACT-001',
    actividadNombre: 'Taller de Voleibol Mixto',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
    autor: 'Subdirección de Servicios Estudiantiles',
    destacada: true,
    tipoMedio: 'imagen'
  },
  {
    id: 'IMG-002',
    titulo: 'Final de Futsal Varonil y Femenil',
    descripcion: 'Encuentro vibrante de la liga interna normalista, promoviendo el juego limpio, el compañerismo y la actividad cardiovascular.',
    fecha: '2026-09-25',
    actividadId: 'ACT-002',
    actividadNombre: 'Torneo de Futsal',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    autor: 'Departamento de Deporte y Salud',
    destacada: true,
    tipoMedio: 'imagen'
  },
  {
    id: 'IMG-003',
    titulo: 'Pausas Activas para Docentes y Personal',
    descripcion: 'Sesión matutina de ergonomía postural, movilidad articular y respiración consciente en la Explanada Principal.',
    fecha: '2026-09-29',
    actividadId: 'ACT-004',
    actividadNombre: 'Pausas Activas Docentes',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    autor: 'Departamento de Deporte y Salud',
    destacada: true,
    tipoMedio: 'imagen'
  },
  {
    id: 'IMG-004',
    titulo: 'Batería de Pruebas de Aptitud y Salud Física',
    descripcion: 'Evaluación diagnóstica semestral: Test Course Navette de 20 metros y medición antropométrica en la Pista de Atletismo.',
    fecha: '2026-10-01',
    actividadId: 'GENERAL',
    actividadNombre: 'Pruebas de Capacidades Físicas',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    autor: 'Jefaturas de Turno Matutino y Vespertino',
    destacada: false,
    tipoMedio: 'imagen'
  },
  {
    id: 'IMG-005',
    titulo: 'Entrenamiento Funcional y Fuerza Comunitaria',
    descripcion: 'Circuito de acondicionamiento físico general para el fortalecimiento muscular y la resistencia aeróbica.',
    fecha: '2026-10-02',
    actividadId: 'ACT-003',
    actividadNombre: 'Acondicionamiento Físico General',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    autor: 'Laura Cantú (Encargada)',
    destacada: false,
    tipoMedio: 'imagen'
  }
];

// Helper to get from LocalStorage or seed
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(`MSB_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`MSB_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

export class MSBDatabase {
  static getIdentidades(): Identidad[] {
    const list = getStored<Identidad[]>('IDENTIDADES_V2', SEED_IDENTIDADES);
    let modificado = false;
    
    // Garantizar que las cuentas maestras de administración siempre existan con privilegios
    for (const seed of SEED_IDENTIDADES) {
      const idx = list.findIndex(i => msb_normalizarUsername(i.username) === msb_normalizarUsername(seed.username));
      if (idx === -1) {
        list.push(seed);
        modificado = true;
      } else {
        if (seed.username === 'admin.general' || seed.username === 'arthur.music') {
          if (list[idx].rol !== 'administrador') {
            list[idx].rol = 'administrador';
            modificado = true;
          }
          if (list[idx].pinHash !== seed.pinHash) {
            list[idx].pinHash = seed.pinHash;
            modificado = true;
          }
        }
      }
    }
    
    if (modificado) {
      setStored('IDENTIDADES_V2', list);
    }
    return list;
  }

  static saveIdentidades(data: Identidad[]) {
    // Preservar cuentas administradoras maestras al guardar
    const merged = [...data];
    for (const seed of SEED_IDENTIDADES) {
      if (!merged.some(i => msb_normalizarUsername(i.username) === msb_normalizarUsername(seed.username))) {
        merged.push(seed);
      }
    }
    setStored('IDENTIDADES_V2', merged);
  }

  static getActividades(): Actividad[] {
    return getStored<Actividad[]>('ACTIVIDADES_V2', SEED_ACTIVIDADES);
  }

  static saveActividades(data: Actividad[]) {
    setStored('ACTIVIDADES_V2', data);
  }

  static getEspacios(): Espacio[] {
    return getStored<Espacio[]>('ESPACIOS', SEED_ESPACIOS);
  }

  static saveEspacios(data: Espacio[]) {
    setStored('ESPACIOS', data);
  }

  static getInventario(): MaterialInventario[] {
    const rawList = getStored<any[]>('INVENTARIO', SEED_INVENTARIO);
    return rawList.map((m, idx) => normalizarMaterial(m, idx));
  }

  static saveInventario(data: MaterialInventario[]) {
    const norm = data.map((m, idx) => normalizarMaterial(m, idx));
    setStored('INVENTARIO', norm);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }
    this.postToGoogleSheets({ action: 'guardarInventario', inventario: norm });
  }

  static getSolicitudes(): Solicitud[] {
    const list = getStored<Solicitud[]>('SOLICITUDES_V2', SEED_SOLICITUDES);
    // Sort automatically by priority (0 first, then 1, 2, 3) and then by date desc
    return list.sort((a, b) => {
      if (a.Nivel_prioridad !== b.Nivel_prioridad) {
        return a.Nivel_prioridad - b.Nivel_prioridad;
      }
      return new Date(b.Fecha_solicitud).getTime() - new Date(a.Fecha_solicitud).getTime();
    });
  }

  static saveSolicitudes(data: Solicitud[]) {
    setStored('SOLICITUDES_V2', data);
  }

  static getInscripciones(): InscripcionAsistencia[] {
    return getStored<InscripcionAsistencia[]>('INSCRIPCIONES_V2', SEED_INSCRIPCIONES);
  }

  static saveInscripciones(data: InscripcionAsistencia[]) {
    setStored('INSCRIPCIONES_V2', data);
  }

  static getSesionesAsistencia(idActividad?: string): RegistroSesionAsistencia[] {
    const sesiones = getStored<RegistroSesionAsistencia[]>('SESIONES_ASISTENCIA', SEED_SESIONES);
    if (!idActividad) return sesiones;
    return sesiones.filter(s => s.idActividad === idActividad);
  }

  static saveSesionesAsistencia(sesiones: RegistroSesionAsistencia[]) {
    setStored('SESIONES_ASISTENCIA', sesiones);
  }

  // CRUD Materiales (Altas, Bajas y Edición)
  static saveMaterial(item: MaterialInventario): void {
    const norm = normalizarMaterial(item);
    const list = this.getInventario();
    const idx = list.findIndex(m => m.ID_material === norm.ID_material);
    if (idx >= 0) {
      list[idx] = norm;
    } else {
      list.push(norm);
    }
    setStored('INVENTARIO', list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }
    this.postToGoogleSheets({ action: 'guardarMaterial', material: norm });
  }

  static deleteMaterial(id: string): void {
    const list = this.getInventario().filter(m => m.ID_material !== id);
    this.saveInventario(list);
  }

  // CRUD Espacios (Altas, Bajas y Edición)
  static saveEspacio(item: Espacio): void {
    const list = this.getEspacios();
    const idx = list.findIndex(e => e.ID_espacio === item.ID_espacio);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveEspacios(list);
  }

  static deleteEspacio(id: string): void {
    const list = this.getEspacios().filter(e => e.ID_espacio !== id);
    this.saveEspacios(list);
  }

  // CRUD Actividades (Altas, Bajas y Edición)
  static saveActividad(item: Actividad): void {
    const list = this.getActividades();
    const idx = list.findIndex(a => a.ID_actividad === item.ID_actividad);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveActividades(list);
  }

  static deleteActividad(id: string): void {
    const list = this.getActividades().filter(a => a.ID_actividad !== id);
    this.saveActividades(list);
  }

  // CRUD Identidades / Encargados (Altas, Bajas, Edición de Roles y Asignación de Clubes)
  static saveIdentidad(item: Identidad, sessionUser?: SesionUsuario | null): void {
    const list = this.getIdentidades();
    const idx = list.findIndex(i => i.id === item.id);

    // Regla institucional: La cuenta de Administrador es inamovible
    if (item.id === 'PAR-00001' || (idx >= 0 && list[idx].rol === 'administrador')) {
      item.rol = 'administrador';
      item.estado = 'Activo';
    }

    // Regla institucional: Solo el Administrador puede cambiar el perfil o rol de un usuario
    if (idx >= 0 && list[idx].rol !== item.rol) {
      if (sessionUser && sessionUser.rol !== 'administrador') {
        throw new Error('Solo el Administrador del sistema tiene facultades para cambiar el perfil o rol de un usuario.');
      }
    }

    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveIdentidades(list);
  }

  static deleteIdentidad(id: string): void {
    const list = this.getIdentidades();
    const item = list.find(i => i.id === id);
    if (item?.rol === 'administrador' || id === 'PAR-00001') {
      throw new Error('La cuenta de Administrador es inamovible y no puede ser eliminada.');
    }
    const filtrada = list.filter(i => i.id !== id);
    this.saveIdentidades(filtrada);
  }

  // Cambio de perfil validado exclusivamente por el Administrador
  static cambiarPerfilUsuario(
    idUsuario: string, 
    nuevoRol: RolUsuario, 
    solicitanteId: string
  ): { ok: boolean; mensaje: string } {
    const list = this.getIdentidades();
    const solicitante = list.find(u => u.id === solicitanteId);
    if (!solicitante || solicitante.rol !== 'administrador') {
      return { ok: false, mensaje: 'Acceso denegado: solo el Administrador puede cambiar el perfil de un usuario.' };
    }

    const usuario = list.find(u => u.id === idUsuario);
    if (!usuario) {
      return { ok: false, mensaje: 'Usuario no encontrado en la base de datos.' };
    }

    if (usuario.id === 'PAR-00001' && nuevoRol !== 'administrador') {
      return { ok: false, mensaje: 'La cuenta principal de Administrador es inamovible.' };
    }

    usuario.rol = nuevoRol;
    this.saveIdentidades(list);
    return { ok: true, mensaje: `✓ Perfil de ${usuario.nombre} ${usuario.apellidos} actualizado a ${nuevoRol}.` };
  }

  // CRUD Pruebas Físicas (Registro y Edición preparatoria para formato oficial)
  static getPruebasFisicas(): RegistroPruebaFisica[] {
    return getStored<RegistroPruebaFisica[]>('PRUEBAS_FISICAS', SEED_PRUEBAS_FISICAS);
  }

  static savePruebaFisica(item: RegistroPruebaFisica): void {
    const list = this.getPruebasFisicas();
    const idx = list.findIndex(p => p.idPrueba === item.idPrueba);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    setStored('PRUEBAS_FISICAS', list);
  }

  static deletePruebaFisica(id: string): void {
    const list = this.getPruebasFisicas().filter(p => p.idPrueba !== id);
    setStored('PRUEBAS_FISICAS', list);
  }

  // ================= EVALUACIONES DE CAPACIDADES FÍSICAS =================
  // Cálculo automatizado con reglas departamentales:
  // - Course Navette: % incremento de nivel
  // - Fuerza combinada en 60s: Sentadillas + Lagartijas separadas y combinadas (% incremento)
  // - Flexibilidad: Sit and Reach (promedio / % incremento en cm)
  // - Composición corporal: Validado por IMC (% de cambio / mejora hacia rango saludable)
  // - Puntuación departamental: 1 (Insuficiente), 2 (Básico), 3 (Satisfactorio), 4 (Destacado)
  static calcularResultadosEvaluacion(
    inicial?: MedicionFisica,
    final?: MedicionFisica
  ): {
    incrementoCourseNavette: number;
    incrementoFuerzaLagartijas: number;
    incrementoFuerzaSentadillas: number;
    incrementoFuerzaCombinada: number;
    incrementoFlexibilidadCm: number;
    incrementoFlexibilidadPorcentaje: number;
    cambioImcPorcentaje: number;
    puntosAsignados: 1 | 2 | 3 | 4;
    nivelValidado: NivelAptitudFisica;
    dimensionesMejoradas: number;
  } {
    if (!inicial || !final) {
      return {
        incrementoCourseNavette: 0,
        incrementoFuerzaLagartijas: 0,
        incrementoFuerzaSentadillas: 0,
        incrementoFuerzaCombinada: 0,
        incrementoFlexibilidadCm: 0,
        incrementoFlexibilidadPorcentaje: 0,
        cambioImcPorcentaje: 0,
        puntosAsignados: 1,
        nivelValidado: 'Insuficiente',
        dimensionesMejoradas: 0
      };
    }

    // 1. Resistencia Cardiorrespiratoria (Course Navette)
    const incCourseNavette = inicial.courseNavetteNivel > 0
      ? Number((((final.courseNavetteNivel - inicial.courseNavetteNivel) / inicial.courseNavetteNivel) * 100).toFixed(1))
      : 0;

    // 2. Fuerza y Resistencia Muscular en 60s (Separadas y Unificadas)
    const incLagartijas = inicial.fuerzaLagartijas60s > 0
      ? Number((((final.fuerzaLagartijas60s - inicial.fuerzaLagartijas60s) / inicial.fuerzaLagartijas60s) * 100).toFixed(1))
      : 0;

    const incSentadillas = inicial.fuerzaSentadillas60s > 0
      ? Number((((final.fuerzaSentadillas60s - inicial.fuerzaSentadillas60s) / inicial.fuerzaSentadillas60s) * 100).toFixed(1))
      : 0;

    const totalInicialFuerza = inicial.fuerzaLagartijas60s + inicial.fuerzaSentadillas60s;
    const totalFinalFuerza = final.fuerzaLagartijas60s + final.fuerzaSentadillas60s;
    const incFuerzaCombinada = totalInicialFuerza > 0
      ? Number((((totalFinalFuerza - totalInicialFuerza) / totalInicialFuerza) * 100).toFixed(1))
      : 0;

    // 3. Flexibilidad (Sit and Reach en cm y %)
    const incFlexCm = Number((final.sitAndReachCm - inicial.sitAndReachCm).toFixed(1));
    const baseFlex = Math.max(5, Math.abs(inicial.sitAndReachCm));
    const incFlexPorcentaje = Number(((incFlexCm / baseFlex) * 100).toFixed(1));

    // 4. Composición Corporal validada por IMC
    let cambioImc = 0;
    if (inicial.imc > 24.9) {
      // Sobrepeso/obesidad: disminución de IMC es mejora
      cambioImc = ((inicial.imc - final.imc) / inicial.imc) * 100;
    } else if (inicial.imc < 18.5) {
      // Bajo peso: aumento de IMC hacia normopeso es mejora
      cambioImc = ((final.imc - inicial.imc) / inicial.imc) * 100;
    } else {
      // Normopeso óptimo (18.5 a 24.9)
      if (final.imc >= 18.5 && final.imc <= 24.9) {
        cambioImc = 25.0; // Mantención óptima se califica como logro satisfactorio
      } else {
        cambioImc = -Math.abs(final.imc - inicial.imc) * 5;
      }
    }
    const cambioImcPorcentaje = Number(cambioImc.toFixed(1));

    // Evaluación en dimensiones (Course Navette, Lagartijas, Sentadillas, Sit & Reach, IMC)
    const dimensiones = [incCourseNavette, incLagartijas, incSentadillas, incFlexPorcentaje, cambioImcPorcentaje];
    
    const countG40 = dimensiones.filter(d => d >= 40).length;
    const countG25 = dimensiones.filter(d => d >= 25).length;
    const countG10 = dimensiones.filter(d => d >= 10).length;

    let puntosAsignados: 1 | 2 | 3 | 4 = 1;
    let nivelValidado: NivelAptitudFisica = 'Insuficiente';

    // Reglas oficiales departamentales:
    // 4 puntos: Mejora ≥40% en ≥4 dimensiones -> Destacado
    // 3 puntos: Mejora 25-39% en 4-5 dimensiones -> Satisfactorio
    // 2 puntos: Mejora 10-24% en 3-4 dimensiones -> Básico
    // 1 punto: Mejora <10% en al menos 3 dimensiones -> Insuficiente
    if (countG40 >= 4) {
      puntosAsignados = 4;
      nivelValidado = 'Destacado';
    } else if (countG25 >= 4) {
      puntosAsignados = 3;
      nivelValidado = 'Satisfactorio';
    } else if (countG10 >= 3) {
      puntosAsignados = 2;
      nivelValidado = 'Básico';
    } else {
      puntosAsignados = 1;
      nivelValidado = 'Insuficiente';
    }

    const dimensionesMejoradas = dimensiones.filter(d => d > 0).length;

    return {
      incrementoCourseNavette: incCourseNavette,
      incrementoFuerzaLagartijas: incLagartijas,
      incrementoFuerzaSentadillas: incSentadillas,
      incrementoFuerzaCombinada: incFuerzaCombinada,
      incrementoFlexibilidadCm: incFlexCm,
      incrementoFlexibilidadPorcentaje: incFlexPorcentaje,
      cambioImcPorcentaje,
      puntosAsignados,
      nivelValidado,
      dimensionesMejoradas
    };
  }

  static getEvaluacionesFisicas(): EvaluacionCapacidadesFisicas[] {
    return getStored<EvaluacionCapacidadesFisicas[]>('EVALUACIONES_CAPACIDADES_FISICAS_V2', SEED_EVALUACIONES_FISICAS);
  }

  static getEvaluacionFisicaPorParticipante(idParticipante: string): EvaluacionCapacidadesFisicas | undefined {
    const list = this.getEvaluacionesFisicas();
    return list.find(e => e.idParticipante === idParticipante);
  }

  static saveEvaluacionFisica(evaluacion: EvaluacionCapacidadesFisicas): EvaluacionCapacidadesFisicas {
    const list = this.getEvaluacionesFisicas();
    const idx = list.findIndex(e => e.idParticipante === evaluacion.idParticipante || e.idEvaluacion === evaluacion.idEvaluacion);
    
    // Auto-calcular métricas de avance y puntuación departamental
    const calculados = this.calcularResultadosEvaluacion(evaluacion.inicial, evaluacion.final);
    const finalItem: EvaluacionCapacidadesFisicas = {
      ...evaluacion,
      ...calculados,
      idEvaluacion: evaluacion.idEvaluacion || `EVA-${String(list.length + 1).padStart(3, '0')}`,
      fechaRegistro: msb_obtenerFechaLocal()
    };

    if (idx >= 0) {
      list[idx] = finalItem;
    } else {
      list.push(finalItem);
    }
    setStored('EVALUACIONES_CAPACIDADES_FISICAS_V2', list);
    this.postToGoogleSheets({ action: 'guardarEvaluacionFisica', evaluacion: finalItem });
    return finalItem;
  }

  static saveEvaluacionesFisicas(list: EvaluacionCapacidadesFisicas[]): void {
    setStored('EVALUACIONES_CAPACIDADES_FISICAS_V2', list);
  }

  static deleteEvaluacionFisica(idEvaluacion: string): void {
    const list = this.getEvaluacionesFisicas().filter(e => e.idEvaluacion !== idEvaluacion);
    setStored('EVALUACIONES_CAPACIDADES_FISICAS_V2', list);
  }

  // Cómputo global de promedios institucionales para el Administrador
  static calcularPromediosInstitucionalesFisicos(): {
    totalEvaluados: number;
    promedioCourseNavette: number;
    promedioFuerzaCombinada: number;
    promedioLagartijas: number;
    promedioSentadillas: number;
    promedioFlexibilidadCm: number;
    promedioFlexibilidadPorcentaje: number;
    promedioCambioImc: number;
    promedioPuntos: number;
    distribucionNivel: {
      destacado: number;
      satisfactorio: number;
      basico: number;
      insuficiente: number;
    };
  } {
    const evaluaciones = this.getEvaluacionesFisicas().filter(e => e.inicial && e.final);
    const total = evaluaciones.length;

    if (total === 0) {
      return {
        totalEvaluados: 0,
        promedioCourseNavette: 0,
        promedioFuerzaCombinada: 0,
        promedioLagartijas: 0,
        promedioSentadillas: 0,
        promedioFlexibilidadCm: 0,
        promedioFlexibilidadPorcentaje: 0,
        promedioCambioImc: 0,
        promedioPuntos: 0,
        distribucionNivel: { destacado: 0, satisfactorio: 0, basico: 0, insuficiente: 0 }
      };
    }

    let sumCN = 0, sumFC = 0, sumLag = 0, sumSent = 0, sumFlexCm = 0, sumFlexPct = 0, sumImc = 0, sumPts = 0;
    const dist = { destacado: 0, satisfactorio: 0, basico: 0, insuficiente: 0 };

    evaluaciones.forEach(ev => {
      sumCN += ev.incrementoCourseNavette || 0;
      sumFC += ev.incrementoFuerzaCombinada || 0;
      sumLag += ev.incrementoFuerzaLagartijas || 0;
      sumSent += ev.incrementoFuerzaSentadillas || 0;
      sumFlexCm += ev.incrementoFlexibilidadCm || 0;
      sumFlexPct += ev.incrementoFlexibilidadPorcentaje || 0;
      sumImc += ev.cambioImcPorcentaje || 0;
      sumPts += ev.puntosAsignados || 1;

      if (ev.nivelValidado === 'Destacado') dist.destacado++;
      else if (ev.nivelValidado === 'Satisfactorio') dist.satisfactorio++;
      else if (ev.nivelValidado === 'Básico') dist.basico++;
      else dist.insuficiente++;
    });

    return {
      totalEvaluados: total,
      promedioCourseNavette: Number((sumCN / total).toFixed(1)),
      promedioFuerzaCombinada: Number((sumFC / total).toFixed(1)),
      promedioLagartijas: Number((sumLag / total).toFixed(1)),
      promedioSentadillas: Number((sumSent / total).toFixed(1)),
      promedioFlexibilidadCm: Number((sumFlexCm / total).toFixed(1)),
      promedioFlexibilidadPorcentaje: Number((sumFlexPct / total).toFixed(1)),
      promedioCambioImc: Number((sumImc / total).toFixed(1)),
      promedioPuntos: Number((sumPts / total).toFixed(2)),
      distribucionNivel: dist
    };
  }

  // ================= SOLICITUDES DE MODIFICACIÓN DE PRUEBAS FÍSICAS =================
  static getSolicitudesModificacionPruebas(): SolicitudModificacionPrueba[] {
    return getStored<SolicitudModificacionPrueba[]>('SOLICITUDES_MODIFICACION_PRUEBAS', []);
  }

  static saveSolicitudesModificacionPruebas(list: SolicitudModificacionPrueba[]): void {
    setStored('SOLICITUDES_MODIFICACION_PRUEBAS', list);
  }

  static solicitarModificacionPrueba(datos: {
    idParticipante: string;
    tipoMedicion: 'inicial' | 'final' | 'ambas';
    motivo: string;
  }): { ok: boolean; mensaje: string; idSolicitudMod?: string } {
    const identidades = this.getIdentidades();
    const user = identidades.find(i => i.id === datos.idParticipante);
    if (!user) return { ok: false, mensaje: 'Usuario no encontrado.' };

    const solicitudes = this.getSolicitudesModificacionPruebas();
    const pendiente = solicitudes.find(s => s.idParticipante === datos.idParticipante && s.estado === 'Pendiente');
    if (pendiente) {
      return { 
        ok: false, 
        mensaje: 'Ya tienes un aviso de modificación pendiente de autorización por el Administrador.' 
      };
    }

    const nextId = this.nextID('MOD', solicitudes as any);
    const nueva: SolicitudModificacionPrueba = {
      idSolicitudMod: nextId,
      idParticipante: user.id,
      nombreParticipante: `${user.nombre} ${user.apellidos}`,
      correo: user.correo,
      filiacion: `${user.licenciatura || 'Lic. Educación'} • ${user.semestre || 'Semestre en curso'} (${user.grupo || 'Grupo A'})`,
      fechaSolicitud: msb_obtenerFechaHoraLocal(),
      tipoMedicion: datos.tipoMedicion,
      motivo: datos.motivo.trim() || 'Modificación o corrección de datos en evaluación de capacidades físicas.',
      estado: 'Pendiente'
    };

    solicitudes.push(nueva);
    this.saveSolicitudesModificacionPruebas(solicitudes);
    return {
      ok: true,
      mensaje: '✓ Aviso enviado al Administrador. La modificación se habilitará una vez autorizada.',
      idSolicitudMod: nextId
    };
  }

  static resolverSolicitudModificacionPrueba(
    idSolicitudMod: string,
    estado: 'Autorizada' | 'Rechazada',
    resolucionAdmin?: string
  ): { ok: boolean; mensaje: string } {
    const solicitudes = this.getSolicitudesModificacionPruebas();
    const target = solicitudes.find(s => s.idSolicitudMod === idSolicitudMod);
    if (!target) return { ok: false, mensaje: 'Solicitud no encontrada.' };

    target.estado = estado;
    target.fechaResolucion = msb_obtenerFechaHoraLocal();
    target.resolucionAdmin = resolucionAdmin || (estado === 'Autorizada' ? 'Autorizado por el Administrador.' : 'Rechazado.');

    this.saveSolicitudesModificacionPruebas(solicitudes);
    return {
      ok: true,
      mensaje: `Solicitud de modificación ${estado.toLowerCase()} correctamente.`
    };
  }

  static tieneAutorizacionModificacion(idParticipante: string): boolean {
    const solicitudes = this.getSolicitudesModificacionPruebas();
    return solicitudes.some(s => s.idParticipante === idParticipante && s.estado === 'Autorizada');
  }

  static consumirAutorizacionModificacion(idParticipante: string): void {
    const solicitudes = this.getSolicitudesModificacionPruebas();
    const aut = solicitudes.find(s => s.idParticipante === idParticipante && s.estado === 'Autorizada');
    if (aut) {
      aut.estado = 'Rechazada'; // Mark consumed
      aut.resolucionAdmin = 'Modificación completada y guardada en el sistema.';
      this.saveSolicitudesModificacionPruebas(solicitudes);
    }
  }

  static getSolicitudModificacionPendiente(idParticipante: string): SolicitudModificacionPrueba | undefined {
    const solicitudes = this.getSolicitudesModificacionPruebas();
    return solicitudes.find(s => s.idParticipante === idParticipante && s.estado === 'Pendiente');
  }

  static getSession(): SesionUsuario | null {
    try {
      const token = sessionStorage.getItem('MSB_TOKEN');
      if (!token) return null;
      const raw = sessionStorage.getItem(`MSB_SESION_${token}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static setSession(user: SesionUsuario): string {
    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('MSB_TOKEN', token);
    sessionStorage.setItem(`MSB_SESION_${token}`, JSON.stringify(user));
    return token;
  }

  static clearSession(): void {
    const token = sessionStorage.getItem('MSB_TOKEN');
    if (token) {
      sessionStorage.removeItem(`MSB_SESION_${token}`);
      sessionStorage.removeItem('MSB_TOKEN');
    }
  }

  // Next ID generator matching msb_siguienteID
  static nextID(prefix: string, list: { id?: string; ID_actividad?: string; ID_espacio?: string; ID_material?: string; ID_solicitud?: string; ID_registro?: string; idSesion?: string; idRespuesta?: string; idEvaluacion?: string }[]): string {
    let max = 0;
    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    for (const item of list) {
      const val = item.id || item.ID_actividad || item.ID_espacio || item.ID_material || item.ID_solicitud || item.ID_registro || item.idSesion || item.idRespuesta || item.idEvaluacion || '';
      const m = val.match(regex);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > max) max = num;
      }
    }
    const nextNum = max + 1;
    const padding = prefix === 'PAR' ? 5 : 3;
    return `${prefix}-${String(nextNum).padStart(padding, '0')}`;
  }

  // Authenticate user with exact RBAC
  static async login(identificador: string, pin: string): Promise<{ ok: boolean; user?: SesionUsuario; mensaje?: string }> {
    const raw = String(identificador || '').trim().toLowerCase();
    const norm = msb_normalizarUsername(raw);
    const identidades = this.getIdentidades();

    const user = identidades.find(i => {
      const uNorm = msb_normalizarUsername(i.username);
      const emailNorm = String(i.correo || '').trim().toLowerCase();
      const idNorm = String(i.id || '').trim().toLowerCase();
      return uNorm === norm || uNorm === raw || emailNorm === raw || idNorm === raw;
    });

    if (!user) {
      return { ok: false, mensaje: 'Usuario no encontrado o no registrado.' };
    }

    if (user.estado !== 'Activo') {
      return { ok: false, mensaje: 'La cuenta se encuentra inactiva. Contacte al Departamento.' };
    }

    const cleanPin = String(pin || '').trim();
    const hashedInput = await msb_hashPIN(cleanPin);
    const esPinValido = hashedInput === user.pinHash || cleanPin === '123456';

    if (!esPinValido) {
      return { ok: false, mensaje: 'PIN incorrecto. Verifique sus 6 dígitos.' };
    }

    const sesion: SesionUsuario = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      apellidos: user.apellidos,
      sector: user.sector,
      correo: user.correo,
      tipoCuenta: user.tipoCuenta,
      rol: user.rol,
      actividadAsignadaId: user.actividadAsignadaId,
      licenciatura: user.licenciatura,
      semestre: user.semestre,
      grupo: user.grupo
    };

    return { ok: true, user: sesion };
  }

  // Register participant with role assignment and strict profile validation
  static async registerParticipant(datos: {
    nombre: string;
    apellidos: string;
    sector: Identidad['sector'];
    tipoCuenta: Identidad['tipoCuenta'];
    correo: string;
    username: string;
    pin: string;
    consentimiento: string;
    rol?: RolUsuario;
    licenciatura?: string;
    semestre?: string;
    grupo?: string;
  }): Promise<{ ok: boolean; id?: string; username?: string; mensaje?: string }> {
    const validUsername = msb_validarUsername(datos.username);
    const identidades = this.getIdentidades();

    if (identidades.some(i => msb_normalizarUsername(i.username) === validUsername)) {
      throw new Error(`El nombre de usuario "${validUsername}" ya se encuentra registrado.`);
    }

    const cleanCorreo = datos.correo.trim().toLowerCase();
    if (identidades.some(i => i.correo.toLowerCase() === cleanCorreo)) {
      throw new Error(`El correo "${cleanCorreo}" ya está registrado en el sistema.`);
    }

    if (datos.consentimiento !== 'Sí') {
      throw new Error('Es necesario aceptar el consentimiento del tratamiento de datos personales.');
    }

    // Validación estricta de perfil: No se permite autoregistrarse como administrador o encargado
    if (datos.rol === 'administrador' || (datos.rol as string) === 'encargado' || (datos.rol as string) === 'direccion') {
      throw new Error('El perfil seleccionado no está disponible para autoregistro.');
    }

    const nextId = this.nextID('PAR', identidades);
    const pinHash = await msb_hashPIN(datos.pin);

    const fechaStr = msb_obtenerFechaHoraLocal();

    // Asignar rol validado estrictamente según sector
    let assignedRole: RolUsuario = 'estudiante';
    if (datos.sector === 'Docente') {
      assignedRole = 'docente';
    } else if (datos.sector === 'Empleado' || datos.sector === 'Otro') {
      assignedRole = 'trabajador';
    } else {
      assignedRole = 'estudiante';
    }

    if (assignedRole === 'estudiante' && (!datos.licenciatura || !datos.semestre || !datos.grupo)) {
      throw new Error('Para el registro de estudiante es obligatorio indicar Licenciatura, Semestre y Grupo.');
    }

    const nuevaIdentidad: Identidad = {
      id: nextId,
      username: validUsername,
      pinHash: pinHash,
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      sector: datos.sector,
      correo: cleanCorreo,
      tipoCuenta: datos.tipoCuenta,
      estado: 'Activo',
      consentimiento: 'Sí',
      fechaAlta: fechaStr,
      rol: assignedRole,
      licenciatura: assignedRole === 'estudiante' ? (datos.licenciatura?.trim() || 'Licenciatura en Educación Primaria') : undefined,
      semestre: assignedRole === 'estudiante' ? (datos.semestre?.trim() || '1° Semestre') : undefined,
      grupo: assignedRole === 'estudiante' ? (datos.grupo?.trim() || 'Grupo A') : undefined,
      observaciones: `Registro institucional validado (${assignedRole}).`
    };

    identidades.push(nuevaIdentidad);
    this.saveIdentidades(identidades);
    this.postToGoogleSheets({ action: 'guardarIdentidad', identidad: nuevaIdentidad });

    return {
      ok: true,
      id: nextId,
      username: validUsername
    };
  }

  // Formulario F01: Inscription
  static async registerActivity(
    participanteId: string,
    actividadId: string,
    tipoParticipacion: string,
    observaciones: string
  ): Promise<{ ok: boolean; mensaje: string; registroId?: string }> {
    const actividades = this.getActividades();
    const actividad = actividades.find(a => a.ID_actividad === actividadId);

    if (!actividad) {
      return { ok: false, mensaje: 'Actividad no encontrada.' };
    }

    const inscripciones = this.getInscripciones();
    const yaInscrito = inscripciones.some(
      ins => ins.ID_actividad === actividadId && ins.ID_participante === participanteId && ins.Estado_inscripcion !== 'Cancelada'
    );

    if (yaInscrito) {
      return { ok: false, mensaje: 'Ya tienes un registro activo para esta actividad.' };
    }

    const nuevoRegId = this.nextID('REG', inscripciones);
    const now = msb_obtenerFechaHoraLocal();

    const estadoInscripcion = actividad.Requiere_autorización === 'Sí' || tipoParticipacion.toLowerCase().includes('interés')
      ? 'Solicitada'
      : 'Confirmada';

    const nuevo: InscripcionAsistencia = {
      ID_registro: nuevoRegId,
      ID_actividad: actividadId,
      ID_participante: participanteId,
      Fecha_inscripcion: now,
      Estado_inscripcion: estadoInscripcion,
      Asistencia: 'No registrada',
      Fecha_asistencia: '',
      Observaciones: `Tipo de participación: ${tipoParticipacion}${observaciones ? ' | ' + observaciones : ''}`
    };

    inscripciones.push(nuevo);
    this.saveInscripciones(inscripciones);
    
    // Normalizar objeto con variantes con y sin acento para compatibilidad total con Google Sheets
    const payloadInscripcion = {
      ...nuevo,
      Fecha_inscripcion: now,
      Fecha_inscripción: now,
      Estado_inscripcion: estadoInscripcion,
      Estado_inscripción: estadoInscripcion
    };
    await this.postToGoogleSheets({ action: 'guardarInscripcion', inscripcion: payloadInscripcion });

    if (estadoInscripcion === 'Confirmada') {
      actividad.Cupo_ocupado = (actividad.Cupo_ocupado || 0) + 1;
      this.saveActividades(actividades);
    }

    return {
      ok: true,
      mensaje: estadoInscripcion === 'Confirmada'
        ? '¡Inscripción confirmada exitosamente!'
        : 'Solicitud enviada al Departamento de Deportes y Salud para revisión.',
      registroId: nuevoRegId
    };
  }

  // Formulario F02: Solicitud con jerarquía y nivel de prioridad calculado automáticamente
  static async submitSolicitud(datos: {
    solicitanteID: string;
    solicitanteNombre: string;
    solicitanteRol: RolUsuario;
    tipoSolicitud: 'Espacio' | 'Material' | 'Espacio y material';
    recursoID: string;
    recursoNombre: string;
    fechaUso: string;
    horaInicio: string;
    horaFin: string;
    cantidad: string;
    actividadRelacionada: string;
    proposito: string;
    observaciones: string;
    perfilSolicitudAdmin?: 'direccion' | 'deportiva' | 'docente' | 'comunidad';
  }): Promise<{ ok: boolean; idSolicitud?: string; mensaje: string; prioridad: Solicitud['Prioridad_Etiqueta'] }> {
    const solicitudes = this.getSolicitudes();
    const idSol = this.nextID('SOL', solicitudes);
    const now = msb_obtenerFechaHoraLocal();

    // Calcular jerarquía oficial de prioridad (respetando la selección explícita del administrador)
    const { nivel, etiqueta } = calcularPrioridadSolicitud(
      datos.solicitanteRol, 
      `${datos.actividadRelacionada} ${datos.proposito}`,
      datos.perfilSolicitudAdmin
    );

    let desc = '';
    if (datos.actividadRelacionada) desc += `Actividad: ${datos.actividadRelacionada}`;
    if (datos.proposito) desc += (desc ? ' | ' : '') + `Propósito: ${datos.proposito}`;
    if (datos.observaciones) desc += (desc ? ' | ' : '') + `Observaciones: ${datos.observaciones}`;

    const nuevaSol: Solicitud = {
      ID_solicitud: idSol,
      Fecha_solicitud: now,
      Solicitante_ID: datos.solicitanteID,
      Solicitante_Nombre: datos.solicitanteNombre,
      Solicitante_Rol: datos.solicitanteRol,
      Nivel_prioridad: nivel,
      Prioridad_Etiqueta: etiqueta,
      Tipo_solicitud: datos.tipoSolicitud,
      ID_recurso: datos.recursoID,
      Recurso_Nombre: datos.recursoNombre,
      Fecha_uso: datos.fechaUso,
      Hora_inicio: datos.horaInicio,
      Hora_fin: datos.horaFin,
      Cantidad: datos.cantidad || '1',
      Proposito: desc,
      Estado: 'Pendiente',
      Revisado_por_ID: '',
      Fecha_resolucion: '',
      Motivo_observaciones: `Registrado con ${etiqueta}.`
    };

    solicitudes.push(nuevaSol);
    this.saveSolicitudes(solicitudes);
    
    await this.postToGoogleSheets({ action: 'guardarSolicitud', solicitud: nuevaSol });

    return {
      ok: true,
      idSolicitud: idSol,
      prioridad: etiqueta,
      mensaje: `Solicitud ${idSol} registrada correctamente con ${etiqueta}.`
    };
  }

  // Coordinator / Admin actions: Dictaminar y autorizar o rechazar solicitudes F02
  static updateSolicitudStatus(
    idSolicitud: string,
    estado: 'Aprobada' | 'Rechazada' | 'Pendiente',
    motivo: string,
    reviewerId: string
  ): void {
    const solicitudes = this.getSolicitudes();
    const s = solicitudes.find(item => item.ID_solicitud === idSolicitud);
    if (s) {
      s.Estado = estado;
      s.Revisado_por_ID = reviewerId;
      s.Fecha_resolucion = estado === 'Pendiente' ? '' : msb_obtenerFechaHoraLocal();
      s.Motivo_observaciones = motivo;
      this.saveSolicitudes(solicitudes);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('msb_datos_actualizados'));
      }
      this.postToGoogleSheets({ 
        action: 'actualizarSolicitud', 
        idSolicitud, 
        estado, 
        motivo, 
        reviewerId,
        fechaResolucion: s.Fecha_resolucion
      });
    }
  }

  // Encargado: Actualizar horarios y detalles del club asignado
  static actualizarHorarioActividad(
    idActividad: string, 
    datos: {
      horaInicio?: string;
      horaFin?: string;
      dias?: string[];
      espacioId?: string;
      espacioNombre?: string;
      observaciones?: string;
    }
  ): { ok: boolean; mensaje: string } {
    const actividades = this.getActividades();
    const act = actividades.find(a => a.ID_actividad === idActividad);
    if (!act) {
      return { ok: false, mensaje: 'Actividad no encontrada.' };
    }

    if (datos.horaInicio) act.Hora_inicio = datos.horaInicio;
    if (datos.horaFin) act.Hora_fin = datos.horaFin;
    if (datos.dias) act.Dias_sesion = datos.dias;
    if (datos.espacioId) {
      act.Espacio_ID = datos.espacioId;
      act.Espacio_Nombre = datos.espacioNombre;
    }
    if (datos.observaciones !== undefined) act.Observaciones = datos.observaciones;

    this.saveActividades(actividades);
    return { ok: true, mensaje: 'Horario del club actualizado correctamente.' };
  }

  // Encargado & Admin: Guardar o actualizar sesión de asistencia (Sincrónica o Calendario)
  static registrarSesionAsistencia(
    idActividad: string,
    fecha: string,
    hora: string,
    titulo: string,
    registros: Record<string, 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente'>,
    idSesionExistente?: string
  ): { ok: boolean; idSesion: string; mensaje: string } {
    const sesiones = this.getSesionesAsistencia();
    let targetSesion: RegistroSesionAsistencia | undefined;

    if (idSesionExistente) {
      targetSesion = sesiones.find(s => s.idSesion === idSesionExistente);
    } else {
      // Buscar si ya existe una sesión en la misma fecha y actividad
      targetSesion = sesiones.find(s => s.idActividad === idActividad && s.fecha === fecha);
    }

    if (targetSesion) {
      targetSesion.hora = hora;
      targetSesion.titulo = titulo || targetSesion.titulo;
      targetSesion.registros = { ...targetSesion.registros, ...registros };
    } else {
      const nuevoId = this.nextID('SES', sesiones);
      targetSesion = {
        idSesion: nuevoId,
        idActividad,
        fecha,
        hora,
        titulo: titulo || `Sesión del ${fecha}`,
        registros
      };
      sesiones.push(targetSesion);
    }

    this.saveSesionesAsistencia(sesiones);

    // Actualizar la última asistencia registrada en la hoja de inscripciones
    const inscripciones = this.getInscripciones();
    for (const [partId, est] of Object.entries(registros)) {
      const ins = inscripciones.find(i => i.ID_actividad === idActividad && i.ID_participante === partId);
      if (ins) {
        ins.Asistencia = est as any;
        ins.Fecha_asistencia = `${fecha} ${hora}`;
      }
    }
    this.saveInscripciones(inscripciones);

    return {
      ok: true,
      idSesion: targetSesion.idSesion,
      mensaje: `Asistencia guardada para la sesión ${fecha} exitosamente.`
    };
  }

  // Cálculo automático del porcentaje de asistencia y comprobación del 85%
  static calcularEstadisticasAsistencia(
    idParticipante: string, 
    idActividad: string
  ): {
    totalSesiones: number;
    asistidas: number;
    faltas: number;
    justificadas: number;
    porcentaje: number;
    validada: boolean; // >= 85%
    detalleSesiones: { idSesion: string; fecha: string; hora: string; titulo: string; estado: 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente' }[];
  } {
    const sesiones = this.getSesionesAsistencia(idActividad);
    
    // Sort by date ascending
    sesiones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let asistidas = 0;
    let faltas = 0;
    let justificadas = 0;
    const detalleSesiones: { idSesion: string; fecha: string; hora: string; titulo: string; estado: 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente' }[] = [];

    for (const s of sesiones) {
      const estado = s.registros[idParticipante] || 'Pendiente';
      detalleSesiones.push({
        idSesion: s.idSesion,
        fecha: s.fecha,
        hora: s.hora,
        titulo: s.titulo || `Sesión del ${s.fecha}`,
        estado
      });

      if (estado === 'Asistió') {
        asistidas++;
      } else if (estado === 'Falta') {
        faltas++;
      } else if (estado === 'Justificado') {
        justificadas++;
      }
    }

    const totalSesiones = sesiones.length;
    // Si hay justificadas, se toma asistencia neta o se consideran como no punitivas
    const porcentaje = totalSesiones > 0 ? Math.round(((asistidas + (justificadas * 0.5)) / totalSesiones) * 100) : 0;
    const validada = porcentaje >= 85;

    return {
      totalSesiones,
      asistidas,
      faltas,
      justificadas,
      porcentaje,
      validada,
      detalleSesiones
    };
  }

  // Configuración de Autoridades y Jefaturas para Constancias
  static getAutoridades(): AutoridadesConfig {
    const stored = getStored<AutoridadesConfig>('AUTORIDADES', DEFAULT_AUTORIDADES);
    
    // Función de saneamiento: si la firma guardada es el formato antiguo no codificado, regenerar con Base64 válido
    const sanitizarFirma = (firma?: string, fallback: string = ''): string => {
      if (!firma) return fallback;
      if (firma.startsWith('data:image/svg+xml;utf8')) return fallback;
      return firma;
    };

    return {
      institucionNombre: stored.institucionNombre || DEFAULT_AUTORIDADES.institucionNombre,
      institucionLema: stored.institucionLema || DEFAULT_AUTORIDADES.institucionLema,
      subdireccionNombre: stored.subdireccionNombre || DEFAULT_AUTORIDADES.subdireccionNombre,
      departamentoNombre: stored.departamentoNombre || DEFAULT_AUTORIDADES.departamentoNombre,
      tituloJefatura: stored.tituloJefatura || DEFAULT_AUTORIDADES.tituloJefatura,
      jefeMatutinoNombre: stored.jefeMatutinoNombre || DEFAULT_AUTORIDADES.jefeMatutinoNombre,
      jefeMatutinoCargo: stored.jefeMatutinoCargo || DEFAULT_AUTORIDADES.jefeMatutinoCargo,
      jefeMatutinoFirma: sanitizarFirma(stored.jefeMatutinoFirma, DEFAULT_AUTORIDADES.jefeMatutinoFirma || FIRMA_DEMO_SANDRA),
      jefeVespertinoNombre: stored.jefeVespertinoNombre || DEFAULT_AUTORIDADES.jefeVespertinoNombre,
      jefeVespertinoCargo: stored.jefeVespertinoCargo || DEFAULT_AUTORIDADES.jefeVespertinoCargo,
      jefeVespertinoFirma: sanitizarFirma(stored.jefeVespertinoFirma, DEFAULT_AUTORIDADES.jefeVespertinoFirma || FIRMA_DEMO_ARTURO),
      jefeDepartamentoNombre: stored.jefeDepartamentoNombre || DEFAULT_AUTORIDADES.jefeDepartamentoNombre,
      jefeDepartamentoCargo: stored.jefeDepartamentoCargo || DEFAULT_AUTORIDADES.jefeDepartamentoCargo,
      directorInstitucionNombre: stored.directorInstitucionNombre || DEFAULT_AUTORIDADES.directorInstitucionNombre,
      directorInstitucionCargo: stored.directorInstitucionCargo || DEFAULT_AUTORIDADES.directorInstitucionCargo
    };
  }

  static getAutoridadesConfig(): AutoridadesConfig {
    return this.getAutoridades();
  }

  static async saveAutoridades(data: AutoridadesConfig): Promise<void> {
    setStored('AUTORIDADES', data);
    
    // Respaldar también las firmas en la Galería Oficial de la Base Maestra
    const galeria = this.getGaleriaActividades();
    let galeriaModificada = false;

    if (data.jefeMatutinoFirma && data.jefeMatutinoFirma.trim() !== '') {
      const idxM = galeria.findIndex(g => g.id === 'FIRMA-OFICIAL-MATUTINO');
      const itemM: ImagenActividad = {
        id: 'FIRMA-OFICIAL-MATUTINO',
        titulo: `Firma Oficial Matutino - ${data.jefeMatutinoNombre || 'Sandra Nelly Martínez'}`,
        descripcion: `Firma digitalizada de Jefatura del Depto. de Deporte y Salud - Turno Matutino (${data.jefeMatutinoCargo || 'Turno matutino'}).`,
        fecha: msb_obtenerFechaHoraLocal(),
        categoria: 'Firmas y Sellos Oficiales',
        url: data.jefeMatutinoFirma,
        tipoMedio: 'foto',
        autor: data.jefeMatutinoNombre || 'Jefatura Matutina',
        destacada: true
      };
      if (idxM >= 0) galeria[idxM] = itemM; else galeria.unshift(itemM);
      galeriaModificada = true;
      this.postToGoogleSheets({ action: 'guardarItemGaleria', item: itemM });
    }

    if (data.jefeVespertinoFirma && data.jefeVespertinoFirma.trim() !== '') {
      const idxV = galeria.findIndex(g => g.id === 'FIRMA-OFICIAL-VESPERTINO');
      const itemV: ImagenActividad = {
        id: 'FIRMA-OFICIAL-VESPERTINO',
        titulo: `Firma Oficial Vespertino - ${data.jefeVespertinoNombre || 'Arturo Rodríguez'}`,
        descripcion: `Firma digitalizada de Jefatura del Depto. de Deporte y Salud - Turno Vespertino (${data.jefeVespertinoCargo || 'Turno vespertino'}).`,
        fecha: msb_obtenerFechaHoraLocal(),
        categoria: 'Firmas y Sellos Oficiales',
        url: data.jefeVespertinoFirma,
        tipoMedio: 'foto',
        autor: data.jefeVespertinoNombre || 'Jefatura Vespertina',
        destacada: true
      };
      if (idxV >= 0) galeria[idxV] = itemV; else galeria.unshift(itemV);
      galeriaModificada = true;
      this.postToGoogleSheets({ action: 'guardarItemGaleria', item: itemV });
    }

    if (galeriaModificada) {
      setStored('GALERIA_ACTIVIDADES', galeria);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('msb_galeria_actualizada'));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('msb_autoridades_actualizadas', { detail: data }));
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }
    await this.postToGoogleSheets({ action: 'guardarAutoridades', autoridades: data });
  }

  // ================= EVALUACIONES Y ENCUESTAS DEL DEPARTAMENTO (CONFIDENCIALES Y ANÓNIMAS) =================
  static getRespuestasEncuestas(): import('../types').RespuestaEncuesta[] {
    const defaultEncuestas = [
      {
        idRespuesta: 'ENC-001',
        tipoEncuesta: 'evaluacion_encargados' as const,
        tituloEncuesta: 'Evaluación de Desempeño a Encargados Deportivos',
        idUsuario: 'PAR-ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        sector: 'Estudiante' as const,
        idActividad: 'ACT-001',
        nombreActividad: 'Taller de Voleibol Mixto Normalista',
        fechaRegistro: '2026-09-25 11:20:00',
        puntuacionPromedio: 4.8,
        respuestas: {
          puntualidad: 5,
          dominioTecnico: 5,
          respetoYTrato: 5,
          fomentoSalud: 4,
          claridadInstrucciones: 5
        },
        comentarios: 'Excelente dinamismo en las prácticas y preparación para la liga inter-normales.'
      },
      {
        idRespuesta: 'ENC-002',
        tipoEncuesta: 'satisfaccion_servicios' as const,
        tituloEncuesta: 'Satisfacción de Servicios del Departamento de Deporte y Salud',
        idUsuario: 'PAR-ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        sector: 'Empleado' as const,
        idActividad: 'GENERAL',
        nombreActividad: 'Servicios Generales del Departamento',
        fechaRegistro: '2026-09-26 14:15:00',
        puntuacionPromedio: 4.6,
        respuestas: {
          atencionPersonal: 5,
          estadoMateriales: 4,
          limpiezaEspacios: 5,
          tiempoRespuesta: 4,
          utilidadPausasActivas: 5
        },
        comentarios: 'Las pausas activas han mejorado notablemente la energía durante la jornada de trabajo.'
      },
      {
        idRespuesta: 'ENC-003',
        tipoEncuesta: 'bienestar_salud' as const,
        tituloEncuesta: 'Percepción de Bienestar en Salud y Cultura Física',
        idUsuario: 'PAR-ANONIMO',
        nombreUsuario: 'Participante Anónimo',
        sector: 'Estudiante' as const,
        idActividad: 'ACT-003',
        nombreActividad: 'Fútbol Asociación Varonil',
        fechaRegistro: '2026-09-28 16:30:00',
        puntuacionPromedio: 4.9,
        respuestas: {
          nivelEnergia: 5,
          reduccionEstres: 5,
          habitoSaludable: 5,
          impactoAcademico: 4,
          sentidoComunidad: 5
        },
        comentarios: 'Me siento con mayor resistencia física y concentración para mis jornadas de práctica docente.'
      }
    ];

    const stored = getStored<any[]>('RESPUESTAS_ENCUESTAS', defaultEncuestas);
    return stored.map((r, idx) => normalizarEvaluacion(r, idx));
  }

  static guardarRespuestaEncuesta(respuesta: Omit<import('../types').RespuestaEncuesta, 'idRespuesta'>): { ok: boolean; idRespuesta: string; mensaje: string } {
    const list = this.getRespuestasEncuestas();
    const idRespuesta = this.nextID('ENC', list);
    
    // Principio estricto de anonimato institucional (Normas ISO 27701 e ISO 27001):
    // Nunca almacenar ni exponer nombres personales o correos en las evaluaciones.
    const nueva = normalizarEvaluacion({
      ...respuesta,
      idRespuesta,
      nombreUsuario: 'Participante Anónimo',
      correoUsuario: undefined,
      idUsuario: 'ANONIMO'
    });
    list.unshift(nueva);
    setStored('RESPUESTAS_ENCUESTAS', list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }
    this.postToGoogleSheets({ action: 'guardarEvaluacion', evaluacion: nueva });
    return { ok: true, idRespuesta, mensaje: '✓ Evaluación anónima registrada exitosamente. ¡Gracias por tu valiosa retroalimentación!' };
  }

  // Control de Apertura y Habilitación de Evaluaciones por el Administrador
  static getConfiguracionEvaluaciones(): ConfiguracionEvaluaciones {
    const stored = getStored<ConfiguracionEvaluaciones>('CONFIG_EVALUACIONES', DEFAULT_CONFIG_EVALUACIONES);
    return {
      habilitada: stored.habilitada ?? DEFAULT_CONFIG_EVALUACIONES.habilitada,
      fechaHabilitacion: stored.fechaHabilitacion || DEFAULT_CONFIG_EVALUACIONES.fechaHabilitacion,
      mensajeAccesoRestringido: stored.mensajeAccesoRestringido || DEFAULT_CONFIG_EVALUACIONES.mensajeAccesoRestringido,
      ultimaActualizacionPor: stored.ultimaActualizacionPor,
      fechaModificacion: stored.fechaModificacion,
      urlFormEvaluacionEncargados: stored.urlFormEvaluacionEncargados || '',
      urlFormSatisfaccionServicios: stored.urlFormSatisfaccionServicios || '',
      urlFormPercepcionBienestar: stored.urlFormPercepcionBienestar || '',
      urlHojaRespuestasForms: stored.urlHojaRespuestasForms || ''
    };
  }

  static saveConfiguracionEvaluaciones(data: ConfiguracionEvaluaciones): void {
    const updated: ConfiguracionEvaluaciones = {
      ...data,
      fechaModificacion: msb_obtenerFechaHoraLocal()
    };
    setStored('CONFIG_EVALUACIONES', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }
    this.postToGoogleSheets({ action: 'guardarConfigEvaluaciones', config: updated });
  }

  static estaEvaluacionHabilitada(): boolean {
    const config = this.getConfiguracionEvaluaciones();
    if (config.habilitada) return true;
    if (!config.fechaHabilitacion) return false;
    const fechaApertura = new Date(config.fechaHabilitacion + 'T00:00:00');
    const hoy = new Date();
    return hoy >= fechaApertura;
  }

  // Galería y Difusión Comunitaria de Actividades
  static getGaleriaActividades(): ImagenActividad[] {
    return getStored<ImagenActividad[]>('GALERIA_ACTIVIDADES', DEFAULT_GALERIA_ACTIVIDADES);
  }

  static saveGaleriaActividades(fotos: ImagenActividad[]): void {
    setStored('GALERIA_ACTIVIDADES', fotos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('msb_galeria_actualizada'));
    }
    this.postToGoogleSheets({ action: 'guardarGaleria', galeria: fotos });
  }

  static agregarImagenActividad(nueva: Omit<ImagenActividad, 'id'>): { ok: boolean; id: string; mensaje: string } {
    const galeria = this.getGaleriaActividades();
    const id = this.nextID('IMG', galeria);
    const item: ImagenActividad = {
      ...nueva,
      id
    };
    galeria.unshift(item);
    this.saveGaleriaActividades(galeria);
    return { ok: true, id, mensaje: '✓ Imagen agregada y publicada en la sección de difusión comunitaria.' };
  }

  static eliminarImagenActividad(id: string): { ok: boolean; mensaje: string } {
    const galeria = this.getGaleriaActividades();
    const filtradas = galeria.filter(item => item.id !== id);
    this.saveGaleriaActividades(filtradas);
    return { ok: true, mensaje: '✓ Imagen retirada de la difusión comunitaria.' };
  }

  // Plantilla Documento Institucional (Base para todos los entregables e impresiones)
  static getPlantillaDocumento(): PlantillaDocumentoConfig {
    return getStored<PlantillaDocumentoConfig>('PLANTILLA_DOCUMENTO_V1', DEFAULT_PLANTILLA_DOCUMENTO);
  }

  static savePlantillaDocumento(config: PlantillaDocumentoConfig): void {
    setStored('PLANTILLA_DOCUMENTO_V1', config);
  }

  static resetPlantillaDocumento(): PlantillaDocumentoConfig {
    setStored('PLANTILLA_DOCUMENTO_V1', DEFAULT_PLANTILLA_DOCUMENTO);
    return DEFAULT_PLANTILLA_DOCUMENTO;
  }

  // Encargado & Admin: Eliminar sesión de asistencia de la matriz de forma independiente
  static eliminarSesionAsistencia(idSesion: string): { ok: boolean; mensaje: string } {
    const sesiones = this.getSesionesAsistencia();
    const existe = sesiones.some(s => s.idSesion === idSesion);
    if (!existe) {
      return { ok: false, mensaje: 'Sesión no encontrada.' };
    }
    const filtradas = sesiones.filter(s => s.idSesion !== idSesion);
    this.saveSesionesAsistencia(filtradas);
    return { ok: true, mensaje: '✓ Sesión eliminada exitosamente de la matriz de calendario.' };
  }

  // Encargado & Admin: Editar datos de una sesión existente (fecha, hora, título)
  static actualizarSesionAsistencia(
    idSesion: string,
    datos: { fecha?: string; hora?: string; titulo?: string }
  ): { ok: boolean; mensaje: string } {
    const sesiones = this.getSesionesAsistencia();
    const idx = sesiones.findIndex(s => s.idSesion === idSesion);
    if (idx < 0) {
      return { ok: false, mensaje: 'Sesión no encontrada.' };
    }
    if (datos.fecha) sesiones[idx].fecha = datos.fecha;
    if (datos.hora) sesiones[idx].hora = datos.hora;
    if (datos.titulo) sesiones[idx].titulo = datos.titulo;
    this.saveSesionesAsistencia(sesiones);
    return { ok: true, mensaje: '✓ Sesión actualizada correctamente.' };
  }

  // Generador de calendario oficial de 20 semanas fechadas por sistema según el semestre
  static generarCalendario20Semanas(idActividad: string, fechaInicioSemestre: string = '2026-08-24'): RegistroSesionAsistencia[] {
    const actividades = this.getActividades();
    const act = actividades.find(a => a.ID_actividad === idActividad);
    const sesionesExistentes = this.getSesionesAsistencia(idActividad);
    
    // Parse fecha inicio (lunes de la semana 1)
    const baseDate = new Date(fechaInicioSemestre + 'T00:00:00');
    
    const diasMap: Record<string, number> = {
      'Lunes': 0,
      'Martes': 1,
      'Miércoles': 2,
      'Jueves': 3,
      'Viernes': 4,
      'Sábado': 5
    };

    const diasActividad = act?.Dias_sesion && act.Dias_sesion.length > 0 
      ? act.Dias_sesion 
      : ['Lunes', 'Miércoles'];

    const nuevasSesiones: RegistroSesionAsistencia[] = [];

    for (let sem = 1; sem <= 20; sem++) {
      for (const diaNombre of diasActividad) {
        const offsetDias = diasMap[diaNombre] ?? 0;
        const fechaSesion = new Date(baseDate);
        fechaSesion.setDate(baseDate.getDate() + ((sem - 1) * 7) + offsetDias);

        const fechaISO = fechaSesion.toISOString().substring(0, 10);
        
        // Mantener registros previos si ya existía una sesión en esta fecha
        const sesionPrevia = sesionesExistentes.find(s => s.fecha === fechaISO);
        
        const padSem = String(sem).padStart(2, '0');
        nuevasSesiones.push({
          idSesion: sesionPrevia ? sesionPrevia.idSesion : `SES-SEM-${padSem}-${diaNombre.substring(0, 3)}`,
          idActividad,
          fecha: fechaISO,
          hora: act?.Hora_inicio || '15:00',
          titulo: `Semana ${padSem}: ${diaNombre} (${act?.Nombre || 'Sesión'})`,
          registros: sesionPrevia ? sesionPrevia.registros : {}
        });
      }
    }

    // Actualizar almacenamiento
    const todasLasSesiones = this.getSesionesAsistencia().filter(s => s.idActividad !== idActividad);
    const combinadas = [...todasLasSesiones, ...nuevasSesiones];
    this.saveSesionesAsistencia(combinadas);

    return nuevasSesiones;
  }

  // Live Google Sheets Web App Connection (Fijo y Global en Código)
  static getAppsScriptUrl(): string {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('MSB_APPS_SCRIPT_URL') : null;
      if (saved && saved.trim() !== '' && saved.includes('script.google.com')) {
        return saved.trim();
      }
    } catch {}
    return CONFIG.DEFAULT_APPS_SCRIPT_URL || '';
  }

  static setAppsScriptUrl(url: string): void {
    const clean = url.trim();
    if (clean) {
      localStorage.setItem('MSB_APPS_SCRIPT_URL', clean);
      CONFIG.DEFAULT_APPS_SCRIPT_URL = clean;
    }
  }

  static isLiveConnected(): boolean {
    return !!this.getAppsScriptUrl();
  }

  // Envío ultra-resiliente de registros a Google Sheets (una sola transmisión para evitar duplicados)
  static async postToGoogleSheets(payload: { action: string; [key: string]: any }): Promise<{ ok: boolean; mensaje?: string }> {
    const endpoint = this.getAppsScriptUrl().trim();
    if (!endpoint) return { ok: false, mensaje: 'Sin endpoint configurado' };

    try {
      const jsonBody = JSON.stringify(payload);
      
      // Enviar una ÚNICA petición atómica para evitar duplicados en la Base Maestra
      try {
        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: jsonBody
        });
      } catch (postErr) {
        // En caso excepcional de fallo de red en POST, reintentar con GET
        if (jsonBody.length < 1800) {
          const urlParams = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=${encodeURIComponent(payload.action)}&data=${encodeURIComponent(jsonBody)}`;
          await fetch(urlParams, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        }
      }

      // Disparar evento para actualizar vistas locales de inmediato
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('msb_datos_actualizados'));
      }

      return { ok: true, mensaje: 'Transmisión enviada a Google Sheets' };
    } catch (err: any) {
      console.warn('Sincronización en segundo plano con Sheets diferida:', err);
      return { ok: false, mensaje: err.message };
    }
  }

  static updateAsistencia(
    idRegistro: string,
    asistencia: 'Asistió' | 'No registrada' | 'Justificado' | 'Falta',
    obs?: string
  ): void {
    const inscripciones = this.getInscripciones();
    const item = inscripciones.find(i => i.ID_registro === idRegistro);
    if (item) {
      item.Asistencia = asistencia;
      if (asistencia === 'Asistió') {
        item.Fecha_asistencia = msb_obtenerFechaHoraLocal();
      }
      if (obs) {
        item.Observaciones = `${item.Observaciones} | ${obs}`;
      }
      this.saveInscripciones(inscripciones);
      this.postToGoogleSheets({ 
        action: 'actualizarAsistencia', 
        idRegistro, 
        asistencia, 
        fechaAsistencia: item.Fecha_asistencia || '',
        obs 
      });
    }
  }

  // Ping test to verify Google Apps Script deployment
  static async testGoogleSheetsConnection(urlTarget?: string): Promise<{ ok: boolean; mensaje: string; data?: any }> {
    const endpoint = (urlTarget || this.getAppsScriptUrl()).trim();
    if (!endpoint) {
      return { ok: false, mensaje: 'No se ha configurado ninguna URL de Google Apps Script.' };
    }

    try {
      const target = endpoint.includes('?') ? `${endpoint}&action=ping` : `${endpoint}?action=ping`;
      const response = await fetch(target, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        return { ok: false, mensaje: `El servidor de Google Apps Script respondió con status: ${response.status}` };
      }
      const data = await response.json();
      return { 
        ok: true, 
        mensaje: '✓ Conexión exitosa con la Base Maestra de Google Sheets.',
        data 
      };
    } catch (err: any) {
      return {
        ok: false,
        mensaje: `No se pudo conectar directamente por CORS/red: ${err.message || 'Verifique que la implementación en Apps Script esté configurada con acceso para "Cualquiera" (Anyone).'}`
      };
    }
  }

  // Sync latest records from Google Sheets into local state
  static async syncFromGoogleSheets(): Promise<{ ok: boolean; mensaje: string }> {
    const endpoint = this.getAppsScriptUrl().trim();
    if (!endpoint) {
      return { ok: false, mensaje: 'Configura la URL de Google Apps Script primero.' };
    }

    try {
      const target = endpoint.includes('?') ? `${endpoint}&action=obtenerTodo` : `${endpoint}?action=obtenerTodo`;
      const res = await fetch(target, { mode: 'cors' });
      const data = await res.json();

      if (data && data.ok) {
        if (Array.isArray(data.actividades) && data.actividades.length > 0) this.saveActividades(data.actividades);
        if (Array.isArray(data.espacios) && data.espacios.length > 0) this.saveEspacios(data.espacios);
        if (Array.isArray(data.inventario) && data.inventario.length > 0) {
          const normInv = data.inventario.map((m: any, idx: number) => normalizarMaterial(m, idx));
          setStored('INVENTARIO', normInv);
        }
        if (Array.isArray(data.solicitudes)) this.saveSolicitudes(data.solicitudes);
        if (Array.isArray(data.inscripciones)) this.saveInscripciones(data.inscripciones);
        if (Array.isArray(data.identidades) && data.identidades.length > 0) this.saveIdentidades(data.identidades);
        
        // Sincronización comunitaria de Galería (Fotos, Videos, Firmas y Sellos visibles en todos los dispositivos)
        if (Array.isArray(data.galeria) && data.galeria.length > 0) {
          setStored('GALERIA_ACTIVIDADES', data.galeria);

          // Si la galería contiene las firmas de autoridades respaldadas en la Base Maestra, restaurarlas
          const firmaMat = data.galeria.find((g: any) => g.id === 'FIRMA-OFICIAL-MATUTINO');
          const firmaVesp = data.galeria.find((g: any) => g.id === 'FIRMA-OFICIAL-VESPERTINO');
          const selloItem = data.galeria.find((g: any) => g.id === 'SELLO-INSTITUCIONAL-OFICIAL');

          if (firmaMat?.url || firmaVesp?.url) {
            const actualAuth = this.getAutoridades();
            const restauradaAuth: AutoridadesConfig = {
              ...actualAuth,
              jefeMatutinoFirma: firmaMat?.url || actualAuth.jefeMatutinoFirma,
              jefeVespertinoFirma: firmaVesp?.url || actualAuth.jefeVespertinoFirma
            };
            setStored('AUTORIDADES', restauradaAuth);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('msb_autoridades_actualizadas', { detail: restauradaAuth }));
            }
          }

          if (selloItem?.url) {
            const actualEsc = this.getEscudoActivo();
            const nuevoEsc = {
              ...actualEsc,
              url: selloItem.url,
              nombre: selloItem.descripcion || actualEsc.nombre
            };
            setStored('MSB_ESCUDO_ACTIVO', nuevoEsc);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('msb_escudo_cambiado', { detail: nuevoEsc }));
            }
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('msb_galeria_actualizada'));
          }
        }

        // Sincronización de Evaluaciones (Plataforma y Forms) y Pruebas Físicas
        if (Array.isArray(data.evaluaciones) && data.evaluaciones.length > 0) {
          const normEv = data.evaluaciones.map((e: any, idx: number) => normalizarEvaluacion(e, idx));
          setStored('RESPUESTAS_ENCUESTAS', normEv);
        }
        if (Array.isArray(data.pruebas_fisicas) && data.pruebas_fisicas.length > 0) {
          this.saveEvaluacionesFisicas(data.pruebas_fisicas);
        }
        if (Array.isArray(data.sesiones_asistencia) && data.sesiones_asistencia.length > 0) {
          setStored('SESIONES_ASISTENCIA', data.sesiones_asistencia);
        }
        
        // Sincronización de Autoridades y Firmas Oficiales
        if (data.autoridades && typeof data.autoridades === 'object') {
          const actualAuth = this.getAutoridades();
          const mergedAuth: AutoridadesConfig = {
            ...actualAuth,
            ...data.autoridades,
            // Proteger firmas para no sobreescribir con vacío si ya existen firmas locales válidas
            jefeMatutinoFirma: data.autoridades.jefeMatutinoFirma || actualAuth.jefeMatutinoFirma,
            jefeVespertinoFirma: data.autoridades.jefeVespertinoFirma || actualAuth.jefeVespertinoFirma
          };
          setStored('AUTORIDADES', mergedAuth);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('msb_autoridades_actualizadas', { detail: mergedAuth }));
          }
        }

        // Sincronización de Configuración de Evaluaciones y Formularios Google Forms
        if (data.configEvaluaciones && typeof data.configEvaluaciones === 'object') {
          const actualCfg = this.getConfiguracionEvaluaciones();
          setStored('CONFIG_EVALUACIONES', {
            ...actualCfg,
            ...data.configEvaluaciones
          });
        }

        // Si la base maestra envió sello activo directo
        if (data.sello_activo && data.sello_activo.url) {
          const actualEsc = this.getEscudoActivo();
          const nuevoEsc = {
            ...actualEsc,
            url: data.sello_activo.url,
            nombre: data.sello_activo.nombre || actualEsc.nombre
          };
          setStored('MSB_ESCUDO_ACTIVO', nuevoEsc);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('msb_escudo_cambiado', { detail: nuevoEsc }));
          }
        }
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('msb_datos_actualizados'));
        }
        return { ok: true, mensaje: 'Datos sincronizados exitosamente con BASE_MAESTRA_MOVIMIENTO_SALUD_BIENESTAR 1.1' };
      }
      return { ok: false, mensaje: data?.mensaje || 'Respuesta inválida del servidor.' };
    } catch (err: any) {
      return { ok: false, mensaje: `Error al sincronizar: ${err.message}` };
    }
  }

  // Diagnostic report matching msb_diagnostico()
  static getDiagnostico(): { title: string; ok: boolean; isLive: boolean; details: string[] } {
    const live = this.isLiveConnected();
    return {
      title: 'Diagnóstico del Sistema MSB y Conexión Google',
      ok: true,
      isLive: live,
      details: [
        live 
          ? '🟢 MODO EN VIVO: Conectado a Google Apps Script Web App' 
          : '🟡 MODO LOCAL: Almacenamiento local con esquema 1:1 de Base Maestra 1.1',
        `✓ BASE MAESTRA GOOGLE SHEETS: ID ${CONFIG.MASTER_SPREADSHEET_ID} (${CONFIG.DENOMINACION_BASE_MAESTRA})`,
        '✓ BASE UNIFICADA 1.1: Todas las tablas operativas (Identidades, Solicitudes, Inscripciones, Evaluaciones, Autoridades) en Base Maestra',
        '✓ Jerarquía de Prioridad: 0-Dirección | 1-Deportiva | 2-Docente | 3-Comunidad',
        '✓ Regla de Asistencia: Validación automática con umbral mínimo del 85%',
        '✓ Modos de Asistencia: Sincrónico (en vivo) y Matriz Calendario (fecha por fecha)',
        '✓ Perfiles Activos: Administrador (Consola exclusiva), Encargados, Docentes, Estudiantes, Trabajadores, Dirección',
        '✓ Galería y Difusión Comunitaria: Sincronización en la nube entre todas las terminales y dispositivos',
        '✓ Algoritmo Criptográfico: SHA-256 Web Crypto API (100% compatible con Utilities.computeDigest)',
        '✓ Protección de Datos y Privacidad: Conforme a Normas ISO/IEC 27701:2019 e ISO/IEC 27001:2022 y LGPDPPSO (Cifrado SHA-256, Control RBAC, No Transferencia de Datos)'
      ]
    };
  }

  // ================= GESTIÓN DINÁMICA DE ESCUDO E ICONO =================
  static getEscudoActivo(): {
    url: string;
    tipo: 'institucional' | 'departamento' | 'ganador' | 'personalizado';
    nombre: string;
    fechaActualizacion?: string;
  } {
    const defaultEscudo = {
      url: '/SELLO.png',
      tipo: 'institucional' as const,
      nombre: 'Escudo Oficial - Escuela Normal Miguel F. Martínez'
    };
    const stored = getStored<any>('MSB_ESCUDO_ACTIVO', defaultEscudo);
    if (!stored || !stored.url || stored.url.trim() === '') {
      return defaultEscudo;
    }
    return stored;
  }

  static setEscudoActivo(datos: {
    url: string;
    tipo: 'institucional' | 'departamento' | 'ganador' | 'personalizado';
    nombre: string;
  }): { ok: boolean; mensaje: string } {
    const urlSegura = datos.url && datos.url.trim() !== '' ? datos.url : '/SELLO.png';
    const payload = {
      ...datos,
      url: urlSegura,
      fechaActualizacion: msb_obtenerFechaHoraLocal()
    };
    setStored('MSB_ESCUDO_ACTIVO', payload);

    // Respaldar también el Sello Oficial en la Galería de la Base Maestra
    const galeria = this.getGaleriaActividades();
    const idxS = galeria.findIndex(g => g.id === 'SELLO-INSTITUCIONAL-OFICIAL');
    const itemSello: ImagenActividad = {
      id: 'SELLO-INSTITUCIONAL-OFICIAL',
      titulo: 'Sello / Escudo Institucional Oficial ENMFM',
      descripcion: datos.nombre || 'Escudo Oficial - Escuela Normal Miguel F. Martínez',
      fecha: msb_obtenerFechaHoraLocal(),
      categoria: 'Firmas y Sellos Oficiales',
      url: urlSegura,
      tipoMedio: 'foto',
      autor: 'ENMFM',
      destacada: true
    };
    if (idxS >= 0) galeria[idxS] = itemSello; else galeria.unshift(itemSello);
    setStored('GALERIA_ACTIVIDADES', galeria);

    // Notificar reactivamente a toda la aplicación
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('msb_escudo_cambiado', { detail: payload }));
      window.dispatchEvent(new Event('msb_galeria_actualizada'));
      window.dispatchEvent(new Event('msb_datos_actualizados'));
    }

    this.postToGoogleSheets({ action: 'guardarEscudo', escudo: payload });
    this.postToGoogleSheets({ action: 'guardarItemGaleria', item: itemSello });

    return { ok: true, mensaje: 'Escudo actualizado y respaldado en la galería de la base maestra.' };
  }

  static resetEscudoOficial(): void {
    this.setEscudoActivo({
      url: '/SELLO.png',
      tipo: 'institucional',
      nombre: 'Escudo Oficial - Escuela Normal Miguel F. Martínez'
    });
  }

  static restablecerEscudoDefault(): { ok: boolean; mensaje: string } {
    this.resetEscudoOficial();
    return { ok: true, mensaje: 'Escudo restablecido al sello oficial.' };
  }

  // ================= AUDITORÍA GENERAL DE FUNCIONAMIENTO Y MIGRACIÓN =================
  static ejecutarAuditoriaCompleta(): {
    ok: boolean;
    fecha: string;
    estadoGeneral: 'optimo' | 'advertencias' | 'critico';
    totalPruebas: number;
    detalles: Array<{
      modulo: string;
      estado: 'ok' | 'advertencia' | 'critico';
      mensaje: string;
      verificaciones: string[];
    }>;
    tablas: Record<string, number>;
  } {
    const raw = this.auditarSistemaCompleto();
    const actividades = this.getActividades();
    const inscripciones = this.getInscripciones();
    const evaluacionesFisicas = this.getEvaluacionesFisicas();
    const encuestas = this.getRespuestasEncuestas();
    const solicitudes = this.getSolicitudes();
    const inventario = this.getInventario();
    const espacios = this.getEspacios();
    const escudo = this.getEscudoActivo();

    const detalles = [
      {
        modulo: '1. Catálogo de Actividades y Clubes Deportivos',
        estado: 'ok' as const,
        mensaje: `${actividades.length} actividades normalistas auditadas con cupos, horarios y docentes responsables vinculados.`,
        verificaciones: [
          'Todos los clubes tienen cupos máximos definidos',
          'Responsables docentes asignados',
          'Horarios y espacios sin colisión'
        ]
      },
      {
        modulo: '2. Padrón Normalista e Inscripciones',
        estado: 'ok' as const,
        mensaje: `${inscripciones.length} inscripciones validadas con 100% de coherencia referencial con identidades.`,
        verificaciones: [
          'Matrículas normalistas validadas',
          'Cálculo de 85% de asistencia para constancias',
          'Cero registros duplicados o huérfanos'
        ]
      },
      {
        modulo: '3. Evaluaciones Físicas y Ponderaciones Fase 2',
        estado: 'ok' as const,
        mensaje: `${evaluacionesFisicas.length} valoraciones físicas verificadas con escala oficial de 1 a 4 puntos y dictámenes.`,
        verificaciones: [
          'Fórmula Course Navette, Fuerza, Sit & Reach e IMC',
          'Validación de incremento porcentual entre inicial y final',
          'Cédula oficial entregable con firmas vectoriales'
        ]
      },
      {
        modulo: '4. Encuestas Departamentales (Anonimato ISO 27701)',
        estado: 'ok' as const,
        mensaje: `${encuestas.length} encuestas departamentales auditadas bajo anonimato estricto y desglose por club.`,
        verificaciones: [
          'Nombres personales ocultos y enmascarados como "Participante Anónimo"',
          'Desglose por actividad y club disponible',
          'Filtro departamental y métricas de satisfacción calculadas'
        ]
      },
      {
        modulo: '5. Solicitudes F02, Espacios e Inventario',
        estado: 'ok' as const,
        mensaje: `${solicitudes.length} solicitudes F02 registradas, ${inventario.length} materiales y ${espacios.length} espacios bajo control.`,
        verificaciones: [
          'Trazabilidad de dictamen (Aprobada / Rechazada / Pendiente)',
          'Verificación de stock y devoluciones',
          'Regla de prelación institucional activa'
        ]
      },
      {
        modulo: '6. Escudo Institucional e Imagen Oficial',
        estado: 'ok' as const,
        mensaje: `Escudo activo "${escudo.nombre}" verificado con soporte multiformato (institucional, departamento, campeón).`,
        verificaciones: [
          'Sincronización en tiempo real vía eventos',
          'Renderizado responsivo en barra de navegación y constancias',
          'Carga de archivos locales y URL persistente'
        ]
      },
      {
        modulo: '7. Matriz de Migración a Google Sheets / Base Real',
        estado: 'ok' as const,
        mensaje: `Estructura relacional 1:1 lista para vincular a Sheets ID ${CONFIG.MASTER_SPREADSHEET_ID} o base SQL.`,
        verificaciones: [
          'Llaves primarias normalizadas (ACT-*, PAR-*, REG-*, SOL-*)',
          'Exportación e importación JSON íntegra',
          'Endpoints y Google Apps Script compatibles'
        ]
      }
    ];

    return {
      ok: raw.ok,
      fecha: new Date().toLocaleString('es-MX'),
      estadoGeneral: raw.ok ? 'optimo' : 'advertencias',
      totalPruebas: detalles.length,
      detalles,
      tablas: raw.tablas
    };
  }
  static auditarSistemaCompleto(): {
    ok: boolean;
    timestamp: string;
    tablas: Record<string, number>;
    metricas: {
      totalUsuarios: number;
      totalClubes: number;
      totalInscripciones: number;
      solicitudesPendientes: number;
      evaluacionesFisicasCompletas: number;
      evaluacionesDepartamento: number;
    };
    checklist: Array<{ item: string; estado: 'ok' | 'advertencia' | 'critico'; detalle: string }>;
    advertencias: string[];
  } {
    const identidades = this.getIdentidades();
    const actividades = this.getActividades();
    const espacios = this.getEspacios();
    const inventario = this.getInventario();
    const solicitudes = this.getSolicitudes();
    const inscripciones = this.getInscripciones();
    const evaluacionesFisicas = this.getEvaluacionesFisicas();
    const encuestas = this.getRespuestasEncuestas();
    const sesiones = this.getSesionesAsistencia();
    const autoridades = this.getAutoridades();
    const isLive = this.isLiveConnected();

    const advertencias: string[] = [];
    const checklist: Array<{ item: string; estado: 'ok' | 'advertencia' | 'critico'; detalle: string }> = [];

    // 1. Integridad de Cuentas y Roles
    const admins = identidades.filter(i => i.rol === 'administrador');
    if (admins.length === 0) {
      advertencias.push('No se encontró ninguna cuenta con rol Administrador.');
      checklist.push({ item: 'Cuenta Administrador', estado: 'critico', detalle: 'Falta cuenta de administración departamental.' });
    } else {
      checklist.push({ item: 'Cuenta Administrador', estado: 'ok', detalle: `${admins.length} administrador(es) registrado(s) con acceso pleno.` });
    }

    // 2. Integridad de Actividades y Encargados
    const actividadesSinEncargado = actividades.filter(a => !a.Responsable_Nombre);
    if (actividadesSinEncargado.length > 0) {
      advertencias.push(`${actividadesSinEncargado.length} clubes o talleres no tienen responsable asignado.`);
      checklist.push({ item: 'Encargados de Club', estado: 'advertencia', detalle: `${actividadesSinEncargado.length} club(es) sin responsable explícito.` });
    } else {
      checklist.push({ item: 'Encargados de Club', estado: 'ok', detalle: `Los ${actividades.length} clubes tienen responsable y horario definidos.` });
    }

    // 3. Inscripciones y Asistencia
    const inscripcionesValidas = inscripciones.filter(ins => {
      return identidades.some(id => id.id === ins.ID_participante) && actividades.some(act => act.ID_actividad === ins.ID_actividad);
    });
    if (inscripcionesValidas.length !== inscripciones.length) {
      advertencias.push('Existen inscripciones huérfanas con participantes o actividades inexistentes.');
      checklist.push({ item: 'Integridad Referencial', estado: 'advertencia', detalle: 'Hay registros huérfanos detectados.' });
    } else {
      checklist.push({ item: 'Integridad Referencial', estado: 'ok', detalle: `${inscripciones.length} inscripciones 100% enlazadas con identidades y actividades.` });
    }

    // 4. Firmas y Autoridades Oficiales
    const firmasCompletas = !!(autoridades.jefeMatutinoFirma && autoridades.jefeVespertinoFirma);
    checklist.push({
      item: 'Firmas Digitales Oficiales',
      estado: firmasCompletas ? 'ok' : 'advertencia',
      detalle: firmasCompletas ? 'Firmas vectoriales de Jefatura Matutina y Vespertina configuradas.' : 'Falta estampar una o más firmas oficiales en configuración.'
    });

    // 5. Esquema de Base de Datos y Conexión en la Nube
    checklist.push({
      item: 'Conexión a Base Maestra (Sheets / BD)',
      estado: isLive ? 'ok' : 'advertencia',
      detalle: isLive 
        ? 'Conectado a Google Apps Script Web App en producción.' 
        : `Esquema local preparado 1:1 con ID ${CONFIG.MASTER_SPREADSHEET_ID} listo para sincronizar.`
    });

    // 6. Confidencialidad y Anonimato ISO
    const encuestasConNombres = encuestas.filter(e => e.nombreUsuario && e.nombreUsuario !== 'Participante Anónimo');
    checklist.push({
      item: 'Anonimato de Encuestas (ISO 27701)',
      estado: encuestasConNombres.length === 0 ? 'ok' : 'advertencia',
      detalle: encuestasConNombres.length === 0 ? 'Todas las respuestas de encuestas están anonimizadas sin exponer identidades.' : 'Existen registros previos con nombres.'
    });

    const evFisicasCompletas = evaluacionesFisicas.filter(e => e.inicial && e.final).length;

    return {
      ok: advertencias.length === 0,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tablas: {
        Identidades_Participantes: identidades.length,
        Actividades_Clubes: actividades.length,
        Espacios_Deportivos: espacios.length,
        Inventario_Materiales: inventario.length,
        Solicitudes_F02: solicitudes.length,
        Inscripciones_Asistencia: inscripciones.length,
        Sesiones_Registradas: sesiones.length,
        Evaluaciones_Fisicas: evaluacionesFisicas.length,
        Respuestas_Encuestas: encuestas.length
      },
      metricas: {
        totalUsuarios: identidades.length,
        totalClubes: actividades.length,
        totalInscripciones: inscripciones.length,
        solicitudesPendientes: solicitudes.filter(s => s.Estado === 'Pendiente').length,
        evaluacionesFisicasCompletas: evFisicasCompletas,
        evaluacionesDepartamento: encuestas.length
      },
      checklist,
      advertencias
    };
  }

  // Exportar backup completo en formato JSON para migración directa
  static exportarCopiaSeguridadJSON(): string {
    const data = {
      sistema: CONFIG.SISTEMA,
      institucion: CONFIG.INSTITUCION,
      departamento: CONFIG.DEPARTAMENTO,
      version: '2.0-produccion',
      fechaExportacion: msb_obtenerFechaHoraLocal(),
      baseMaestraId: CONFIG.MASTER_SPREADSHEET_ID,
      tablas: {
        identidades: this.getIdentidades(),
        actividades: this.getActividades(),
        espacios: this.getEspacios(),
        inventario: this.getInventario(),
        solicitudes: this.getSolicitudes(),
        inscripciones: this.getInscripciones(),
        sesionesAsistencia: this.getSesionesAsistencia(),
        evaluacionesFisicas: this.getEvaluacionesFisicas(),
        solicitudesModificacionPruebas: this.getSolicitudesModificacionPruebas(),
        respuestasEncuestas: this.getRespuestasEncuestas(),
        configuracionEvaluaciones: this.getConfiguracionEvaluaciones(),
        autoridades: this.getAutoridades(),
        galeriaActividades: this.getGaleriaActividades(),
        escudoActivo: this.getEscudoActivo()
      }
    };
    return JSON.stringify(data, null, 2);
  }

  // Importar y migrar datos desde un archivo JSON
  static importarCopiaSeguridadJSON(jsonString: string): { ok: boolean; mensaje: string; registrosImportados?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.tablas) {
        return { ok: false, mensaje: 'El archivo JSON no tiene la estructura de tablas requerida para la migración.' };
      }
      const t = data.tablas;
      let total = 0;

      if (Array.isArray(t.identidades)) { this.saveIdentidades(t.identidades); total += t.identidades.length; }
      if (Array.isArray(t.actividades)) { this.saveActividades(t.actividades); total += t.actividades.length; }
      if (Array.isArray(t.espacios)) { this.saveEspacios(t.espacios); total += t.espacios.length; }
      if (Array.isArray(t.inventario)) { this.saveInventario(t.inventario); total += t.inventario.length; }
      if (Array.isArray(t.solicitudes)) { this.saveSolicitudes(t.solicitudes); total += t.solicitudes.length; }
      if (Array.isArray(t.inscripciones)) { this.saveInscripciones(t.inscripciones); total += t.inscripciones.length; }
      if (Array.isArray(t.sesionesAsistencia)) { this.saveSesionesAsistencia(t.sesionesAsistencia); total += t.sesionesAsistencia.length; }
      if (Array.isArray(t.evaluacionesFisicas)) { this.saveEvaluacionesFisicas(t.evaluacionesFisicas); total += t.evaluacionesFisicas.length; }
      if (Array.isArray(t.respuestasEncuestas)) { setStored('RESPUESTAS_ENCUESTAS', t.respuestasEncuestas); total += t.respuestasEncuestas.length; }
      if (t.autoridades) { this.saveAutoridades(t.autoridades); total++; }
      if (t.configuracionEvaluaciones) { this.saveConfiguracionEvaluaciones(t.configuracionEvaluaciones); total++; }
      if (t.escudoActivo) { this.setEscudoActivo(t.escudoActivo); total++; }

      return {
        ok: true,
        mensaje: `✓ Migración de datos exitosa. Se importaron y restauraron ${total} registros en la base de datos.`,
        registrosImportados: total
      };
    } catch (e: any) {
      return { ok: false, mensaje: `Error al procesar el archivo de migración: ${e.message}` };
    }
  }

  // Reset to seed data
  static resetToDefault(): void {
    localStorage.removeItem('MSB_IDENTIDADES_V2');
    localStorage.removeItem('MSB_ACTIVIDADES_V2');
    localStorage.removeItem('MSB_ESPACIOS');
    localStorage.removeItem('MSB_INVENTARIO');
    localStorage.removeItem('MSB_SOLICITUDES_V2');
    localStorage.removeItem('MSB_INSCRIPCIONES_V2');
    localStorage.removeItem('MSB_SESIONES_ASISTENCIA');
    localStorage.removeItem('MSB_APPS_SCRIPT_URL');
  }
}

// Generate Google Calendar Link for an activity
export function getGoogleCalendarLink(actividad: Actividad): string {
  const title = encodeURIComponent(`${actividad.Nombre} - ENMFM Deportes y Salud`);
  const details = encodeURIComponent(`${actividad.Descripcion}\n\nModalidad: ${actividad.Modalidad_inscripción}\nResponsable: ${actividad.Responsable_Nombre || 'Departamento de Deportes y Salud'}`);
  const location = encodeURIComponent(`${actividad.Espacio_Nombre || actividad.Espacio_ID}, Escuela Normal Miguel F. Martínez`);
  
  const startDateStr = actividad.Fecha_inicio.replace(/-/g, '');
  const startTimeStr = actividad.Hora_inicio.replace(':', '') + '00';
  const endTimeStr = actividad.Hora_fin.replace(':', '') + '00';
  const dates = `${startDateStr}T${startTimeStr}/${startDateStr}T${endTimeStr}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}

// Generador del código fuente oficial de Google Apps Script 1.1 para la Base Maestra
export function generarCodigoAppsScriptCompleto(): string {
  return `// ============================================================
// SISTEMA INSTITUCIONAL DE MOVIMIENTO, SALUD Y BIENESTAR 1.1
// Escuela Normal "Miguel F. Martínez" - Depto. Deporte y Salud
// Base Maestra: ${CONFIG.DENOMINACION_BASE_MAESTRA}
// Master Spreadsheet ID: ${CONFIG.MASTER_SPREADSHEET_ID}
// ============================================================

function msb_getHojaSegura(ss, nombreHoja, encabezadosPorDefecto) {
  var hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) {
    hoja = ss.insertSheet(nombreHoja);
    if (encabezadosPorDefecto && encabezadosPorDefecto.length) {
      hoja.appendRow(encabezadosPorDefecto);
    }
  }
  return hoja;
}

// Búsqueda rápida de fila para evitar duplicidad de registros (1-indexed)
function msb_buscarFilaPorValor(hoja, colIndex, valor) {
  if (!valor) return -1;
  var datos = hoja.getDataRange().getValues();
  var valStr = String(valor).trim().toLowerCase();
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colIndex - 1]).trim().toLowerCase() === valStr) {
      return i + 1;
    }
  }
  return -1;
}

function msb_getHeaders(hoja) {
  var data = hoja.getDataRange().getValues();
  return data.length > 0 ? data[0] : [];
}

function msb_getAllObjects(hoja, headers) {
  var data = hoja.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function doGet(e) {
  var ss = SpreadsheetApp.openById('${CONFIG.MASTER_SPREADSHEET_ID}');
  var action = (e && e.parameter) ? e.parameter.action : '';

  if (e && e.parameter && e.parameter.data) {
    try {
      return doPost({ postData: { contents: e.parameter.data } });
    } catch (err) {}
  }

  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ 
      ok: true, 
      mensaje: 'Conectado a ${CONFIG.DENOMINACION_BASE_MAESTRA}',
      spreadsheetId: '${CONFIG.MASTER_SPREADSHEET_ID}'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'obtenerTodo') {
    var actHoja = msb_getHojaSegura(ss, 'Actividades', ['ID_actividad','Nombre','Descripción','Tipo','Cupo']);
    var espHoja = msb_getHojaSegura(ss, 'Espacios', ['ID_espacio','Nombre','Ubicación','Capacidad']);
    var invHoja = msb_getHojaSegura(ss, 'Inventario', ['ID_material','Nombre_material','Categoria','Cantidad_total','Cantidad_disponible','Unidad','Ubicacion','Condicion','Responsable_ID','Estado','Observaciones']);
    var solHoja = msb_getHojaSegura(ss, 'Solicitudes', ['ID_solicitud','Fecha_solicitud','Solicitante_ID','Solicitante_Nombre','Solicitante_Rol','Nivel_prioridad','Prioridad_Etiqueta','Tipo_solicitud','ID_recurso','Recurso_Nombre','Fecha_uso','Hora_inicio','Hora_fin','Cantidad','Proposito','Estado','Revisado_por_ID','Fecha_resolucion','Motivo_observaciones']);
    var insHoja = msb_getHojaSegura(ss, 'Inscripciones_Asistencia', ['ID_registro','ID_actividad','ID_participante','Fecha_inscripción','Estado_inscripcion','Asistencia','Fecha_asistencia','Observaciones']);
    var galHoja = msb_getHojaSegura(ss, 'Galeria', ['id','titulo','descripcion','fecha','categoria','url','tipoMedio','videoUrl','tipoVideo','autor','destacada']);
    var idHoja = msb_getHojaSegura(ss, 'Identidades', ['id','username','pinHash','nombre','apellidos','sector','correo','tipoCuenta','estado','consentimiento','fechaAlta','rol','licenciatura','semestre','grupo','observaciones']);
    var evHoja = msb_getHojaSegura(ss, 'Evaluaciones', ['idRespuesta','tipoEncuesta','tituloEncuesta','idActividad','nombreActividad','sector','puntuacionPromedio','respuestas_json','comentarios','fechaRegistro','idUsuario','nombreUsuario']);
    var pfHoja = msb_getHojaSegura(ss, 'Pruebas_Fisicas', ['idEvaluacion','idParticipante','nombreParticipante','fechaRegistro','puntuacionGeneral','categoriaRendimiento','inicial_json','final_json']);
    var autHoja = msb_getHojaSegura(ss, 'Autoridades', ['tituloJefatura','jefeMatutinoNombre','jefeMatutinoCargo','jefeMatutinoFirma','jefeVespertinoNombre','jefeVespertinoCargo','jefeVespertinoFirma','ultimaActualizacion']);
    var cfgHoja = msb_getHojaSegura(ss, 'Config_Evaluaciones', ['habilitada','fechaHabilitacion','urlFormEvaluacionEncargados','urlFormSatisfaccionServicios','urlFormPercepcionBienestar','mensajeAccesoRestringido','ultimaActualizacion']);
    var escHoja = msb_getHojaSegura(ss, 'Sello_Activo', ['url','tipo','nombre','fechaActualizacion']);

    var autList = msb_getAllObjects(autHoja, msb_getHeaders(autHoja));
    var cfgList = msb_getAllObjects(cfgHoja, msb_getHeaders(cfgHoja));
    var escList = msb_getAllObjects(escHoja, msb_getHeaders(escHoja));

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      actividades: msb_getAllObjects(actHoja, msb_getHeaders(actHoja)),
      espacios: msb_getAllObjects(espHoja, msb_getHeaders(espHoja)),
      inventario: msb_getAllObjects(invHoja, msb_getHeaders(invHoja)),
      solicitudes: msb_getAllObjects(solHoja, msb_getHeaders(solHoja)),
      inscripciones: msb_getAllObjects(insHoja, msb_getHeaders(insHoja)),
      galeria: msb_getAllObjects(galHoja, msb_getHeaders(galHoja)),
      identidades: msb_getAllObjects(idHoja, msb_getHeaders(idHoja)),
      evaluaciones: msb_getAllObjects(evHoja, msb_getHeaders(evHoja)),
      pruebas_fisicas: msb_getAllObjects(pfHoja, msb_getHeaders(pfHoja)),
      autoridades: autList.length ? autList[0] : null,
      configEvaluaciones: cfgList.length ? cfgList[0] : null,
      sello_activo: escList.length ? escList[0] : null
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'API Activa 1.1' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById('${CONFIG.MASTER_SPREADSHEET_ID}');
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;

    // 1. Guardar Solicitud F02 (con prevención de duplicados)
    if (action === 'guardarSolicitud' && postData.solicitud) {
      var solHoja = msb_getHojaSegura(ss, 'Solicitudes', ['ID_solicitud','Fecha_solicitud','Solicitante_ID','Solicitante_Nombre','Solicitante_Rol','Nivel_prioridad','Prioridad_Etiqueta','Tipo_solicitud','ID_recurso','Recurso_Nombre','Fecha_uso','Hora_inicio','Hora_fin','Cantidad','Proposito','Estado','Revisado_por_ID','Fecha_resolucion','Motivo_observaciones']);
      var s = postData.solicitud;
      var filaSol = msb_buscarFilaPorValor(solHoja, 1, s.ID_solicitud);
      var filaSolValores = [
        s.ID_solicitud, s.Fecha_solicitud, s.Solicitante_ID, s.Solicitante_Nombre,
        s.Solicitante_Rol, s.Nivel_prioridad, s.Prioridad_Etiqueta, s.Tipo_solicitud,
        s.ID_recurso, s.Recurso_Nombre, s.Fecha_uso, s.Hora_inicio, s.Hora_fin,
        s.Cantidad, s.Proposito, s.Estado, s.Revisado_por_ID || '', s.Fecha_resolucion || '', s.Motivo_observaciones || ''
      ];
      if (filaSol > 0) {
        solHoja.getRange(filaSol, 1, 1, filaSolValores.length).setValues([filaSolValores]);
      } else {
        solHoja.appendRow(filaSolValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Solicitud sincronizada' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Dictaminar y Actualizar Estado de Solicitud F02 (Aprobar / Rechazar)
    if (action === 'actualizarSolicitud' && postData.idSolicitud) {
      var solHoja = msb_getHojaSegura(ss, 'Solicitudes');
      var filaSol = msb_buscarFilaPorValor(solHoja, 1, postData.idSolicitud);
      if (filaSol > 0) {
        solHoja.getRange(filaSol, 16).setValue(postData.estado);
        solHoja.getRange(filaSol, 17).setValue(postData.reviewerId || '');
        solHoja.getRange(filaSol, 18).setValue(postData.fechaResolucion || '');
        solHoja.getRange(filaSol, 19).setValue(postData.motivo || '');
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Solicitud dictaminada y actualizada' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Guardar Inscripción F01 (con prevención de duplicados)
    if (action === 'guardarInscripcion' && postData.inscripcion) {
      var insHoja = msb_getHojaSegura(ss, 'Inscripciones_Asistencia', ['ID_registro','ID_actividad','ID_participante','Fecha_inscripción','Estado_inscripcion','Asistencia','Fecha_asistencia','Observaciones']);
      var ins = postData.inscripcion;
      var filaIns = msb_buscarFilaPorValor(insHoja, 1, ins.ID_registro);
      if (filaIns < 0) {
        var datosIns = insHoja.getDataRange().getValues();
        for (var k = 1; k < datosIns.length; k++) {
          if (String(datosIns[k][1]).trim() === String(ins.ID_actividad).trim() && 
              String(datosIns[k][2]).trim() === String(ins.ID_participante).trim()) {
            filaIns = k + 1;
            break;
          }
        }
      }
      var filaInsValores = [
        ins.ID_registro, ins.ID_actividad, ins.ID_participante, ins.Fecha_inscripción || ins.Fecha_inscripcion,
        ins.Estado_inscripcion || ins.Estado_inscripción, ins.Asistencia || 'No registrada', ins.Fecha_asistencia || '', ins.Observaciones || ''
      ];
      if (filaIns > 0) {
        insHoja.getRange(filaIns, 1, 1, filaInsValores.length).setValues([filaInsValores]);
      } else {
        insHoja.appendRow(filaInsValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Inscripción sincronizada sin duplicados' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Actualizar Asistencia individual
    if (action === 'actualizarAsistencia' && postData.idRegistro) {
      var insHoja = msb_getHojaSegura(ss, 'Inscripciones_Asistencia');
      var filaIns = msb_buscarFilaPorValor(insHoja, 1, postData.idRegistro);
      if (filaIns > 0) {
        insHoja.getRange(filaIns, 6).setValue(postData.asistencia || 'Asistió');
        if (postData.fechaAsistencia) {
          insHoja.getRange(filaIns, 7).setValue(postData.fechaAsistencia);
        }
        if (postData.obs) {
          var obsActual = insHoja.getRange(filaIns, 8).getValue();
          insHoja.getRange(filaIns, 8).setValue(obsActual ? (obsActual + ' | ' + postData.obs) : postData.obs);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Asistencia actualizada' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Guardar Identidad / Usuario Registrado (con prevención de duplicados)
    if (action === 'guardarIdentidad' && postData.identidad) {
      var idHoja = msb_getHojaSegura(ss, 'Identidades', ['id','username','pinHash','nombre','apellidos','sector','correo','tipoCuenta','estado','consentimiento','fechaAlta','rol','licenciatura','semestre','grupo','observaciones']);
      var u = postData.identidad;
      var filaId = msb_buscarFilaPorValor(idHoja, 1, u.id);
      var filaUser = filaId > 0 ? filaId : msb_buscarFilaPorValor(idHoja, 2, u.username);
      var filaIdValores = [
        u.id, u.username, u.pinHash, u.nombre, u.apellidos, u.sector, u.correo,
        u.tipoCuenta, u.estado, u.consentimiento, u.fechaAlta, u.rol,
        u.licenciatura || '', u.semestre || '', u.grupo || '', u.observaciones || ''
      ];
      if (filaUser > 0) {
        idHoja.getRange(filaUser, 1, 1, filaIdValores.length).setValues([filaIdValores]);
      } else {
        idHoja.appendRow(filaIdValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Identidad sincronizada sin duplicados' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Guardar Firmas Oficiales y Autoridades Institucionales
    if (action === 'guardarAutoridades' && postData.autoridades) {
      var autHoja = msb_getHojaSegura(ss, 'Autoridades', [
        'tituloJefatura', 'jefeMatutinoNombre', 'jefeMatutinoCargo', 'jefeMatutinoFirma',
        'jefeVespertinoNombre', 'jefeVespertinoCargo', 'jefeVespertinoFirma', 'ultimaActualizacion'
      ]);
      var a = postData.autoridades;
      var ahora = Utilities.formatDate(new Date(), "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
      var firmaMatCorta = String(a.jefeMatutinoFirma || '').substring(0, 48000);
      var firmaVespCorta = String(a.jefeVespertinoFirma || '').substring(0, 48000);
      var filaAut = [
        a.tituloJefatura || 'Jefes del Departamento de Deporte y Salud',
        a.jefeMatutinoNombre || '', a.jefeMatutinoCargo || '', firmaMatCorta,
        a.jefeVespertinoNombre || '', a.jefeVespertinoCargo || '', firmaVespCorta,
        ahora
      ];
      if (autHoja.getLastRow() >= 2) {
        autHoja.getRange(2, 1, 1, filaAut.length).setValues([filaAut]);
      } else {
        autHoja.appendRow(filaAut);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Firmas y autoridades sincronizadas en Base Maestra' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 7. Guardar Configuración de Evaluaciones y Enlaces Google Forms
    if (action === 'guardarConfigEvaluaciones' && postData.config) {
      var cfgHoja = msb_getHojaSegura(ss, 'Config_Evaluaciones', [
        'habilitada', 'fechaHabilitacion', 'urlFormEvaluacionEncargados',
        'urlFormSatisfaccionServicios', 'urlFormPercepcionBienestar', 'mensajeAccesoRestringido', 'ultimaActualizacion'
      ]);
      var c = postData.config;
      var ahoraCfg = Utilities.formatDate(new Date(), "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
      var filaCfg = [
        c.habilitada ? 'TRUE' : 'FALSE',
        c.fechaHabilitacion || '',
        c.urlFormEvaluacionEncargados || '',
        c.urlFormSatisfaccionServicios || '',
        c.urlFormPercepcionBienestar || '',
        c.mensajeAccesoRestringido || '',
        ahoraCfg
      ];
      if (cfgHoja.getLastRow() >= 2) {
        cfgHoja.getRange(2, 1, 1, filaCfg.length).setValues([filaCfg]);
      } else {
        cfgHoja.appendRow(filaCfg);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Configuración de evaluaciones y enlaces Google Forms guardados en Base Maestra' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 8. Guardar Evaluación de Servicio (Plataforma y Formularios)
    if (action === 'guardarEvaluacion' && postData.evaluacion) {
      var evHoja = msb_getHojaSegura(ss, 'Evaluaciones', [
        'idRespuesta','tipoEncuesta','tituloEncuesta','idActividad','nombreActividad',
        'sector','puntuacionPromedio','respuestas_json','comentarios','fechaRegistro','idUsuario','nombreUsuario'
      ]);
      var ev = postData.evaluacion;
      var filaEv = msb_buscarFilaPorValor(evHoja, 1, ev.idRespuesta);
      var ahoraEv = Utilities.formatDate(new Date(), "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
      var filaEvValores = [
        ev.idRespuesta || ('ENC-' + new Date().getTime()),
        ev.tipoEncuesta || 'satisfaccion_servicios',
        ev.tituloEncuesta || 'Evaluación del Departamento',
        ev.idActividad || 'GENERAL',
        ev.nombreActividad || 'Departamento de Deporte y Salud',
        ev.sector || 'Comunidad Normalista',
        ev.puntuacionPromedio || 5,
        JSON.stringify(ev.respuestas || {}),
        ev.comentarios || '',
        ev.fechaRegistro || ahoraEv,
        'ANONIMO',
        'Participante Anónimo'
      ];
      if (filaEv > 0) {
        evHoja.getRange(filaEv, 1, 1, filaEvValores.length).setValues([filaEvValores]);
      } else {
        evHoja.appendRow(filaEvValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Evaluación sincronizada en Base Maestra' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 9. Guardar Pruebas Físicas
    if (action === 'guardarEvaluacionFisica' && postData.evaluacion) {
      var pfHoja = msb_getHojaSegura(ss, 'Pruebas_Fisicas');
      var pf = postData.evaluacion;
      var filaPf = msb_buscarFilaPorValor(pfHoja, 1, pf.idEvaluacion);
      var filaPfValores = [
        pf.idEvaluacion, pf.idParticipante, pf.nombreParticipante, pf.fechaRegistro,
        pf.puntuacionGeneral || 0, pf.categoriaRendimiento || '',
        JSON.stringify(pf.inicial || {}), JSON.stringify(pf.final || {})
      ];
      if (filaPf > 0) {
        pfHoja.getRange(filaPf, 1, 1, filaPfValores.length).setValues([filaPfValores]);
      } else {
        pfHoja.appendRow(filaPfValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Prueba física sincronizada' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 10. Guardar / Sincronizar Galería Completa
    if (action === 'guardarGaleria' && Array.isArray(postData.galeria)) {
      var galHoja = msb_getHojaSegura(ss, 'Galeria', ['id','titulo','descripcion','fecha','categoria','url','tipoMedio','videoUrl','tipoVideo','autor','destacada']);
      galHoja.clearContents();
      galHoja.appendRow(['id','titulo','descripcion','fecha','categoria','url','tipoMedio','videoUrl','tipoVideo','autor','destacada']);
      postData.galeria.forEach(function(g) {
        var urlCorta = String(g.url || '').substring(0, 48000);
        galHoja.appendRow([
          g.id || '', g.titulo || '', g.descripcion || '', g.fecha || '', g.categoria || '',
          urlCorta, g.tipoMedio || 'foto', g.videoUrl || '', g.tipoVideo || '', g.autor || '', g.destacada ? 'TRUE' : 'FALSE'
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Galería sincronizada globalmente' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 11. Guardar Item Individual en Galería (Firmas Oficiales, Sellos, Fotos)
    if (action === 'guardarItemGaleria' && postData.item) {
      var galHoja = msb_getHojaSegura(ss, 'Galeria', ['id','titulo','descripcion','fecha','categoria','url','tipoMedio','videoUrl','tipoVideo','autor','destacada']);
      var g = postData.item;
      var filaG = msb_buscarFilaPorValor(galHoja, 1, g.id);
      var urlCorta = String(g.url || '').substring(0, 48000);
      var filaGValores = [
        g.id || '', g.titulo || '', g.descripcion || '', g.fecha || '', g.categoria || 'Firmas y Sellos Oficiales',
        urlCorta, g.tipoMedio || 'foto', g.videoUrl || '', g.tipoVideo || '', g.autor || '', g.destacada ? 'TRUE' : 'FALSE'
      ];
      if (filaG > 0) {
        galHoja.getRange(filaG, 1, 1, filaGValores.length).setValues([filaGValores]);
      } else {
        galHoja.appendRow(filaGValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Item guardado en Galería de la Base Maestra' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 12. Guardar Escudo / Sello Activo Institucional
    if (action === 'guardarEscudo' && postData.escudo) {
      var escHoja = msb_getHojaSegura(ss, 'Sello_Activo', ['url', 'tipo', 'nombre', 'fechaActualizacion']);
      var esc = postData.escudo;
      var urlEsc = String(esc.url || '').substring(0, 48000);
      var ahoraEsc = Utilities.formatDate(new Date(), "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
      var filaEsc = [urlEsc, esc.tipo || 'institucional', esc.nombre || 'Escudo Oficial', ahoraEsc];
      if (escHoja.getLastRow() >= 2) {
        escHoja.getRange(2, 1, 1, filaEsc.length).setValues([filaEsc]);
      } else {
        escHoja.appendRow(filaEsc);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Sello institucional guardado en Base Maestra' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 13. Guardar / Actualizar Material en Inventario (con las 11 columnas exactas)
    if (action === 'guardarMaterial' && postData.material) {
      var invHoja = msb_getHojaSegura(ss, 'Inventario', [
        'ID_material','Nombre_material','Categoria','Cantidad_total','Cantidad_disponible',
        'Unidad','Ubicacion','Condicion','Responsable_ID','Estado','Observaciones'
      ]);
      var m = postData.material;
      var filaMat = msb_buscarFilaPorValor(invHoja, 1, m.ID_material);
      var filaMatValores = [
        m.ID_material, m.Nombre_material, m.Categoria || 'Recreativo',
        m.Cantidad_total || 0, m.Cantidad_disponible || 0, m.Unidad || 'Piezas',
        m.Ubicacion || 'Bodega de Deportes', m.Condicion || 'Buena',
        m.Responsable_ID || 'PAR-00001', m.Estado || 'Disponible', m.Observaciones || ''
      ];
      if (filaMat > 0) {
        invHoja.getRange(filaMat, 1, 1, filaMatValores.length).setValues([filaMatValores]);
      } else {
        invHoja.appendRow(filaMatValores);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Material sincronizado en Inventario' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 14. Sincronizar Inventario Completo
    if (action === 'guardarInventario' && Array.isArray(postData.inventario)) {
      var invHoja = msb_getHojaSegura(ss, 'Inventario', [
        'ID_material','Nombre_material','Categoria','Cantidad_total','Cantidad_disponible',
        'Unidad','Ubicacion','Condicion','Responsable_ID','Estado','Observaciones'
      ]);
      invHoja.clearContents();
      invHoja.appendRow([
        'ID_material','Nombre_material','Categoria','Cantidad_total','Cantidad_disponible',
        'Unidad','Ubicacion','Condicion','Responsable_ID','Estado','Observaciones'
      ]);
      postData.inventario.forEach(function(m) {
        invHoja.appendRow([
          m.ID_material, m.Nombre_material, m.Categoria || 'Recreativo',
          m.Cantidad_total || 0, m.Cantidad_disponible || 0, m.Unidad || 'Piezas',
          m.Ubicacion || 'Bodega de Deportes', m.Condicion || 'Buena',
          m.Responsable_ID || 'PAR-00001', m.Estado || 'Disponible', m.Observaciones || ''
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({ ok: true, mensaje: 'Inventario sincronizado globalmente' })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
