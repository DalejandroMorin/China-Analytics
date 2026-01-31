import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeatmapCorrelaciones from '../components/Analysis/HeatmapCorrelaciones';
import AnalisisComparativo from '../components/Analysis/AnalisisComparativo';
import AnalisisTendencias from '../components/Analysis/AnalisisTendencias';

// ✅ CORRECTO: Usar import.meta.env para Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('correlaciones');
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [loadingIndicadores, setLoadingIndicadores] = useState(true);
  
  const [correlacionesData, setCorrelacionesData] = useState<any>(null);
  const [comparativaData, setComparativaData] = useState<any>(null);
  
  const [loading, setLoading] = useState({
    correlaciones: false,
    comparativa: false
  });
  
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'correlaciones', label: '🔗 Correlaciones', icon: '🔗' },
    { id: 'comparativa', label: '📊 Comparativa', icon: '📊' },
    { id: 'tendencias', label: '📈 Tendencias', icon: '📈' }
  ];

  const cargarIndicadores = async () => {
    try {
      setLoadingIndicadores(true);
      // ✅ CORRECTO: Usar API_BASE_URL dinámico
      const response = await fetch(`${API_BASE_URL}/api/china/indicadores/lista`);
      if (!response.ok) throw new Error('Error al cargar indicadores');
      
      const data = await response.json();
      const indicadoresFiltrados = data.filter((ind: any) => 
        !['year', 'country'].includes(ind.field)
      );
      setIndicadores(indicadoresFiltrados);
    } catch (err) {
      console.error('Error cargando indicadores:', err);
      setError('Error al cargar la lista de indicadores');
    } finally {
      setLoadingIndicadores(false);
    }
  };

  const cargarCorrelaciones = async () => {
    try {
      setLoading(prev => ({ ...prev, correlaciones: true }));
      setError(null);
      
      // ✅ CORRECTO: Usar API_BASE_URL dinámico
      const response = await fetch(`${API_BASE_URL}/api/china/analisis/analisis/correlaciones`);
      if (!response.ok) throw new Error('Error al cargar correlaciones');
      
      const data = await response.json();
      setCorrelacionesData(data);
    } catch (err) {
      console.error('Error cargando correlaciones:', err);
      setError('Error al cargar análisis de correlaciones');
      setCorrelacionesData(getMockCorrelacionesData());
    } finally {
      setLoading(prev => ({ ...prev, correlaciones: false }));
    }
  };

  const cargarComparativa = async () => {
    try {
      setLoading(prev => ({ ...prev, comparativa: true }));
      setError(null);
      
      // ✅ CORRECTO: Usar API_BASE_URL dinámico
      const response = await fetch(`${API_BASE_URL}/api/china/analisis/analisis/comparativa`);
      if (!response.ok) throw new Error('Error al cargar análisis comparativo');
      
      const data = await response.json();
      setComparativaData(data);
    } catch (err) {
      console.error('Error cargando comparativa:', err);
      setError('Error al cargar análisis comparativo');
      setComparativaData(getMockComparativaData());
    } finally {
      setLoading(prev => ({ ...prev, comparativa: false }));
    }
  };

  useEffect(() => {
    switch(activeTab) {
      case 'correlaciones':
        if (!correlacionesData) cargarCorrelaciones();
        break;
      case 'comparativa':
        if (!comparativaData) cargarComparativa();
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'correlaciones':
        return (
          <HeatmapCorrelaciones 
            data={correlacionesData}
            loading={loading.correlaciones}
            error={error}
            indicadores={indicadores}
          />
        );
      case 'comparativa':
        return (
          <AnalisisComparativo 
            data={comparativaData}
            loading={loading.comparativa}
            error={error}
            indicadores={indicadores}
          />
        );
      case 'tendencias':
        return (
          <AnalisisTendencias 
            indicadores={indicadores}
            loading={loadingIndicadores}
          />
        );
      default:
        return null;
    }
  };

  const getMockCorrelacionesData = () => ({
    resumen_analisis: {
      total_indicadores: 14,
      total_pares_analizados: 91,
      total_correlaciones_significativas: 60
    },
    top_correlaciones: {
      positivas: [
        { indicador1: 'gdp_usd', indicador2: 'gdp_per_capita_usd', correlacion: 0.9998 },
        { indicador1: 'gdp_ppp', indicador2: 'gdp_per_capita_usd', correlacion: 0.994 }
      ],
      negativas: [
        { indicador1: 'population', indicador2: 'poverty_pct', correlacion: -0.983 },
        { indicador1: 'life_expectancy_years', indicador2: 'poverty_pct', correlacion: -0.9795 }
      ]
    }
  });

  const getMockComparativaData = () => ({
    resumen_ejecutivo: {
      total_indicadores_analizados: 14,
      periodo_analizado: "1991-2020"
    },
    rankings_comparativos: {
      global: {
        top_10_crecimiento_global: [
          { indicador: 'total_reserves_usd', cagr_global: 15.76 },
          { indicador: 'gdp_usd', cagr_global: 13.40 }
        ]
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 shadow-xl overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">China Economic Analytics</h1>
              <p className="text-sky-100 mt-1">Análisis Estadístico Avanzado</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm">14 indicadores • 1991-2020</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-3">
            📈 Análisis Estadístico Avanzado
          </h2>
          <p className="text-stone-600">
            Explora correlaciones, tendencias y análisis comparativo de {indicadores.length} indicadores económicos y sociales.
            Datos históricos desde 1991 hasta 2020.
          </p>
        </div>
      </div>
      
      {/* Tabs de Navegación */}
      <div className="bg-white rounded-2xl shadow-lg p-2 border border-stone-200">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Contenido Principal */}
      {renderTabContent()}
      
      {/* Panel de Métricas Rápidas */}
      {correlacionesData?.resumen_analisis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Indicadores</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">
              {correlacionesData.resumen_analisis.total_indicadores}
            </p>
            <p className="text-xs text-blue-600 mt-1">Analizados</p>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-xl border border-sky-200">
            <p className="text-sm text-sky-700 font-medium">Correlaciones</p>
            <p className="text-2xl font-bold text-sky-800 mt-1">
              {correlacionesData.resumen_analisis.total_pares_analizados}
            </p>
            <p className="text-xs text-sky-600 mt-1">Pares analizados</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700 font-medium">Significativas</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">
              {correlacionesData.resumen_analisis.total_correlaciones_significativas}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {(correlacionesData.resumen_analisis.total_correlaciones_significativas / 
                correlacionesData.resumen_analisis.total_pares_analizados * 100).toFixed(1)}% del total
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-700 font-medium">Correlación Media</p>
            <p className="text-2xl font-bold text-purple-800 mt-1">
              {correlacionesData.resumen_analisis.correlacion_promedio?.toFixed(3) || '0.573'}
            </p>
            <p className="text-xs text-purple-600 mt-1">Promedio de todas las relaciones</p>
          </div>
        </div>
      )}
      
      {/* Enlaces Rápidos */}
      <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-6 border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">📚 API Documentation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href={`${API_BASE_URL}/docs`}  {/* ✅ CORREGIDO: Usar API_BASE_URL dinámico */}
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-sky-100 to-sky-200 p-3 rounded-lg mr-4">
                <span className="text-sky-600">📖</span>
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 group-hover:text-sky-600">Swagger UI</h4>
                <p className="text-sm text-stone-600 mt-1">Documentación interactiva de la API</p>
              </div>
            </div>
          </a>
          <Link 
            to="/dashboard" 
            className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-sky-100 to-sky-200 p-3 rounded-lg mr-4">
                <span className="text-sky-600">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 group-hover:text-sky-600">Volver al Dashboard</h4>
                <p className="text-sm text-stone-600 mt-1">Vista general de indicadores clave</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;