# Importaciones necesarias
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import numpy as np
from scipy import stats
from typing import List, Dict, Any
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

# Importamos nuestras dependencias
from app.database.database import get_db
from app.models.china_models import ChinaHistoricalData as ChinaModel

# Creamos el router para análisis
router = APIRouter(prefix="/analisis", tags=["China Analysis"])

# Lista de indicadores numéricos válidos para análisis
INDICADORES_VALIDOS = [
    'gdp_usd', 'gdp_ppp', 'gdp_per_capita_usd', 'gdp_growth_pct',
    'imports_pct_gdp', 'exports_pct_gdp', 'total_reserves_usd',
    'unemployment_pct', 'inflation_pct', 'remittances_pct_gdp',
    'population', 'pop_growth_pct', 'life_expectancy_years', 'poverty_pct'
]

# =============================================================================
# ENDPOINT EXISTENTE - MÉTRICAS DESCRIPTIVAS (Ya funcionaba)
# =============================================================================

@router.get("/metricas/{indicador}")
def obtener_metricas_descriptivas(
    indicador: str, 
    db: Session = Depends(get_db)
):
    """
    # Métricas Descriptivas para Indicador
    
    Calcula estadísticas descriptivas completas para un indicador específico de China.
    """
    # 1. VALIDAR QUE EL INDICADOR EXISTE
    if indicador not in INDICADORES_VALIDOS:
        raise HTTPException(
            status_code=404,
            detail=f"Indicador '{indicador}' no válido. Indicadores disponibles: {', '.join(INDICADORES_VALIDOS)}"
        )
    
    try:
        # 2. OBTENER DATOS DEL INDICADOR (excluyendo valores nulos)
        datos = db.query(getattr(ChinaModel, indicador)).filter(
            getattr(ChinaModel, indicador).isnot(None)
        ).filter(
            getattr(ChinaModel, indicador) > 0  # EXCLUIR CEROS
        ).all()
        
        # Convertir a lista plana de valores
        valores = [d[0] for d in datos]
        
        # Verificar que hay datos suficientes
        if len(valores) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No hay datos no nulos para el indicador '{indicador}'"
            )
        
        if len(valores) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Datos insuficientes para análisis. Se necesitan al menos 2 valores no nulos."
            )
        
        # Convertir a array de numpy para cálculos
        arr = np.array(valores)
        
        # 3. CÁLCULOS DE TENDENCIA CENTRAL
        media = float(np.mean(arr))
        mediana = float(np.median(arr))
        
        # Moda puede tener múltiples valores
        moda_result = stats.mode(arr)
        moda = moda_result.mode.tolist()
        
        # 4. CÁLCULOS DE DISPERSIÓN
        desviacion_estandar = float(np.std(arr, ddof=1))  # ddof=1 para muestra (no población)
        varianza = float(np.var(arr, ddof=1))
        minimo = float(np.min(arr))
        maximo = float(np.max(arr))
        
        # Rango intercuartílico (Q1 y Q3)
        q1 = float(np.percentile(arr, 25))
        q3 = float(np.percentile(arr, 75))
        
        # 5. CÁLCULOS DE DISTRIBUCIÓN
        asimetria = float(stats.skew(arr))
        curtosis = float(stats.kurtosis(arr))
        
        # Coeficiente de variación (manejar división por cero)
        coeficiente_variacion = desviacion_estandar / media if media != 0 else float('inf')
        
        # 6. ESTRUCTURAR RESPUESTA
        return {
            "indicador": indicador,
            "total_muestras": len(valores),
            "estadisticas": {
                "tendencia_central": {
                    "media": round(media, 2),
                    "mediana": round(mediana, 2),
                    "moda": [round(m, 2) for m in moda] if isinstance(moda, list) else round(moda, 2),
                    "interpretacion": _interpretar_tendencia_central(media, mediana, moda)
                },
                "dispersion": {
                    "desviacion_estandar": round(desviacion_estandar, 2),
                    "varianza": round(varianza, 2),
                    "rango": {
                        "minimo": round(minimo, 2),
                        "maximo": round(maximo, 2),
                        "amplitud": round(maximo - minimo, 2)
                    },
                    "rango_intercuartil": {
                        "q1": round(q1, 2),
                        "q3": round(q3, 2),
                        "iqr": round(q3 - q1, 2)
                    },
                    "interpretacion": _interpretar_dispersion(desviacion_estandar, coeficiente_variacion)
                },
                "distribucion": {
                    "asimetria": round(asimetria, 4),
                    "curtosis": round(curtosis, 4),
                    "coeficiente_variacion": round(coeficiente_variacion, 4) if coeficiente_variacion != float('inf') else "infinito",
                    "interpretacion": _interpretar_distribucion(asimetria, curtosis, coeficiente_variacion)
                }
            }
        }
        
    except Exception as e:
        # Manejo de errores en cálculos
        raise HTTPException(
            status_code=500,
            detail=f"Error en cálculo de métricas: {str(e)}"
        )

# =============================================================================
# NUEVO ENDPOINT - TENDENCIAS TEMPORALES (Corregido)
# =============================================================================

@router.get("/tendencias")
def analizar_tendencias_temporales(
    indicador: str = Query(..., description="Indicador a analizar (ej: 'gdp_usd', 'population')"),
    db: Session = Depends(get_db)
):
    """
    # Análisis de Tendencias Temporales
    
    Analiza patrones de crecimiento, tendencias y puntos de inflexión para un indicador específico
    a lo largo del período histórico completo (1991-2020).
    
    ## Cálculos Incluidos:
    - **CAGR**: Tasa de Crecimiento Anual Compuesta
    - **Clasificación de tendencia**: Exponencial, lineal, estancamiento
    - **Puntos de inflexión**: Años con cambios significativos
    - **Análisis por década**: Comparativa 1990s vs 2000s vs 2010s
    - **Máximos y mínimos**: Períodos de mayor y menor crecimiento
    
    ## Nota: Usa 1991 como año base (1990 excluido por datos inconsistentes)
    """
    
    # 1. VALIDAR QUE EL INDICADOR EXISTE
    if indicador not in INDICADORES_VALIDOS:
        raise HTTPException(
            status_code=404,
            detail=f"Indicador '{indicador}' no válido. Indicadores disponibles: {', '.join(INDICADORES_VALIDOS)}"
        )
    
    try:
        # 2. OBTENER DATOS TEMPORALES ORDENADOS - EXCLUYENDO 1990
        datos = db.query(
            ChinaModel.year, 
            getattr(ChinaModel, indicador)
        ).filter(
            getattr(ChinaModel, indicador).isnot(None)
        ).filter(
            ChinaModel.year >= 1991  # ← SOLO ESTA LÍNEA CAMBIADA
        ).order_by(ChinaModel.year).all()
        
        # Convertir a arrays separados
        años = [d[0] for d in datos]
        valores = [d[1] for d in datos]
        
        # Validar que hay datos suficientes
        if len(años) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"Datos insuficientes para análisis temporal. Se necesitan al menos 3 años de datos."
            )
        
        # 3. CÁLCULOS PRINCIPALES
        # CAGR Global (1991-2020)
        cagr_global = _calcular_cagr_seguro(valores[0], valores[-1], len(años) - 1)
        
        # Clasificar tipo de tendencia
        tipo_tendencia = _clasificar_tendencia_segura(años, valores)
        
        # Identificar puntos de inflexión
        puntos_inflexion = _identificar_puntos_inflexion_seguro(años, valores)
        
        # Análisis por décadas
        analisis_decadas = _analizar_por_decadas_seguro(años, valores)
        
        # Crecimiento total y anual promedio
        crecimiento_total = _calcular_crecimiento_total_seguro(valores[0], valores[-1])
        crecimiento_promedio_anual = _calcular_crecimiento_promedio_seguro(crecimiento_total, len(años) - 1)
        
        # Períodos destacados
        periodos_destacados = _calcular_periodos_destacados_seguro(años, valores)
        
        # 4. ESTRUCTURAR RESPUESTA
        return {
            "indicador": indicador,
            "periodo_analizado": {
                "inicio": años[0],
                "fin": años[-1],
                "total_años": len(años),
                "años_con_datos": años,
                "nota": "1990 excluido por datos inconsistentes"  # ← AGREGAR ESTA NOTA
            },
            "resumen_crecimiento": {
                "valor_inicial": round(valores[0], 2),
                "valor_final": round(valores[-1], 2),
                "crecimiento_total_porcentaje": round(crecimiento_total, 2),
                "crecimiento_promedio_anual": round(crecimiento_promedio_anual, 2),
                "cagr_global": round(cagr_global * 100, 2)  # En porcentaje
            },
            "analisis_tendencia": tipo_tendencia,
            "puntos_inflexion": puntos_inflexion,
            "analisis_por_decada": analisis_decadas,
            "periodos_destacados": periodos_destacados
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en análisis de tendencias: {str(e)}"
        )

# =============================================================================
# FUNCIONES AUXILIARES ORIGINALES (Para métricas descriptivas)
# =============================================================================

def _interpretar_tendencia_central(media: float, mediana: float, moda: Any) -> str:
    """Interpreta las medidas de tendencia central"""
    if abs(media - mediana) < 0.001:
        return "Distribución simétrica (media ≈ mediana)"
    elif media > mediana:
        return "Distribución sesgada a la derecha (media > mediana)"
    else:
        return "Distribución sesgada a la izquierda (media < mediana)"

def _interpretar_dispersion(desviacion: float, coef_variacion: float) -> str:
    """Interpreta las medidas de dispersión"""
    if coef_variacion == float('inf'):
        return "Media cero - alta dispersión relativa"
    elif coef_variacion < 0.1:
        return "Baja dispersión relativa"
    elif coef_variacion < 0.3:
        return "Dispersión relativa moderada"
    else:
        return "Alta dispersión relativa"

def _interpretar_distribucion(asimetria: float, curtosis: float, coef_variacion: float) -> str:
    """Interpreta la forma de la distribución"""
    # Interpretar asimetría
    if asimetria < -1:
        asym_text = "Sesgo negativo fuerte"
    elif asimetria < -0.5:
        asym_text = "Sesgo negativo moderado"
    elif asimetria < 0:
        asym_text = "Sesgo negativo leve"
    elif asimetria == 0:
        asym_text = "Simétrica"
    elif asimetria <= 0.5:
        asym_text = "Sesgo positivo leve"
    elif asimetria <= 1:
        asym_text = "Sesgo positivo moderado"
    else:
        asym_text = "Sesgo positivo fuerte"
    
    # Interpretar curtosis
    if curtosis < -1:
        kurt_text = "platicúrtica (menos picuda que la normal)"
    elif curtosis < 1:
        kurt_text = "mesocúrtica (similar a la normal)"
    else:
        kurt_text = "leptocúrtica (más picuda que la normal)"
    
    return f"{asym_text}, {kurt_text}"

# =============================================================================
# FUNCIONES AUXILIARES SEGURAS (Para tendencias temporales)
# =============================================================================

def _calcular_cagr_seguro(valor_inicial: float, valor_final: float, años: int) -> float:
    """Calcula la Tasa de Crecimiento Anual Compuesta de forma segura"""
    if valor_inicial == 0 or valor_final == 0 or años == 0:
        return 0.0
    try:
        return (valor_final / valor_inicial) ** (1 / años) - 1
    except:
        return 0.0

def _calcular_crecimiento_total_seguro(valor_inicial: float, valor_final: float) -> float:
    """Calcula el crecimiento total porcentual de forma segura"""
    if valor_inicial == 0:
        return 0.0
    return ((valor_final - valor_inicial) / valor_inicial) * 100

def _calcular_crecimiento_promedio_seguro(crecimiento_total: float, años: int) -> float:
    """Calcula el crecimiento promedio anual de forma segura"""
    if años == 0:
        return 0.0
    return crecimiento_total / años

def _clasificar_tendencia_segura(años: list, valores: list) -> dict:
    """Clasifica la tendencia de forma segura"""
    try:
        # Convertir a arrays numpy
        x = np.array(años).reshape(-1, 1)
        y = np.array(valores)
        
        # Modelo lineal
        model_lineal = LinearRegression()
        model_lineal.fit(x, y)
        y_pred_lineal = model_lineal.predict(x)
        r2_lineal = r2_score(y, y_pred_lineal)
        
        # Inicializar variables para el modelo exponencial
        r2_exp = -float('inf')
        tipo = "lineal"
        r_cuadrado = r2_lineal
        
        # Solo intentar modelo exponencial si todos los valores son positivos
        if np.all(y > 0):
            try:
                # Modelo exponencial (log-lineal)
                y_log = np.log(y)
                model_exp = LinearRegression()
                model_exp.fit(x, y_log)
                y_pred_exp = np.exp(model_exp.predict(x))
                r2_exp = r2_score(y, y_pred_exp)
            except:
                r2_exp = -float('inf')
        
        # Determinar mejor modelo
        if r2_exp > r2_lineal + 0.1:
            tipo = "exponencial"
            r_cuadrado = r2_exp
        else:
            tipo = "lineal"
            r_cuadrado = r2_lineal

        # Asignar confianza
        if r_cuadrado > 0.9:
            confianza = "alta"
        elif r_cuadrado > 0.7:
            confianza = "media"
        else:
            confianza = "baja"
        
        # Determinar dirección
        pendiente = model_lineal.coef_[0]
        if pendiente > 0:
            direccion = "crecimiento"
        elif pendiente < 0:
            direccion = "decrecimiento"
        else:
            direccion = "estancamiento"
        
        descripciones = {
            "exponencial_crecimiento": "Crecimiento exponencial sostenido",
            "exponencial_decrecimiento": "Decrecimiento exponencial acelerado",
            "lineal_crecimiento": "Crecimiento lineal constante",
            "lineal_decrecimiento": "Decrecimiento lineal constante",
            "estancamiento": "Tendencia plana sin crecimiento significativo"
        }
        
        clave_desc = f"{tipo}_{direccion}"
        descripcion = descripciones.get(clave_desc, f"Tendencia {tipo} con {direccion}")
        
        return {
            "tipo": f"{tipo}_{direccion}",
            "r_cuadrado": round(r_cuadrado, 4),
            "confianza": confianza,
            "descripcion": descripcion,
            "pendiente": float(pendiente)
        }
    except:
        return {
            "tipo": "indeterminado",
            "r_cuadrado": 0.0,
            "confianza": "baja",
            "descripcion": "No se pudo determinar la tendencia",
            "pendiente": 0.0
        }

def _identificar_puntos_inflexion_seguro(años: list, valores: list) -> list:
    """Identifica puntos de inflexión de forma segura"""
    try:
        if len(valores) < 5:
            return []
        
        # Calcular tasas de crecimiento anual
        tasas_crecimiento = []
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                tasa = (valores[i] - valores[i-1]) / valores[i-1]
                tasas_crecimiento.append((años[i], tasa))
        
        if len(tasas_crecimiento) < 3:
            return []
        
        tasas = [t[1] for t in tasas_crecimiento]
        media = np.mean(tasas)
        desviacion = np.std(tasas)
        
        if desviacion == 0:
            return []
        
        puntos = []
        for año, tasa in tasas_crecimiento:
            if abs(tasa - media) > 2 * desviacion:
                tipo = "aceleracion" if tasa > media else "desaceleracion"
                puntos.append({
                    "año": año,
                    "tipo": tipo,
                    "tasa_crecimiento": round(tasa * 100, 2),
                    "desviacion": round(abs(tasa - media) / desviacion, 2)
                })
        
        return puntos
    except:
        return []

def _analizar_por_decadas_seguro(años: list, valores: list) -> dict:
    """Analiza el crecimiento por décadas de forma segura"""
    try:
        decadas = {
            "1990s": (1991, 2000),
            "2000s": (2001, 2010), 
            "2010s": (2011, 2020)
        }
        
        resultado = {}
        
        for nombre, (inicio, fin) in decadas.items():
            # Filtrar datos de la década
            datos_decada = [(a, v) for a, v in zip(años, valores) if inicio <= a <= fin]
            
            if len(datos_decada) >= 2:
                años_decada = [d[0] for d in datos_decada]
                valores_decada = [d[1] for d in datos_decada]
                
                cagr = _calcular_cagr_seguro(valores_decada[0], valores_decada[-1], len(años_decada) - 1)
                crecimiento_total = _calcular_crecimiento_total_seguro(valores_decada[0], valores_decada[-1])
                
                resultado[nombre] = {
                    "años": f"{años_decada[0]}-{años_decada[-1]}",
                    "cagr": round(cagr * 100, 2) if cagr is not None else None,
                    "crecimiento_total_porcentaje": round(crecimiento_total, 2) if crecimiento_total is not None else None,
                    "valor_inicial": round(valores_decada[0], 2),
                    "valor_final": round(valores_decada[-1], 2),
                    "registros": len(datos_decada)
                }
            else:
                resultado[nombre] = {
                    "años": f"{inicio}-{fin}",
                    "cagr": None,
                    "crecimiento_total_porcentaje": None,
                    "valor_inicial": None,
                    "valor_final": None,
                    "registros": len(datos_decada),
                    "error": "Datos insuficientes"
                }
        
        return resultado
    except:
        return {}

def _calcular_periodos_destacados_seguro(años: list, valores: list) -> dict:
    """Calcula períodos destacados de forma segura"""
    try:
        max_crecimiento = _encontrar_maximo_crecimiento_seguro(años, valores)
        min_crecimiento = _encontrar_minimo_crecimiento_seguro(años, valores)
        mayor_aceleracion = _encontrar_mayor_aceleracion_seguro(años, valores)
        
        return {
            "maximo_crecimiento": max_crecimiento,
            "minimo_crecimiento": min_crecimiento,
            "mayor_aceleracion": mayor_aceleracion
        }
    except:
        return {
            "maximo_crecimiento": {"error": "No disponible"},
            "minimo_crecimiento": {"error": "No disponible"},
            "mayor_aceleracion": {"error": "No disponible"}
        }

def _encontrar_maximo_crecimiento_seguro(años: list, valores: list) -> dict:
    """Encuentra máximo crecimiento de forma segura"""
    try:
        max_crecimiento = 0
        año_max = años[0] if años else 0
        
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                crecimiento = (valores[i] - valores[i-1]) / valores[i-1]
                if crecimiento > max_crecimiento:
                    max_crecimiento = crecimiento
                    año_max = años[i]
        
        return {
            "año": año_max,
            "crecimiento_porcentaje": round(max_crecimiento * 100, 2),
            "periodo": f"{año_max-1}-{año_max}"
        }
    except:
        return {"error": "No disponible"}

def _encontrar_minimo_crecimiento_seguro(años: list, valores: list) -> dict:
    """Encuentra mínimo crecimiento de forma segura"""
    try:
        min_crecimiento = float('inf')
        año_min = años[0] if años else 0
        
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                crecimiento = (valores[i] - valores[i-1]) / valores[i-1]
                if crecimiento < min_crecimiento:
                    min_crecimiento = crecimiento
                    año_min = años[i]
        
        if min_crecimiento == float('inf'):
            min_crecimiento = 0
        
        return {
            "año": año_min,
            "crecimiento_porcentaje": round(min_crecimiento * 100, 2),
            "periodo": f"{año_min-1}-{año_min}"
        }
    except:
        return {"error": "No disponible"}

def _encontrar_mayor_aceleracion_seguro(años: list, valores: list) -> dict:
    """Encuentra mayor aceleración de forma segura"""
    try:
        if len(valores) < 3:
            return {"error": "Datos insuficientes"}
        
        # Calcular tasas de crecimiento
        tasas = []
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                tasa = (valores[i] - valores[i-1]) / valores[i-1]
                tasas.append((años[i], tasa))
        
        if len(tasas) < 2:
            return {"error": "No se pudieron calcular tasas"}
        
        # Encontrar mayor cambio
        max_aceleracion = 0
        año_aceleracion = tasas[0][0]
        
        for i in range(1, len(tasas)):
            aceleracion = abs(tasas[i][1] - tasas[i-1][1])
            if aceleracion > max_aceleracion:
                max_aceleracion = aceleracion
                año_aceleracion = tasas[i][0]
        
        return {
            "año": año_aceleracion,
            "cambio_aceleracion_porcentaje": round(max_aceleracion * 100, 2),
            "periodo": f"{año_aceleracion-1}-{año_aceleracion}"
        }
    except:
        return {"error": "No disponible"}
    
# =========================================================================================================================================================
# =========================================================================================================================================================
# =========================================================================================================================================================

@router.get("/comparativa")
def analisis_comparativo_avanzado(db: Session = Depends(get_db)):
    """
    # Análisis Comparativo Avanzado
    
    Proporciona un análisis comparativo completo entre indicadores y décadas,
    identificando transformaciones estructurales en la economía china.
    
    ## Análisis Incluidos:
    - **Ranking de crecimiento** por década e indicador
    - **Comparativa entre décadas** (1990s vs 2000s vs 2010s)
    - **Identificación de transformaciones estructurales**
    - **Análisis de volatilidad** y consistencia del crecimiento
    - **Clasificación de indicadores** por comportamiento
    """
    
    try:
        # 1. ANÁLISIS POR DÉCADA PARA CADA INDICADOR
        analisis_indicadores = {}
        
        for indicador in INDICADORES_VALIDOS:
            # Obtener datos del indicador
            datos = db.query(
                ChinaModel.year, 
                getattr(ChinaModel, indicador)
            ).filter(
                getattr(ChinaModel, indicador).isnot(None)
            ).filter(
                ChinaModel.year >= 1991
            ).order_by(ChinaModel.year).all()
            
            if len(datos) < 5:  # Mínimo de datos para análisis
                continue
                
            años = [d[0] for d in datos]
            valores = [d[1] for d in datos]
            
            # Calcular análisis por década
            analisis_decadas = _analizar_por_decadas_seguro(años, valores)
            analisis_indicadores[indicador] = analisis_decadas
        
        # 2. CONSTRUIR RANKINGS COMPARATIVOS
        rankings = _construir_rankings_comparativos(analisis_indicadores)
        
        # 3. IDENTIFICAR TRANSFORMACIONES ESTRUCTURALES
        transformaciones = _identificar_transformaciones_estructurales(analisis_indicadores)
        
        # 4. ANÁLISIS DE VOLATILIDAD Y CONSISTENCIA
        volatilidad = _analizar_volatilidad_consistencia(analisis_indicadores)
        
        # 5. CLASIFICACIÓN DE INDICADORES
        clasificacion = _clasificar_indicadores(analisis_indicadores)
        
        # 6. ESTRUCTURAR RESPUESTA FINAL
        return {
            "resumen_ejecutivo": {
                "total_indicadores_analizados": len(analisis_indicadores),
                "periodo_analizado": "1991-2020",
                "transformaciones_principales": transformaciones["resumen"],
                "hallazgos_clave": _generar_hallazgos_clave(rankings, transformaciones)
            },
            "rankings_comparativos": rankings,
            "analisis_por_decada": {
                "1990s": _analizar_decada_especifica(analisis_indicadores, "1990s"),
                "2000s": _analizar_decada_especifica(analisis_indicadores, "2000s"),
                "2010s": _analizar_decada_especifica(analisis_indicadores, "2010s")
            },
            "transformaciones_estructurales": transformaciones["detalladas"],
            "analisis_volatilidad": volatilidad,
            "clasificacion_indicadores": clasificacion,
            "metricas_globales": {
                "decada_mayor_crecimiento": _identificar_decada_mayor_crecimiento(analisis_indicadores),
                "indicador_mas_estable": _identificar_indicador_mas_estable(analisis_indicadores),
                "indicador_mas_volatil": _identificar_indicador_mas_volatil(analisis_indicadores),
                "cambio_estructural_mas_significativo": transformaciones["mas_significativa"]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en análisis comparativo: {str(e)}"
        )


# 🔧 FUNCIONES AUXILIARES PARA ANÁLISIS COMPARATIVO

def _construir_rankings_comparativos(analisis_indicadores: dict) -> dict:
    """Construye rankings comparativos por década"""
    rankings = {
        "por_decada": {},
        "global": {}
    }
    
    # Rankings por década
    for decada in ["1990s", "2000s", "2010s"]:
        indicadores_decada = []
        
        for indicador, datos in analisis_indicadores.items():
            if decada in datos and datos[decada].get("cagr") is not None:
                indicadores_decada.append({
                    "indicador": indicador,
                    "cagr": datos[decada]["cagr"],
                    "crecimiento_total": datos[decada]["crecimiento_total_porcentaje"],
                    "valor_inicial": datos[decada]["valor_inicial"],
                    "valor_final": datos[decada]["valor_final"]
                })
        
        # Ordenar por CAGR (descendente)
        indicadores_decada.sort(key=lambda x: x["cagr"] if x["cagr"] is not None else -float('inf'), reverse=True)
        
        rankings["por_decada"][decada] = {
            "top_5_crecimiento": indicadores_decada[:5],
            "bottom_5_crecimiento": indicadores_decada[-5:] if len(indicadores_decada) >= 5 else indicadores_decada,
            "total_indicadores": len(indicadores_decada),
            "cagr_promedio": np.mean([x["cagr"] for x in indicadores_decada if x["cagr"] is not None]) if indicadores_decada else 0
        }
    
    # Ranking global (crecimiento 1991-2020)
    indicadores_global = []
    for indicador, datos in analisis_indicadores.items():
        # Calcular CAGR global aproximado
        if "1990s" in datos and "2010s" in datos:
            valor_1991 = datos["1990s"]["valor_inicial"]
            valor_2020 = datos["2010s"]["valor_final"]
            if valor_1991 and valor_2020 and valor_1991 != 0:
                cagr_global = _calcular_cagr_seguro(valor_1991, valor_2020, 29)  # 1991-2020 = 29 años
                indicadores_global.append({
                    "indicador": indicador,
                    "cagr_global": cagr_global * 100,
                    "crecimiento_total_30_anios": ((valor_2020 - valor_1991) / valor_1991) * 100 if valor_1991 != 0 else 0
                })
    
    indicadores_global.sort(key=lambda x: x["cagr_global"], reverse=True)
    rankings["global"] = {
        "top_10_crecimiento_global": indicadores_global[:10],
        "bottom_5_crecimiento_global": indicadores_global[-5:] if len(indicadores_global) >= 5 else indicadores_global,
        "total_indicadores": len(indicadores_global)
    }
    
    return rankings

def _identificar_transformaciones_estructurales(analisis_indicadores: dict) -> dict:
    """Identifica transformaciones estructurales en la economía"""
    transformaciones = {
        "resumen": [],
        "detalladas": [],
        "mas_significativa": ""
    }
    
    # Analizar cambios en patrones de crecimiento entre décadas
    cambios_significativos = []
    
    for indicador, datos in analisis_indicadores.items():
        if all(decada in datos for decada in ["1990s", "2000s", "2010s"]):
            cagr_90s = datos["1990s"].get("cagr", 0)
            cagr_00s = datos["2000s"].get("cagr", 0)
            cagr_10s = datos["2010s"].get("cagr", 0)
            
            # Identificar cambios dramáticos
            if cagr_00s and cagr_90s and abs(cagr_00s - cagr_90s) > 5:  # Cambio > 5% puntos
                tipo = "aceleracion" if cagr_00s > cagr_90s else "desaceleracion"
                cambios_significativos.append({
                    "indicador": indicador,
                    "decada": "2000s",
                    "tipo": tipo,
                    "cambio_cagr": round(cagr_00s - cagr_90s, 2),
                    "interpretacion": _interpretar_cambio_estructural(indicador, tipo, "1990s", "2000s")
                })
            
            if cagr_10s and cagr_00s and abs(cagr_10s - cagr_00s) > 3:  # Cambio > 3% puntos
                tipo = "aceleracion" if cagr_10s > cagr_00s else "desaceleracion"
                cambios_significativos.append({
                    "indicador": indicador,
                    "decada": "2010s",
                    "tipo": tipo,
                    "cambio_cagr": round(cagr_10s - cagr_00s, 2),
                    "interpretacion": _interpretar_cambio_estructural(indicador, tipo, "2000s", "2010s")
                })
    
    # Agrupar transformaciones por tipo
    aceleraciones = [c for c in cambios_significativos if c["tipo"] == "aceleracion"]
    desaceleraciones = [c for c in cambios_significativos if c["tipo"] == "desaceleracion"]
    
    # Transformaciones más significativas
    if aceleraciones:
        mayor_aceleracion = max(aceleraciones, key=lambda x: abs(x["cambio_cagr"]))
        transformaciones["resumen"].append(f"Aceleración significativa en {mayor_aceleracion['indicador']} durante {mayor_aceleracion['decada']}")
    
    if desaceleraciones:
        mayor_desaceleracion = max(desaceleraciones, key=lambda x: abs(x["cambio_cagr"]))
        transformaciones["resumen"].append(f"Desaceleración significativa en {mayor_desaceleracion['indicador']} durante {mayor_desaceleracion['decada']}")
    
    transformaciones["detalladas"] = cambios_significativos
    
    # Identificar transformación más significativa
    if cambios_significativos:
        mas_significativa = max(cambios_significativos, key=lambda x: abs(x["cambio_cagr"]))
        transformaciones["mas_significativa"] = f"{mas_significativa['interpretacion']} (ΔCAGR: {mas_significativa['cambio_cagr']}%)"
    
    return transformaciones

def _interpretar_cambio_estructural(indicador: str, tipo: str, decada_anterior: str, decada_actual: str) -> str:
    """Interpreta cambios estructurales entre décadas"""
    mapeo_interpretaciones = {
        "gdp_usd": {
            "aceleracion": f"Expansión económica acelerada en {decada_actual}",
            "desaceleracion": f"Maduración y desaceleración económica en {decada_actual}"
        },
        "poverty_pct": {
            "aceleracion": f"Intensificación de la reducción de pobreza en {decada_actual}",
            "desaceleracion": f"Ritmo más lento en reducción de pobreza en {decada_actual}"
        },
        "exports_pct_gdp": {
            "aceleracion": f"Mayor orientación exportadora en {decada_actual}",
            "desaceleracion": f"Cambio hacia economía más doméstica en {decada_actual}"
        },
        "population": {
            "aceleracion": f"Crecimiento poblacional acelerado en {decada_actual}",
            "desaceleracion": f"Desaceleración del crecimiento poblacional en {decada_actual}"
        }
    }
    
    interpretacion_default = {
        "aceleracion": f"Crecimiento acelerado de {indicador} en {decada_actual}",
        "desaceleracion": f"Desaceleración en {indicador} durante {decada_actual}"
    }
    
    return mapeo_interpretaciones.get(indicador, interpretacion_default).get(tipo, "")

def _analizar_volatilidad_consistencia(analisis_indicadores: dict) -> dict:
    """Analiza volatilidad y consistencia del crecimiento"""
    volatilidad = {}
    
    for indicador, datos in analisis_indicadores.items():
        cagrs = []
        for decada in ["1990s", "2000s", "2010s"]:
            if decada in datos and datos[decada].get("cagr") is not None:
                cagrs.append(datos[decada]["cagr"])
        
        if len(cagrs) >= 2:
            volatilidad[indicador] = {
                "cagr_promedio": round(np.mean(cagrs), 2),
                "desviacion_estandar": round(np.std(cagrs), 2) if len(cagrs) > 1 else 0,
                "coeficiente_variacion": round(np.std(cagrs) / np.mean(cagrs), 4) if np.mean(cagrs) != 0 else float('inf'),
                "rango_cagr": round(max(cagrs) - min(cagrs), 2),
                "consistencia": "alta" if len(cagrs) >= 2 and np.std(cagrs) < 2 else "media" if np.std(cagrs) < 5 else "baja"
            }
    
    return volatilidad

def _clasificar_indicadores(analisis_indicadores: dict) -> dict:
    """Clasifica indicadores por comportamiento y categoría"""
    categorias = {
        "alto_crecimiento_constante": [],
        "crecimiento_moderado": [],
        "decrecimiento_significativo": [],
        "alta_volatilidad": [],
        "baja_volatilidad": []
    }
    
    for indicador, datos in analisis_indicadores.items():
        # Calcular métricas para clasificación
        cagrs = [datos[decada]["cagr"] for decada in ["1990s", "2000s", "2010s"] if decada in datos and datos[decada].get("cagr") is not None]
        
        if not cagrs:
            continue
            
        cagr_promedio = np.mean(cagrs)
        volatilidad = np.std(cagrs) if len(cagrs) > 1 else 0
        
        # Clasificar
        if cagr_promedio > 10:
            categorias["alto_crecimiento_constante"].append(indicador)
        elif cagr_promedio > 5:
            categorias["crecimiento_moderado"].append(indicador)
        elif cagr_promedio < -5:
            categorias["decrecimiento_significativo"].append(indicador)
            
        if volatilidad > 5:
            categorias["alta_volatilidad"].append(indicador)
        elif volatilidad < 2:
            categorias["baja_volatilidad"].append(indicador)
    
    return categorias

def _analizar_decada_especifica(analisis_indicadores: dict, decada: str) -> dict:
    """Analiza una década específica en detalle"""
    indicadores_decada = []
    
    for indicador, datos in analisis_indicadores.items():
        if decada in datos and datos[decada].get("cagr") is not None:
            indicadores_decada.append({
                "indicador": indicador,
                "cagr": datos[decada]["cagr"],
                "crecimiento_total": datos[decada]["crecimiento_total_porcentaje"],
                "categoria": _clasificar_indicador_decada(indicador, datos[decada]["cagr"])
            })
    
    # Estadísticas de la década
    cagrs = [x["cagr"] for x in indicadores_decada if x["cagr"] is not None]
    
    return {
        "total_indicadores": len(indicadores_decada),
        "cagr_promedio": round(np.mean(cagrs), 2) if cagrs else 0,
        "cagr_mediano": round(np.median(cagrs), 2) if cagrs else 0,
        "distribucion_crecimiento": {
            "alto_crecimiento": len([x for x in indicadores_decada if x["cagr"] and x["cagr"] > 10]),
            "crecimiento_moderado": len([x for x in indicadores_decada if x["cagr"] and 5 < x["cagr"] <= 10]),
            "crecimiento_bajo": len([x for x in indicadores_decada if x["cagr"] and 0 < x["cagr"] <= 5]),
            "decrecimiento": len([x for x in indicadores_decada if x["cagr"] and x["cagr"] <= 0])
        },
        "indicadores_destacados": {
            "mayor_crecimiento": max(indicadores_decada, key=lambda x: x["cagr"] or -float('inf')),
            "menor_crecimiento": min(indicadores_decada, key=lambda x: x["cagr"] or float('inf'))
        } if indicadores_decada else {}
    }

def _clasificar_indicador_decada(indicador: str, cagr: float) -> str:
    """Clasifica un indicador para una década específica"""
    if cagr > 15:
        return "crecimiento_explosivo"
    elif cagr > 8:
        return "crecimiento_alto"
    elif cagr > 3:
        return "crecimiento_moderado"
    elif cagr > 0:
        return "crecimiento_bajo"
    elif cagr > -5:
        return "decrecimiento_moderado"
    else:
        return "decrecimiento_severo"

def _identificar_decada_mayor_crecimiento(analisis_indicadores: dict) -> str:
    """Identifica la década con mayor crecimiento promedio"""
    promedios = {}
    
    for decada in ["1990s", "2000s", "2010s"]:
        cagrs = []
        for datos in analisis_indicadores.values():
            if decada in datos and datos[decada].get("cagr") is not None:
                cagrs.append(datos[decada]["cagr"])
        
        if cagrs:
            promedios[decada] = np.mean(cagrs)
    
    return max(promedios, key=promedios.get) if promedios else "No disponible"

def _identificar_indicador_mas_estable(analisis_indicadores: dict) -> str:
    """Identifica el indicador con menor volatilidad"""
    volatilidades = {}
    
    for indicador, datos in analisis_indicadores.items():
        cagrs = [datos[decada]["cagr"] for decada in ["1990s", "2000s", "2010s"] if decada in datos and datos[decada].get("cagr") is not None]
        if len(cagrs) > 1:
            volatilidades[indicador] = np.std(cagrs)
    
    return min(volatilidades, key=volatilidades.get) if volatilidades else "No disponible"

def _identificar_indicador_mas_volatil(analisis_indicadores: dict) -> str:
    """Identifica el indicador con mayor volatilidad"""
    volatilidades = {}
    
    for indicador, datos in analisis_indicadores.items():
        cagrs = [datos[decada]["cagr"] for decada in ["1990s", "2000s", "2010s"] if decada in datos and datos[decada].get("cagr") is not None]
        if len(cagrs) > 1:
            volatilidades[indicador] = np.std(cagrs)
    
    return max(volatilidades, key=volatilidades.get) if volatilidades else "No disponible"

def _generar_hallazgos_clave(rankings: dict, transformaciones: dict) -> list:
    """Genera hallazgos clave del análisis comparativo"""
    hallazgos = []
    
    # Hallazgos de rankings
    if rankings["global"]["top_10_crecimiento_global"]:
        top_global = rankings["global"]["top_10_crecimiento_global"][0]
        hallazgos.append(f"Indicador de mayor crecimiento global: {top_global['indicador']} con {top_global['cagr_global']:.1f}% CAGR")
    
    # Hallazgos de transformaciones
    if transformaciones["resumen"]:
        hallazgos.extend(transformaciones["resumen"])
    
    # Hallazgos por década
    for decada in ["1990s", "2000s", "2010s"]:
        if decada in rankings["por_decada"]:
            top_decada = rankings["por_decada"][decada]["top_5_crecimiento"][0] if rankings["por_decada"][decada]["top_5_crecimiento"] else None
            if top_decada:
                hallazgos.append(f"En {decada}, {top_decada['indicador']} lideró el crecimiento con {top_decada['cagr']}% CAGR")
    
    return hallazgos[:5]  # Limitar a 5 hallazgos principales


## ==========================================================================================================================================================
## ==========================================================================================================================================================
## ==========================================================================================================================================================

@router.get("/correlaciones")
def analisis_correlaciones(db: Session = Depends(get_db)):
    """
    # Análisis de Correlaciones
    
    Calcula la matriz de correlaciones entre todos los indicadores económicos y sociales de China.
    Identifica las relaciones más fuertes (positivas y negativas) entre variables.
    
    ## Métricas Incluidas:
    - **Matriz de correlaciones completa** (Pearson)
    - **Top 5 correlaciones positivas** más fuertes
    - **Top 5 correlaciones negativas** más fuertes
    - **Análisis de significancia** estadística
    - **Visualización de relaciones** clave para el dashboard
    
    ## Interpretación de Correlaciones:
    - ±0.8 a ±1.0: Correlación muy fuerte
    - ±0.6 a ±0.8: Correlación fuerte  
    - ±0.4 a ±0.6: Correlación moderada
    - ±0.2 a ±0.4: Correlación débil
    - ±0.0 a ±0.2: Correlación muy débil o nula
    """
    
    try:
        # 1. OBTENER DATOS PARA TODOS LOS INDICADORES
        datos_indicadores = {}
        
        for indicador in INDICADORES_VALIDOS:
            # Obtener datos del indicador (años y valores)
            datos = db.query(
                ChinaModel.year, 
                getattr(ChinaModel, indicador)
            ).filter(
                getattr(ChinaModel, indicador).isnot(None)
            ).filter(
                ChinaModel.year >= 1991
            ).order_by(ChinaModel.year).all()
            
            # Convertir a diccionario por año para alineación
            datos_por_anio = {año: valor for año, valor in datos}
            datos_indicadores[indicador] = datos_por_anio
        
        # 2. CREAR DATAFRAME ALINEADO POR AÑO
        todos_los_anios = set()
        for datos in datos_indicadores.values():
            todos_los_anios.update(datos.keys())
        
        todos_los_anios = sorted(todos_los_anios)
        
        # Crear matriz de datos
        matriz_datos = {}
        for indicador in INDICADORES_VALIDOS:
            valores = []
            for año in todos_los_anios:
                valor = datos_indicadores[indicador].get(año)
                valores.append(valor)
            matriz_datos[indicador] = valores
        
        # 3. CALCULAR MATRIZ DE CORRELACIONES
        matriz_correlaciones = {}
        correlaciones_lista = []
        
        for i, indicador1 in enumerate(INDICADORES_VALIDOS):
            matriz_correlaciones[indicador1] = {}
            valores1 = matriz_datos[indicador1]
            
            for j, indicador2 in enumerate(INDICADORES_VALIDOS):
                if i <= j:
                    valores2 = matriz_datos[indicador2]
                    
                    # Filtrar pares donde ambos valores no son nulos
                    pares_validos = [(v1, v2) for v1, v2 in zip(valores1, valores2) 
                                   if v1 is not None and v2 is not None]
                    
                    if len(pares_validos) >= 3:
                        v1_array = [par[0] for par in pares_validos]
                        v2_array = [par[1] for par in pares_validos]
                        
                        try:
                            correlacion, valor_p = stats.pearsonr(v1_array, v2_array)
                            
                            # 🔧 CORRECCIÓN: Convertir tipos NumPy a Python nativo
                            correlacion_python = float(correlacion)
                            valor_p_python = float(valor_p)
                            significativo_python = bool(valor_p_python < 0.05)
                            
                            matriz_correlaciones[indicador1][indicador2] = {
                                "correlacion": round(correlacion_python, 4),
                                "valor_p": round(valor_p_python, 6),
                                "muestras": len(pares_validos),
                                "significativo": significativo_python
                            }
                            
                            if indicador1 != indicador2:
                                correlaciones_lista.append({
                                    "indicador1": indicador1,
                                    "indicador2": indicador2,
                                    "correlacion": round(correlacion_python, 4),
                                    "valor_p": round(valor_p_python, 6),
                                    "muestras": len(pares_validos),
                                    "significativo": significativo_python
                                })
                        except Exception as e:
                            matriz_correlaciones[indicador1][indicador2] = {
                                "correlacion": None,
                                "valor_p": None,
                                "muestras": len(pares_validos),
                                "significativo": False
                            }
                    else:
                        matriz_correlaciones[indicador1][indicador2] = {
                            "correlacion": None,
                            "valor_p": None,
                            "muestras": len(pares_validos),
                            "significativo": False
                        }
        
        # 4. IDENTIFICAR TOP CORRELACIONES
        correlaciones_validas = [c for c in correlaciones_lista 
                               if c["correlacion"] is not None and c["muestras"] >= 5]
        
        top_positivas = sorted(correlaciones_validas, 
                             key=lambda x: x["correlacion"], 
                             reverse=True)[:5]
        
        top_negativas = sorted(correlaciones_validas, 
                             key=lambda x: x["correlacion"])[:5]
        
        # 5. IDENTIFICAR CLUSTERS DE RELACIONES
        clusters = _identificar_clusters_correlacion(correlaciones_validas)
        
        # 6. ESTRUCTURAR RESPUESTA (asegurando tipos Python nativos)
        correlacion_promedio = 0.0
        if correlaciones_validas:
            correlaciones_abs = [abs(c["correlacion"]) for c in correlaciones_validas]
            correlacion_promedio = float(np.mean(correlaciones_abs))
        
        return {
            "resumen_analisis": {
                "total_indicadores": len(INDICADORES_VALIDOS),
                "total_pares_analizados": len(correlaciones_validas),
                "total_correlaciones_significativas": len([c for c in correlaciones_validas if c["significativo"]]),
                "correlacion_promedio": round(correlacion_promedio, 4),
                "fortaleza_relaciones": _evaluar_fortaleza_relaciones(correlaciones_validas)
            },
            "matriz_correlaciones": matriz_correlaciones,
            "top_correlaciones": {
                "positivas": top_positivas,
                "negativas": top_negativas
            },
            "clusters_relaciones": clusters,
            "interpretacion_relaciones": _generar_interpretacion_relaciones(top_positivas, top_negativas),
            "metricas_destacadas": _obtener_metricas_destacadas(correlaciones_validas)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en análisis de correlaciones: {str(e)}"
        )


# 🔧 FUNCIONES AUXILIARES CORREGIDAS

def _identificar_clusters_correlacion(correlaciones: list) -> dict:
    """Identifica clusters de indicadores altamente correlacionados"""
    UMBRAL_FUERTE = 0.7
    
    clusters = {
        "economic_growth": [],
        "social_development": [], 
        "trade_commerce": [],
        "demographic": [],
        "macroeconomic_stability": []
    }
    
    for corr in correlaciones:
        if abs(corr["correlacion"]) > UMBRAL_FUERTE and corr["significativo"]:
            ind1, ind2 = corr["indicador1"], corr["indicador2"]
            
            if any(x in ind1 for x in ['gdp', 'reserves']) and any(x in ind2 for x in ['gdp', 'reserves']):
                if ind1 not in clusters["economic_growth"]:
                    clusters["economic_growth"].append(ind1)
                if ind2 not in clusters["economic_growth"]:
                    clusters["economic_growth"].append(ind2)
            
            elif any(x in ind1 for x in ['life', 'poverty', 'unemployment']) and any(x in ind2 for x in ['life', 'poverty', 'unemployment']):
                if ind1 not in clusters["social_development"]:
                    clusters["social_development"].append(ind1)
                if ind2 not in clusters["social_development"]:
                    clusters["social_development"].append(ind2)
            
            elif any(x in ind1 for x in ['imports', 'exports']) and any(x in ind2 for x in ['imports', 'exports']):
                if ind1 not in clusters["trade_commerce"]:
                    clusters["trade_commerce"].append(ind1)
                if ind2 not in clusters["trade_commerce"]:
                    clusters["trade_commerce"].append(ind2)
            
            elif any(x in ind1 for x in ['population', 'pop_growth']) and any(x in ind2 for x in ['population', 'pop_growth']):
                if ind1 not in clusters["demographic"]:
                    clusters["demographic"].append(ind1)
                if ind2 not in clusters["demographic"]:
                    clusters["demographic"].append(ind2)
            
            elif any(x in ind1 for x in ['inflation', 'debt', 'remittances']) and any(x in ind2 for x in ['inflation', 'debt', 'remittances']):
                if ind1 not in clusters["macroeconomic_stability"]:
                    clusters["macroeconomic_stability"].append(ind1)
                if ind2 not in clusters["macroeconomic_stability"]:
                    clusters["macroeconomic_stability"].append(ind2)
    
    clusters = {k: v for k, v in clusters.items() if v}
    
    return clusters

def _evaluar_fortaleza_relaciones(correlaciones: list) -> dict:
    """Evalúa la fortaleza general de las relaciones en el dataset"""
    if not correlaciones:
        return {"error": "No hay correlaciones válidas"}
    
    correlaciones_abs = [abs(c["correlacion"]) for c in correlaciones]
    
    muy_fuertes = len([c for c in correlaciones_abs if c > 0.8])
    fuertes = len([c for c in correlaciones_abs if 0.6 < c <= 0.8])
    moderadas = len([c for c in correlaciones_abs if 0.4 < c <= 0.6])
    debil = len([c for c in correlaciones_abs if 0.2 < c <= 0.4])
    muy_debil = len([c for c in correlaciones_abs if c <= 0.2])
    
    porcentaje_significativas = len([c for c in correlaciones if c["significativo"]]) / len(correlaciones) * 100
    
    return {
        "muy_fuertes": int(muy_fuertes),
        "fuertes": int(fuertes),
        "moderadas": int(moderadas),
        "debil": int(debil),
        "muy_debil": int(muy_debil),
        "porcentaje_significativas": float(round(porcentaje_significativas, 2))
    }

def _generar_interpretacion_relaciones(top_positivas: list, top_negativas: list) -> dict:
    """Genera interpretaciones automáticas de las relaciones más fuertes"""
    interpretaciones = {
        "positivas": [],
        "negativas": []
    }
    
    for corr in top_positivas[:3]:
        ind1, ind2 = corr["indicador1"], corr["indicador2"]
        fuerza = _clasificar_fuerza_correlacion(corr["correlacion"])
        
        interpretacion = _interpretar_par_indicadores(ind1, ind2, "positiva", fuerza)
        if interpretacion:
            interpretaciones["positivas"].append({
                "par": f"{ind1} - {ind2}",
                "correlacion": corr["correlacion"],
                "interpretacion": interpretacion,
                "fuerza": fuerza
            })
    
    for corr in top_negativas[:3]:
        ind1, ind2 = corr["indicador1"], corr["indicador2"]
        fuerza = _clasificar_fuerza_correlacion(abs(corr["correlacion"]))
        
        interpretacion = _interpretar_par_indicadores(ind1, ind2, "negativa", fuerza)
        if interpretacion:
            interpretaciones["negativas"].append({
                "par": f"{ind1} - {ind2}",
                "correlacion": corr["correlacion"],
                "interpretacion": interpretacion,
                "fuerza": fuerza
            })
    
    return interpretaciones

def _clasificar_fuerza_correlacion(correlacion: float) -> str:
    """Clasifica la fuerza de una correlación"""
    abs_corr = abs(correlacion)
    if abs_corr >= 0.8:
        return "muy_fuerte"
    elif abs_corr >= 0.6:
        return "fuerte"
    elif abs_corr >= 0.4:
        return "moderada"
    elif abs_corr >= 0.2:
        return "debil"
    else:
        return "muy_debil"

def _interpretar_par_indicadores(ind1: str, ind2: str, tipo: str, fuerza: str) -> str:
    """Interpreta la relación entre dos indicadores"""
    
    mapeo_interpretaciones = {
        ("gdp_usd", "exports_pct_gdp"): {
            "positiva": "El crecimiento económico está fuertemente ligado a la capacidad exportadora",
            "negativa": "Relación inesperada: mayor PIB asociado a menor exportación"
        },
        ("gdp_usd", "imports_pct_gdp"): {
            "positiva": "Economías más ricas importan más bienes y servicios",
            "negativa": "Mayor autosuficiencia en economías desarrolladas"
        },
        ("gdp_usd", "total_reserves_usd"): {
            "positiva": "Crecimiento económico acumula reservas internacionales",
            "negativa": "Patrón inusual: crecimiento sin acumulación de reservas"
        },
        ("gdp_usd", "life_expectancy_years"): {
            "positiva": "El desarrollo económico mejora la esperanza de vida",
            "negativa": "Crecimiento económico no se traduce en mejor salud"
        },
        ("gdp_usd", "poverty_pct"): {
            "positiva": "Relación inesperada: mayor PIB con mayor pobreza",
            "negativa": "El crecimiento económico reduce la pobreza"
        },
        ("exports_pct_gdp", "imports_pct_gdp"): {
            "positiva": "Economías abiertas tanto para exportar como importar",
            "negativa": "Especialización en solo uno de los flujos comerciales"
        },
        ("life_expectancy_years", "poverty_pct"): {
            "positiva": "Relación contra-intuitiva: mayor esperanza de vida con mayor pobreza",
            "negativa": "Reducción de pobreza asociada a mejor salud poblacional"
        },
        ("population", "gdp_usd"): {
            "positiva": "Población más grande asociada a economía más grande",
            "negativa": "Crecimiento poblacional no se traduce en crecimiento económico"
        },
        ("gdp_usd", "gdp_ppp"): {
            "positiva": "Consistencia entre mediciones de PIB nominal y PPP",
            "negativa": "Discrepancia inusual entre PIB nominal y PPP"
        },
        ("gdp_usd", "gdp_per_capita_usd"): {
            "positiva": "Crecimiento económico beneficia a la población per cápita",
            "negativa": "Crecimiento económico no se distribuye a la población"
        }
    }
    
    par_key1 = (ind1, ind2)
    par_key2 = (ind2, ind1)
    
    if par_key1 in mapeo_interpretaciones:
        return mapeo_interpretaciones[par_key1].get(tipo)
    elif par_key2 in mapeo_interpretaciones:
        return mapeo_interpretaciones[par_key2].get(tipo)
    
    interpretaciones_genericas = {
        "positiva": f"Los indicadores {ind1} y {ind2} tienden a moverse en la misma dirección ({fuerza})",
        "negativa": f"Los indicadores {ind1} y {ind2} tienden a moverse en direcciones opuestas ({fuerza})"
    }
    
    return interpretaciones_genericas.get(tipo)

def _obtener_metricas_destacadas(correlaciones: list) -> dict:
    """Obtiene métricas destacadas de forma segura"""
    if not correlaciones:
        return {
            "correlacion_mas_fuerte": None,
            "relacion_mas_significativa": None,
            "indicador_mas_conectado": {"error": "No hay correlaciones"}
        }
    
    try:
        correlacion_mas_fuerte = max(correlaciones, key=lambda x: abs(x["correlacion"]))
        relacion_mas_significativa = min(correlaciones, key=lambda x: x["valor_p"])
        indicador_mas_conectado = _identificar_indicador_mas_conectado(correlaciones)
        
        return {
            "correlacion_mas_fuerte": correlacion_mas_fuerte,
            "relacion_mas_significativa": relacion_mas_significativa,
            "indicador_mas_conectado": indicador_mas_conectado
        }
    except:
        return {
            "correlacion_mas_fuerte": None,
            "relacion_mas_significativa": None,
            "indicador_mas_conectado": {"error": "Error calculando métricas"}
        }

def _identificar_indicador_mas_conectado(correlaciones: list) -> dict:
    """Identifica el indicador con más correlaciones fuertes"""
    if not correlaciones:
        return {"error": "No hay correlaciones"}
    
    conteo_indicadores = {}
    conteo_fuertes = {}
    
    for corr in correlaciones:
        for indicador in [corr["indicador1"], corr["indicador2"]]:
            conteo_indicadores[indicador] = conteo_indicadores.get(indicador, 0) + 1
            
            if abs(corr["correlacion"]) > 0.6 and corr["significativo"]:
                conteo_fuertes[indicador] = conteo_fuertes.get(indicador, 0) + 1
    
    if not conteo_indicadores:
        return {"error": "No hay correlaciones"}
    
    indicador_mas_conectado = max(conteo_indicadores, key=conteo_indicadores.get)
    indicador_mas_fuertes = max(conteo_fuertes, key=conteo_fuertes.get) if conteo_fuertes else indicador_mas_conectado
    
    return {
        "indicador": str(indicador_mas_conectado),
        "total_correlaciones": int(conteo_indicadores[indicador_mas_conectado]),
        "correlaciones_fuertes": int(conteo_fuertes.get(indicador_mas_conectado, 0)),
        "indicador_relaciones_fuertes": str(indicador_mas_fuertes),
        "interpretacion": "Indicador central que influye en múltiples dimensiones económicas"
    }