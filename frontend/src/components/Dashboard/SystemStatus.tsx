// src/components/Dashboard/SystemStatus.tsx - ACTUALIZADO
import React from 'react';

interface SystemStatusProps {
  data?: {
    estado: string;
    modelos_entrenados: number;
    memoria_utilizada_mb: number;
    ultima_actualizacion: string;
    metricas_rendimiento: {
      tiempo_promedio_prediccion: number;
      precision_promedio: number;
      solicitudes_procesadas: number;
      cache_hit_rate: number;
    };
  };
  loading?: boolean;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-stone-200">
        <div className="animate-pulse">
          <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-stone-200 rounded"></div>
            <div className="h-4 bg-stone-200 rounded"></div>
            <div className="h-4 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusData = data || {
    estado: 'operacional',
    modelos_entrenados: 4,
    memoria_utilizada_mb: 52.7,
    ultima_actualizacion: new Date().toISOString(),
    metricas_rendimiento: {
      tiempo_promedio_prediccion: 1.45,
      precision_promedio: 0.88,
      solicitudes_procesadas: 127,
      cache_hit_rate: 0.65
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getStatusColor = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'operacional':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'mantenimiento':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-stone-200">
      <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Estado del Sistema ML
      </h2>
      
      <div className="space-y-4">
        {/* Status general */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(statusData.estado)}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              statusData.estado.toLowerCase() === 'operacional' ? 'bg-emerald-500' :
              statusData.estado.toLowerCase() === 'mantenimiento' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
            <span className="font-medium">Sistema {statusData.estado}</span>
          </div>
          <span className="text-sm font-semibold">✓</span>
        </div>
        
        {/* Modelos disponibles */}
        <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sky-700">Modelos entrenados</span>
            <span className="text-lg font-bold text-sky-600">{statusData.modelos_entrenados}</span>
          </div>
          <div className="flex items-center text-sm text-sky-600">
            <span>ARIMA • Random Forest • Linear Regression • Prophet</span>
          </div>
        </div>
        
        {/* Última actualización */}
        <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Última actualización</span>
            <span className="text-sm font-semibold text-stone-800">{formatDate(statusData.ultima_actualizacion)}</span>
          </div>
          <div className="text-xs text-stone-500">
            Sistema actualizado automáticamente
          </div>
        </div>
        
        {/* Precisión */}
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Precisión promedio</span>
            <span className="text-lg font-bold text-emerald-600">
              {(statusData.metricas_rendimiento.precision_promedio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full" 
              style={{ width: `${statusData.metricas_rendimiento.precision_promedio * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Rendimiento */}
        <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-violet-700">Tiempo predicción</p>
              <p className="text-sm font-bold text-violet-800">
                {statusData.metricas_rendimiento.tiempo_promedio_prediccion.toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-xs text-violet-700">Cache hit rate</p>
              <p className="text-sm font-bold text-violet-800">
                {(statusData.metricas_rendimiento.cache_hit_rate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;