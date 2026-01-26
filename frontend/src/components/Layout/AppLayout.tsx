// src/components/Layout/AppLayout.tsx
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '🏠 Dashboard', color: 'sky' },
    { path: '/datos', label: '📊 Datos Históricos', color: 'blue' },
    { path: '/analisis', label: '📈 Análisis', color: 'emerald' },
    { path: '/predicciones', label: '🤖 Predicciones ML', color: 'violet' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">中</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-sky-700">China Dash</h1>
              <p className="text-xs text-stone-500">Panel de control</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? `bg-${item.color}-50 text-${item.color}-700 border-l-4 border-${item.color}-500` 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <span className="text-lg mr-3">{item.label.split(' ')[0]}</span>
                <span className="font-medium">{item.label.split(' ').slice(1).join(' ')}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-stone-100">
          <div className="text-xs text-stone-500 space-y-1">
            <p>© 2025 China Economic Dashboard</p>
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              Datos del Banco Mundial
            </p>
          </div>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Header sutil */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">
                {location.pathname === '/' && 'Dashboard Principal'}
                {location.pathname === '/datos' && 'Datos Históricos'}
                {location.pathname === '/analisis' && 'Análisis Avanzado'}
                {location.pathname === '/predicciones' && 'Predicciones ML'}
              </h2>
              <p className="text-sm text-stone-600">
                Sistema de análisis económico de China
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs px-3 py-1 bg-sky-100 text-sky-700 rounded-full">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenido de la página */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;  // Asegúrate de que tenga esto