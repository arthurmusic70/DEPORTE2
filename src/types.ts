export type Sector = 'Estudiante' | 'Docente' | 'Empleado' | 'Otro';
export type TipoCuenta = 'Institucional' | 'Personal';

export type RolUsuario = 'administrador' | 'encargado' | 'docente' | 'estudiante' | 'trabajador';

export type NivelPrioridad = 0 | 1 | 2 | 3;
// 0: Dirección Institucional ejercida por Administrador (Prioridad Total)
// 1: Actividades deportivas y clubes representativos
// 2: Docentes formativos
// 3: Comunidad (Trabajadores y Estudiantes)

export interface Identidad {
  id: string; // PAR-00001
  username: string;
  pinHash: string; // SHA-256
  nombre: string;
  apellidos: string;
  sector: Sector;
  correo: string;
  tipoCuenta: TipoCuenta;
  estado: 'Activo' | 'Inactivo';
  consentimiento: string;
  fechaAlta: string;
  rol: RolUsuario;
  actividadAsignadaId?: string; // Para rol 'encargado': club o actividad vinculada
  licenciatura?: string; // Ej: 'Licenciatura en Educación Primaria'
  semestre?: string;     // Ej: '4° Semestre'
  grupo?: string;        // Ej: 'Grupo A'
  observaciones?: string;
}

export interface Actividad {
  ID_actividad: string; // ACT-001
  Nombre: string;
  Descripcion: string;
  Tipo: 'Deportes' | 'Salud' | 'Bienestar' | 'Pausas Activas' | 'Torneo' | 'Recreativo';
  Responsable_ID: string;
  Responsable_Nombre?: string;
  Fecha_inicio: string;
  Hora_inicio: string;
  Fecha_fin: string;
  Hora_fin: string;
  Dias_sesion?: string[]; // Ej: ['Lunes', 'Miércoles']
  Cupo: number;
  Cupo_ocupado?: number;
  Modalidad_inscripción: 'Libre' | 'Previa solicitud' | 'Por convocatoria';
  Requiere_autorización: 'Sí' | 'No';
  Espacio_ID: string;
  Espacio_Nombre?: string;
  Estado: 'Activa' | 'En curso' | 'Concluida' | 'Cancelada' | 'Baja';
  Fecha_publicación: string;
  Observaciones: string;
}

export interface Espacio {
  ID_espacio: string; // ESP-001
  Nombre: string;
  Ubicacion: string;
  Capacidad: number;
  Equipamiento: string;
  Accesibilidad: string;
  Responsable_ID: string;
  Estado: 'Disponible' | 'Mantenimiento' | 'Ocupado' | 'Baja';
  Observaciones: string;
}

export interface MaterialInventario {
  ID_material: string; // MAT-001
  Nombre_material: string;
  Categoria: 'Balones' | 'Entrenamiento' | 'Salud y Medición' | 'Sonido y Eventos' | 'Recreativo';
  Cantidad_total: number;
  Cantidad_disponible: number;
  Unidad: string;
  Ubicacion: string;
  Condicion: 'Excelente' | 'Buena' | 'Regular';
  Responsable_ID: string;
  Estado: 'Disponible' | 'En préstamo' | 'En reparación' | 'Baja';
  Observaciones: string;
}

export interface Solicitud {
  ID_solicitud: string; // SOL-001
  Fecha_solicitud: string;
  Solicitante_ID: string;
  Solicitante_Nombre?: string;
  Solicitante_Rol?: RolUsuario;
  Nivel_prioridad: NivelPrioridad;
  Prioridad_Etiqueta: 'Prioridad Total (Dirección / Admin)' | 'Prioridad 1 (Deportiva)' | 'Prioridad 2 (Docente)' | 'Prioridad 3 (Comunidad)';
  Tipo_solicitud: 'Espacio' | 'Material' | 'Espacio y material';
  ID_recurso: string;
  Recurso_Nombre?: string;
  Fecha_uso: string;
  Hora_inicio: string;
  Hora_fin: string;
  Cantidad: string;
  Proposito: string;
  Estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Concluida';
  Revisado_por_ID: string;
  Fecha_resolucion: string;
  Motivo_observaciones: string;
}

export interface RegistroSesionAsistencia {
  idSesion: string; // SES-001
  idActividad: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  titulo?: string;
  registros: Record<string, 'Asistió' | 'Falta' | 'Justificado' | 'Pendiente'>; // idParticipante -> estado
}

export interface InscripcionAsistencia {
  ID_registro: string; // REG-001
  ID_actividad: string;
  ID_participante: string;
  Fecha_inscripcion: string;
  Estado_inscripcion: 'Solicitada' | 'Confirmada' | 'Cancelada';
  Asistencia: 'Asistió' | 'No registrada' | 'Justificado' | 'Falta';
  Fecha_asistencia: string;
  Observaciones: string;
  // Métricas calculadas automáticamente
  Total_sesiones?: number;
  Sesiones_asistidas?: number;
  Porcentaje_asistencia?: number; // ej. 92.5
  Asistencia_validada?: boolean; // true si >= 85%
}

export interface SesionUsuario {
  id: string;
  username: string;
  nombre: string;
  apellidos: string;
  sector: Sector;
  correo: string;
  tipoCuenta: TipoCuenta;
  rol: RolUsuario;
  actividadAsignadaId?: string; // Si es encargado
  licenciatura?: string;
  semestre?: string;
  grupo?: string;
}

export interface AutoridadesConfig {
  institucionNombre: string; // "ESCUELA NORMAL \"MIGUEL F. MARTÍNEZ\""
  institucionLema: string; // "CENTENARIA Y BENEMÉRITA"
  subdireccionNombre: string; // "SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES"
  departamentoNombre: string; // "DEPARTAMENTO DE DEPORTE Y SALUD"
  tituloJefatura: string; // "Jefes del Departamento de Deporte y Salud"
  jefeMatutinoNombre: string; // "Sandra Nelly Martínez Cantú"
  jefeMatutinoCargo: string; // "Turno matutino"
  jefeMatutinoFirma?: string; // Data URL Base64 de la firma virtual
  jefeVespertinoNombre: string; // "Arturo Rodríguez Segovia"
  jefeVespertinoCargo: string; // "Turno vespertino"
  jefeVespertinoFirma?: string; // Data URL Base64 de la firma virtual
  jefeDepartamentoNombre?: string;
  jefeDepartamentoCargo?: string;
  directorInstitucionNombre?: string;
  directorInstitucionCargo?: string;
}

export interface MedicionFisica {
  fecha: string;
  pesoKg: number;
  estaturaCm: number;
  imc: number;
  // 1. Resistencia Cardiorrespiratoria: Test Course Navette (Nivel alcanzado)
  courseNavetteNivel: number;
  // 2. Fuerza y Resistencia Muscular en 60 segundos
  fuerzaLagartijas60s: number;
  fuerzaSentadillas60s: number;
  // 3. Flexibilidad: Test Sit and Reach (cm de alcance)
  sitAndReachCm: number;
  observaciones?: string;
}

export type NivelAptitudFisica = 'Insuficiente' | 'Básico' | 'Satisfactorio' | 'Destacado';

export interface EvaluacionCapacidadesFisicas {
  idEvaluacion: string; // EVA-001
  idParticipante: string;
  periodo: string; // ej: 'Semestre 2026-1'
  inicial?: MedicionFisica;
  final?: MedicionFisica;
  // Métricas de avance porcentual calculado
  incrementoCourseNavette?: number; // %
  incrementoFuerzaLagartijas?: number; // %
  incrementoFuerzaSentadillas?: number; // %
  incrementoFuerzaCombinada?: number; // % (Sentadillas + Lagartijas)
  incrementoFlexibilidadCm?: number; // cm
  incrementoFlexibilidadPorcentaje?: number; // %
  cambioImcPorcentaje?: number; // % de mejora o cambio
  puntosAsignados?: 1 | 2 | 3 | 4;
  nivelValidado?: NivelAptitudFisica;
  dimensionesMejoradas?: number;
  fechaRegistro?: string;
}

export interface RegistroPruebaFisica {
  idPrueba: string; // PRU-001
  idParticipante: string;
  fecha: string;
  periodo: string; // ej: 'Semestre 2026-1'
  // Parámetros antropométricos
  pesoKg?: number;
  estaturaCm?: number;
  imc?: number;
  frecuenciaCardiacaReposo?: number;
  // Batería de pruebas físicas
  fuerzaLagartijas1Min?: number;
  fuerzaAbdominales1Min?: number;
  fuerzaSentadillas60s?: number;
  courseNavetteNivel?: number;
  flexibilidadCm?: number;
  resistenciaMetrosOCooper?: number;
  observaciones?: string;
  evaluadorId?: string;
}

export interface SolicitudModificacionPrueba {
  idSolicitudMod: string; // MOD-001
  idParticipante: string;
  nombreParticipante: string;
  correo: string;
  filiacion: string;
  fechaSolicitud: string;
  tipoMedicion: 'inicial' | 'final' | 'ambas';
  motivo: string;
  estado: 'Pendiente' | 'Autorizada' | 'Rechazada';
  fechaResolucion?: string;
  resolucionAdmin?: string;
}

export type TipoEncuesta = 'evaluacion_encargados' | 'satisfaccion_servicios' | 'bienestar_salud';

export interface RespuestaEncuesta {
  idRespuesta: string;
  tipoEncuesta: TipoEncuesta;
  tituloEncuesta: string;
  idUsuario?: string;
  nombreUsuario?: string;
  correoUsuario?: string;
  sector?: Sector;
  idActividad?: string;
  nombreActividad?: string;
  fechaRegistro: string;
  respuestas: Record<string, any>;
  puntuacionPromedio?: number;
  comentarios?: string;
}

export interface ConfiguracionEvaluaciones {
  habilitada: boolean;
  fechaHabilitacion: string; // ej: '2026-06-15'
  mensajeAccesoRestringido?: string;
  ultimaActualizacionPor?: string;
  fechaModificacion?: string;
  // Enlaces a Google Forms oficiales del Departamento
  urlFormEvaluacionEncargados?: string;
  urlFormSatisfaccionServicios?: string;
  urlFormPercepcionBienestar?: string;
  urlHojaRespuestasForms?: string;
}

export interface ImagenActividad {
  id: string; // ej: 'IMG-001'
  titulo: string;
  descripcion?: string;
  fecha: string;
  categoria?: string; // ej: 'Firmas y Sellos Oficiales', 'Torneos', etc.
  actividadId?: string;
  actividadNombre?: string;
  url: string; // Base64 data URL o URL externa para imagen / póster
  autor?: string;
  destacada?: boolean;
  tipoMedio?: 'foto' | 'imagen' | 'video'; // Diferenciación entre fotografía o video
  videoUrl?: string; // URL directa de video mp4/webm o enlace YouTube/Vimeo/Drive
  tipoVideo?: 'directo' | 'youtube' | 'vimeo' | 'drive' | 'enlace';
}

export interface PlantillaDocumentoConfig {
  institucionNombre: string;      // ESCUELA NORMAL “MIGUEL F. MARTÍNEZ”
  institucionLema: string;        // CENTENARIA Y BENEMÉRITA
  cicloEscolar: string;           // CICLO ESCOLAR 2026 - 2027
  subdireccionNombre: string;     // SUBDIRECCIÓN DE SERVICIOS ESTUDIANTILES
  departamentoNombre: string;     // DEPARTAMENTO DE DEPORTE Y SALUD
  mostrarLogoNLEducacion: boolean;
  mostrarLogoUnesco: boolean;
  mostrarEscudoNormal: boolean;
  logoNLEducacionPersonalizado?: string;
  logoUnescoPersonalizado?: string;
  escudoNormalPersonalizado?: string;
  pieDePagina?: string;
  colorPrimario?: string;
}


