// src/components/Dashboard/Dashboard.tsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from './KpiCard';
import TrendChart from './TrendChart';
import SystemStatus from './SystemStatus';
import ModalCorrelaciones from './ModalCorrelaciones';
import { dashboardServices } from '../../services/api';

// ✅ CORRECTO: Definir API_BASE_URL para Vite (igual que en otros componentes)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://china-analytics.onrender.com';

// Definir los 6 indicadores principales para las tarjetas KPI
const INDICADORES_PRINCIPALES = [
  { 
    field: 'gdp_usd', 
    name: 'PIB (USD)', 
    description: 'Producto Interno Bruto en dólares americanos',
    icon: '💰',
    color: 'sky' as const,
    format: 'currency'
  },
  { 
    field: 'population', 
    name: 'Población Total', 
    description: 'Población total del país',
    icon: '👥',
    color: 'amber' as const,
    format: 'population'
  },
  { 
    field: 'gdp_growth_pct', 
    name: 'Crecimiento del PIB', 
    description: 'Tasa de crecimiento anual del PIB',
    icon: '📈',
    color: 'emerald' as const,
    format: 'percent'
  },
  { 
    field: 'life_expectancy_years', 
    name: 'Esperanza de Vida', 
    description: 'Años de esperanza de vida al nacer',
    icon: '❤️',
    color: 'rose' as const,
    format: 'decimal'
  },
  { 
    field: 'inflation_pct', 
    name: 'Tasa de Inflación', 
    description: 'Inflación anual de precios al consumidor',
    icon: '📊',
    color: 'violet' as const,
    format: 'percent'
  },
  { 
    field: 'total_reserves_usd', 
    name: 'Reservas Totales', 
    description: 'Reservas internacionales totales en dólares americanos',
    icon: '🏦',
    color: 'cyan' as const,
    format: 'currency'
  }
];

// Mapeo de unidades a formatos
const UNIT_TO_FORMAT: Record<string, string> = {
  'USD': 'currency',
  '%': 'percent',
  'años': 'decimal',
  'personas': 'population',
  'texto': 'text',
  'año': 'decimal'
};

// Mapeo de field a icono y color para indicadores no principales
const DEFAULT_ICON_MAP: Record<string, { icon: string, color: string }> = {
  'gdp_ppp': { icon: '🌐', color: 'blue' },
  'gdp_per_capita_usd': { icon: '👤', color: 'indigo' },
  'imports_pct_gdp': { icon: '📥', color: 'green' },
  'exports_pct_gdp': { icon: '📤', color: 'orange' },
  'unemployment_pct': { icon: '📉', color: 'red' },
  'remittances_pct_gdp': { icon: '💸', color: 'emerald' },
  'pop_growth_pct': { icon: '📊', color: 'purple' },
  'poverty_pct': { icon: '🏚️', color: 'gray' },
  'year': { icon: '📅', color: 'stone' },
  'country': { icon: '🇨🇳', color: 'red' }
};

// Función para obtener el formato basado en la unidad
const getFormatFromUnit = (unit: string): string => {
  return UNIT_TO_FORMAT[unit] || 'decimal';
};

// Función para obtener icono y color basado en el field
const getIconAndColor = (field: string) => {
  const principal = INDICADORES_PRINCIPALES.find(ind => ind.field === field);
  if (principal) {
    return { icon: principal.icon, color: principal.color };
  }
  
  if (DEFAULT_ICON_MAP[field]) {
    return DEFAULT_ICON_MAP[field];
  }
  
  return { icon: '📈', color: 'gray' as const };
};

// Función para formatear valores
const formatValue = (value: number, format: string): string => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  switch(format) {
    case 'currency':
      if (value === 0) return '$0';
      if (value < 1e9) return `$${(value / 1e6).toFixed(2)}M`;
      if (value < 1e12) return `$${(value / 1e9).toFixed(2)}B`;
      return `$${(value / 1e12).toFixed(2)}T`;
    case 'population':
      if (value === 0) return '0';
      if (value < 1e6) return `${(value / 1e3).toFixed(1)}K`;
      if (value < 1e9) return `${(value / 1e6).toFixed(1)}M`;
      return `${(value / 1e9).toFixed(2)}B`;
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value.toString();
  }
};

// Función para determinar tendencia
const getTrend = (value: number): 'up' | 'down' | 'neutral' => {
  if (value > 0.5) return 'up';
  if (value < -0.5) return 'down';
  return 'neutral';
};

// Rango de años a analizar
const AÑOS_ANALIZAR = Array.from({length: 30}, (_, i) => 1991 + i); // 1991-2020

const Dashboard: React.FC = () => {
  
  // Estados para datos del dashboard
  const [kpis, setKpis] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState({
    kpis: true,
    trends: true,
    system: true,
    indicadores: true
  });
  const [error, setError] = useState<string | null>(null);

  // Estados para el modal de correlaciones
  const [modalOpen, setModalOpen] = useState(false);
  const [indicadorAnalisis, setIndicadorAnalisis] = useState<any>(null);
  const [correlacionesData, setCorrelacionesData] = useState<any>(null);
  const [loadingCorrelaciones, setLoadingCorrelaciones] = useState(false);

  // Estados para el indicador seleccionado en el gráfico
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<string>('gdp_usd');
  const [cargandoTrend, setCargandoTrend] = useState<boolean>(false);
  
  // Estado para todos los indicadores disponibles
  const [todosIndicadores, setTodosIndicadores] = useState<any[]>([]);
  
  // Estado para datos históricos del gráfico
  const [serieTemporal, setSerieTemporal] = useState<Array<{year: number, value: number, isMock?: boolean}>>([]);
  const [cargandoSerie, setCargandoSerie] = useState<boolean>(false);

  // Función para cargar todos los indicadores desde el backend
  const cargarTodosIndicadores = async () => {
    try {
      setLoading(prev => ({ ...prev, indicadores: true }));
      
      // ✅ CORRECTO: Usar API_BASE_URL en lugar de URL hardcodeada
      const response = await fetch(`${API_BASE_URL}/api/china/indicadores/lista`);
      if (!response.ok) throw new Error('Error al cargar indicadores');
      
      const data = await response.json();
      
      const indicadoresTransformados = data
        .filter((item: any) => item.field !== 'year' && item.field !== 'country')
        .map((item: any) => {
          const { icon, color } = getIconAndColor(item.field);
          const format = getFormatFromUnit(item.unit);
          
          return {
            key: item.field,
            label: item.name,
            description: item.description,
            unit: item.unit,
            icon,
            color,
            format
          };
        });
      
      setTodosIndicadores(indicadoresTransformados);
      setLoading(prev => ({ ...prev, indicadores: false }));
      
    } catch (err) {
      console.error('Error cargando indicadores:', err);
      const indicadoresTransformados = INDICADORES_PRINCIPALES.map(item => ({
        key: item.field,
        label: item.name,
        description: item.description,
        unit: item.field.includes('usd') ? 'USD' : 
               item.field.includes('pct') ? '%' : 
               item.field === 'population' ? 'personas' : 'años',
        icon: item.icon,
        color: item.color,
        format: item.format
      }));
      setTodosIndicadores(indicadoresTransformados);
      setLoading(prev => ({ ...prev, indicadores: false }));
    }
  };

  // Función para cargar datos históricos del indicador
  const cargarDatosHistoricos = async (indicadorKey: string) => {
    try {
      setCargandoSerie(true);
      const serie = [];
      
      // Intentar cargar datos para cada año
      for (const año of AÑOS_ANALIZAR) {
        try {
          // ✅ CORRECTO: Usar API_BASE_URL en lugar de URL hardcodeada
          const response = await fetch(`${API_BASE_URL}/api/china/datos/${año}`);
          if (response.ok) {
            const datos = await response.json();
            if (datos[indicadorKey] !== null && datos[indicadorKey] !== undefined) {
              serie.push({
                year: año,
                value: datos[indicadorKey],
                isMock: false
              });
            }
          }
        } catch (error) {
          console.warn(`Error cargando datos para ${año}:`, error);
        }
      }
      
      // Si tenemos al menos 10 puntos de datos, usar los reales
      if (serie.length >= 10) {
        setSerieTemporal(serie.sort((a, b) => a.year - b.year));
      } else {
        // Si no hay suficientes datos reales, generar datos de ejemplo
        generarSerieEjemplo(indicadorKey);
      }
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
      generarSerieEjemplo(indicadorKey);
    } finally {
      setCargandoSerie(false);
    }
  };

  // Función para generar datos de ejemplo
  const generarSerieEjemplo = (indicadorKey: string) => {
    const indicador = todosIndicadores.find(ind => ind.key === indicadorKey) || 
                     INDICADORES_PRINCIPALES.find(ind => ind.field === indicadorKey);
    
    let valorBase = 100;
    let factorCrecimiento = 1.1;
    
    if (indicador?.format === 'currency') {
      valorBase = indicadorKey.includes('gdp') ? 400e9 : 100e9;
      factorCrecimiento = 1.12;
    } else if (indicador?.format === 'population') {
      valorBase = 1.1e9;
      factorCrecimiento = 1.007;
    } else if (indicador?.format === 'percent') {
      valorBase = indicadorKey.includes('growth') ? 10 : 5;
      factorCrecimiento = indicadorKey.includes('growth') ? 0.98 : 1.0;
    } else if (indicador?.format === 'decimal') {
      valorBase = indicadorKey.includes('life') ? 70 : 50;
      factorCrecimiento = 1.005;
    }
    
    const serieEjemplo = AÑOS_ANALIZAR.map((año, index) => {
      const crecimiento = Math.pow(factorCrecimiento, index);
      const variacion = (Math.random() - 0.5) * 0.1;
      const valor = valorBase * crecimiento * (1 + variacion);
      
      return {
        year: año,
        value: valor,
        isMock: true
      };
    });
    
    setSerieTemporal(serieEjemplo);
  };

  // Modificar la función para cargar datos del indicador
  const cargarDatosTrend = async (indicadorKey: string) => {
    try {
      setCargandoTrend(true);
      
      // Cargar datos de tendencias
      const tendencias = await dashboardServices.getTendencias(indicadorKey);
      setTrendData(tendencias);
      
      // Cargar datos históricos en paralelo
      await cargarDatosHistoricos(indicadorKey);
      
    } catch (err) {
      console.warn(`Error cargando tendencias para ${indicadorKey}:`, err);
      setTrendData(getMockTrendData(indicadorKey));
      
      // Generar datos de ejemplo para el gráfico
      generarSerieEjemplo(indicadorKey);
    } finally {
      setCargandoTrend(false);
    }
  };

  // Función para extraer top 3 correlaciones de la matriz
  const extractTopCorrelaciones = (matriz: any, indicadorKey: string) => {
    if (!matriz || !matriz[indicadorKey]) return [];
    
    const correlaciones = matriz[indicadorKey];
    const correlacionesArray = Object.entries(correlaciones)
      .filter(([key]) => key !== indicadorKey)
      .map(([indicador, data]: [string, any]) => ({
        indicador,
        correlacion: data.correlacion,
        valor_p: data.valor_p,
        muestras: data.muestras,
        significativo: data.significativo
      }))
      .sort((a, b) => Math.abs(b.correlacion) - Math.abs(a.correlacion));
    
    return correlacionesArray.slice(0, 3);
  };

  const extractInterpretaciones = (data: any, indicadorKey: string) => {
    if (!data || !data.interpretacion_relaciones) return [];
    
    const todasInterpretaciones = [
      ...(data.interpretacion_relaciones.positivas || []),
      ...(data.interpretacion_relaciones.negativas || [])
    ];
    
    return todasInterpretaciones.filter((inter: any) => 
      inter.par.includes(indicadorKey)
    ).slice(0, 2);
  };

  const getEventoHistorico = (indicadorKey: string) => {
    const eventos: Record<string, { año: number, evento: string, impacto: string }> = {
      'gdp_usd': {
        año: 2001,
        evento: "China ingresa a la OMC",
        impacto: "Aceleración en crecimiento de exportaciones y PIB"
      },
      'population': {
        año: 2015,
        evento: "Fin de la política del hijo único",
        impacto: "Cambio en tendencias demográficas"
      },
      'gdp_growth_pct': {
        año: 2008,
        evento: "Crisis financiera global",
        impacto: "Desaceleración temporal del crecimiento económico"
      },
      'life_expectancy_years': {
        año: 2009,
        evento: "Reforma del sistema de salud",
        impacto: "Mejora en esperanza de vida y acceso a salud"
      },
      'inflation_pct': {
        año: 2011,
        evento: "Pico inflacionario post-crisis",
        impacto: "Máxima inflación en década (5.4%)"
      },
      'total_reserves_usd': {
        año: 2014,
        evento: "Acumulación máxima de reservas",
        impacto: "China alcanza $4T en reservas internacionales"
      },
      'gdp_per_capita_usd': {
        año: 2010,
        evento: "China supera a Japón como segunda economía",
        impacto: "Aumento significativo en PIB per cápita"
      },
      'unemployment_pct': {
        año: 2009,
        evento: "Estímulo económico post-crisis",
        impacto: "Contención del desempleo durante recesión global"
      }
    };
    
    return eventos[indicadorKey] || {
      año: 2001,
      evento: "China ingresa a la OMC",
      impacto: "Punto de inflexión en integración económica global"
    };
  };

  const handleVerAnalisis = async (kpi: any) => {
    try {
      setLoadingCorrelaciones(true);
      
      const correlaciones = await dashboardServices.getCorrelaciones();
      setCorrelacionesData(correlaciones);
      
      setIndicadorAnalisis({
        key: kpi.indicadorKey,
        nombre: kpi.title,
        valor: kpi.value,
        descripcion: kpi.description,
        icon: kpi.icon,
        color: kpi.color
      });
      
      setModalOpen(true);
    } catch (error) {
      console.error('Error cargando correlaciones:', error);
      setCorrelacionesData(getMockCorrelacionesData());
      setIndicadorAnalisis({
        key: kpi.indicadorKey,
        nombre: kpi.title,
        valor: kpi.value,
        descripcion: kpi.description,
        icon: kpi.icon,
        color: kpi.color
      });
      setModalOpen(true);
    } finally {
      setLoadingCorrelaciones(false);
    }
  };

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        await cargarTodosIndicadores();
        
        const kpisPromises = INDICADORES_PRINCIPALES.map(async (indicador, index) => {
          try {
            const tendencias = await dashboardServices.getTendencias(indicador.field);
            
            const valorFinal = tendencias.resumen_crecimiento?.valor_final || 0;
            const valorInicial = tendencias.resumen_crecimiento?.valor_inicial || 0;
            const crecimientoTotal = tendencias.resumen_crecimiento?.crecimiento_total_porcentaje || 0;
            const periodo = `${tendencias.periodo_analizado?.inicio}-${tendencias.periodo_analizado?.fin}`;
            
            return {
              id: index + 1,
              title: indicador.name,
              value: formatValue(valorFinal, indicador.format),
              change: `${crecimientoTotal >= 0 ? '+' : ''}${crecimientoTotal.toFixed(2)}%`,
              description: indicador.description,
              icon: indicador.icon,
              trend: getTrend(crecimientoTotal),
              color: indicador.color,
              periodo: periodo,
              valorInicial: formatValue(valorInicial, indicador.format),
              crecimientoAnual: tendencias.resumen_crecimiento?.crecimiento_promedio_anual || 0,
              cagr: tendencias.resumen_crecimiento?.cagr_global || 0,
              crecimientoTotal: crecimientoTotal,
              tipoTendencia: tendencias.analisis_tendencia?.tipo || 'lineal_crecimiento',
              datosOriginales: tendencias,
              indicadorKey: indicador.field
            };
          } catch (err) {
            console.warn(`Error cargando tendencias para ${indicador.field}:`, err);
            return getMockKpi(indicador, index);
          }
        });

        const kpisResults = await Promise.all(kpisPromises);
        setKpis(kpisResults);
        setLoading(prev => ({ ...prev, kpis: false }));

        // Cargar tendencias y datos históricos para el indicador por defecto
        await cargarDatosTrend('gdp_usd');
        setLoading(prev => ({ ...prev, trends: false }));

        try {
          const status = await dashboardServices.getSystemStatus();
          setSystemStatus(status);
        } catch (err) {
          console.warn('Error cargando estado del sistema:', err);
          setSystemStatus(getMockSystemStatus());
        }
        setLoading(prev => ({ ...prev, system: false }));

      } catch (err) {
        console.error('Error general cargando dashboard:', err);
        setError('Error al cargar datos del dashboard. Mostrando datos de ejemplo.');
        setKpis(getMockKpis());
        setTrendData(getMockTrendData('gdp_usd'));
        setSystemStatus(getMockSystemStatus());
        setLoading({ 
          kpis: false, 
          trends: false, 
          system: false,
          indicadores: false 
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Datos mock para respaldo
  const getMockKpi = (indicador: any, index: number) => {
    const valoresDefault: Record<string, {valor: number, cambio: number}> = {
      'gdp_usd': { valor: 14.69e12, cambio: 3730.42 },
      'population': { valor: 1.402e9, cambio: 15.2 },
      'gdp_growth_pct': { valor: 6.0, cambio: -2.1 },
      'life_expectancy_years': { valor: 77.1, cambio: 11.34 },
      'inflation_pct': { valor: 2.42, cambio: -0.8 },
      'total_reserves_usd': { valor: 3.222e12, cambio: 8.5 }
    };
    
    const defaultData = valoresDefault[indicador.field] || { valor: 0, cambio: 0 };
    
    return {
      id: index + 1,
      title: indicador.name,
      value: formatValue(defaultData.valor, indicador.format),
      change: `${defaultData.cambio >= 0 ? '+' : ''}${defaultData.cambio.toFixed(2)}%`,
      description: indicador.description,
      icon: indicador.icon,
      trend: getTrend(defaultData.cambio),
      color: indicador.color,
      periodo: '1991-2020',
      valorInicial: formatValue(defaultData.valor / (1 + defaultData.cambio/100), indicador.format),
      crecimientoAnual: defaultData.cambio / 30,
      cagr: Math.pow(1 + defaultData.cambio/100, 1/30) - 1,
      crecimientoTotal: defaultData.cambio,
      tipoTendencia: defaultData.cambio > 5 ? 'exponencial' : 'lineal_crecimiento',
      indicadorKey: indicador.field
    };
  };

  const getMockKpis = () => {
    return INDICADORES_PRINCIPALES.map((indicador, index) => getMockKpi(indicador, index));
  };

  const getMockTrendData = (indicadorKey: string) => {
    const datosPorIndicador: Record<string, any> = {
      'gdp_usd': {
        indicador: 'gdp_usd',
        periodo_analizado: {
          inicio: 1991,
          fin: 2020,
          total_años: 30
        },
        resumen_crecimiento: {
          valor_inicial: 383373318083.62,
          valor_final: 14687673892882,
          crecimiento_total_porcentaje: 3730.42,
          crecimiento_promedio_anual: 13.42,
          cagr_global: 13.4
        },
        analisis_tendencia: {
          tipo: 'lineal_crecimiento'
        }
      },
      'population': {
        indicador: 'population',
        periodo_analizado: {
          inicio: 1991,
          fin: 2020,
          total_años: 30
        },
        resumen_crecimiento: {
          valor_inicial: 1.154e9,
          valor_final: 1.402e9,
          crecimiento_total_porcentaje: 21.5,
          crecimiento_promedio_anual: 0.72,
          cagr_global: 0.65
        },
        analisis_tendencia: {
          tipo: 'lineal_crecimiento'
        }
      }
    };
    
    const defaultData = datosPorIndicador[indicadorKey] || {
      indicador: indicadorKey,
      periodo_analizado: {
        inicio: 1991,
        fin: 2020,
        total_años: 30
      },
      resumen_crecimiento: {
        valor_inicial: 100,
        valor_final: 300,
        crecimiento_total_porcentaje: 200,
        crecimiento_promedio_anual: 6.67,
        cagr_global: 3.73
      },
      analisis_tendencia: {
        tipo: 'lineal_crecimiento',
        r_cuadrado: 0.85
      }
    };
    
    return defaultData;
  };

  const getMockSystemStatus = () => ({
    estado: 'operacional',
    modelos_entrenados: 4,
    memoria_utilizada_mb: 52.7,
    ultima_actualizacion: '2026-01-02T22:24:58.296106Z',
    metricas_rendimiento: {
      tiempo_promedio_prediccion: 1.45,
      precision_promedio: 0.88,
      solicitudes_procesadas: 127,
      cache_hit_rate: 0.65
    }
  });

  const getMockCorrelacionesData = () => ({
    matriz_correlaciones: {
      gdp_usd: {
        population: { correlacion: 0.8981, valor_p: 0, muestras: 30, significativo: true },
        life_expectancy_years: { correlacion: 0.9389, valor_p: 0, muestras: 30, significativo: true },
        total_reserves_usd: { correlacion: 0.9246, valor_p: 0, muestras: 30, significativo: true }
      }
    },
    interpretacion_relaciones: {
      positivas: [
        {
          par: "gdp_usd - population",
          correlacion: 0.8981,
          interpretacion: "Crecimiento económico asociado con aumento poblacional",
          fuerza: "muy_fuerte"
        },
        {
          par: "gdp_usd - life_expectancy_years",
          correlacion: 0.9389,
          interpretacion: "Mayor PIB correlaciona con mejor salud y esperanza de vida",
          fuerza: "muy_fuerte"
        }
      ]
    }
  });

  const getTituloGrafico = () => {
    const indicador = todosIndicadores.find(ind => ind.key === indicadorSeleccionado);
    return indicador ? indicador.label : 'Análisis de Tendencias';
  };

  // Función para formatear valores para el TrendChart
  const formatValueForChart = (value: number) => {
    const indicador = todosIndicadores.find(ind => ind.key === indicadorSeleccionado);
    return formatValue(value, indicador?.format || 'decimal');
  };

  // Verificar si hay datos reales en la serie temporal
  const tieneDatosReales = serieTemporal.some(item => !item.isMock);

  if (loading.kpis && loading.trends && loading.system && loading.indicadores) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
        <p className="text-stone-600">Cargando dashboard...</p>
        <p className="text-sm text-stone-500 mt-2">Analizando 30 años de datos económicos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">China Economic Dashboard</h1>
            <p className="text-sky-100 mt-2 opacity-90">
              Panel de control con análisis temporal de indicadores económicos clave (1991-2020)
            </p>
            {error && (
              <div className="mt-3 inline-flex items-center px-3 py-1 bg-yellow-500/30 backdrop-blur-sm rounded-full text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm">
                Última actualización: {new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <span className="ml-2 text-xs bg-white/30 px-2 py-1 rounded">{todosIndicadores.length} indicadores</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-xs opacity-80">Indicadores activos</p>
            <p className="text-lg font-bold">{todosIndicadores.length}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-xs opacity-80">Período analizado</p>
            <p className="text-lg font-bold">1991-2020</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-xs opacity-80">Datos procesados</p>
            <p className="text-lg font-bold">180+</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-xs opacity-80">Tasa de crecimiento promedio</p>
            <p className="text-lg font-bold">13.4%</p>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Mejorados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-800">Indicadores Clave</h2>
          <p className="text-sm text-stone-600">
            Haz clic en "Ver análisis" para ver correlaciones y análisis detallado
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              description={kpi.description}
              icon={kpi.icon}
              trend={kpi.trend}
              color={kpi.color}
              periodo={kpi.periodo}
              valorInicial={kpi.valorInicial}
              crecimientoAnual={kpi.crecimientoAnual}
              cagr={kpi.cagr}
              crecimientoTotal={kpi.crecimientoTotal}
              tipoTendencia={kpi.tipoTendencia}
              onVerDetalles={() => handleVerAnalisis(kpi)}
            />
          ))}
        </div>
      </div>

      {/* Sección de gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-stone-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-xl font-bold text-stone-800">Análisis de Tendencias</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative min-w-[200px]">
                  <select 
                    value={indicadorSeleccionado}
                    onChange={(e) => {
                      setIndicadorSeleccionado(e.target.value);
                      cargarDatosTrend(e.target.value);
                    }}
                    className="appearance-none w-full bg-white border border-stone-300 rounded-lg px-4 py-2 pr-8 text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
                    disabled={cargandoTrend || loading.indicadores}
                  >
                    {loading.indicadores ? (
                      <option>Cargando indicadores...</option>
                    ) : (
                      todosIndicadores.map(ind => (
                        <option key={ind.key} value={ind.key}>
                          {ind.label}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <div className="text-sm text-stone-600">
                  <span className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-full">
                    {cargandoTrend || cargandoSerie ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-500 mr-2"></div>
                    ) : (
                      <span className="w-2 h-2 bg-sky-500 rounded-full mr-2"></span>
                    )}
                    {loading.indicadores ? (
                      'Cargando...'
                    ) : (
                      <>
                        CAGR: {cargandoTrend ? '...' : trendData?.resumen_crecimiento?.cagr_global?.toFixed(2) || 'N/A'}%
                        <span className="ml-2 text-xs opacity-75">
                          {tieneDatosReales ? '📊 Reales' : '📈 Estimados'}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {cargandoTrend || cargandoSerie ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mb-4"></div>
                <p className="text-stone-600">Cargando datos del indicador...</p>
                <p className="text-sm text-stone-500">Obteniendo datos históricos 1991-2020...</p>
              </div>
            ) : trendData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-lg border border-sky-200">
                    <p className="text-sm text-sky-700 font-medium">Período analizado</p>
                    <p className="text-lg font-bold text-sky-800 mt-1">
                      {trendData.periodo_analizado?.inicio} - {trendData.periodo_analizado?.fin}
                    </p>
                    <p className="text-xs text-sky-600 mt-1">{trendData.periodo_analizado?.total_años} años</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">Crecimiento total</p>
                    <p className="text-lg font-bold text-emerald-800 mt-1">
                      {trendData.resumen_crecimiento?.crecimiento_total_porcentaje?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Desde {formatValueForChart(trendData.resumen_crecimiento?.valor_inicial)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700 font-medium">Promedio anual</p>
                    <p className="text-lg font-bold text-amber-800 mt-1">
                      {trendData.resumen_crecimiento?.crecimiento_promedio_anual?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Tasa media de crecimiento</p>
                  </div>
                  <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-4 rounded-lg border border-stone-200">
                    <p className="text-sm text-stone-700 font-medium">Tipo de tendencia</p>
                    <p className="text-lg font-bold text-stone-800 mt-1">
                      {trendData.analisis_tendencia?.tipo?.replace('_', ' ') || 'Lineal'}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">R²: {trendData.analisis_tendencia?.r_cuadrado?.toFixed(4) || '0.8809'}</p>
                  </div>
                </div>
                
                {/* TrendChart mejorado con datos reales */}
                <TrendChart 
                  data={trendData} 
                  loading={cargandoTrend || cargandoSerie}
                  title={`${getTituloGrafico()} - 1991-2020`}
                  serieTemporal={serieTemporal}
                  formatValue={formatValueForChart}
                  indicadorKey={indicadorSeleccionado}
                />
                
                {/* Info sobre calidad de datos */}
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
                          Esta gráfica muestra datos estimados. Para ver datos reales, asegúrate que el backend tenga datos históricos completos.
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          Endpoint usado: <code className="bg-amber-100 px-2 py-1 rounded">GET /api/china/datos/[año]</code>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <TrendChart loading={true} />
            )}
            
            <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-sky-500 mr-2"></div>
                  <span>{getTituloGrafico()}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Período: 1991-2020</span>
                </div>
              </div>
              <Link to="/analisis" className="text-sky-600 hover:text-sky-700 font-medium flex items-center">
                Análisis comparativo completo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <SystemStatus data={systemStatus} loading={loading.system} />
        </div>
      <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-6 border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Acceso Rápido a Datos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/datos" 
            className="group bg-white p-5 rounded-xl border border-stone-200 hover:border-sky-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-sky-100 to-sky-200 p-3 rounded-lg mr-4 group-hover:from-sky-200 group-hover:to-sky-300 transition-all">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 group-hover:text-sky-600">Tabla Completa</h4>
                <p className="text-sm text-stone-600 mt-1">Todos los datos históricos 1990-2020</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/analisis" 
            className="group bg-white p-5 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-lg mr-4 group-hover:from-amber-200 group-hover:to-amber-300 transition-all">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 group-hover:text-amber-600">Análisis</h4>
                <p className="text-sm text-stone-600 mt-1">Correlaciones y tendencias avanzadas</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/predicciones" 
            className="group bg-white p-5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-lg mr-4 group-hover:from-emerald-200 group-hover:to-emerald-300 transition-all">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 group-hover:text-emerald-600">Predicciones</h4>
                <p className="text-sm text-stone-600 mt-1">Modelos ML y proyecciones 2025-2030</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="text-center text-sm text-stone-500 pt-4 border-t border-stone-200">
        <p>
          Dashboard económico de China • {todosIndicadores.length} indicadores analizados • 
          <span className="mx-2">•</span>
          Última actualización de datos: Diciembre 2020
          <span className="mx-2">•</span>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sky-600 hover:text-sky-700 hover:underline"
          >
            Actualizar datos
          </button>
        </p>
      </div>

      {modalOpen && indicadorAnalisis && correlacionesData && (
        <ModalCorrelaciones
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          indicadorActual={indicadorAnalisis}
          topCorrelaciones={extractTopCorrelaciones(correlacionesData.matriz_correlaciones, indicadorAnalisis.key)}
          interpretaciones={extractInterpretaciones(correlacionesData, indicadorAnalisis.key)}
          eventoHistorico={getEventoHistorico(indicadorAnalisis.key)}
        />
      )}

      {loadingCorrelaciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-stone-700">Analizando correlaciones...</p>
            <p className="text-sm text-stone-500 mt-1">Buscando relaciones con otros {todosIndicadores.length - 1} indicadores</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;