// src/components/Dashboard/KpiCard.tsx - VERSIÓN RESPONSIVE COMPLETA
import React, { useState } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'sky' | 'amber' | 'emerald' | 'rose' | 'violet' | 'cyan';
  // Nuevas props para el análisis completo
  periodo?: string;
  valorInicial?: string;
  crecimientoAnual?: number;
  cagr?: number;
  crecimientoTotal?: number;
  tipoTendencia?: string;
  // Para expandir detalles
  mostrarDetalles?: boolean;
  onVerDetalles?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  description,
  icon,
  trend,
  color,
  periodo = '1991-2020',
  valorInicial = 'N/A',
  crecimientoAnual = 0,
  cagr = 0,
  crecimientoTotal = 0,
  tipoTendencia = 'lineal',
  onVerDetalles
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const colorClasses = {
    sky: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      accent: 'bg-sky-500',
      light: 'bg-sky-100',
      dark: 'bg-sky-200'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      accent: 'bg-amber-500',
      light: 'bg-amber-100',
      dark: 'bg-amber-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      accent: 'bg-emerald-500',
      light: 'bg-emerald-100',
      dark: 'bg-emerald-200'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      accent: 'bg-rose-500',
      light: 'bg-rose-100',
      dark: 'bg-rose-200'
    },
    violet: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-800',
      accent: 'bg-violet-500',
      light: 'bg-violet-100',
      dark: 'bg-violet-200'
    },
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      accent: 'bg-cyan-500',
      light: 'bg-cyan-100',
      dark: 'bg-cyan-200'
    }
  };

  const currentColor = colorClasses[color];

  const trendIcons = {
    up: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  };

  const getTendenciaIcon = () => {
    switch(tipoTendencia?.toLowerCase()) {
      case 'exponencial':
        return '↗️';
      case 'lineal_crecimiento':
        return '📈';
      case 'estancamiento':
        return '➡️';
      default:
        return '📊';
    }
  };

  const handleCardClick = () => {
    if (onVerDetalles) {
      onVerDetalles();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${currentColor.border} ${currentColor.bg} shadow-sm hover:shadow-md transition-all duration-300 ${expanded ? 'ring-2 ring-opacity-50 ' + currentColor.accent.replace('bg-', 'ring-') : ''}`}>
      
      {/* Header - COMPLETAMENTE RESPONSIVE */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
        <div className="flex items-start w-full sm:flex-1">
          <span className="text-2xl sm:text-3xl mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-stone-800 line-clamp-1 break-words">{title}</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 sm:mt-1.5 line-clamp-2 sm:line-clamp-1">{description}</p>
          </div>
        </div>
        
        {/* Badge de tendencia - Adapta tamaño y posición */}
        <div className={`inline-flex items-center justify-center sm:justify-start px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium w-fit sm:w-auto mt-1 sm:mt-0 ${
          trend === 'up' 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : trend === 'down'
            ? 'bg-rose-100 text-rose-800 border border-rose-200'
            : 'bg-stone-100 text-stone-800 border border-stone-200'
        }`}>
          {trendIcons[trend]}
          <span className="ml-1.5 sm:ml-2 whitespace-nowrap">{change}</span>
        </div>
      </div>
      
      {/* Valor Principal - Tamaño adaptable */}
      <div className="mt-3 sm:mt-5 mb-3 sm:mb-5">
        <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-stone-900 mb-1.5 sm:mb-2 break-all sm:break-words leading-tight">{value}</div>
        <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-stone-600">
          <span className={`inline-flex items-center justify-center xs:justify-start px-2 sm:px-2.5 py-1 sm:py-1 rounded ${currentColor.light} ${currentColor.text} text-xs font-medium w-fit max-w-full`}>
            <span className="mr-1 sm:mr-1.5">{getTendenciaIcon()}</span>
            <span className="truncate">{tipoTendencia.replace('_', ' ').toUpperCase()}</span>
          </span>
          <span className="hidden xs:inline text-stone-400 mx-1">•</span>
          <span className="text-stone-500 truncate">Período: {periodo}</span>
        </div>
      </div>
      
      {/* Barra de Progreso - Reducida en móvil */}
      <div className="mb-3 sm:mb-5">
        <div className="flex flex-col xs:flex-row xs:justify-between text-xs text-stone-600 mb-1 gap-0.5">
          <span className="truncate text-stone-500">Inicio: <span className="font-medium">{valorInicial}</span></span>
          <span className="truncate text-stone-500">Crecimiento: <span className="font-medium">{crecimientoTotal.toFixed(1)}%</span></span>
        </div>
        <div className="h-1.5 sm:h-2 bg-white rounded-full overflow-hidden border border-white/30">
          <div 
            className={`h-full rounded-full ${currentColor.accent} transition-all duration-500`}
            style={{ width: `${Math.min(100, (crecimientoTotal / 50) * 100)}%` }}
            title={`Crecimiento total: ${crecimientoTotal.toFixed(2)}%`}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs text-stone-400 mt-0.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Análisis Expandido - Grid responsivo */}
      {expanded && (
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-white/50 animate-fadeIn">
          <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm uppercase tracking-wider text-stone-700">Análisis de Crecimiento</h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
            <div className={`p-2.5 sm:p-3 rounded-lg ${currentColor.light} ${currentColor.text}`}>
              <p className="text-xs text-stone-600 mb-0.5">CAGR Global</p>
              <p className="text-base sm:text-lg font-bold">{cagr.toFixed(2)}%</p>
              <p className="text-xs text-stone-500 mt-0.5 sm:mt-1 truncate">Tasa anual compuesta</p>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-lg ${currentColor.light} ${currentColor.text}`}>
              <p className="text-xs text-stone-600 mb-0.5">Promedio Anual</p>
              <p className="text-base sm:text-lg font-bold">{crecimientoAnual.toFixed(2)}%</p>
              <p className="text-xs text-stone-500 mt-0.5 sm:mt-1 truncate">Crecimiento medio anual</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xs sm:text-sm">
            <p className="text-stone-600 leading-relaxed">
              El indicador creció un <span className="font-semibold">{crecimientoTotal.toFixed(2)}%</span> desde <span className="font-semibold">{periodo.split('-')[0]}</span> hasta <span className="font-semibold">{periodo.split('-')[1]}</span>
            </p>
          </div>
        </div>
      )}
      
      {/* Footer - Botón táctil optimizado */}
      <div className="mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-white/50">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm">
            <div className="flex items-center">
              <span className={`inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${currentColor.accent} mr-1.5 sm:mr-2 flex-shrink-0`}></span>
              <span className="text-stone-600 truncate">Análisis: {periodo}</span>
            </div>
          </div>
          <button 
            onClick={handleCardClick}
            className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2.5 rounded-lg transition-all ${currentColor.light} hover:${currentColor.dark} active:scale-95 w-full xs:w-auto min-h-[44px] flex items-center justify-center border ${currentColor.border} focus:outline-none focus:ring-2 focus:ring-offset-1 ${currentColor.accent.replace('bg-', 'focus:ring-')}`}
            aria-label={expanded ? "Ocultar análisis detallado" : "Mostrar análisis detallado"}
          >
            <span className="truncate">
              {expanded ? 'Ver menos' : 'Ver análisis'}
            </span>
            <svg 
              className={`ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;