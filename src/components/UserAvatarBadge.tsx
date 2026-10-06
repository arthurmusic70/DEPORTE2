import React from 'react';
import { SesionUsuario } from '../types';
import { 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Activity, 
  User, 
  Crown,
  Sparkles,
  Dumbbell
} from 'lucide-react';

interface UserAvatarBadgeProps {
  usuario: SesionUsuario;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export const UserAvatarBadge: React.FC<UserAvatarBadgeProps> = ({
  usuario,
  size = 'md',
  showBadge = true,
  className = ''
}) => {
  const rol = usuario.rol;
  const sector = usuario.sector?.toLowerCase() || '';

  // Determine avatar background gradient and icon based on role/sector
  let gradient = 'from-blue-600 via-indigo-600 to-blue-800 text-white border-blue-400/40';
  let badgeIcon = <User className="w-2.5 h-2.5" />;
  let badgeColor = 'bg-blue-600 text-white border-blue-400';
  let roleIcon = <User className="w-4 h-4" />;
  let roleTitle = 'Estudiante Normalista';

  if (rol === 'administrador') {
    gradient = 'from-purple-700 via-indigo-800 to-amber-600 text-amber-200 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    badgeIcon = <Crown className="w-2.5 h-2.5 text-amber-300" />;
    badgeColor = 'bg-purple-900 text-amber-300 border-amber-400';
    roleIcon = <Crown className="w-4 h-4 text-amber-300" />;
    roleTitle = 'Administrador General';
  } else if (rol === 'encargado') {
    gradient = 'from-emerald-700 via-teal-800 to-cyan-900 text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
    badgeIcon = <Award className="w-2.5 h-2.5 text-emerald-300" />;
    badgeColor = 'bg-emerald-900 text-emerald-300 border-emerald-400';
    roleIcon = <Award className="w-4 h-4 text-emerald-300" />;
    roleTitle = 'Encargado Técnico de Club';
  } else if (sector.includes('docente') || rol === 'docente') {
    gradient = 'from-sky-700 via-blue-800 to-indigo-900 text-sky-200 border-sky-400/50';
    badgeIcon = <BookOpen className="w-2.5 h-2.5 text-sky-200" />;
    badgeColor = 'bg-sky-900 text-sky-300 border-sky-400';
    roleIcon = <BookOpen className="w-4 h-4 text-sky-300" />;
    roleTitle = 'Cuerpo Docente';
  } else if (sector.includes('trabajador')) {
    gradient = 'from-amber-700 via-orange-800 to-amber-900 text-amber-200 border-amber-400/50';
    badgeIcon = <Sparkles className="w-2.5 h-2.5 text-amber-300" />;
    badgeColor = 'bg-amber-900 text-amber-300 border-amber-400';
    roleIcon = <Sparkles className="w-4 h-4 text-amber-300" />;
    roleTitle = 'Personal Institucional';
  } else {
    // Normalista / Estudiante
    gradient = 'from-blue-700 via-blue-800 to-indigo-950 text-white border-blue-400/40';
    badgeIcon = <GraduationCap className="w-2.5 h-2.5 text-blue-200" />;
    badgeColor = 'bg-blue-900 text-blue-200 border-blue-400';
    roleIcon = <GraduationCap className="w-4 h-4 text-blue-200" />;
    roleTitle = 'Estudiante Normalista';
  }

  const initial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-bold border',
    md: 'w-9 h-9 text-sm font-bold border-2',
    lg: 'w-12 h-12 text-base font-extrabold border-2',
    xl: 'w-16 h-16 text-xl font-black border-2'
  }[size];

  const badgePosition = {
    sm: '-bottom-0.5 -right-0.5 p-0.5',
    md: '-bottom-1 -right-1 p-0.5',
    lg: '-bottom-1 -right-1 p-1',
    xl: 'bottom-0 right-0 p-1.5'
  }[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} title={`${usuario.nombre} ${usuario.apellidos} • ${roleTitle}`}>
      <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm select-none`}>
        {initial}
      </div>
      
      {showBadge && (
        <div className={`absolute ${badgePosition} rounded-full ${badgeColor} border flex items-center justify-center shadow-xs`}>
          {badgeIcon}
        </div>
      )}
    </div>
  );
};
