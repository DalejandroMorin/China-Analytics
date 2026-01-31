from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, SessionLocal
from app.models.china_models import Base
from sqlalchemy import text
from datetime import datetime, timedelta
import os
import fastapi
import sys 
import time
from fastapi import HTTPException
from app.routes.analisis import router as analisis_router
from app.routes.predictions import router as predictions_router

start_time = time.time()


# Importamos el router de China
from app.routes.china import router as china_router





# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# 🔧 CONFIGURACIÓN MEJORADA DE FASTAPI
app = FastAPI(
    title="🇨🇳 China Data Analytics API",
    description="""
    # API para Análisis de Datos Económicos y Sociales de China
    
    ## 📊 ¿Qué hace esta API?
    
    Proporciona acceso programático a datos históricos, análisis estadísticos avanzados
    y predicciones con Machine Learning sobre indicadores económicos y sociales de China 
    desde 1990 hasta 2030.
    
    ## 🚀 Características principales
    
    - **Datos históricos completos** de China (1990-2020+)
    - **Análisis estadísticos avanzados**: Correlaciones, tendencias, métricas
    - **Predicciones ML**: Forecasting 2025-2030 con múltiples modelos
    - **Indicadores económicos**: PIB, comercio, reservas, inflación
    - **Indicadores sociales**: Población, esperanza de vida, pobreza
    - **API RESTful** con documentación interactiva
    
    ## 📈 Endpoints disponibles
    
    ### Datos Básicos
    - `GET /api/china/datos/historicos` - Datos históricos paginados
    - `GET /api/china/indicadores/lista` - Lista de indicadores disponibles
    - `GET /api/china/datos/{año}` - Datos específicos por año
    - `POST /api/china/datos/` - Agregar nuevos registros
    
    ### Análisis Avanzado
    - `GET /api/china/analisis/metricas/{indicador}` - Métricas descriptivas
    - `GET /api/china/analisis/tendencias` - Análisis de tendencias temporales
    - `GET /api/china/analisis/comparativa` - Análisis comparativo avanzado
    - `GET /api/china/analisis/correlaciones` - Matriz de correlaciones
    
    ### 🤖 Predicciones ML (NUEVO)
    - `POST /api/china/predicciones/forecast` - Predicciones 2025-2030
    - `POST /api/china/predicciones/batch-forecast` - Predicción por lote
    - `GET /api/china/predicciones/indicadores` - Indicadores predecibles
    - `GET /api/china/predicciones/modelos` - Modelos ML disponibles
    - `GET /api/china/predicciones/status` - Estado del sistema ML
    - `POST /api/china/predicciones/entrenar` - Entrenar modelos
    - `GET /api/china/predicciones/metricas/{indicador}` - Evaluación de modelos
    
    ## 🛠️ Tecnologías
    
    - **Backend**: FastAPI, SQLAlchemy, pandas, scikit-learn, statsmodels
    - **Machine Learning**: ARIMA, Random Forest, Linear Regression, Prophet
    - **Base de datos**: SQLite
    - **Frontend**: React (próximamente)
    
    *Desarrollado para análisis económico y educativo.*
    """,
    version="2.0.0",
    contact={
        "name": "Equipo de Desarrollo",
        "url": "https://github.com/tu-usuario/china-analytics",
        "email": "datos.china@example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=[
        {
            "name": "China Data",
            "description": "Endpoints para datos históricos y análisis de China"
        },
        {
            "name": "API Info", 
            "description": "Información general y estado de la API"
        }
    ]
)

# 🔧 CORS - ESENCIAL para React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://china-analytics2.vercel.app",
        "https://china-analytics.onrender.com"
    ],  # Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📍 INCLUIR ROUTERS CON TAGS MEJORADOS
app.include_router(
    china_router,
    prefix="/api/china",
    tags=["China Data"]  # Ahora usa el tag documentado
)

app.include_router(
    analisis_router,
    prefix="/api/china/analisis",
    tags=["China Analysis"]
)

app.include_router(
    predictions_router,
    prefix="/api/china",
    tags=["China Predictions"]
)

# 🏠 ENDPOINTS DE INFORMACIÓN (nuevo tag)
@app.get("/", tags=["API Info"])
def root():
    """
    # Endpoint Raíz - Información General de la API
    
    Punto de entrada principal que proporciona información básica sobre la API,
    incluyendo versión, estado y enlaces útiles para desarrolladores.
    
    ## Respuesta
    - **api_name**: Nombre de la API
    - **version**: Versión actual de la API
    - **status**: Estado operacional del servicio
    - **description**: Breve descripción del propósito
    - **endpoints**: Enlaces a los principales endpoints
    - **metadata**: Información adicional del sistema
    
    ## Ejemplo de uso
    ```bash
    curl http://localhost:8000/
    ```
    """
    
    # Información básica de la API
    api_info = {
        "api_name": "🇨🇳 China Data Analytics API",
        "version": "1.0.0", 
        "status": "operational",
        "description": "API RESTful para análisis de datos económicos y sociales de China",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    # Endpoints principales disponibles
    endpoints_info = {
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc", 
            "openapi_spec": "/openapi.json"
        },
        "health_check": "/health",
        "api_statistics": "/api/stats",
        "china_data": {
            "historical_data": "/api/china/datos/historicos",
            "indicators_list": "/api/china/indicadores/lista", 
            "data_by_year": "/api/china/datos/{year}",
            "create_record": "/api/china/datos/"
        },
        "china_analysis": {
            "descriptive_metrics": "/api/china/analisis/metricas/{indicador}",
            "temporal_trends": "/api/china/analisis/tendencias",
            "comparative_analysis": "/api/china/analisis/comparativa",
            "correlation_analysis": "/api/china/analisis/correlaciones"
        },
        # 🔥 NUEVA SECCIÓN PARA PREDICCIONES ML
        "china_predictions": {
            "single_forecast": "/api/china/predicciones/forecast",
            "batch_forecast": "/api/china/predicciones/batch-forecast",
            "available_indicators": "/api/china/predicciones/indicadores",
            "ml_models": "/api/china/predicciones/modelos",
            "system_status": "/api/china/predicciones/status",
            "model_training": "/api/china/predicciones/entrenar",
            "model_metrics": "/api/china/predicciones/metricas/{indicador}"
        }
    }
    
    # Metadatos del sistema - CORREGIDO
    system_info = {
        "environment": os.getenv("ENVIRONMENT", "development"),
        "python_version": sys.version.split()[0],  # ← Solo la versión principal
        "fastapi_version": fastapi.__version__,    # ← Usar el módulo, no la clase
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    # Respuesta consolidada
    return {
        **api_info,
        "endpoints": endpoints_info,
        "metadata": system_info,
        "quick_start": {
            "check_health": "GET /health",
            "view_docs": "GET /docs", 
            "get_data": "GET /api/china/datos/historicos?limit=10",
            "list_indicators": "GET /api/china/indicadores/lista"
        }
    }
@app.get("/health", tags=["API Info"])
def health_check():
    """
    # Health Check Avanzado del Sistema
    
    Verifica el estado completo de la API y todas sus dependencias.
    Proporciona métricas detalladas de salud del sistema.
    
    ## Componentes verificados
    - **API**: Estado general del servicio
    - **Database**: Conexión y disponibilidad de datos
    - **ML Predictions**: Servicio de Machine Learning
    - **System**: Tiempo de actividad y versión
    
    ## Respuesta
    - **status**: Estado general (healthy, degraded, unhealthy)
    - **timestamp**: Fecha y hora de la verificación
    - **uptime_seconds**: Tiempo de actividad en segundos
    - **version**: Versión de la aplicación
    - **components**: Estado detallado de cada componente
    - **database_stats**: Métricas de la base de datos
    - **ml_predictions_stats**: Métricas del servicio ML
    
    ## Códigos de estado
    - 200: Sistema saludable
    - 503: Sistema con problemas (si quisieras cambiar el código en caso de error)
    """
    
    # Estado general (asumimos saludable hasta probar lo contrario)
    overall_status = "healthy"
    components_status = {}
    database_stats = {}
    ml_predictions_stats = {}
    
    # 📊 VERIFICAR BASE DE DATOS
    try:
        from app.database.database import SessionLocal
        from app.models.china_models import ChinaHistoricalData
        from sqlalchemy import text, func
        
        db = SessionLocal()
        
        # 1. Verificar conexión básica
        db.execute(text("SELECT 1"))
        components_status["database_connection"] = "healthy"
        
        # 2. Obtener estadísticas de la base de datos
        total_records = db.query(func.count(ChinaHistoricalData.id)).scalar()
        year_range = db.query(
            func.min(ChinaHistoricalData.year),
            func.max(ChinaHistoricalData.year)
        ).first()
        
        database_stats = {
            "total_records": total_records,
            "year_range": {
                "min": year_range[0] if year_range[0] else None,
                "max": year_range[1] if year_range[1] else None
            },
            "tables": ["china_historical_data"],
            "last_checked": datetime.utcnow().isoformat() + "Z"
        }
        
        components_status["database_data"] = "healthy"
        db.close()
        
    except Exception as e:
        overall_status = "degraded"
        components_status["database_connection"] = f"unhealthy: {str(e)}"
        components_status["database_data"] = "unreachable"
        database_stats = {
            "error": "No se pudo conectar a la base de datos",
            "details": str(e)
        }
    
    # 🤖 VERIFICAR SERVICIO DE PREDICCIONES ML
    try:
        from app.services.prediction_service import prediction_service
        
        # Verificar que el servicio se inicializó correctamente
        if hasattr(prediction_service, 'available_indicators') and prediction_service.available_indicators:
            components_status["ml_predictions_service"] = "healthy"
            
            # Obtener métricas del servicio ML
            ml_predictions_stats = {
                "available_indicators": len(prediction_service.available_indicators),
                "trained_models": len(prediction_service.trained_models),
                "cache_size": len(prediction_service.prediction_cache),
                "service_initialized": True,
                "last_checked": datetime.utcnow().isoformat() + "Z"
            }
        else:
            components_status["ml_predictions_service"] = "unhealthy: servicio no inicializado correctamente"
            ml_predictions_stats = {
                "error": "Servicio de predicciones no inicializado",
                "available_indicators": 0,
                "trained_models": 0
            }
            overall_status = "degraded"
            
    except Exception as e:
        components_status["ml_predictions_service"] = f"unhealthy: {str(e)}"
        ml_predictions_stats = {
            "error": f"Error inicializando servicio ML: {str(e)}",
            "available_indicators": 0,
            "trained_models": 0
        }
        overall_status = "degraded"
    
    # 🕒 CALCULAR TIEMPO DE ACTIVIDAD
    current_time = time.time()
    uptime_seconds = int(current_time - start_time)
    
    # Convertir a formato legible
    uptime_formatted = str(timedelta(seconds=uptime_seconds))
    
    # 📦 INFORMACIÓN DEL SISTEMA
    system_info = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": uptime_seconds,
        "uptime_human": uptime_formatted,
        "version": "2.0.0",  # Actualizado por nuevo módulo ML
        "environment": os.getenv("ENVIRONMENT", "development")
    }
    
    # 🎯 DETERMINAR ESTADO GENERAL
    # Si cualquier componente crítico falla, el sistema está degraded
    if any("unhealthy" in str(status) for status in components_status.values()):
        overall_status = "degraded"
    
    # Si la base de datos no está disponible, el sistema está unhealthy
    if components_status.get("database_connection", "").startswith("unhealthy"):
        overall_status = "unhealthy"
    
    # 📋 CONSTRUIR RESPUESTA
    response_data = {
        "status": overall_status,
        **system_info,
        "components": components_status,
        "database_stats": database_stats,
        "ml_predictions_stats": ml_predictions_stats  # Nueva sección agregada
    }
    
    # 🚨 SI EL SISTEMA NO ESTÁ SALUDABLE, DEVOLVER CÓDIGO 503
    if overall_status == "unhealthy":
        raise HTTPException(
            status_code=503,
            detail=response_data
        )
    
    return response_data

@app.get("/api/stats", tags=["API Info"])
def get_api_statistics():
    """
    # Estadísticas Avanzadas de Datos y API
    
    Proporciona métricas detalladas sobre los datos almacenados, distribución temporal
    y análisis de completitud de los indicadores.
    
    ## Métricas incluidas
    - **Resumen general**: Conteos y rangos
    - **Distribución temporal**: Registros por década y año
    - **Completitud de datos**: Porcentaje de valores no nulos por indicador
    - **Análisis de indicadores**: Clasificación por categorías
    
    ## Respuesta
    - **data_summary**: Resumen general de los datos
    - **temporal_distribution**: Distribución por décadas y años
    - **data_completeness**: Completitud por indicador
    - **indicators_analysis**: Clasificación de indicadores
    - **system_info**: Información del sistema
    
    ## Ejemplo de uso
    ```bash
    GET /api/stats
    ```
    """
    
    try:
        from app.database.database import SessionLocal
        from app.models.china_models import ChinaHistoricalData
        from sqlalchemy import func, text
        from collections import defaultdict
        
        db = SessionLocal()
        
        # 📊 RESUMEN GENERAL
        total_records = db.query(func.count(ChinaHistoricalData.id)).scalar()
        year_range = db.query(
            func.min(ChinaHistoricalData.year),
            func.max(ChinaHistoricalData.year)
        ).first()
        
        # 📅 DISTRIBUCIÓN TEMPORAL
        # Por décadas
        decades = db.query(
            func.floor(ChinaHistoricalData.year / 10) * 10,
            func.count(ChinaHistoricalData.id)
        ).group_by(func.floor(ChinaHistoricalData.year / 10)).all()
        
        # Por año (para ver años faltantes)
        years_data = db.query(ChinaHistoricalData.year).order_by(ChinaHistoricalData.year).all()
        available_years = [year[0] for year in years_data]
        year_min, year_max = year_range[0], year_range[1]
        all_possible_years = list(range(year_min, year_max + 1))
        missing_years = [year for year in all_possible_years if year not in available_years]
        
        # 📈 COMPLETITUD DE DATOS
        # Lista de todos los indicadores numéricos
        numeric_indicators = [
            'gdp_usd', 'gdp_ppp', 'gdp_per_capita_usd', 'gdp_growth_pct',
            'imports_pct_gdp', 'exports_pct_gdp', 'total_reserves_usd',
            'unemployment_pct', 'inflation_pct', 'remittances_pct_gdp',
            'population', 'pop_growth_pct', 'life_expectancy_years', 'poverty_pct'
        ]
        
        completeness_data = {}
        for indicator in numeric_indicators:
            non_null_count = db.query(func.count(getattr(ChinaHistoricalData, indicator))).filter(
                getattr(ChinaHistoricalData, indicator).isnot(None)
            ).scalar()
            completeness_pct = round((non_null_count / total_records) * 100, 2) if total_records > 0 else 0
            completeness_data[indicator] = {
                'non_null_count': non_null_count,
                'completeness_percentage': completeness_pct,
                'status': 'excellent' if completeness_pct >= 90 else 
                         'good' if completeness_pct >= 75 else 
                         'fair' if completeness_pct >= 50 else 'poor'
            }
        
        # 🏷️ CLASIFICACIÓN DE INDICADORES
        indicator_categories = {
            'economic_primary': ['gdp_usd', 'gdp_ppp', 'gdp_per_capita_usd', 'gdp_growth_pct'],
            'trade_commerce': ['imports_pct_gdp', 'exports_pct_gdp', 'total_reserves_usd'],
            'employment_inflation': ['unemployment_pct', 'inflation_pct', 'remittances_pct_gdp'],
            'demographic': ['population', 'pop_growth_pct'],
            'social_development': ['life_expectancy_years', 'poverty_pct']
        }
        
        category_stats = {}
        for category, indicators in indicator_categories.items():
            category_completeness = sum(completeness_data[indicator]['completeness_percentage'] for indicator in indicators) / len(indicators)
            category_stats[category] = {
                'indicator_count': len(indicators),
                'average_completeness': round(category_completeness, 2),
                'indicators': indicators
            }
        
        # 📦 CONSTRUIR RESPUESTA
        response_data = {
            "data_summary": {
                "total_records": total_records,
                "year_range": {
                    "min": year_range[0],
                    "max": year_range[1],
                    "span_years": year_range[1] - year_range[0] + 1
                },
                "records_per_year": round(total_records / (year_range[1] - year_range[0] + 1), 2),
                "data_status": "complete" if len(missing_years) == 0 else "incomplete",
                "data_updated": datetime.utcnow().isoformat() + "Z"
            },
            "temporal_distribution": {
                "by_decade": [
                    {
                        "decade": f"{int(decade)}s",
                        "year_range": f"{int(decade)}-{int(decade)+9}",
                        "record_count": count,
                        "percentage": round((count / total_records) * 100, 2)
                    }
                    for decade, count in decades
                ],
                "missing_years": missing_years,
                "completeness_percentage": round(((len(all_possible_years) - len(missing_years)) / len(all_possible_years) * 100), 2)
            },
            "data_completeness": {
                "overall_score": round(sum(item['completeness_percentage'] for item in completeness_data.values()) / len(completeness_data), 2),
                "by_indicator": completeness_data,
                "summary": {
                    "excellent": sum(1 for item in completeness_data.values() if item['status'] == 'excellent'),
                    "good": sum(1 for item in completeness_data.values() if item['status'] == 'good'),
                    "fair": sum(1 for item in completeness_data.values() if item['status'] == 'fair'),
                    "poor": sum(1 for item in completeness_data.values() if item['status'] == 'poor')
                }
            },
            "indicators_analysis": {
                "total_indicators": len(numeric_indicators),
                "by_category": category_stats,
                "most_complete_indicators": sorted(
                    [(indicator, data['completeness_percentage']) 
                     for indicator, data in completeness_data.items()],
                    key=lambda x: x[1], 
                    reverse=True
                )[:3],
                "least_complete_indicators": sorted(
                    [(indicator, data['completeness_percentage']) 
                     for indicator, data in completeness_data.items()],
                    key=lambda x: x[1]
                )[:3]
            },
            "system_info": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "version": "1.0.0",
                "environment": os.getenv("ENVIRONMENT", "development")
            }
        }
        
        db.close()
        return response_data
        
    except Exception as e:
        # En caso de error, devolver información básica
        return {
            "error": "No se pudieron calcular las estadísticas completas",
            "details": str(e),
            "basic_stats": {
                "status": "degraded",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }