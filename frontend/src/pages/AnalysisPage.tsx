import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeatmapCorrelaciones from '../components/Analysis/HeatmapCorrelaciones';
import AnalisisComparativo from '../components/Analysis/AnalisisComparativo';
import AnalisisTendencias from '../components/Analysis/AnalisisTendencias';

// ✅ Usar import.meta.env para Vite
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

      const response = await fetch(
        `${API_BASE_URL}/api/china/analisis/analisis/correlaciones`
      );
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

      const response = await fetch(
        `${API_BASE_URL}/api/china/analisis/analisis/comparativa`
      );
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
    switch (activeTab) {
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
    switch (activeTab) {
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
      periodo_analizado: '1991-2020'
    },
    rankings_comparativos: {
      global: {
        top_10_crecimiento_global: [
          { indicador: 'total_reserves_usd', cagr_global: 15.76 },
          { indicador: 'gdp_usd', cagr_global: 13.4 }
        ]
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 shadow-xl overflow-hidden">
        <div className="p-6 text-white">
          <h1 className="text-2xl font-bold">China Economic Analytics</h1>
          <p className="text-sky-100 mt-1">Análisis Estadístico Avanzado</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}

      {/* Links */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">📚 API Documentation</h3>

        <a
          href={`${API_BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border rounded-xl hover:shadow"
        >
          Swagger UI
        </a>

        <Link
          to="/dashboard"
          className="block p-4 border rounded-xl hover:shadow mt-4"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AnalysisPage;
