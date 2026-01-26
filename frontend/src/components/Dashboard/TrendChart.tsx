// src/components/Dashboard/TrendChart.tsx - VERSIÓN MEJORADA CON DATOS REALES
import React, { useEffect, useState, useMemo } from 'react';

interface TrendChartProps {
  data?: any;
  loading?: boolean;
  title?: string;
  serieTemporal?: Array<{ 
    year: number; 
    value: number;
    isMock?: boolean;
  }>;
  formatValue?: (value: number) => string;
  indicadorKey?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  loading, 
  title,
  serieTemporal = [],
  formatValue = (val) => val.toLocaleString(),
}) => {
  const [datosProcesados, setDatosProcesados] = useState<any[]>([]);
  const [tieneDatosReales, setTieneDatosReales] = useState<boolean>(false);
  
  useEffect(() => {
    if (serieTemporal && serieTemporal.length > 0) {
      const procesados = serieTemporal
        .filter(item => item.value !== null && item.value !== undefined)
        .sort((a, b) => a.year - b.year);
      
      setDatosProcesados(procesados);
      setTieneDatosReales(procesados.some(item => !item.isMock));
    } else {
      setDatosProcesados([]);
      setTieneDatosReales(false);
    }
  }, [serieTemporal]);
  
  const { valores, años, maxValor, minValor, promedio, crecimientoTotal } = useMemo(() => {
    if (datosProcesados.length === 0) {
      return { valores: [], años: [], maxValor: 0, minValor: 0, promedio: 0, crecimientoTotal: 0 };
    }
    
    const valoresArray = datosProcesados.map(item => item.value);
    const añosArray = datosProcesados.map(item => item.year);
    const maxVal = Math.max(...valoresArray);
    const minVal = Math.min(...valoresArray);
    const prom = valoresArray.reduce((sum, val) => sum + val, 0) / valoresArray.length;
    const crecimiento = datosProcesados.length > 1 
      ? ((valoresArray[valoresArray.length - 1] - valoresArray[0]) / valoresArray[0]) * 100
      : 0;
    
    return {
      valores: valoresArray,
      años: añosArray,
      maxValor: maxVal,
      minValor: minVal,
      promedio: prom,
      crecimientoTotal: crecimiento
    };
  }, [datosProcesados]);
  
  const calcularCAGR = () => {
    if (valores.length < 2) return 0;
    const periodoAños = años[años.length - 1] - años[0];
    if (periodoAños === 0) return 0;
    
    const valorFinal = valores[valores.length - 1];
    const valorInicial = valores[0];
    return (Math.pow(valorFinal / valorInicial, 1 / periodoAños) - 1) * 100;
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-stone-50 rounded-lg border border-stone-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4"></div>
        <p className="text-stone-500">Cargando gráfico de tendencias...</p>
        <p className="text-xs text-stone-400 mt-1">Obteniendo datos históricos...</p>
      </div>
    );
  }
  
  if (datosProcesados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-linear-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200">
        <div className="text-center p-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-stone-600">No hay datos disponibles para el gráfico</p>
          <p className="text-sm text-stone-500 mt-1">Seleccione otro indicador o intente nuevamente</p>
        </div>
      </div>
    );
  }
  
  const rango = maxValor - minValor || 1;
  const añosParaMostrar = años.filter((_, index) => index % 5 === 0 || index === años.length - 1);
  const cagr = calcularCAGR();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-700">{title || 'Análisis de Tendencias'}</h3>
          <div className="flex items-center mt-1 space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${tieneDatosReales ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {tieneDatosReales ? (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Datos reales
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  Datos estimados
                </>
              )}
            </span>
            <span className="text-sm text-stone-500">
              {datosProcesados.length} puntos de datos
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-stone-800">
            {formatValue(valores[valores.length - 1])}
          </div>
          <div className={`text-sm ${crecimientoTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {crecimientoTotal >= 0 ? '↗' : '↘'} 
            {crecimientoTotal.toFixed(1)}% total
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-stone-200">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-stone-600 mb-2">
            <span className="font-medium">{años[0]}</span>
            <span className="font-medium">{años[años.length - 1]}</span>
          </div>
          
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div className="relative h-64">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 0.25, 0.5, 0.75, 1].map((_, idx) => (
              <div key={idx} className="border-t border-stone-100" />
            ))}
          </div>
          
          <div className="absolute inset-0 flex items-end px-1">
            {valores.map((valor, index) => {
              const alturaPorcentaje = rango > 0 
                ? ((valor - minValor) / rango) * 100 
                : 50;
              
              const esMayorPromedio = valor > promedio;
              const colorClase = esMayorPromedio 
                ? 'from-sky-500 to-blue-600' 
                : 'from-sky-300 to-sky-500';
              
              return (
                <div
                  key={index}
                  className="flex-1 mx-0.5 relative group"
                  style={{ height: `${Math.max(alturaPorcentaje, 2)}%` }}
                >
                  <div 
                    className={`w-full h-full bg-gradient-to-t ${colorClase} rounded-t-lg transition-all duration-300 hover:opacity-90 cursor-pointer`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-50 shadow-lg">
                      <div className="font-bold mb-1">{años[index]}</div>
                      <div className="text-emerald-300">{formatValue(valor)}</div>
                      {index > 0 && (
                        <div className={`mt-1 text-xs ${valor > valores[index-1] ? 'text-emerald-300' : 'text-red-300'}`}>
                          {valor > valores[index-1] ? '↗' : '↘'} 
                          {((valor - valores[index-1]) / valores[index-1] * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {añosParaMostrar.includes(años[index]) && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-stone-500">
                      {años[index]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-center mt-10 space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-t from-sky-300 to-sky-500 rounded mr-2"></div>
            <span className="text-stone-600">Por debajo del promedio</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-t from-sky-500 to-blue-600 rounded mr-2"></div>
            <span className="text-stone-600">Por encima del promedio</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200">
          <div className="text-sm text-sky-700 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            CAGR
          </div>
          <div className="text-2xl font-bold text-sky-800 mt-1">
            {cagr.toFixed(2)}%
          </div>
          <div className="text-xs text-sky-600 mt-1">
            Crecimiento anual compuesto
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-700 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Rango
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {formatValue(maxValor - minValor)}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {((maxValor - minValor) / minValor * 100).toFixed(1)}% variación
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-700 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
            Promedio
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {formatValue(promedio)}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Valor medio del período
          </div>
        </div>
      </div>
      
      {!tieneDatosReales && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="bg-amber-100 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800">Datos de ejemplo</h4>
              <p className="text-sm text-amber-700 mt-1">
                Esta gráfica muestra datos simulados. Para ver datos reales, asegúrate que el backend tenga datos históricos completos en los endpoints <code>/api/china/datos/[año]</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;