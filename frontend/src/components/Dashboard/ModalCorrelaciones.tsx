import React from 'react';

interface CorrelacionItem {
  indicador: string;
  correlacion: number;
  valor_p: number;
  muestras: number;
  significativo: boolean;
}

interface Interpretacion {
  par: string;
  correlacion: number;
  interpretacion: string;
  fuerza: string;
}

interface ModalCorrelacionesProps {
  isOpen: boolean;
  onClose: () => void;
  indicadorActual: {
    key: string;
    nombre: string;
    valor: string;
    descripcion: string;
    icon: string;
    color: string;
  };
  topCorrelaciones: CorrelacionItem[];
  interpretaciones: Interpretacion[];
  eventoHistorico?: {
    año: number;
    evento: string;
    impacto: string;
  };
}

const ModalCorrelaciones: React.FC<ModalCorrelacionesProps> = ({
  isOpen,
  onClose,
  indicadorActual,
  topCorrelaciones,
  interpretaciones,
  eventoHistorico
}) => {
  if (!isOpen) return null;

  const getNombreLegible = (key: string): string => {
    const nombres: Record<string, string> = {
      'gdp_usd': 'PIB Total (USD)',
      'gdp_ppp': 'PIB (PPA)',
      'gdp_per_capita_usd': 'PIB per cápita (USD)',
      'gdp_growth_pct': 'Crecimiento PIB (%)',
      'imports_pct_gdp': 'Importaciones (% PIB)',
      'exports_pct_gdp': 'Exportaciones (% PIB)',
      'total_reserves_usd': 'Reservas Internacionales (USD)',
      'unemployment_pct': 'Desempleo (%)',
      'inflation_pct': 'Inflación (%)',
      'remittances_pct_gdp': 'Remesas (% PIB)',
      'population': 'Población',
      'pop_growth_pct': 'Crecimiento Poblacional (%)',
      'life_expectancy_years': 'Esperanza de Vida (años)',
      'poverty_pct': 'Pobreza (%)'
    };
    return nombres[key] || key;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        
        {/* Header - Azul celeste */}
        <div className="bg-sky-100 px-6 py-4 rounded-t-2xl border-b border-sky-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{indicadorActual.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-sky-800">Análisis de Correlaciones</h2>
                <p className="text-sky-600">{indicadorActual.nombre}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-sky-600 hover:text-sky-800 text-xl">×</button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {/* Resumen - Café clarito */}
          <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-800">{indicadorActual.nombre}</h3>
                <p className="text-stone-600 text-sm">{indicadorActual.descripcion}</p>
              </div>
              <div className="text-2xl font-bold text-sky-600">{indicadorActual.valor}</div>
            </div>
          </div>

          {/* Top 3 Correlaciones */}
          <h3 className="text-lg font-bold text-stone-800 mb-3">Top 3 Correlaciones</h3>
          <div className="space-y-4 mb-6">
            {topCorrelaciones.slice(0, 3).map((corr, index) => (
              <div key={corr.indicador} className={`
                p-4 rounded-xl border 
                ${index === 0 ? 'bg-sky-50 border-sky-200' : 
                  index === 1 ? 'bg-amber-50 border-amber-200' : 
                  'bg-stone-50 border-stone-200'}
              `}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">
                      {corr.correlacion > 0 ? '📈' : '📉'}
                    </span>
                    <div>
                      <h4 className="font-semibold text-stone-800">{getNombreLegible(corr.indicador)}</h4>
                      <p className="text-sm text-stone-600">
                        {Math.abs(corr.correlacion) >= 0.8 ? 'Muy fuerte' : 
                         Math.abs(corr.correlacion) >= 0.6 ? 'Fuerte' : 
                         Math.abs(corr.correlacion) >= 0.4 ? 'Moderada' : 'Débil'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${corr.correlacion > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {corr.correlacion > 0 ? '+' : ''}{corr.correlacion.toFixed(3)}
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-stone-500 mb-1">
                    <span>-1.0</span>
                    <span>0</span>
                    <span>+1.0</span>
                  </div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${corr.correlacion > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ 
                        width: `${Math.abs(corr.correlacion) * 100}%`,
                        marginLeft: `${(corr.correlacion + 1) * 50}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Insights - Cremita */}
          {interpretaciones.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-stone-800 mb-3">Insights</h3>
              <div className="mb-6 space-y-3">
                {interpretaciones.slice(0, 2).map((insight, index) => (
                  <div key={index} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-3">💡</span>
                      <div>
                        <p className="text-stone-700">{insight.interpretacion}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                            Correlación: {insight.correlacion > 0 ? '+' : ''}{insight.correlacion.toFixed(3)}
                          </span>
                          <span className="px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-xs">
                            {insight.fuerza}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Evento histórico - Café clarito */}
          {eventoHistorico && (
            <>
              <h3 className="text-lg font-bold text-stone-800 mb-3">Contexto Histórico</h3>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-start">
                  <div className="mr-4">
                    <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-sky-800">{eventoHistorico.año}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-800">{eventoHistorico.evento}</h4>
                    <p className="text-stone-600 text-sm mt-1">{eventoHistorico.impacto}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Nota */}
          <div className="mt-6 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-sm text-stone-600">
              <span className="font-semibold">Nota:</span> Correlación no implica causalidad. Análisis basado en datos 1991-2020.
            </p>
          </div>
        </div>

        {/* Footer - Café clarito */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-stone-600">
              China Economic Dashboard • 30 años de análisis
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCorrelaciones;