import React, { useState } from 'react';

interface AnalisisComparativoProps {
  data: any;
  loading: boolean;
  error: string | null;
  indicadores: any[];
}

const AnalisisComparativo: React.FC<AnalisisComparativoProps> = ({ 
  data, 
  loading, 
  error,
  indicadores 
}) => {
  const [selectedDecade, setSelectedDecade] = useState<string>('global');
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-stone-600">Analizando crecimiento por década...</p>
          <p className="text-sm text-stone-500 mt-2">Comparando 1990s, 2000s y 2010s</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-stone-200">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getIndicatorName = (field: string) => {
    const indicator = indicadores.find(ind => ind.field === field);
    return indicator ? indicator.name : field.replace('_', ' ');
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'percentage') return `${value.toFixed(2)}%`;
    if (type === 'cagr') return `${value.toFixed(2)}%`;
    return value.toFixed(2);
  };

  const renderGlobalRanking = () => {
    const ranking = data.rankings_comparativos?.global?.top_10_crecimiento_global || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead>
            <tr className="bg-stone-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-700 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-700 uppercase">Indicador</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-700 uppercase">CAGR Global</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-700 uppercase">Crecimiento Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-700 uppercase">Clasificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {ranking.map((item: any, index: number) => {
              const growth = item.cagr_global || 0;
              let classification = '';
              let color = '';
              
              if (growth > 10) {
                classification = 'Crecimiento Explosivo';
                color = 'bg-emerald-100 text-emerald-800';
              } else if (growth > 5) {
                classification = 'Crecimiento Alto';
                color = 'bg-green-100 text-green-800';
              } else if (growth > 0) {
                classification = 'Crecimiento Moderado';
                color = 'bg-amber-100 text-amber-800';
              } else {
                classification = 'Decrecimiento';
                color = 'bg-rose-100 text-rose-800';
              }
              
              return (
                <tr key={index} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < 3 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {getIndicatorName(item.indicador)}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-bold ${
                      growth > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formatValue(growth, 'cagr')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-stone-700">
                      {formatValue(item.crecimiento_total_30_anios || 0, 'percentage')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
                      {classification}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDecadeRanking = (decade: string) => {
    const decadeData = data.rankings_comparativos?.por_decada?.[decade];
    if (!decadeData) return null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 crecimiento */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
          <h4 className="font-semibold text-emerald-800 mb-4">📈 Top 5 Crecimiento</h4>
          <div className="space-y-3">
            {decadeData.top_5_crecimiento?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-amber-100 text-amber-800' :
                    index === 1 ? 'bg-stone-100 text-stone-700' :
                    index === 2 ? 'bg-stone-100 text-stone-700' :
                    'bg-stone-50 text-stone-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{getIndicatorName(item.indicador)}</p>
                    <p className="text-xs text-stone-600">
                      Desde {formatValue(item.valor_inicial, 'percentage')} a {formatValue(item.valor_final, 'percentage')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatValue(item.cagr, 'cagr')}</p>
                  <p className="text-xs text-stone-600">{formatValue(item.crecimiento_total, 'percentage')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom 5 crecimiento */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-xl border border-rose-200">
          <h4 className="font-semibold text-rose-800 mb-4">📉 Bottom 5 Crecimiento</h4>
          <div className="space-y-3">
            {decadeData.bottom_5_crecimiento?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-stone-100 text-stone-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{getIndicatorName(item.indicador)}</p>
                    <p className="text-xs text-stone-600">
                      Desde {formatValue(item.valor_inicial, 'percentage')} a {formatValue(item.valor_final, 'percentage')}</p>
                    </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600">{formatValue(item.cagr, 'cagr')}</p>
                  <p className="text-xs text-stone-600">{formatValue(item.crecimiento_total, 'percentage')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTransformaciones = () => {
    const transformaciones = data.transformaciones_estructurales || [];
    
    return (
      <div className="mt-8">
        <h4 className="font-semibold text-stone-800 mb-4">🔄 Transformaciones Estructurales por Década</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformaciones.slice(0, 6).map((item: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-stone-200 hover:shadow-md transition-shadow">
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${
                  item.tipo === 'aceleracion' ? 'bg-emerald-100' :
                  item.tipo === 'desaceleracion' ? 'bg-amber-100' :
                  'bg-stone-100'
                }`}>
                  {item.tipo === 'aceleracion' ? '🚀' :
                   item.tipo === 'desaceleracion' ? '📉' : '📊'}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{getIndicatorName(item.indicador)}</p>
                  <p className="text-sm text-stone-600 mt-1">{item.decada}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.tipo === 'aceleracion' ? 'bg-emerald-200 text-emerald-800' :
                      item.tipo === 'desaceleracion' ? 'bg-amber-200 text-amber-800' :
                      'bg-stone-200 text-stone-800'
                    }`}>
                      {item.tipo === 'aceleracion' ? 'Aceleración' : 'Desaceleración'}
                    </span>
                    <span className="ml-2 text-sm font-bold">
                      {item.cambio_cagr > 0 ? '+' : ''}{formatValue(item.cambio_cagr, 'cagr')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-600 mt-3">{item.interpretacion}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-stone-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-stone-800">Análisis Comparativo por Década</h3>
          <p className="text-stone-600 mt-1">
            Comparativa de crecimiento económico y social entre 1990s, 2000s y 2010s
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium ${selectedDecade === 'global' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}
              onClick={() => setSelectedDecade('global')}
            >
              Global
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium ${selectedDecade === '1990s' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}
              onClick={() => setSelectedDecade('1990s')}
            >
              1990s
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium ${selectedDecade === '2000s' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}
              onClick={() => setSelectedDecade('2000s')}
            >
              2000s
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium ${selectedDecade === '2010s' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}
              onClick={() => setSelectedDecade('2010s')}
            >
              2010s
            </button>
          </div>
        </div>
      </div>
      
      {/* Resumen Ejecutivo */}
      {data.resumen_ejecutivo && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200 mb-8">
          <h4 className="font-semibold text-amber-800 mb-3">📋 Resumen Ejecutivo</h4>
          <p className="text-stone-700 mb-4">
            Análisis de {data.resumen_ejecutivo.total_indicadores_analizados} indicadores durante el período {
            data.resumen_ejecutivo.periodo_analizado}. {data.resumen_ejecutivo.hallazgos_clave?.[0]}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-amber-700">Período</p>
              <p className="text-lg font-bold text-amber-800">{data.resumen_ejecutivo.periodo_analizado}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-amber-700">Indicadores</p>
              <p className="text-lg font-bold text-amber-800">{data.resumen_ejecutivo.total_indicadores_analizados}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-amber-700">Década Mayor Crecimiento</p>
              <p className="text-lg font-bold text-amber-800">2000s</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-amber-700">Indicador Más Estable</p>
              <p className="text-lg font-bold text-amber-800">Esperanza de Vida</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido según selección */}
      {selectedDecade === 'global' ? renderGlobalRanking() : renderDecadeRanking(selectedDecade)}
      
      {/* Transformaciones Estructurales */}
      {renderTransformaciones()}
      
      {/* Volatilidad */}
      {data.analisis_volatilidad && (
        <div className="mt-8">
          <h4 className="font-semibold text-stone-800 mb-4">📊 Análisis de Volatilidad</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2">Alta Volatilidad</h5>
              <div className="flex flex-wrap gap-2">
                {data.clasificacion_indicadores?.alta_volatilidad?.map((ind: string, index: number) => (
                  <span key={index} className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                    {getIndicatorName(ind)}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">Baja Volatilidad</h5>
              <div className="flex flex-wrap gap-2">
                {data.clasificacion_indicadores?.baja_volatilidad?.map((ind: string, index: number) => (
                  <span key={index} className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
                    {getIndicatorName(ind)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalisisComparativo;