// src/services/api.ts - VERSIÓN COMPLETA CON TODOS LOS SERVICIOS
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/china';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para loguear errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ==================== SERVICIOS PARA DASHBOARD ====================
export const dashboardServices = {
  // Obtener tendencias para un indicador
  getTendencias: async (indicador: string) => {
    const response = await api.get(`/analisis/analisis/tendencias?indicador=${indicador}`);
    return response.data;
  },

  // Obtener status del sistema ML
  getSystemStatus: async () => {
    const response = await api.get('/predicciones/status');
    return response.data;
  },

  // Obtener datos históricos (para la tabla)
  getHistoricalData: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/datos/historicos?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener lista de indicadores
  getIndicadoresList: async () => {
    const response = await api.get('/indicadores/lista');
    return response.data;
  },

  // Obtener correlaciones (para el modal del dashboard)
  getCorrelaciones: async () => {
    const response = await api.get('/analisis/analisis/correlaciones');
    return response.data;
  },

  // Obtener métricas específicas de un indicador
  getMetricas: async (indicador: string) => {
    const response = await api.get(`/analisis/metricas/${indicador}`);
    return response.data;
  },

  // Obtener datos específicos por año
  getDatosPorAño: async (año: number) => {
    const response = await api.get(`/datos/${año}`);
    return response.data;
  }
};

// ==================== SERVICIOS PARA ANÁLISIS ====================
export const analisisServices = {
  // Obtener matriz completa de correlaciones
  getCorrelaciones: async () => {
    const response = await api.get('/analisis/analisis/correlaciones');
    return response.data;
  },

  // Obtener análisis comparativo por década
  getAnalisisComparativo: async () => {
    const response = await api.get('/analisis/analisis/comparativa');
    return response.data;
  },

  // Obtener análisis de tendencias por indicador
  getAnalisisTendencias: async (indicador: string) => {
    const response = await api.get(`/analisis/analisis/tendencias?indicador=${indicador}`);
    return response.data;
  },

  // Obtener lista completa de indicadores
  getIndicadores: async () => {
    const response = await api.get('/indicadores/lista');
    return response.data;
  },

  // Obtener métricas descriptivas de un indicador
  getMetricasIndicador: async (indicador: string) => {
    const response = await api.get(`/analisis/metricas/${indicador}`);
    return response.data;
  },

  // Enviar datos para predicciones (si decides implementarlas después)
  postPrediccion: async (indicador: string, modelo: string = 'arima', horizonte: number = 5) => {
    const response = await api.post('/predicciones/forecast', {
      indicador,
      modelo,
      horizonte
    });
    return response.data;
  }
};

// ==================== SERVICIOS PARA DATOS ====================
export const datosServices = {
  // Obtener datos históricos paginados
  getDatosHistoricos: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/datos/historicos?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener datos por año específico
  getDatosPorAño: async (año: number) => {
    const response = await api.get(`/datos/${año}`);
    return response.data;
  },

  // Agregar nuevos registros
  postNuevoDato: async (datos: any) => {
    const response = await api.post('/datos/', datos);
    return response.data;
  }
};

// ==================== SERVICIOS PARA PREDICCIONES ====================
export const prediccionesServices = {
  // Obtener indicadores predecibles
  getIndicadoresPredecibles: async () => {
    const response = await api.get('/predicciones/indicadores');
    return response.data;
  },

  // Obtener modelos disponibles
  getModelosDisponibles: async () => {
    const response = await api.get('/predicciones/modelos');
    return response.data;
  },

  // Obtener estado del sistema ML
  getSystemStatus: async () => {
    const response = await api.get('/predicciones/status');
    return response.data;
  },

  // Generar predicciones
  postPrediccion: async (indicador: string, modelo: string = 'arima', horizonte: number = 5) => {
    const response = await api.post('/predicciones/forecast', {
      indicador,
      modelo,
      horizonte
    });
    return response.data;
  },

  // Generar predicción por lote
  postBatchPrediccion: async (indicadores: string[], modelo: string = 'arima') => {
    const response = await api.post('/predicciones/batch-forecast', {
      indicadores,
      modelo
    });
    return response.data;
  },

  // Entrenar modelos
  postEntrenarModelos: async () => {
    const response = await api.post('/predicciones/entrenar');
    return response.data;
  },

  // Obtener métricas de evaluación
  getMetricasModelo: async (indicador: string) => {
    const response = await api.get(`/predicciones/metricas/${indicador}`);
    return response.data;
  }
};

// ==================== FUNCIONES DE UTILIDAD ====================
// Formatear valores para mostrar en UI
export const formatUtils = {
  formatCurrency: (value: number): string => {
    if (value === 0) return '$0';
    if (value < 1e6) return `$${value.toFixed(2)}`;
    if (value < 1e9) return `$${(value / 1e6).toFixed(2)}M`;
    if (value < 1e12) return `$${(value / 1e9).toFixed(2)}B`;
    return `$${(value / 1e12).toFixed(2)}T`;
  },

  formatPercentage: (value: number): string => {
    return `${value.toFixed(2)}%`;
  },

  formatPopulation: (value: number): string => {
    if (value < 1e6) return `${(value / 1e3).toFixed(1)}K`;
    if (value < 1e9) return `${(value / 1e6).toFixed(1)}M`;
    return `${(value / 1e9).toFixed(2)}B`;
  },

  formatDecimal: (value: number): string => {
    return value.toFixed(2);
  },

  getIconForIndicator: (field: string): string => {
    const iconMap: Record<string, string> = {
      'gdp_usd': '💰',
      'gdp_ppp': '🌐',
      'gdp_per_capita_usd': '👤',
      'gdp_growth_pct': '📈',
      'imports_pct_gdp': '📥',
      'exports_pct_gdp': '📤',
      'total_reserves_usd': '🏦',
      'unemployment_pct': '📉',
      'inflation_pct': '📊',
      'remittances_pct_gdp': '💸',
      'population': '👥',
      'pop_growth_pct': '📊',
      'life_expectancy_years': '❤️',
      'poverty_pct': '🏚️'
    };
    return iconMap[field] || '📈';
  },

  getColorForIndicator: (field: string): string => {
    const colorMap: Record<string, string> = {
      'gdp_usd': 'sky',
      'gdp_ppp': 'blue',
      'gdp_per_capita_usd': 'indigo',
      'gdp_growth_pct': 'emerald',
      'imports_pct_gdp': 'green',
      'exports_pct_gdp': 'orange',
      'total_reserves_usd': 'cyan',
      'unemployment_pct': 'red',
      'inflation_pct': 'violet',
      'remittances_pct_gdp': 'emerald',
      'population': 'amber',
      'pop_growth_pct': 'purple',
      'life_expectancy_years': 'rose',
      'poverty_pct': 'gray'
    };
    return colorMap[field] || 'gray';
  }
};

// Tipos de datos comunes
export interface Indicador {
  field: string;
  name: string;
  description: string;
  unit: string;
}

export interface Correlacion {
  indicador1: string;
  indicador2: string;
  correlacion: number;
  valor_p: number;
  muestras: number;
  significativo: boolean;
}

export interface Tendencia {
  indicador: string;
  periodo_analizado: {
    inicio: number;
    fin: number;
    total_años: number;
  };
  resumen_crecimiento: {
    valor_inicial: number;
    valor_final: number;
    crecimiento_total_porcentaje: number;
    crecimiento_promedio_anual: number;
    cagr_global: number;
  };
  analisis_tendencia: {
    tipo: string;
    r_cuadrado: number;
    confianza: string;
    descripcion: string;
  };
}

// Exportar la instancia de axios por si se necesita directamente
export default api;