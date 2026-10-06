import React, { useState } from 'react';
import { MSBDatabase } from '../utils/storage';
import { Sector, TipoCuenta } from '../types';
import { UserPlus, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { PrivacidadISOModal } from './PrivacidadISOModal';
import { SelloInstitucional } from './SelloInstitucional';

interface RegistroModalProps {
  onVolverALogin: () => void;
  onRegistroExitoso: (username: string) => void;
}

export const RegistroModal: React.FC<RegistroModalProps> = ({ onVolverALogin, onRegistroExitoso }) => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [sector, setSector] = useState<Sector>('Estudiante');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('Institucional');
  const [correo, setCorreo] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirmacion, setPinConfirmacion] = useState('');
  const [licenciatura, setLicenciatura] = useState('Licenciatura en Educación Primaria');
  const [semestre, setSemestre] = useState('1° Semestre');
  const [grupo, setGrupo] = useState('Grupo A');
  const [consentimiento, setConsentimiento] = useState(false);
  const [mostrarISOModal, setMostrarISOModal] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoInfo, setExitoInfo] = useState<{ id: string; username: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin !== pinConfirmacion) {
      setError('Los números de PIN no coinciden.');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('El PIN debe contener exactamente 6 dígitos numéricos.');
      return;
    }

    if (!consentimiento) {
      setError('Debes aceptar el consentimiento de tratamiento de datos institucionales.');
      return;
    }

    setCargando(true);
    try {
      const res = await MSBDatabase.registerParticipant({
        nombre,
        apellidos,
        sector,
        tipoCuenta,
        correo,
        username,
        pin,
        consentimiento: 'Sí',
        licenciatura: sector === 'Estudiante' ? licenciatura : undefined,
        semestre: sector === 'Estudiante' ? semestre : undefined,
        grupo: sector === 'Estudiante' ? grupo : undefined
      });

      if (res.ok && res.id && res.username) {
        setExitoInfo({ id: res.id, username: res.username });
      } else {
        setError(res.mensaje || 'No fue posible registrar la cuenta.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error durante el registro.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 my-6">
      <div className="w-full max-w-lg bg-[#0a192f] rounded-3xl shadow-2xl border border-[#1e3a8a] p-8 sm:p-10 transition-all text-white relative overflow-hidden">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Encabezado con SELLO Oficial */}
        <div className="text-center mb-6 relative z-10">
          <div className="flex justify-center mb-2.5">
            <SelloInstitucional className="w-20 h-20 hover:scale-105 transition-transform drop-shadow-xl" />
          </div>
          <span className="text-[10px] text-[#fbbf24] uppercase tracking-widest font-mono font-bold block mb-1">
            Centenaria y Benemérita Escuela Normal "Miguel F. Martínez"
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Crear cuenta institucional
          </h1>
          <p className="text-xs text-[#d6e3ff] mt-0.5">
            Registro en el Sistema de Movimiento, Salud y Bienestar (MSB)
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/70 border border-red-800 text-red-200 rounded-2xl text-xs sm:text-sm flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {exitoInfo ? (
          <div className="p-6 bg-[#061426] border border-emerald-500/50 rounded-2xl text-center space-y-4 animate-in fade-in relative z-10">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ¡Cuenta creada correctamente!
              </h3>
              <p className="text-xs text-[#94a3b8] mt-1">
                Se ha sincronizado tu registro con la Base Maestra oficial.
              </p>
            </div>

            <div className="bg-[#112240] p-3.5 rounded-xl border border-[#1e3a8a] text-left text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">ID de Participante:</span>
                <span className="font-bold text-[#fbbf24] font-mono">{exitoInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Nombre de usuario:</span>
                <span className="font-bold text-white font-mono">@{exitoInfo.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Estado en base:</span>
                <span className="text-emerald-400 font-semibold">Activo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRegistroExitoso(exitoInfo.username)}
              className="w-full py-3 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md border border-[#3b82f6]/40 cursor-pointer"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carmen"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  Apellido(s)
                </label>
                <input
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Treviño Garza"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  Sector institucional
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as Sector)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] font-medium cursor-pointer"
                >
                  <option value="Estudiante">Estudiante</option>
                  <option value="Docente">Docente</option>
                  <option value="Empleado">Empleado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  Tipo de cuenta
                </label>
                <select
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value as TipoCuenta)}
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] font-medium cursor-pointer"
                >
                  <option value="Institucional">Institucional (@enmfm.edu.mx)</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            {sector === 'Estudiante' && (
              <div className="p-3.5 bg-[#112240] rounded-2xl border border-[#1e3a8a] space-y-3">
                <div className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider">
                  Datos Académicos Normalistas
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#d6e3ff] mb-1">
                    Licenciatura
                  </label>
                  <select
                    value={licenciatura}
                    onChange={(e) => setLicenciatura(e.target.value)}
                    className="w-full p-2 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-[#f59e0b] cursor-pointer"
                  >
                    <option value="Licenciatura en Educación Primaria">Licenciatura en Educación Primaria</option>
                    <option value="Licenciatura en Educación Preescolar">Licenciatura en Educación Preescolar</option>
                    <option value="Licenciatura en Educación Inicial">Licenciatura en Educación Inicial</option>
                    <option value="Licenciatura en Educación Física">Licenciatura en Educación Física</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#d6e3ff] mb-1">
                      Semestre
                    </label>
                    <select
                      value={semestre}
                      onChange={(e) => setSemestre(e.target.value)}
                      className="w-full p-2 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-[#f59e0b] cursor-pointer"
                    >
                      <option value="1° Semestre">1° Semestre</option>
                      <option value="2° Semestre">2° Semestre</option>
                      <option value="3° Semestre">3° Semestre</option>
                      <option value="4° Semestre">4° Semestre</option>
                      <option value="5° Semestre">5° Semestre</option>
                      <option value="6° Semestre">6° Semestre</option>
                      <option value="7° Semestre">7° Semestre</option>
                      <option value="8° Semestre">8° Semestre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#d6e3ff] mb-1">
                      Grupo
                    </label>
                    <input
                      type="text"
                      value={grupo}
                      onChange={(e) => setGrupo(e.target.value)}
                      placeholder="Grupo A, B, C..."
                      className="w-full p-2 bg-[#061426] border border-[#1e3a8a] rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@enmfm.edu.mx o personal"
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                Nombre de usuario
              </label>
              <input
                type="text"
                required
                minLength={4}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ejemplo: carmen.trevino"
                className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
              />
              <span className="text-[11px] text-[#94a3b8] mt-0.5 block">
                Solo letras, números, punto o guión (mínimo 4 caracteres).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  PIN de acceso (6 dígitos)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="6 dígitos"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6e3ff] uppercase tracking-wider mb-1.5">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={pinConfirmacion}
                  onChange={(e) => setPinConfirmacion(e.target.value)}
                  placeholder="Repite tu PIN"
                  className="w-full p-2.5 bg-[#061426] border border-[#1e3a8a] rounded-xl text-white text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#f59e0b] placeholder-[#64748b]"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#112240] rounded-2xl border border-[#1e3a8a] space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentimiento}
                  onChange={(e) => setConsentimiento(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-gray-600 bg-[#061426]"
                />
                <span className="text-xs text-[#d6e3ff] leading-relaxed select-none">
                  Acepto el tratamiento de mis datos personales conforme a la <strong>Política Institucional de Protección de Datos</strong> y los lineamientos de las <strong>Normas ISO/IEC 27701 e ISO/IEC 27001</strong> de la Escuela Normal Miguel F. Martínez.
                </span>
              </label>

              <div className="pl-6.5">
                <button
                  type="button"
                  onClick={() => setMostrarISOModal(true)}
                  className="text-[11px] text-[#38bdf8] hover:text-[#7dd3fc] font-bold underline cursor-pointer inline-flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] inline shrink-0" />
                  <span>Consultar Política y Normas ISO de Privacidad</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-[#3b82f6]/40 cursor-pointer"
            >
              {cargando ? 'Registrando en Base Maestra...' : 'Crear cuenta institucional'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onVolverALogin}
                className="inline-flex items-center space-x-1 text-xs text-[#94a3b8] hover:text-white font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>¿Ya tienes cuenta? Regresar al inicio de sesión</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Modal Informativo ISO */}
      <PrivacidadISOModal
        abierto={mostrarISOModal}
        onCerrar={() => setMostrarISOModal(false)}
      />

    </div>
  );
};

