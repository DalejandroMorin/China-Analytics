import HistoricalDataTable from '../components/HistoricalDataTable/HistoricalDataTable';

const HistoricalDataPage = () => {
  return (
    <div className="space-y-6">
      {/* Header con tu diseño original pero adaptado */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 shadow-xl overflow-hidden">
        <div className="p-6 text-white">
          <h1 className="text-2xl font-bold">China Dash</h1>
          <p className="text-sky-100 mt-1">Datos Históricos</p>
        </div>
        
        <div className="bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-3">
            📊 Datos Históricos de China (1990-2020)
          </h2>
          <p className="text-stone-600">
            Explora los datos económicos y sociales de China desde 1990 hasta 2020.
            Selecciona las columnas que quieres ver y ordena los datos según tus necesidades.
          </p>
        </div>
      </div>
      
      {/* Tabla de datos */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <HistoricalDataTable />
      </div>
      
      {/* Footer ligero */}
      <div className="text-center text-sm text-stone-500 pt-4 border-t border-stone-100">
        <p>© 2025 • China Economic Dashboard • Datos del Banco Mundial</p>
      </div>
    </div>
  );
};

export default HistoricalDataPage;