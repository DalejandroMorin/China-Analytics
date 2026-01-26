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
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className={`bg-white rounded-2xl p-6 border ${currentColor.border} ${currentColor.bg} shadow-sm hover:shadow-md transition-all duration-300 ${expanded ? 'ring-2 ring-opacity-50 ' + currentColor.accent.replace('bg-', 'ring-') : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm opacity-75 mt-1">{description}</p>
            </div>
          </div>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          trend === 'up' 
            ? 'bg-emerald-100 text-emerald-800' 
            : trend === 'down'
            ? 'bg-rose-100 text-rose-800'
            : 'bg-stone-100 text-stone-800'
        }`}>
          {trendIcons[trend]}
          <span className="ml-1">{change}</span>
        </div>
      </div>
      
      {/* Valor Principal */}
      <div className="mt-6 mb-6">
        <div className="text-3xl font-bold mb-2">{value}</div>
        <div className="flex items-center text-sm text-stone-600">
          <span className={`inline-flex items-center px-2 py-1 rounded ${currentColor.light} text-xs`}>
            <span className="mr-1">{getTendenciaIcon()}</span>
            {tipoTendencia.replace('_', ' ').toUpperCase()}
          </span>
          <span className="mx-2">•</span>
          <span>Período: {periodo}</span>
        </div>
      </div>
      
      {/* Barra de Progreso (Representando el crecimiento) */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-stone-600 mb-1">
          <span>Inicio: {valorInicial}</span>
          <span>Crecimiento: {crecimientoTotal.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${currentColor.accent}`}
            style={{ width: `${Math.min(100, (crecimientoTotal / 50) * 100)}%` }}
            title={`Crecimiento total: ${crecimientoTotal.toFixed(2)}%`}
          ></div>
        </div>
      </div>
      
      {/* Análisis Expandido (Visible solo si expanded=true) */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-white/50 animate-fadeIn">
          <h4 className="font-medium mb-3 text-sm uppercase tracking-wider opacity-75">Análisis de Crecimiento</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${currentColor.light}`}>
              <p className="text-xs opacity-75">CAGR Global</p>
              <p className="text-lg font-bold">{cagr.toFixed(2)}%</p>
              <p className="text-xs mt-1">Tasa anual compuesta</p>
            </div>
            <div className={`p-3 rounded-lg ${currentColor.light}`}>
              <p className="text-xs opacity-75">Promedio Anual</p>
              <p className="text-lg font-bold">{crecimientoAnual.toFixed(2)}%</p>
              <p className="text-xs mt-1">Crecimiento medio anual</p>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <p className="opacity-75">
              El indicador creció un {crecimientoTotal.toFixed(2)}% desde {periodo.split('-')[0]} hasta {periodo.split('-')[1]}
            </p>
          </div>
        </div>
      )}
      
      {/* Footer con acción */}
      <div className="mt-6 pt-6 border-t border-white/50">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full ${currentColor.accent} mr-2`}></span>
              <span className="opacity-75">Análisis: {periodo}</span>
            </div>
          </div>
          <button 
            onClick={handleCardClick}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${currentColor.light} hover:${currentColor.dark} active:scale-95`}
          >
            {expanded ? 'Ver menos' : 'Ver análisis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;