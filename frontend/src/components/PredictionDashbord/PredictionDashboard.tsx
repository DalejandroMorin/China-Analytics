// PredictionDashboard.tsx - Versión simplificada
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

interface Indicator {
  field: string;
  name: string;
  description: string;
  unit: string;
}

interface Prediction {
  año: number;
  valor_predicho: number;
  intervalo_confianza_80: [number, number];
  intervalo_confianza_95: [number, number];
  crecimiento_anual_pct: number;
}

interface Metrics {
  r_cuadrado: number;
  mse: number;
  mae: number;
  mape: number;
  calidad_prediccion: string;
}

interface Summary {
  valor_2020: number;
  valor_2030: number;
  crecimiento_total_pct: number;
  cagr_2020_2030: number;
  tendencia_principal: string;
  años_proyectados: number;
}

interface PredictionResponse {
  indicador: string;
  modelo_utilizado: string;
  predicciones: Prediction[];
  metricas: Metrics;
  metadatos: {
    rango_entrenamiento: string;
    horizonte_prediccion: string;
    total_años_entrenamiento: number;
    ultima_actualizacion: string;
    tiempo_procesamiento_segundos: number;
    modelo_seleccionado: string;
    calidad_datos: string;
  };
  resumen: Summary;
}

const PredictionDashboard: React.FC = () => {
  // ✅ CORRECTO: Definir API_BASE_URL para Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://china-analytics.onrender.com';

  // Estados
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('gdp_usd');
  const [loading, setLoading] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Colores
  const colors = {
    azul: {
      50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
      400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
      800: '#1E40AF', 900: '#1E3A8A'
    },
    crema: {
      50: '#FEFAF6', 100: '#FDF6F0', 200: '#F9EDE4', 300: '#F5E4D8'
    },
    cafe: {
      100: '#F5E9DD', 200: '#E7D7C9', 300: '#D4B499', 400: '#B08968',
      500: '#8B5A2B', 600: '#7A4C25', 700: '#69401F', 800: '#573419',
      900: '#462813'
    }
  };

  // Cargar indicadores
  useEffect(() => {
    // ✅ CORRECTO: Usar API_BASE_URL
    fetch(`${API_BASE_URL}/api/china/indicadores/lista`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((ind: Indicator) => 
          ind.field !== 'year' && ind.field !== 'country'
        );
        setIndicators(filtered);
      })
      .catch(err => console.error('Error cargando indicadores:', err));
  }, []);

  // Cargar datos históricos
  useEffect(() => {
    if (!selectedIndicator) return;
    
    // ✅ CORRECTO: Usar API_BASE_URL
    fetch(`${API_BASE_URL}/api/china/datos/historicos?skip=0&limit=100`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((item: any) => item.year >= 1991);
        setHistoricalData(filtered);
      })
      .catch(err => console.error('Error cargando datos históricos:', err));
  }, [selectedIndicator]);

  // Generar predicción con modelo automático
  const handlePredict = async () => {
    if (!selectedIndicator) return;
    
    setLoading(true);
    try {
      // ✅ CORRECTO: Usar API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/china/predicciones/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicador: selectedIndicator,
          modelo: 'auto', // SIEMPRE automático
          horizonte: 'completo',
          incluir_metricas: true
        })
      });
      
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Error generando predicción:', error);
      alert('Error al generar predicción. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para el gráfico
  const getChartData = () => {
    const data: any[] = [];
    
    // Agregar datos históricos (1991-2020)
    historicalData.forEach(item => {
      data.push({
        año: item.year,
        valor: item[selectedIndicator] || 0,
        tipo: 'histórico',
        fuente: 'real'
      });
    });
    
    // Agregar predicciones (2021-2030)
    if (predictionData) {
      predictionData.predicciones.forEach(pred => {
        data.push({
          año: pred.año,
          valor: pred.valor_predicho,
          tipo: 'predicción',
          fuente: 'modelo',
          intervalo_80: pred.intervalo_confianza_80,
          intervalo_95: pred.intervalo_confianza_95,
          crecimiento: pred.crecimiento_anual_pct
        });
      });
    }
    
    return data.sort((a, b) => a.año - b.año);
  };

  // Formatear números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Obtener unidad del indicador seleccionado
  const getCurrentUnit = () => {
    const indicator = indicators.find(ind => ind.field === selectedIndicator);
    return indicator?.unit || '';
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const isPrediction = dataItem.tipo === 'predicción';
      const unit = getCurrentUnit();
      
      return (
        <div style={{
          backgroundColor: colors.crema[50],
          padding: '12px',
          border: `1px solid ${colors.cafe[200]}`,
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <p style={{ 
            fontWeight: 600, 
            color: colors.azul[900], 
            marginBottom: '8px',
            borderBottom: `1px solid ${colors.cafe[100]}`,
            paddingBottom: '4px'
          }}>
            Año: {label} {isPrediction ? '🔮' : '📊'}
          </p>
          <p style={{ margin: '4px 0' }}>
            <span style={{ fontWeight: 500, color: colors.cafe[700] }}>Valor: </span>
            <span style={{ fontWeight: 700, color: colors.azul[700] }}>
              {formatNumber(dataItem.valor)} {unit}
            </span>
          </p>
          {isPrediction && dataItem.crecimiento && (
            <p style={{ margin: '4px 0' }}>
              <span style={{ fontWeight: 500, color: colors.cafe[700] }}>Crecimiento: </span>
              <span style={{ 
                fontWeight: 700, 
                color: dataItem.crecimiento >= 0 ? '#059669' : '#DC2626' 
              }}>
                {dataItem.crecimiento.toFixed(2)}%
              </span>
            </p>
          )}
          <p style={{ 
            fontSize: '12px', 
            color: colors.cafe[500],
            marginTop: '8px',
            fontStyle: 'italic'
          }}>
            {isPrediction ? 'Predicción del modelo' : 'Dato histórico'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.azul[50],
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        border: `1px solid ${colors.azul[100]}`
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: colors.azul[900],
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            marginRight: '12px',
            padding: '8px',
            backgroundColor: colors.azul[500],
            color: 'white',
            borderRadius: '10px',
            fontSize: '20px'
          }}>
            🔮
          </span>
          Predicciones Económicas de China
        </h1>
        <p style={{ color: colors.cafe[600], fontSize: '16px' }}>
          Genera predicciones hasta 2030 usando modelos de Machine Learning automáticos
        </p>
        <div style={{
          marginTop: '12px',
          padding: '10px 16px',
          backgroundColor: colors.azul[100],
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          <span style={{ color: colors.azul[800], fontWeight: 600 }}>
            ⚡ Modelo Automático: 
          </span>
          <span style={{ color: colors.cafe[600], marginLeft: '8px' }}>
            El sistema selecciona automáticamente el mejor algoritmo para cada indicador
          </span>
        </div>
      </div>

      {/* Controles */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        border: `1px solid ${colors.crema[300]}`,
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        {/* Selector de indicador */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
            color: colors.azul[800],
            fontSize: '16px'
          }}>
            Selecciona un indicador:
          </label>
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1px solid ${colors.crema[300]}`,
              backgroundColor: 'white',
              color: colors.cafe[800],
              fontSize: '16px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {indicators.map(indicator => (
              <option key={indicator.field} value={indicator.field}>
                {indicator.name} ({indicator.unit})
              </option>
            ))}
          </select>
          {indicators.find(ind => ind.field === selectedIndicator)?.description && (
            <p style={{ marginTop: '8px', color: colors.cafe[600], fontSize: '14px' }}>
              {indicators.find(ind => ind.field === selectedIndicator)?.description}
            </p>
          )}
        </div>

        {/* Información del modelo automático */}
        <div style={{
          backgroundColor: colors.crema[50],
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: `1px solid ${colors.crema[200]}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: colors.azul[500],
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: 'white',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: colors.azul[900],
                marginBottom: '4px'
              }}>
                Modelo Automático de ML
              </h4>
              <p style={{ color: colors.cafe[600], fontSize: '14px' }}>
                El sistema analiza automáticamente tus datos y selecciona el mejor algoritmo (ARIMA, Random Forest, Linear, Prophet)
              </p>
            </div>
          </div>
        </div>

        {/* Botón de predicción */}
        <button
          onClick={handlePredict}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: colors.azul[500],
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = colors.azul[600];
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = colors.azul[500];
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: `3px solid ${colors.crema[50]}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                marginRight: '10px',
                animation: 'spin 1s linear infinite'
              }} />
              Generando Predicción...
            </span>
          ) : '🔮 Generar Predicción Automática'}
        </button>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Resultados */}
      {predictionData && (
        <div>
          {/* Gráfico */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: `1px solid ${colors.crema[300]}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.azul[900],
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '10px' }}>📈</span>
              {indicators.find(ind => ind.field === selectedIndicator)?.name} 
              <span style={{ 
                marginLeft: '10px', 
                fontSize: '14px', 
                fontWeight: 500,
                color: colors.cafe[600]
              }}>
                (1991-2030)
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.azul[600],
                backgroundColor: colors.azul[100],
                padding: '6px 12px',
                borderRadius: '20px'
              }}>
                Modelo: {predictionData.modelo_utilizado}
              </span>
            </h2>
            
            <div style={{ height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <defs>
                    <linearGradient id="confidence95" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.azul[200]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.azul[200]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confidence80" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.azul[300]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.azul[300]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.crema[300]} />
                  <XAxis 
                    dataKey="año" 
                    stroke={colors.cafe[600]}
                    label={{ 
                      value: 'Año', 
                      position: 'insideBottom', 
                      offset: -10,
                      style: { fill: colors.cafe[700], fontSize: '14px' }
                    }}
                  />
                  <YAxis 
                    stroke={colors.cafe[600]}
                    tickFormatter={(value) => formatNumber(value)}
                    label={{
                      value: getCurrentUnit(),
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: colors.cafe[700], fontSize: '14px' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="intervalo_95" 
                    stroke="none" 
                    fill="url(#confidence95)" 
                    name="Intervalo 95%"
                    hide={true}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="intervalo_80" 
                    stroke="none" 
                    fill="url(#confidence80)" 
                    name="Intervalo 80%"
                    hide={true}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke={colors.azul[500]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                    name="Valor"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '4px',
                  backgroundColor: colors.azul[500],
                  marginRight: '8px'
                }} />
                <span style={{ color: colors.cafe[700], fontSize: '14px' }}>Datos históricos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '4px',
                  backgroundColor: colors.azul[500],
                  marginRight: '8px'
                }} />
                <span style={{ color: colors.cafe[700], fontSize: '14px' }}>Predicciones 2021-2030</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: colors.azul[200],
                  marginRight: '8px',
                  opacity: 0.6
                }} />
                <span style={{ color: colors.cafe[700], fontSize: '14px' }}>Intervalo de confianza</span>
              </div>
            </div>
          </div>

          {/* Métricas y Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Métricas */}
            <div style={{
              backgroundColor: colors.azul[50],
              padding: '20px',
              borderRadius: '16px',
              border: `1px solid ${colors.azul[200]}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: colors.azul[900],
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px' }}>📊</span> Métricas del Modelo
                <span style={{
                  marginLeft: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: colors.cafe[600],
                  backgroundColor: colors.azul[100],
                  padding: '4px 12px',
                  borderRadius: '20px'
                }}>
                  {predictionData.modelo_utilizado}
                </span>
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>R² (Precisión)</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: colors.azul[700] }}>
                    {predictionData.metricas.r_cuadrado.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Error Absoluto (MAE)</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: colors.azul[700] }}>
                    {formatNumber(predictionData.metricas.mae)}
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Error % (MAPE)</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: colors.azul[700] }}>
                    {predictionData.metricas.mape.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Calidad</p>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: 
                        predictionData.metricas.calidad_prediccion === 'excelente' ? '#D1FAE5' :
                        predictionData.metricas.calidad_prediccion === 'buena' ? colors.azul[100] :
                        predictionData.metricas.calidad_prediccion === 'regular' ? '#FEF3C7' : '#FEE2E2',
                      color: 
                        predictionData.metricas.calidad_prediccion === 'excelente' ? '#065F46' :
                        predictionData.metricas.calidad_prediccion === 'buena' ? colors.azul[800] :
                        predictionData.metricas.calidad_prediccion === 'regular' ? '#92400E' : '#DC2626',
                      fontWeight: 600,
                      fontSize: '14px',
                      textTransform: 'capitalize'
                    }}>
                      {predictionData.metricas.calidad_prediccion}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div style={{
              backgroundColor: colors.crema[50],
              padding: '20px',
              borderRadius: '16px',
              border: `1px solid ${colors.crema[300]}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: colors.azul[900],
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px' }}>📈</span> Resumen 2020-2030
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Valor en 2020</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: colors.azul[700] }}>
                    {formatNumber(predictionData.resumen.valor_2020)}
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Valor proyectado 2030</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: colors.azul[700] }}>
                    {formatNumber(predictionData.resumen.valor_2030)}
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Crecimiento total</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: colors.azul[700] }}>
                    {predictionData.resumen.crecimiento_total_pct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Crecimiento anual (CAGR)</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: colors.azul[700] }}>
                    {predictionData.resumen.cagr_2020_2030.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.cafe[600], fontSize: '14px', marginBottom: '4px' }}>Tendencia</p>
                  <p style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: colors.azul[700],
                    textTransform: 'capitalize'
                  }}>
                    {predictionData.resumen.tendencia_principal.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de predicciones */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            border: `1px solid ${colors.crema[300]}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: colors.azul[900],
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>📋</span> Predicciones Detalladas por Año
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.azul[50] }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: colors.azul[900],
                      borderBottom: `2px solid ${colors.azul[200]}`
                    }}>Año</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: colors.azul[900],
                      borderBottom: `2px solid ${colors.azul[200]}`
                    }}>Valor Predicho</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: colors.azul[900],
                      borderBottom: `2px solid ${colors.azul[200]}`
                    }}>Crecimiento</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: colors.azul[900],
                      borderBottom: `2px solid ${colors.azul[200]}`
                    }}>Intervalo 80%</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.predicciones.map((pred, index) => (
                    <tr 
                      key={pred.año}
                      style={{
                        borderBottom: `1px solid ${colors.crema[200]}`,
                        backgroundColor: index % 2 === 0 ? 'white' : colors.crema[50]
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.azul[900] }}>
                        {pred.año}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {formatNumber(pred.valor_predicho)}
                      </td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: pred.crecimiento_anual_pct >= 0 ? '#059669' : '#DC2626',
                        fontWeight: 600
                      }}>
                        {pred.crecimiento_anual_pct.toFixed(2)}%
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatNumber(pred.intervalo_confianza_80[0])} - {formatNumber(pred.intervalo_confianza_80[1])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p style={{
              marginTop: '16px',
              color: colors.cafe[500],
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              * Los intervalos de confianza indican el rango donde se espera que esté el valor real con 80% de probabilidad
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionDashboard;