import React, { useState } from 'react';

interface HeatmapCorrelacionesProps {
  data: any;
  loading: boolean;
  error: string | null;
  indicadores: any[];
}

const HeatmapCorrelaciones: React.FC<HeatmapCorrelacionesProps> = ({ 
  data, 
  loading, 
  error,
  indicadores 
}) => {
  const [selectedCell, setSelectedCell] = useState<{row: string, col: string} | null>(null);
  const [filterStrength, setFilterStrength] = useState<string>('all');
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-stone-600">Calculando matriz de correlaciones...</p>
          <p className="text-sm text-stone-500 mt-2">Analizando 91 relaciones entre indicadores</p>
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

  const matriz = data.matriz_correlaciones || {};
  const indicadoresList = Object.keys(matriz);
  
  const getIndicatorName = (field: string) => {
    const indicator = indicadores.find(ind => ind.field === field);
    return indicator ? indicator.name : field.replace('_', ' ');
  };

  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return value > 0 ? 'bg-emerald-500' : 'bg-rose-500';
    if (absValue >= 0.6) return value > 0 ? 'bg-emerald-300' : 'bg-rose-300';
    if (absValue >= 0.4) return value > 0 ? 'bg-emerald-100' : 'bg-rose-100';
    return 'bg-stone-100';
  };

  const getCorrelationText = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return value > 0 ? 'Muy Fuerte +' : 'Muy Fuerte -';
    if (absValue >= 0.6) return value > 0 ? 'Fuerte +' : 'Fuerte -';
    if (absValue >= 0.4) return value > 0 ? 'Moderada +' : 'Moderada -';
    if (absValue >= 0.2) return value > 0 ? 'Débil +' : 'Débil -';
    return 'Muy Débil';
  };

  const getCellDetails = (row: string, col: string) => {
    if (row === col) return null;
    const cellData = matriz[row]?.[col];
    if (!cellData) return null;
    
    return {
      indicador1: getIndicatorName(row),
      indicador2: getIndicatorName(col),
      correlacion: cellData.correlacion,
      valor_p: cellData.valor_p,
      muestras: cellData.muestras,
      significativo: cellData.significativo
    };
  };

  const cellDetails = selectedCell ? getCellDetails(selectedCell.row, selectedCell.col) : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-stone-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-stone-800">Matriz de Correlaciones</h3>
          <p className="text-stone-600 mt-1">
            Mide la relación lineal entre pares de indicadores (-1 a 1)
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <select 
            value={filterStrength}
            onChange={(e) => setFilterStrength(e.target.value)}
            className="border border-stone-300 rounded-lg px-4 py-2 text-stone-700"
          >
            <option value="all">Todas las correlaciones</option>
            <option value="strong">Solo fuertes (|r| ≥ 0.6)</option>
            <option value="positive">Solo positivas (r ≥ 0)</option>
            <option value="negative">Solo negativas (r ≤ 0)</option>
          </select>
          
          <div className="flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
            <span className="text-sm">
              {data.resumen_analisis?.total_correlaciones_significativas || 60}/{data.resumen_analisis?.total_pares_analizados || 91} significativas
            </span>
          </div>
        </div>
      </div>
      
      {data.top_correlaciones && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-3">🔗 Correlaciones Más Fuertes</h4>
            <ul className="space-y-2">
              {data.top_correlaciones.positivas?.slice(0, 3).map((item: any, index: number) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{getIndicatorName(item.indicador1)} ↔ {getIndicatorName(item.indicador2)}</span>
                  <span className="font-bold text-emerald-700">+{item.correlacion.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl border border-rose-200">
            <h4 className="font-semibold text-rose-800 mb-3">⚠️ Correlaciones Negativas Fuertes</h4>
            <ul className="space-y-2">
              {data.top_correlaciones.negativas?.slice(0, 3).map((item: any, index: number) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{getIndicatorName(item.indicador1)} ↔ {getIndicatorName(item.indicador2)}</span>
                  <span className="font-bold text-rose-700">{item.correlacion.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header de columnas */}
          <div className="flex border-b border-stone-200">
            <div className="w-48 flex-shrink-0 p-3 font-medium text-stone-700 bg-stone-50"></div>
            {indicadoresList.slice(0, 8).map((col) => (
              <div 
                key={col}
                className="w-24 flex-shrink-0 p-3 text-sm font-medium text-stone-700 bg-stone-50 text-center truncate"
                title={getIndicatorName(col)}
              >
                {getIndicatorName(col).split(' ')[0]}
              </div>
            ))}
          </div>
          
          {/* Filas del heatmap */}
          {indicadoresList.slice(0, 8).map((row, rowIndex) => (
            <div 
              key={row} 
              className={`flex ${rowIndex % 2 === 0 ? 'bg-stone-50' : 'bg-white'} border-b border-stone-200`}
            >
              {/* Nombre del indicador de fila */}
              <div className="w-48 flex-shrink-0 p-3 font-medium text-stone-800 border-r border-stone-200 truncate">
                {getIndicatorName(row)}
              </div>
              
              {/* Celdas de correlación */}
              {indicadoresList.slice(0, 8).map((col) => {
                const cellData = matriz[row]?.[col];
                const correlacion = cellData?.correlacion || 0;
                const significativo = cellData?.significativo || false;
                
                // Aplicar filtros
                const shouldShow = () => {
                  if (row === col) return true;
                  if (filterStrength === 'strong' && Math.abs(correlacion) < 0.6) return false;
                  if (filterStrength === 'positive' && correlacion < 0) return false;
                  if (filterStrength === 'negative' && correlacion > 0) return false;
                  return true;
                };
                
                if (!shouldShow() && row !== col) {
                  return (
                    <div key={col} className="w-24 flex-shrink-0 p-3 border-r border-stone-200">
                      <div className="w-12 h-12 mx-auto bg-stone-100 rounded flex items-center justify-center text-xs text-stone-400">
                        -
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div 
                    key={col}
                    className={`w-24 flex-shrink-0 p-3 border-r border-stone-200 ${
                      row === col ? 'bg-stone-100' : ''
                    }`}
                    onClick={() => row !== col && setSelectedCell({row, col})}
                  >
                    <div 
                      className={`w-12 h-12 mx-auto rounded flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                        row === col 
                          ? 'bg-stone-300' 
                          : getCorrelationColor(correlacion)
                      } ${selectedCell?.row === row && selectedCell?.col === col ? 'ring-2 ring-blue-500' : ''}`}
                      title={
                        row === col 
                          ? `Auto-correlación: 1.000` 
                          : `Correlación: ${correlacion.toFixed(4)}\nValor p: ${cellData?.valor_p?.toFixed(6) || 'N/A'}\nSignificativo: ${significativo ? 'Sí' : 'No'}`
                      }
                    >
                      {row === col ? (
                        <span className="text-stone-600 text-sm font-bold">1.00</span>
                      ) : (
                        <>
                          <span className={`text-xs font-bold ${
                            Math.abs(correlacion) >= 0.8 ? 'text-white' :
                            Math.abs(correlacion) >= 0.6 ? 'text-stone-800' :
                            'text-stone-600'
                          }`}>
                            {correlacion.toFixed(2)}
                          </span>
                          {significativo && (
                            <span className="text-[10px] mt-0.5">★</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Detalles de celda seleccionada */}
      {cellDetails && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">
                {cellDetails.indicador1} ↔ {cellDetails.indicador2}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Correlación</p>
                  <p className={`text-lg font-bold ${
                    cellDetails.correlacion > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {cellDetails.correlacion > 0 ? '+' : ''}{cellDetails.correlacion.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-600">{getCorrelationText(cellDetails.correlacion)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Valor p</p>
                  <p className="text-lg font-bold text-blue-800">
                    {cellDetails.valor_p?.toExponential(2) || 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {cellDetails.significativo ? 'Significativo' : 'No significativo'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Muestras</p>
                  <p className="text-lg font-bold text-blue-800">{cellDetails.muestras}</p>
                  <p className="text-xs text-blue-600">años analizados</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Interpretación</p>
                  <p className="text-sm text-blue-800">
                    {cellDetails.correlacion > 0.6 
                      ? 'Relación muy fuerte positiva' 
                      : cellDetails.correlacion < -0.6 
                      ? 'Relación muy fuerte negativa'
                      : cellDetails.correlacion > 0
                      ? 'Relación positiva débil'
                      : 'Relación negativa débil'}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCell(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Interpretaciones */}
      {data.interpretacion_relaciones && (
        <div className="mt-8">
          <h4 className="font-semibold text-stone-800 mb-4">📝 Interpretaciones de Relaciones Clave</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.interpretacion_relaciones.positivas?.slice(0, 3).map((item: any, index: number) => (
              <div key={index} className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                <p className="font-medium text-emerald-800 mb-2">
                  {getIndicatorName(item.par.split(' - ')[0])} ↔ {getIndicatorName(item.par.split(' - ')[1])}
                </p>
                <p className="text-sm text-emerald-700">{item.interpretacion}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs px-2 py-1 bg-emerald-200 text-emerald-800 rounded">
                    Correlación: +{item.correlacion.toFixed(4)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-emerald-300 text-emerald-900 rounded">
                    {item.fuerza.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Leyenda */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <h4 className="font-semibold text-stone-800 mb-3">🎨 Leyenda de Correlaciones</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-emerald-500 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Muy Fuerte Positiva (r ≥ 0.8)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-emerald-300 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Fuerte Positiva (r ≥ 0.6)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-rose-500 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Muy Fuerte Negativa (r ≤ -0.8)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-rose-300 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Fuerte Negativa (r ≤ -0.6)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-stone-300 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Auto-correlación</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 border-2 border-blue-500 rounded mr-2"></div>
            <span className="text-sm text-stone-600">Celda seleccionada</span>
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-4">
          ★ Indica correlación estadísticamente significativa (valor p {'<'} 0.05)</p>
      </div>
    </div>
  );
};

export default HeatmapCorrelaciones;