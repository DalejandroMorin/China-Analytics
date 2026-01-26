import csv
import os
from typing import Optional

from app.database.database import SessionLocal, engine, Base
from app.models.china_models import ChinaHistoricalData


def safe_float(value: str) -> Optional[float]:
    if value is None:
        return None
    v = value.strip()
    if v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def safe_int(value: str) -> Optional[int]:
    if value is None:
        return None
    v = value.strip()
    if v == "":
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def load_csv_to_db(csv_path: str, batch_size: int = 100):
    """
    Lee `csv_path` y carga los registros en la base de datos.

    Comportamiento:
    - Ignora columnas vacías y valores no convertibles (pone None).
    - Evita insertar duplicados por (country, year).
    - Hace commits por lotes para mejorar rendimiento.
    - Imprime progreso y resumen final.
    """

    # Aseguramos que las tablas existen
    Base.metadata.create_all(bind=engine)

    total_rows = 0
    inserted = 0
    skipped = 0
    errors = 0

    session = SessionLocal()
    try:
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            buffer = []
            for row in reader:
                total_rows += 1

                try:
                    # Cast fields safely
                    country = row.get("country") or "China"
                    year = safe_int(row.get("year"))

                    # If year is missing we skip the row
                    if year is None:
                        skipped += 1
                        print(f"Fila {total_rows}: año inválido, se omite.")
                        continue

                    # Check duplicate (country + year)
                    exists = session.query(ChinaHistoricalData).filter_by(country=country, year=year).first()
                    if exists:
                        skipped += 1
                        if total_rows % 50 == 0:
                            print(f"Fila {total_rows}: registro {country} {year} ya existe, se salta.")
                        continue

                    obj = ChinaHistoricalData(
                        country=country,
                        year=year,
                        gdp_usd=safe_float(row.get("gdp_usd")),
                        gdp_ppp=safe_float(row.get("gdp_ppp")),
                        gdp_per_capita_usd=safe_float(row.get("gdp_per_capita_usd")),
                        gdp_growth_pct=safe_float(row.get("gdp_growth_pct")),
                        imports_pct_gdp=safe_float(row.get("imports_pct_gdp")),
                        exports_pct_gdp=safe_float(row.get("exports_pct_gdp")),
                        total_reserves_usd=safe_float(row.get("total_reserves_usd")),
                        unemployment_pct=safe_float(row.get("unemployment_pct")),
                        inflation_pct=safe_float(row.get("inflation_pct")),
                        remittances_pct_gdp=safe_float(row.get("remittances_pct_gdp")),
                        population=safe_float(row.get("population")),
                        pop_growth_pct=safe_float(row.get("pop_growth_pct")),
                        life_expectancy_years=safe_float(row.get("life_expectancy_years")),
                        poverty_pct=safe_float(row.get("poverty_pct")),
                    )

                    buffer.append(obj)

                    # Commit por lotes
                    if len(buffer) >= batch_size:
                        session.add_all(buffer)
                        session.commit()
                        inserted += len(buffer)
                        buffer = []
                        print(f"Inserted {inserted} rows so far...")

                except Exception as e:
                    errors += 1
                    print(f"Error procesando fila {total_rows}: {e}")
                    # continue con la siguiente fila

            # Insert remaining
            if buffer:
                session.add_all(buffer)
                session.commit()
                inserted += len(buffer)

    finally:
        session.close()

    print("\nCarga finalizada")
    print(f"Filas leídas: {total_rows}")
    print(f"Insertadas: {inserted}")
    print(f"Omitidas (duplicados/invalidas): {skipped}")
    print(f"Errores: {errors}")


def get_default_csv_path() -> str:
    here = os.path.dirname(__file__)
    # ../database/datos_china.csv
    return os.path.abspath(os.path.join(here, "..", "database", "datos_china.csv"))


if __name__ == "__main__":
    path = get_default_csv_path()
    if not os.path.exists(path):
        print(f"Archivo no encontrado: {path}")
    else:
        print(f"Cargando datos desde: {path}")
        load_csv_to_db(path)
