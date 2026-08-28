# Permiscopio — maqueta

Maqueta de la plataforma de autoservicio (idea #4 del plan). HTML/CSS/JS plano,
sin build ni backend — pensada solo para mostrar a Jorge.

## Ver

Abre `index.html` directo en el navegador (doble clic). No necesita servidor.

- **Login**: cualquier correo/contraseña entra — es cosmético.
- **Resumen**: KPIs de cartera, tendencia de días de tramitación (con el corte
  de la Ley 21.770), proyectos por sector, feed de nuevos ingresos.
- **Proyectos**: tabla filtrable (región/sector/estado/tipo) con el benchmark
  de cada proyecto vs. la mediana histórica de su sector.
- **Insights**: mediana de días por sector, inversión activa por región, y el
  ranking de proyectos con más exceso sobre su benchmark.

## Datos

`data.js` trae 42 proyectos de muestra escritos a mano — no son datos reales
del SEIA. Reemplazar por un `fetch()` a la API cuando exista backend (ver
Fase 3 del plan: `df_sin_dup` + capa de costo WACC).

## Stack

Vanilla JS + Chart.js por CDN. Cero dependencias que instalar — a propósito,
para que esto se pueda mostrar hoy. El plan real (Fase 3) usa el dashboard
Shiny ya desplegado como v1; esto es la exploración visual de a dónde podría
llegar la v3 en Next.js si el negocio lo justifica.
