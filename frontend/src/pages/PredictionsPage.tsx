// src/pages/PredictionsPage.tsx
import React from 'react';
import PredictionDashboard from '../components/PredictionDashbord/PredictionDashboard';

const PredictionsPage: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      <PredictionDashboard />
    </div>
  );
};

export default PredictionsPage;