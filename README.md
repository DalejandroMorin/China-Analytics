# China Analytics Dashboard 🇨🇳📊

**China Analytics** is a full-stack data analytics and prediction dashboard focused on economic and social indicators of China.  
It combines historical data, statistical analysis, and machine learning models to generate insights and future forecasts.

This project is designed as a **Business Intelligence (BI) system**, built to demonstrate skills in backend APIs, data analysis, machine learning, and modern frontend development.

---

## 🔍 Overview

The platform allows users to:

- Explore historical economic and social data of China
- Analyze trends, correlations, and statistical metrics
- Generate future forecasts using multiple ML models
- Visualize insights through interactive dashboards and charts

It is suitable for **data analysis**, **forecasting**, **research**, **education**, and **decision support** use cases.

---

## 📸 Screenshots

<img width="800" alt="Dashboard" src="https://github.com/user-attachments/assets/d8b2172e-3526-441d-a19a-b2ca30a36649" />


<img width="800" alt="Comparative analysis" src="https://github.com/user-attachments/assets/5b4662d9-b1dc-49cb-bc4d-68876f0ee861" />

<img width="400" alt="Predictions" src="https://github.com/user-attachments/assets/eb0c24ac-68cb-46bb-80e0-d62da6dca360" />

## 🧱 Tech Stack

### Backend
- **FastAPI** (Python)
- **SQLAlchemy**
- **SQL Database** (SQLite / PostgreSQL)
- **scikit-learn**
- **statsmodels**
- **Prophet**
- **NumPy / SciPy**

### Frontend
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Recharts**
- **Vite**

---

## 🏗️ Architecture (High-Level)

- A **RESTful API** built with FastAPI provides endpoints for:
  - Historical data access
  - Statistical analysis
  - Machine learning predictions
- A **Single Page Application (SPA)** built with React consumes the API and renders:
  - KPI dashboards
  - Interactive charts and tables
  - Forecast visualizations
- A **Machine Learning layer** supports multiple models with automatic model selection and batch predictions

---

## 📊 Data & Analytics

### Historical Data
- Covers multiple decades (1990–2020+)
- Includes indicators such as:
  - GDP
  - Economic growth
  - Imports & exports
  - Inflation
  - Unemployment
  - Population
  - Life expectancy
  - Poverty indicators
  - International reserves

### Statistical Analysis
- Descriptive statistics (mean, median, std, min/max)
- Correlation analysis between indicators
- Trend analysis
- Linear regressions with R² scores
- Percentage growth and variations

---

## 🤖 Machine Learning & Predictions

- Forecast future values for selected indicators (e.g. 2025–2030)
- Multiple models supported:
  - ARIMA
  - Random Forest
  - Linear Regression
  - Prophet
- Automatic best-model selection
- Custom model training
- Batch prediction support

---

## 🖥️ Frontend Features

- **Main Dashboard**
  - Key performance indicators (KPIs)
  - Trend charts
  - System status overview
  - Correlation insights

- **Historical Data View**
  - Interactive data table
  - Search, filter, and sort
  - Column selection
  - Data export

- **Analysis Section**
  - Comparative analysis between indicators
  - Trend visualizations
  - Correlation heatmaps
  - Interactive modals for exploration

- **Predictions Section**
  - Forecast generator
  - Model selection
  - Custom prediction horizon
  - Projection charts

---

## 🚀 Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
