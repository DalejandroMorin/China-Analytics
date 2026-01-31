import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { HistoricalData, HistoricalDataTableProps, SortConfig, Indicator } from './HistoricalDataTable.types';
import { columnCategories, formatValue, getVisibleColumns, isSortableColumn } from './HistoricalDataTable.utils';

// ✅ CORRECTO: Definir API_BASE_URL para Vite (igual que en PredictionDashboard)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Definir la interfaz del payload para el tooltip
interface CustomTooltipPayload {
  dataKey: string;
  value: number;
  color: string;
  payload: any;
}

// Custom Tooltip para manejar tipos correctamente
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#FEFAF6',
        padding: '1rem',
        border: '1px solid #E7D7C9',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(8px)'
      }}>
        <p style={{
          fontWeight: 600,
          color: '#1E3A8A',
          fontSize: '1.125rem',
          marginBottom: '0.5rem'
        }}>Año: {label}</p>
        {payload.map((entry: CustomTooltipPayload, index: number) => {
          const getIndicatorInfo = (_field: string): Indicator | undefined => {
            return undefined;
          };
          
          const indicator = getIndicatorInfo(entry.dataKey || '');
          const value = entry.value || 0;
          const formattedValue = typeof value === 'number' ? value.toLocaleString() : String(value);
          
          return (
            <div key={`tooltip-${index}`} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s'
            }}>
              <div 
                style={{
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '9999px',
                  marginRight: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  border: '2px solid white',
                  background: entry.color
                }}
              />
              <span style={{
                fontSize: '0.875rem',
                color: '#1E3A8A'
              }}>
                <span style={{ fontWeight: 500 }}>{indicator?.name || entry.dataKey}: </span>
                <span style={{ fontWeight: 700, marginLeft: '0.25rem' }}>
                  {formattedValue} {indicator?.unit ? indicator.unit : ''}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({
  initialPageSize = 10,
}) => {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingIndicators, setLoadingIndicators] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getVisibleColumns());
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['gdp_usd', 'population']);

  // Paleta de colores
  const colors = {
    azul: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A'
    },
    crema: {
      50: '#FEFAF6',
      100: '#FDF6F0',
      200: '#F9EDE4',
      300: '#F5E4D8'
    },
    cafe: {
      100: '#F5E9DD',
      200: '#E7D7C9',
      300: '#D4B499',
      400: '#B08968',
      500: '#8B5A2B',
      600: '#7A4C25',
      700: '#69401F',
      800: '#573419',
      900: '#462813'
    }
  };

  // Colores para las barras (gradientes de celeste a azul)
  const barGradients = [
    { id: 'gradient0', start: '#93C5FD', end: '#2563EB' }, // Celeste claro a Azul
    { id: 'gradient1', start: '#60A5FA', end: '#1D4ED8' }, // Celeste a Azul oscuro
    { id: 'gradient2', start: '#3B82F6', end: '#1E40AF' }, // Azul medio a Azul intenso
    { id: 'gradient3', start: '#BFDBFE', end: '#1E3A8A' }, // Azul muy claro a Azul marino
    { id: 'gradient4', start: '#DBEAFE', end: '#1E3A8A' }, // Azul pastel a Azul oscuro
    { id: 'gradient5', start: '#EFF6FF', end: '#2563EB' }, // Azul muy claro a Azul eléctrico
    { id: 'gradient6', start: '#BAE6FD', end: '#0284C7' }, // Celeste cielo a Azul cian
    { id: 'gradient7', start: '#7DD3FC', end: '#0C4A6E' }, // Celeste hielo a Azul noche
  ];

  // Fetch indicators
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoadingIndicators(true);
        // ✅ CORRECTO: Usar API_BASE_URL en lugar de URL hardcodeada
        const response = await fetch(`${API_BASE_URL}/api/china/indicadores/lista`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result: Indicator[] = await response.json();
        setIndicators(result);
      } catch (err: unknown) {
        console.error('Error al cargar indicadores:', err);
      } finally {
        setLoadingIndicators(false);
      }
    };
    
    fetchIndicators();
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ✅ CORRECTO: Usar API_BASE_URL en lugar de URL hardcodeada
        const response = await fetch(
          `${API_BASE_URL}/api/china/datos/historicos?skip=${currentPage * itemsPerPage}&limit=${itemsPerPage}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result: HistoricalData[] = await response.json();
        setData(result);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido al cargar los datos');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, itemsPerPage]);


  // Función para manejar el ordenamiento
  const handleSort = (key: keyof HistoricalData) => {
    if (!isSortableColumn(key)) return;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortConfig.direction === 'desc') {
        newDirection = null;
      }
    }
    
    if (newDirection === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ key, direction: newDirection });
    }
  };

  // Datos ordenados
  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) return data;
    
    const { key, direction } = sortConfig;
    
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return direction === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortConfig]);

  // Preparar datos para gráficas
  const chartData = useMemo(() => {
    if (viewMode !== 'chart') return [];
    
    return data.map(item => {
      const chartItem: any = { year: item.year };
      
      selectedIndicators.forEach(indicator => {
        const value = item[indicator as keyof HistoricalData];
        chartItem[indicator] = typeof value === 'number' ? value : 0;
      });
      
      return chartItem;
    });
  }, [data, selectedIndicators, viewMode]);

  // Obtener información del indicador
  const getIndicatorInfo = (field: string) => {
    return indicators.find(ind => ind.field === field);
  };

  // Toggle de indicador seleccionado
  const toggleIndicator = (indicatorField: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicatorField)
        ? prev.filter(ind => ind !== indicatorField)
        : [...prev, indicatorField]
    );
  };

  // Toggle de columnas
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Función para renderizar el ícono de ordenamiento
  const renderSortIcon = (columnKey: string) => {
    if (!isSortableColumn(columnKey)) return null;
    
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? (
        <svg style={{ width: '1rem', height: '1rem', marginLeft: '0.25rem', color: colors.azul[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg style={{ width: '1rem', height: '1rem', marginLeft: '0.25rem', color: colors.azul[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    
    return (
      <svg style={{ width: '1rem', height: '1rem', marginLeft: '0.25rem', color: colors.cafe[300] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  };

  // Función para obtener estilo de encabezado según estado de ordenamiento
  const getSortHeaderStyle = (columnKey: string) => {
    const baseStyle = {
      padding: '1rem 1.5rem',
      textAlign: 'left' as const,
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      transition: 'all 0.2s'
    };
    
    const sortableStyle = isSortableColumn(columnKey) 
      ? { cursor: 'pointer' }
      : {};
    
    if (sortConfig?.key === columnKey) {
      return {
        ...baseStyle,
        ...sortableStyle,
        color: colors.azul[700],
        backgroundColor: `${colors.azul[50]}CC`,
        borderBottom: `2px solid ${colors.azul[500]}`
      };
    }
    
    return {
      ...baseStyle,
      ...sortableStyle,
      color: colors.cafe[700],
      backgroundColor: colors.crema[50],
      borderBottom: `1px solid ${colors.cafe[100]}`
    };
  };

  // Renderizar gráfica
  const renderChart = () => {
    if (loading || loadingIndicators) return null;
    
    if (selectedIndicators.length === 0) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '24rem'
        }}>
          <div style={{ color: colors.cafe[300], marginBottom: '1.5rem' }}>
            <svg style={{ width: '5rem', height: '5rem', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p style={{ color: colors.cafe[600], fontSize: '1.125rem', fontWeight: 500 }}>Selecciona al menos un indicador para mostrar en la gráfica</p>
          <p style={{ color: colors.cafe[400], fontSize: '0.875rem', marginTop: '0.5rem' }}>Usa el panel inferior para seleccionar indicadores</p>
        </div>
      );
    }

    return (
      <div style={{ height: '500px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {/* Definición de gradientes */}
            <defs>
              {barGradients.map((gradient, _index) => (
                <linearGradient 
                  key={gradient.id}
                  id={gradient.id} 
                  x1="0" 
                  y1="0" 
                  x2="0" 
                  y2="1"
                >
                  <stop offset="0%" stopColor={gradient.start} stopOpacity={1} />
                  <stop offset="100%" stopColor={gradient.end} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#E7D7C9" opacity={0.6} />
            <XAxis 
              dataKey="year" 
              stroke="#8B5A2B"
              tick={{ fill: '#8B5A2B', fontSize: 14 }}
              axisLine={{ stroke: '#D4B499' }}
            />
            <YAxis 
              stroke="#8B5A2B"
              tick={{ fill: '#8B5A2B', fontSize: 13 }}
              axisLine={{ stroke: '#D4B499' }}
              tickFormatter={(value: number) => {
                if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toLocaleString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value: string) => {
                const indicator = getIndicatorInfo(value);
                return indicator?.name || value;
              }}
              wrapperStyle={{ fontSize: '14px', color: colors.azul[900], paddingTop: '20px' }}
            />
            {selectedIndicators.map((indicator, index) => (
              <Bar
                key={indicator}
                dataKey={indicator}
                name={indicator}
                fill={`url(#${barGradients[index % barGradients.length].id})`}
                radius={[6, 6, 0, 0]}
                strokeWidth={0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '16rem',
        background: `linear-gradient(135deg, ${colors.crema[50]}, ${colors.azul[50]})`,
        borderRadius: '1rem'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '9999px',
            height: '4rem',
            width: '4rem',
            borderTop: `2px solid ${colors.azul[500]}`,
            borderBottom: `2px solid ${colors.azul[500]}`
          }}></div>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              height: '2rem',
              width: '2rem',
              borderRadius: '9999px',
              backgroundColor: colors.azul[100],
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          </div>
        </div>
        <p style={{ color: colors.azul[700], fontWeight: 500, marginTop: '1.5rem' }}>Cargando datos históricos...</p>
        <p style={{ color: colors.cafe[500], fontSize: '0.875rem', marginTop: '0.5rem' }}>Esto puede tomar unos segundos</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: `linear-gradient(to right, #FEE2E2, ${colors.crema[50]})`,
        borderLeft: `4px solid #F87171`,
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, backgroundColor: '#FECACA', padding: '0.75rem', borderRadius: '9999px' }}>
            <svg style={{ height: '1.5rem', width: '1.5rem', color: '#EF4444' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div style={{ marginLeft: '1rem' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#DC2626' }}>Error al cargar los datos</p>
            <p style={{ color: '#DC2626', marginTop: '0.5rem' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: `linear-gradient(to right, ${colors.azul[500]}, ${colors.azul[600]})`,
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, ${colors.azul[600]}, ${colors.azul[700]})`;
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, ${colors.azul[500]}, ${colors.azul[600]})`;
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.crema[50]}, white)`,
      borderRadius: '1.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      border: `1px solid ${colors.crema[200]}`
    }}>
      {/* Header con botones de vista */}
      <div style={{
        padding: '2rem',
        borderBottom: `1px solid ${colors.crema[300]}`,
        background: `linear-gradient(to right, ${colors.azul[50]}30, ${colors.crema[50]}50)`
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: colors.azul[900],
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                marginRight: '0.75rem',
                padding: '0.5rem',
                background: `linear-gradient(135deg, ${colors.azul[500]}, ${colors.azul[600]})`,
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              {viewMode === 'table' ? 'Datos Históricos de China' : 'Gráficos de Datos Históricos'}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: colors.cafe[700],
                backgroundColor: colors.crema[100],
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px'
              }}>
                <span style={{ fontWeight: 700, color: colors.azul[700] }}>{sortedData.length}</span> registros • 1990 - 2020
              </p>
              {viewMode === 'table' && sortConfig && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.375rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: `linear-gradient(to right, ${colors.azul[100]}, ${colors.azul[50]})`,
                  color: colors.azul[800],
                  border: `1px solid ${colors.azul[200]}`,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}>
                  <svg style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                  Ordenado por: {sortConfig.key.replace('_', ' ')} ({sortConfig.direction === 'asc' ? 'ascendente' : 'descendente'})
                </span>
              )}
              {viewMode === 'chart' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.375rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: `linear-gradient(to right, ${colors.cafe[100]}, ${colors.crema[100]})`,
                  color: colors.cafe[800],
                  border: `1px solid ${colors.cafe[200]}`,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}>
                  <svg style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {selectedIndicators.length} indicadores seleccionados
                </span>
              )}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            {/* Selector de vista */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                padding: '0.25rem',
                backgroundColor: colors.crema[100],
                borderRadius: '0.75rem',
                border: `1px solid ${colors.crema[300]}`
              }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    position: 'relative',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'table' ? 'white' : 'transparent',
                    color: viewMode === 'table' ? colors.azul[700] : colors.cafe[600],
                    boxShadow: viewMode === 'table' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (viewMode !== 'table') {
                      e.currentTarget.style.color = colors.cafe[800];
                      e.currentTarget.style.backgroundColor = colors.crema[200];
                    }
                  }}
                  onMouseOut={(e) => {
                    if (viewMode !== 'table') {
                      e.currentTarget.style.color = colors.cafe[600];
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Tabla
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  style={{
                    position: 'relative',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'chart' ? 'white' : 'transparent',
                    color: viewMode === 'chart' ? colors.azul[700] : colors.cafe[600],
                    boxShadow: viewMode === 'chart' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (viewMode !== 'chart') {
                      e.currentTarget.style.color = colors.cafe[800];
                      e.currentTarget.style.backgroundColor = colors.crema[200];
                    }
                  }}
                  onMouseOut={(e) => {
                    if (viewMode !== 'chart') {
                      e.currentTarget.style.color = colors.cafe[600];
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Gráficas
                  </div>
                </button>
              </div>
            </div>
            
            {/* Selector de filas por página - Solo en vista tabla */}
            {viewMode === 'table' && (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <svg style={{ width: '1rem', height: '1rem', color: colors.cafe[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <select 
                  style={{
                    paddingLeft: '2.5rem',
                    appearance: 'none',
                    backgroundColor: 'white',
                    border: `1px solid ${colors.crema[300]}`,
                    color: colors.cafe[700],
                    padding: '0.625rem 1rem',
                    paddingRight: '2rem',
                    borderRadius: '0.75rem',
                    lineHeight: '1.25',
                    outline: 'none',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  value={itemsPerPage}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.azul[500];
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.azul[500]}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.crema[300];
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <option value="5">5 filas</option>
                  <option value="10">10 filas</option>
                  <option value="20">20 filas</option>
                  <option value="50">50 filas</option>
                </select>
              </div>
            )}
            
            {/* Botón de columnas/indicadores según vista */}
            {viewMode === 'table' ? (
              <button 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1rem',
                  border: `1px solid ${colors.azul[200]}`,
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.azul[700],
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  const details = document.querySelector('details');
                  if (details) {
                    details.open = !details.open;
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.azul[50];
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }}
              >
                <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: colors.azul[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columnas ({visibleColumns.length})
              </button>
            ) : (
              <button 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1rem',
                  border: `1px solid ${colors.cafe[200]}`,
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.cafe[700],
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  const details = document.querySelector('details');
                  if (details) {
                    details.open = !details.open;
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.crema[100];
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }}
              >
                <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: colors.cafe[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Indicadores ({selectedIndicators.length})
              </button>
            )}
            
            {/* Botón para limpiar ordenamiento - Solo en vista tabla */}
            {viewMode === 'table' && sortConfig && (
              <button
                onClick={() => setSortConfig(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1rem',
                  border: `1px solid ${colors.azul[200]}`,
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.azul[700],
                  background: `linear-gradient(to right, ${colors.azul[50]}, #E0F2FE)`,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${colors.azul[100]}, #BAE6FD)`;
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${colors.azul[50]}, #E0F2FE)`;
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }}
              >
                <svg style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar orden
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido según vista */}
      {viewMode === 'table' ? (
        <>
          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  {columnCategories
                    .filter(col => visibleColumns.includes(col.key))
                    .map(column => (
                      <th 
                        key={column.key}
                        style={getSortHeaderStyle(column.key)}
                        onClick={() => handleSort(column.key as keyof HistoricalData)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            {column.category === 'económicas' && (
                              <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: colors.azul[400],
                                marginRight: '0.5rem'
                              }}></div>
                            )}
                            {column.category === 'sociales' && (
                              <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: colors.cafe[400],
                                marginRight: '0.5rem'
                              }}></div>
                            )}
                            {column.category === 'metadata' && (
                              <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: '#F59E0B',
                                marginRight: '0.5rem'
                              }}></div>
                            )}
                            {column.label}
                          </span>
                          {renderSortIcon(column.key)}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${colors.crema[200]}` }}>
                {sortedData.map((row, index) => (
                  <tr 
                    key={row.id} 
                    style={{
                      transition: 'all 0.2s',
                      backgroundColor: index % 2 === 0 ? 'white' : `${colors.crema[50]}80`
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.azul[50]}30`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : `${colors.crema[50]}80`;
                    }}
                  >
                    {columnCategories
                      .filter(col => visibleColumns.includes(col.key))
                      .map(column => {
                        const value = row[column.key as keyof HistoricalData];
                        const isYearColumn = column.key === 'year';
                        const isEconomicColumn = column.category === 'económicas';
                        const isSocialColumn = column.category === 'sociales';
                        
                        return (
                          <td 
                            key={`${row.id}-${column.key}`} 
                            style={{
                              padding: '1rem 1.5rem',
                              whiteSpace: 'nowrap',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: isYearColumn 
                                ? colors.azul[900]
                                : isEconomicColumn
                                ? colors.azul[800]
                                : isSocialColumn
                                ? colors.cafe[800]
                                : colors.cafe[700]
                            }}
                          >
                            {isYearColumn ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: `linear-gradient(to right, ${colors.azul[100]}, ${colors.azul[50]})`,
                                color: colors.azul[800],
                                border: `1px solid ${colors.azul[200]}`,
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                              }}>
                                {formatValue(value as number | string | null, column.format)}
                              </span>
                            ) : (
                              formatValue(value as number | string | null, column.format)
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación - Solo en vista tabla */}
          <div style={{
            padding: '1.25rem 2rem',
            borderTop: `1px solid ${colors.crema[300]}`,
            background: `linear-gradient(to right, ${colors.azul[50]}20, ${colors.crema[50]}30)`
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: colors.cafe[700]
              }}>
                <p style={{ fontWeight: 500 }}>
                  Mostrando <span style={{ fontWeight: 700, color: colors.azul[900] }}>{(currentPage * itemsPerPage) + 1}</span> a{' '}
                  <span style={{ fontWeight: 700, color: colors.azul[900] }}>{Math.min((currentPage + 1) * itemsPerPage, 31)}</span> de{' '}
                  <span style={{ fontWeight: 700, color: colors.azul[900] }}>31</span> registros
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: colors.cafe[500],
                  marginTop: '0.5rem',
                  backgroundColor: colors.crema[100],
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  display: 'inline-block'
                }}>
                  Página <span style={{ fontWeight: 700 }}>{currentPage + 1}</span> de{' '}
                  <span style={{ fontWeight: 700 }}>{Math.ceil(31 / itemsPerPage)}</span>
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    border: 'none',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    backgroundColor: currentPage === 0 ? colors.crema[100] : 'white',
                    color: currentPage === 0 ? colors.cafe[400] : colors.cafe[700],
                    borderColor: currentPage === 0 ? colors.crema[300] : colors.crema[300],
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== 0) {
                      e.currentTarget.style.backgroundColor = colors.crema[100];
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== 0) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }
                  }}
                >
                  <svg style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {[...Array(Math.ceil(31 / itemsPerPage))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: currentPage === i ? `linear-gradient(135deg, ${colors.azul[500]}, ${colors.azul[600]})` : 'white',
                        color: currentPage === i ? 'white' : colors.cafe[700],
                        borderColor: currentPage === i ? colors.azul[500] : colors.crema[300],
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                      onMouseOver={(e) => {
                        if (currentPage !== i) {
                          e.currentTarget.style.backgroundColor = colors.crema[100];
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (currentPage !== i) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                        }
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={(currentPage + 1) * itemsPerPage >= 31}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    border: 'none',
                    cursor: (currentPage + 1) * itemsPerPage >= 31 ? 'not-allowed' : 'pointer',
                    backgroundColor: (currentPage + 1) * itemsPerPage >= 31 ? colors.crema[100] : 'white',
                    color: (currentPage + 1) * itemsPerPage >= 31 ? colors.cafe[400] : colors.cafe[700],
                    borderColor: (currentPage + 1) * itemsPerPage >= 31 ? colors.crema[300] : colors.crema[300],
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                  onMouseOver={(e) => {
                    if ((currentPage + 1) * itemsPerPage < 31) {
                      e.currentTarget.style.backgroundColor = colors.crema[100];
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if ((currentPage + 1) * itemsPerPage < 31) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                    }
                  }}
                >
                  Siguiente
                  <svg style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Vista de gráficas */
        <div style={{ padding: '2rem' }}>
          {loadingIndicators ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '16rem'
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  animation: 'spin 1s linear infinite',
                  borderRadius: '9999px',
                  height: '3rem',
                  width: '3rem',
                  borderTop: `2px solid ${colors.cafe[400]}`,
                  borderBottom: `2px solid ${colors.cafe[400]}`
                }}></div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    height: '1.5rem',
                    width: '1.5rem',
                    borderRadius: '9999px',
                    backgroundColor: colors.cafe[100],
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}></div>
                </div>
              </div>
              <p style={{ marginLeft: '1rem', color: colors.cafe[700], fontWeight: 500 }}>Cargando indicadores...</p>
            </div>
          ) : (
            <>
              {/* Gráfico */}
              <div style={{
                marginBottom: '2rem',
                background: `linear-gradient(135deg, white, ${colors.crema[50]})`,
                borderRadius: '1rem',
                border: `1px solid ${colors.crema[300]}`,
                padding: '1.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}>
                {renderChart()}
              </div>
              
              {/* Leyenda de indicadores seleccionados */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: colors.azul[900],
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: colors.cafe[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Indicadores Seleccionados
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  {selectedIndicators.map((indicator, index) => {
                    const info = getIndicatorInfo(indicator);
                    const gradient = barGradients[index % barGradients.length];
                    
                    return (
                      <div 
                        key={indicator}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.625rem 1rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          border: `1px solid ${gradient.end}`,
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                          transition: 'all 0.3s',
                          background: `linear-gradient(to right, ${gradient.start}15, ${gradient.end}10)`,
                          color: gradient.end
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                        }}
                      >
                        <span 
                          style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '9999px',
                            marginRight: '0.75rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`
                          }}
                        ></span>
                        <span style={{ fontWeight: 600 }}>{info?.name || indicator}</span>
                        <button
                          onClick={() => toggleIndicator(indicator)}
                          style={{
                            marginLeft: '1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.375rem',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Panel de selección (columnas o indicadores según vista) */}
      <div style={{
        padding: '1.5rem 2rem',
        borderTop: `1px solid ${colors.crema[300]}`,
        background: `linear-gradient(to right, ${colors.azul[50]}20, ${colors.crema[50]}30)`
      }}>
        <details className="group">
          <summary style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: colors.azul[800],
            outline: 'none',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: 'white',
            border: `1px solid ${colors.crema[200]}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.crema[100];
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }}>
            <svg style={{
              width: '1.25rem',
              height: '1.25rem',
              marginRight: '0.75rem',
              transition: 'transform 0.2s',
              color: colors.azul[600]
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700 }}>
                {viewMode === 'table' ? 'Seleccionar Columnas' : 'Seleccionar Indicadores'}
              </span>
              <span style={{ color: colors.cafe[600], marginLeft: '0.75rem', fontWeight: 500 }}>
                {viewMode === 'table' 
                  ? `(${visibleColumns.length} de ${columnCategories.length} seleccionadas)`
                  : `(${selectedIndicators.length} de ${indicators.filter(i => i.field !== 'year' && i.field !== 'country').length} seleccionados)`
                }
              </span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: colors.cafe[500],
              backgroundColor: colors.crema[100],
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px'
            }}>Haz clic para expandir</span>
          </summary>
          
          <div style={{ marginTop: '1.5rem' }}>
            {viewMode === 'table' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1.5rem'
              }}>
                {Object.entries({
                  '📈 Económicas': columnCategories.filter(c => c.category === 'económicas'),
                  '👥 Sociales': columnCategories.filter(c => c.category === 'sociales'),
                  '📋 Metadata': columnCategories.filter(c => c.category === 'metadata'),
                }).map(([category, columns]) => (
                  <div key={category} style={{
                    background: `linear-gradient(to bottom, white, ${colors.crema[50]})`,
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    border: `1px solid ${colors.crema[300]}`,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4 style={{
                      fontWeight: 700,
                      color: colors.azul[900],
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '1.125rem'
                    }}>
                      <span style={{
                        marginRight: '0.75rem',
                        padding: '0.5rem',
                        background: `linear-gradient(to right, ${colors.azul[100]}, ${colors.azul[50]})`,
                        borderRadius: '0.75rem'
                      }}>
                        {category.split(' ')[0]}
                      </span>
                      <span>{category.split(' ')[1]}</span>
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      maxHeight: '15rem',
                      overflowY: 'auto',
                      paddingRight: '0.75rem'
                    }}>
                      {columns.map(col => {
                        const isSortable = isSortableColumn(col.key);
                        return (
                          <label 
                            key={col.key} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem',
                              borderRadius: '0.75rem',
                              transition: 'all 0.2s',
                              border: `1px solid ${colors.crema[200]}`,
                              cursor: isSortable ? 'pointer' : 'default',
                              opacity: isSortable ? 1 : 0.7
                            }}
                            onMouseOver={(e) => {
                              if (isSortable) {
                                e.currentTarget.style.backgroundColor = colors.crema[100];
                              }
                            }}
                            onMouseOut={(e) => {
                              if (isSortable) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.key)}
                              onChange={() => toggleColumn(col.key)}
                              disabled={!isSortable}
                              style={{
                                height: '1.25rem',
                                width: '1.25rem',
                                borderRadius: '0.5rem',
                                cursor: isSortable ? 'pointer' : 'not-allowed',
                                color: isSortable ? colors.azul[600] : colors.cafe[400],
                                borderColor: isSortable ? colors.crema[300] : colors.crema[200]
                              }}
                            />
                            <div style={{ marginLeft: '1rem', flex: 1 }}>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: isSortable ? 500 : 400,
                                color: isSortable ? colors.azul[800] : colors.cafe[600]
                              }}>
                                {col.label}
                              </span>
                              {!isSortable && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: colors.cafe[400],
                                  marginTop: '0.25rem',
                                  backgroundColor: colors.crema[100],
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '9999px',
                                  display: 'inline-block'
                                }}>No ordenable</span>
                              )}
                            </div>
                            {sortConfig?.key === col.key && (
                              <span style={{
                                marginLeft: '0.5rem',
                                padding: '0.375rem',
                                backgroundColor: colors.azul[100],
                                borderRadius: '0.5rem'
                              }}>
                                {sortConfig.direction === 'asc' ? (
                                  <svg style={{ width: '1rem', height: '1rem', color: colors.azul[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg style={{ width: '1rem', height: '1rem', color: colors.azul[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: `linear-gradient(to bottom, white, ${colors.crema[50]})`,
                padding: '1.5rem',
                borderRadius: '1rem',
                border: `1px solid ${colors.crema[300]}`,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '24rem',
                  overflowY: 'auto',
                  paddingRight: '0.75rem'
                }}>
                  {indicators
                    .filter(indicator => indicator.field !== 'year' && indicator.field !== 'country')
                    .map(indicator => (
                      <label 
                        key={indicator.field}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          border: `1px solid ${colors.crema[200]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = colors.crema[100];
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIndicators.includes(indicator.field)}
                          onChange={() => toggleIndicator(indicator.field)}
                          style={{
                            height: '1.25rem',
                            width: '1.25rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            color: colors.azul[600],
                            borderColor: colors.crema[300]
                          }}
                        />
                        <div style={{ marginLeft: '1rem', flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: colors.azul[900]
                            }}>
                              {indicator.name}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: colors.cafe[700],
                              background: `linear-gradient(to right, ${colors.crema[200]}, #FDE68A)`,
                              padding: '0.375rem 0.75rem',
                              borderRadius: '9999px'
                            }}>
                              {indicator.unit}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: colors.cafe[600],
                            marginTop: '0.5rem'
                          }}>
                            {indicator.description}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default HistoricalDataTable;