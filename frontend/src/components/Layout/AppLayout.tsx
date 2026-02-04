// src/components/Layout/AppLayout.tsx - VERSIÓN RESPONSIVE COMPLETA
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si estamos en móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  const navItems = [
    { path: '/', label: 'Dashboard', color: 'sky', icon: '🏠' },
    { path: '/datos', label: 'Datos Históricos', color: 'blue', icon: '📊' },
    { path: '/analisis', label: 'Análisis', color: 'emerald', icon: '📈' },
    { path: '/predicciones', label: 'Predicciones ML', color: 'violet', icon: '🤖' },
  ];

  // Cerrar sidebar al hacer clic fuera (solo en móvil)
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Overlay para móvil (solo visible cuando sidebar está abierto) */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Sidebar - Responsive */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 shadow-sm md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isMobile ? 'w-64' : ''}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 md:p-6 border-b border-stone-100">
          <div className="flex items-center justify-between md:justify-start space-x-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg md:text-xl">中</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-sky-700 truncate">China Dash</h1>
                <p className="text-xs text-stone-500 hidden md:block">Panel de control</p>
                <p className="text-xs text-stone-500 md:hidden">Dashboard</p>
              </div>
            </div>
            
            {/* Botón para cerrar sidebar en móvil */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="p-3 md:p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const colorClass = `bg-${item.color}-50 text-${item.color}-700 border-l-4 border-${item.color}-500`;
            const inactiveClass = 'text-stone-600 hover:bg-stone-50 hover:text-stone-800';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 md:px-4 py-3 rounded-lg transition-all ${isActive ? colorClass : inactiveClass}`}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <span className="text-lg md:text-xl mr-3 flex-shrink-0">{item.icon}</span>
                <span className="font-medium truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer del Sidebar */}
        <div className="absolute bottom-0 w-full p-3 md:p-4 border-t border-stone-100 bg-white">
          <div className="text-xs text-stone-500 space-y-1">
            <p className="truncate">© 2025 China Economic Dashboard</p>
            <p className="flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 flex-shrink-0"></span>
              <span className="truncate">Datos del Banco Mundial</span>
            </p>
          </div>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {/* Header sutil con botón de menú para móvil */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Botón hamburguesa para móvil */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg"
                aria-label="Abrir menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h2 className="text-base md:text-lg font-semibold text-stone-800">
                  {location.pathname === '/' && 'Dashboard Principal'}
                  {location.pathname === '/datos' && 'Datos Históricos'}
                  {location.pathname === '/analisis' && 'Análisis Avanzado'}
                  {location.pathname === '/predicciones' && 'Predicciones ML'}
                </h2>
                <p className="text-xs md:text-sm text-stone-600 hidden sm:block">
                  Sistema de análisis económico de China
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Indicador de fecha - Responsive */}
              <div className="text-xs px-2 md:px-3 py-1 bg-sky-100 text-sky-700 rounded-full whitespace-nowrap hidden sm:block">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              {/* Versión móvil más compacta */}
              <div className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded-full whitespace-nowrap sm:hidden">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
              
              {/* Indicador de ruta actual (solo móvil) */}
              {isMobile && (
                <div className="text-xs px-2 py-1 bg-stone-100 text-stone-700 rounded-full">
                  {navItems.find(item => item.path === location.pathname)?.icon || '📍'}
                </div>
              )}
            </div>
          </div>
          
          {/* Breadcrumb para móvil */}
          <div className="mt-2 md:hidden">
            <div className="flex items-center text-xs text-stone-500">
              <span className="truncate">China Dash</span>
              <svg className="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-stone-700 truncate">
                {location.pathname === '/' && 'Dashboard'}
                {location.pathname === '/datos' && 'Datos'}
                {location.pathname === '/analisis' && 'Análisis'}
                {location.pathname === '/predicciones' && 'Predicciones'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Contenido de la página */}
        <div className="p-3 md:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;