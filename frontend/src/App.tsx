// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import AppLayout from './components/Layout/AppLayout';

// Importamos las páginas
import HistoricalDataPage from './pages/HistoricalDataPage';
import AnalysisPage from './pages/AnalysisPage';
import PredictionsPage from './pages/PredictionsPage';  // ¡Nuevo!

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/datos" element={<HistoricalDataPage />} />
          <Route path="/analisis" element={<AnalysisPage />} />
          <Route path="/predicciones" element={<PredictionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;