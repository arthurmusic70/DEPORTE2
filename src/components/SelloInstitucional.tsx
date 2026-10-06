import React, { useState, useEffect } from 'react';
import { MSBDatabase } from '../utils/storage';

interface SelloInstitucionalProps {
  className?: string;
  size?: number;
  alt?: string;
  onClick?: () => void;
}

export const SelloInstitucional: React.FC<SelloInstitucionalProps> = ({ 
  className = "w-12 h-12", 
  size,
  alt = "Escudo Oficial - Escuela Normal Miguel F. Martínez",
  onClick
}) => {
  const [escudo, setEscudo] = useState(() => MSBDatabase.getEscudoActivo());
  const [errorCarga, setErrorCarga] = useState(false);
  const dimensionStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  useEffect(() => {
    const handleEscudoCambiado = (e: any) => {
      const nuevo = e.detail || MSBDatabase.getEscudoActivo();
      setEscudo(nuevo);
      setErrorCarga(false);
    };

    window.addEventListener('msb_escudo_cambiado', handleEscudoCambiado);
    return () => {
      window.removeEventListener('msb_escudo_cambiado', handleEscudoCambiado);
    };
  }, []);

  const fuenteImagen = !errorCarga && escudo?.url ? escudo.url : '/SELLO.png';
  const textoAlternativo = alt || escudo?.nombre || 'Escudo Institucional / Deportivo';

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full ${className}`}
      style={dimensionStyle}
      title={textoAlternativo}
      onClick={onClick}
    >
      <img
        key={fuenteImagen}
        src={fuenteImagen}
        alt={textoAlternativo}
        className="w-full h-full object-contain drop-shadow-md rounded-full transition-transform"
        onError={() => {
          if (!errorCarga && fuenteImagen !== '/SELLO.png') {
            setErrorCarga(true);
          }
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

