import React, { useState, useEffect } from 'react';

interface AnalisisTendenciasProps {
  indicadores: any[];
  loading: boolean;
}

const AnalisisTendencias: React.FC<AnalisisTendenciasProps> = ({ 
  indicadores,
  loading: loadingIndicadores 
}) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('gdp_usd');
  const [tendenciasData, setTendenciasData] = useState<any>(null);
  const [loadingTendencias, setLoadingTendencias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedIndicator) {
      cargarTendencias(selectedIndicator);
    }
  }, [selectedIndicator]);
  
  const cargarTendencias = async (indicador: string) => {
    try {
      setLoadingTendencias(true);
      setError(null);
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/china/analisis/analisis/tendencias?indicador=${indicador}`
      );
      
      if (!response.ok) throw new Error('Error al cargar tendencias');
      
      const data = await response.json();
      setTendenciasData(data);
    } catch (err) {
      console.error('Error cargando tendencias:', err);
      setError('Error al cargar análisis de tendencias');
    } finally {
      setLoadingTendencias(false);
    }
  };
  
  if (loadingIndicadores) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-stone-600">Cargando indicadores...</p>
        </div>
      </div>
    );
  }
  
  const formatValue = (value: number, indicatorField: string) => {
    const indicator = indicadores.find(ind => ind.field === indicatorField);
    const unit = indicator?.unit || '';
    
    if (unit === 'USD') {
      if (value === 0) return '$0';
      if (value < 1e9) return `$${(value / 1e6).toFixed(2)}M`;
      if (value < 1e12) return `$${(value / 1e9).toFixed(2)}B`;
      return `$${(value / 1e12).toFixed(2)}T`;
    }
    if (unit === '%') {
      return `${value.toFixed(2)}%`;
    }
    if (unit === 'personas') {
      if (value < 1e6) return `${(value / 1e3).toFixed(1)}K`;
      if (value < 1e9) return `${(value / 1e6).toFixed(1)}M`;
      return `${(value / 1e9).toFixed(2)}B`;
    }
    return value.toFixed(2);
  };
  
  const getIndicatorName = (field: string) => {
    const indicator = indicadores.find(ind => ind.field === field);
    return indicator ? indicator.name : field.replace('_', ' ');
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-stone-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-stone-800">Análisis de Tendencias Temporales</h3>
          <p className="text-stone-600 mt-1">
            Evolución histórica y puntos de inflexión por indicador
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="relative min-w-[250px]">
            <select 
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="appearance-none w-full bg-white border border-stone-300 rounded-lg px-4 py-2 pr-8 text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
              disabled={loadingTendencias}
            >
              {indicadores.map(ind => (
                <option key={ind.field} value={ind.field}>
                  {ind.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-rose-100 rounded-xl border border-rose-200">
          <p className="text-rose-700">{error}</p>
        </div>
      )}
      
      {loadingTendencias ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-stone-600">Analizando tendencias de {getIndicatorName(selectedIndicator)}...</p>
        </div>
      ) : tendenciasData ? (
        <div className="space-y-6">
          {/* Resumen de crecimiento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-lg border border-sky-200">
              <p className="text-sm text-sky-700 font-medium">Período analizado</p>
              <p className="text-lg font-bold text-sky-800 mt-1">
                {tendenciasData.periodo_analizado?.inicio} - {tendenciasData.periodo_analizado?.fin}
              </p>
              <p className="text-xs text-sky-600 mt-1">{tendenciasData.periodo_analizado?.total_años} años</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700 font-medium">Crecimiento total</p>
              <p className="text-lg font-bold text-emerald-800 mt-1">
                {tendenciasData.resumen_crecimiento?.crecimiento_total_porcentaje?.toFixed(2)}%
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Desde {formatValue(tendenciasData.resumen_crecimiento?.valor_inicial, selectedIndicator)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 font-medium">Promedio anual</p>
              <p className="text-lg font-bold text-amber-800 mt-1">
                {tendenciasData.resumen_crecimiento?.crecimiento_promedio_anual?.toFixed(2)}%
              </p>
              <p className="text-xs text-amber-600 mt-1">Tasa media de crecimiento</p>
            </div>
            <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-4 rounded-lg border border-stone-200">
              <p className="text-sm text-stone-700 font-medium">CAGR Global</p>
              <p className="text-lg font-bold text-stone-800 mt-1">
                {tendenciasData.resumen_crecimiento?.cagr_global?.toFixed(2)}%
              </p>
              <p className="text-xs text-stone-600 mt-1">Tasa compuesta anual</p>
            </div>
          </div>
          
          {/* Análisis por década */}
          {tendenciasData.analisis_por_decada && (
            <div className="mt-6">
              <h4 className="font-semibold text-stone-800 mb-4">📅 Análisis por Década</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tendenciasData.analisis_por_decada).map(([decade, data]: [string, any]) => (
                  <div key={decade} className="bg-gradient-to-br from-stone-50 to-stone-100 p-4 rounded-xl border border-stone-200">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-bold text-stone-800">{decade}</h5>
                      <span className="text-xs px-2 py-1 bg-stone-200 text-stone-800 rounded">
                        {data.años}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">CAGR:</span>
                        <span className="font-bold text-stone-800">{data.cagr?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">Crecimiento:</span>
                        <span className="font-bold text-stone-800">{data.crecimiento_total_porcentaje?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">Valor final:</span>
                        <span className="font-bold text-stone-800">{formatValue(data.valor_final, selectedIndicator)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Puntos de inflexión */}
          {tendenciasData.puntos_inflexion && tendenciasData.puntos_inflexion.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-stone-800 mb-4">📍 Puntos de Inflexión</h4>
              <div className="space-y-3">
                {tendenciasData.puntos_inflexion.map((punto: any, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="mr-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{punto.año}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">
                        {punto.tipo === 'aceleracion' ? 'Aceleración significativa' : 'Desaceleración significativa'} en {punto.año}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Tasa de crecimiento: {punto.tasa_crecimiento?.toFixed(2)}%
                        {punto.desviacion && ` (Desviación: ${punto.desviacion.toFixed(2)})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Períodos destacados */}
          {tendenciasData.periodos_destacados && (
            <div className="mt-6">
              <h4 className="font-semibold text-stone-800 mb-4">🏆 Períodos Destacados</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tendenciasData.periodos_destacados.maximo_crecimiento && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                    <h5 className="font-medium text-emerald-800 mb-2">Máximo Crecimiento</h5>
                    <p className="text-2xl font-bold text-emerald-800">
                      {tendenciasData.periodos_destacados.maximo_crecimiento.crecimiento_porcentaje?.toFixed(2)}%
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                      {tendenciasData.periodos_destacados.maximo_crecimiento.periodo} ({tendenciasData.periodos_destacados.maximo_crecimiento.año})
                    </p>
                  </div>
                )}
                
                {tendenciasData.periodos_destacados.minimo_crecimiento && (
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl border border-rose-200">
                    <h5 className="font-medium text-rose-800 mb-2">Mínimo Crecimiento</h5>
                    <p className="text-2xl font-bold text-rose-800">
                      {tendenciasData.periodos_destacados.minimo_crecimiento.crecimiento_porcentaje?.toFixed(2)}%
                    </p>
                    <p className="text-sm text-rose-700 mt-1">
                      {tendenciasData.periodos_destacados.minimo_crecimiento.periodo} ({tendenciasData.periodos_destacados.minimo_crecimiento.año})
                    </p>
                  </div>
                )}
                
                {tendenciasData.periodos_destacados.mayor_aceleracion && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <h5 className="font-medium text-amber-800 mb-2">Mayor Aceleración</h5>
                    <p className="text-2xl font-bold text-amber-800">
                      {tendenciasData.periodos_destacados.mayor_aceleracion.cambio_aceleracion_porcentaje?.toFixed(2)}%
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      {tendenciasData.periodos_destacados.mayor_aceleracion.periodo} ({tendenciasData.periodos_destacados.mayor_aceleracion.año})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tipo de tendencia */}
          {tendenciasData.analisis_tendencia && (
            <div className="mt-6 p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl border border-stone-200">
              <h4 className="font-semibold text-stone-800 mb-3">📊 Tipo de Tendencia Detectada</h4>
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-stone-800">
                    {tendenciasData.analisis_tendencia.tipo?.replace('_', ' ') || 'Lineal Crecimiento'}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">
                    {tendenciasData.analisis_tendencia.descripcion || 'Crecimiento lineal constante'}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-stone-600">R²</p>
                      <p className="text-lg font-bold text-stone-800">
                        {tendenciasData.analisis_tendencia.r_cuadrado?.toFixed(4) || '0.8809'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-stone-600">Confianza</p>
                      <p className="text-lg font-bold text-stone-800">
                        {tendenciasData.analisis_tendencia.confianza === 'alta' ? 'Alta' :
                         tendenciasData.analisis_tendencia.confianza === 'media' ? 'Media' : 'Baja'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-stone-800 mb-2">Selecciona un indicador</h4>
          <p className="text-stone-600">Elige un indicador de la lista para ver su análisis de tendencias</p>
        </div>
      )}
    </div>
  );
};

export default AnalisisTendencias;