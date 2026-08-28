// ponytail: datos de muestra codificados a mano para la maqueta — reemplazar por
// fetch() a la API real (df_sin_dup + capa de costo WACC) cuando exista backend.

const REGIONES = [
  "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana",
  "O'Higgins", "Biobío", "Los Lagos", "Magallanes", "Tarapacá",
];

const SECTORES = [
  "Minería", "Energía", "Inmobiliario", "Obras Públicas",
  "Saneamiento Ambiental", "Agroindustria", "Pesca y Acuicultura",
];

const ESTADOS = ["En calificación", "Aprobado", "Rechazado", "Desistido", "No admitido"];

const TITULARES = [
  "Minera Los Andes SpA", "SolarWatt Chile S.A.", "Inmobiliaria Costanera",
  "Hidroeléctrica del Sur", "AquaChile Cultivos", "Agrícola Valle Fértil",
  "EnergíaLimpia Holding", "Constructora Andina", "Puerto Pacífico S.A.",
  "Minera Cordillera", "Parque Eólico Costero", "Sanitaria Regional Ltda.",
];

// PROYECTOS — 42 filas representativas, tipo DIA/EIA, con benchmark de mediana
// sectorial precalculado (ver medianasSector abajo).
const PROYECTOS = [
  { nombre: "Ampliación Rajo Norte", titular: "Minera Cordillera", region: "Antofagasta", sector: "Minería", tipo: "EIA", fecha_ingreso: "2025-11-03", estado: "En calificación", dias: 298, inversion: 820 },
  { nombre: "Parque Solar Atacama III", titular: "SolarWatt Chile S.A.", region: "Atacama", sector: "Energía", tipo: "DIA", fecha_ingreso: "2026-01-14", estado: "En calificación", dias: 187, inversion: 145 },
  { nombre: "Edificio Costanera Vista", titular: "Inmobiliaria Costanera", region: "Valparaíso", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2026-02-02", estado: "En calificación", dias: 168, inversion: 38 },
  { nombre: "Central Hidroeléctrica Ñuble", titular: "Hidroeléctrica del Sur", region: "Biobío", sector: "Energía", tipo: "EIA", fecha_ingreso: "2025-08-19", estado: "En calificación", dias: 374, inversion: 512 },
  { nombre: "Centro de Cultivo Chiloé Sur", titular: "AquaChile Cultivos", region: "Los Lagos", sector: "Pesca y Acuicultura", tipo: "DIA", fecha_ingreso: "2026-03-10", estado: "En calificación", dias: 131, inversion: 62 },
  { nombre: "Planta Desalinizadora Mejillones", titular: "Minera Cordillera", region: "Antofagasta", sector: "Minería", tipo: "EIA", fecha_ingreso: "2025-05-22", estado: "Aprobado", dias: 402, inversion: 690 },
  { nombre: "Parque Eólico Punta Colorada", titular: "Parque Eólico Costero", region: "Coquimbo", sector: "Energía", tipo: "DIA", fecha_ingreso: "2025-09-01", estado: "Aprobado", dias: 214, inversion: 210 },
  { nombre: "Loteo Industrial Til Til", titular: "Constructora Andina", region: "Metropolitana", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2025-10-15", estado: "Aprobado", dias: 155, inversion: 54 },
  { nombre: "Extensión Terminal Portuario", titular: "Puerto Pacífico S.A.", region: "Valparaíso", sector: "Obras Públicas", tipo: "EIA", fecha_ingreso: "2025-02-11", estado: "Aprobado", dias: 461, inversion: 980 },
  { nombre: "Planta Tratamiento Aguas Rancagua", titular: "Sanitaria Regional Ltda.", region: "O'Higgins", sector: "Saneamiento Ambiental", tipo: "DIA", fecha_ingreso: "2025-07-04", estado: "Aprobado", dias: 176, inversion: 41 },
  { nombre: "Fundo Agroexportador Valle Fértil", titular: "Agrícola Valle Fértil", region: "Coquimbo", sector: "Agroindustria", tipo: "DIA", fecha_ingreso: "2025-06-18", estado: "Rechazado", dias: 289, inversion: 27 },
  { nombre: "Rajo Cordillera Sur Fase II", titular: "Minera Los Andes SpA", region: "Atacama", sector: "Minería", tipo: "EIA", fecha_ingreso: "2024-12-02", estado: "Rechazado", dias: 519, inversion: 1140 },
  { nombre: "Condominio Altos del Mar", titular: "Inmobiliaria Costanera", region: "Valparaíso", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2025-12-20", estado: "En calificación", dias: 110, inversion: 22 },
  { nombre: "Parque Solar Diego de Almagro", titular: "EnergíaLimpia Holding", region: "Atacama", sector: "Energía", tipo: "DIA", fecha_ingreso: "2026-04-08", estado: "En calificación", dias: 102, inversion: 178 },
  { nombre: "Concentradora Sulfuros Norte", titular: "Minera Los Andes SpA", region: "Antofagasta", sector: "Minería", tipo: "EIA", fecha_ingreso: "2025-03-27", estado: "En calificación", dias: 356, inversion: 1560 },
  { nombre: "Planta de Harina de Pescado", titular: "AquaChile Cultivos", region: "Los Lagos", sector: "Pesca y Acuicultura", tipo: "DIA", fecha_ingreso: "2025-11-29", estado: "Desistido", dias: 84, inversion: 19 },
  { nombre: "Vertedero Regional Magallanes", titular: "Sanitaria Regional Ltda.", region: "Magallanes", sector: "Saneamiento Ambiental", tipo: "DIA", fecha_ingreso: "2026-01-30", estado: "En calificación", dias: 170, inversion: 33 },
  { nombre: "Camino Concesionado Ruta 5 Norte", titular: "Constructora Andina", region: "Tarapacá", sector: "Obras Públicas", tipo: "EIA", fecha_ingreso: "2025-04-14", estado: "Aprobado", dias: 388, inversion: 640 },
  { nombre: "Parque Eólico Llanos del Viento", titular: "Parque Eólico Costero", region: "Biobío", sector: "Energía", tipo: "DIA", fecha_ingreso: "2026-02-19", estado: "En calificación", dias: 151, inversion: 195 },
  { nombre: "Rajo Los Cóndores", titular: "Minera Cordillera", region: "Tarapacá", sector: "Minería", tipo: "EIA", fecha_ingreso: "2025-01-09", estado: "Aprobado", dias: 447, inversion: 870 },
  { nombre: "Torres Vista Andes", titular: "Inmobiliaria Costanera", region: "Metropolitana", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2026-03-22", estado: "En calificación", dias: 118, inversion: 46 },
  { nombre: "Central Solar Diego Portales", titular: "SolarWatt Chile S.A.", region: "Coquimbo", sector: "Energía", tipo: "DIA", fecha_ingreso: "2025-10-02", estado: "Aprobado", dias: 198, inversion: 132 },
  { nombre: "Planta Faenadora Agroindustrial", titular: "Agrícola Valle Fértil", region: "O'Higgins", sector: "Agroindustria", tipo: "DIA", fecha_ingreso: "2026-01-05", estado: "En calificación", dias: 189, inversion: 31 },
  { nombre: "Muelle de Transferencia Los Vilos", titular: "Puerto Pacífico S.A.", region: "Coquimbo", sector: "Obras Públicas", tipo: "DIA", fecha_ingreso: "2025-09-27", estado: "Aprobado", dias: 205, inversion: 88 },
  { nombre: "Rajo Salar Blanco", titular: "Minera Los Andes SpA", region: "Antofagasta", sector: "Minería", tipo: "EIA", fecha_ingreso: "2026-02-27", estado: "En calificación", dias: 174, inversion: 2100 },
  { nombre: "Central Hidroeléctrica Bío Alto", titular: "Hidroeléctrica del Sur", region: "Biobío", sector: "Energía", tipo: "EIA", fecha_ingreso: "2025-06-30", estado: "En calificación", dias: 342, inversion: 470 },
  { nombre: "Planta Osmosis Inversa Tocopilla", titular: "Minera Cordillera", region: "Antofagasta", sector: "Saneamiento Ambiental", tipo: "DIA", fecha_ingreso: "2025-12-11", estado: "En calificación", dias: 141, inversion: 58 },
  { nombre: "Loteo Los Almendros", titular: "Constructora Andina", region: "Valparaíso", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2025-08-08", estado: "Aprobado", dias: 162, inversion: 29 },
  { nombre: "Cultivo Mitílidos Chonchi", titular: "AquaChile Cultivos", region: "Los Lagos", sector: "Pesca y Acuicultura", tipo: "DIA", fecha_ingreso: "2026-04-01", estado: "En calificación", dias: 90, inversion: 15 },
  { nombre: "Parque Solar Atacama IV", titular: "EnergíaLimpia Holding", region: "Atacama", sector: "Energía", tipo: "DIA", fecha_ingreso: "2026-04-20", estado: "En calificación", dias: 79, inversion: 160 },
  { nombre: "Rajo Cerro Amarillo", titular: "Minera Los Andes SpA", region: "Coquimbo", sector: "Minería", tipo: "EIA", fecha_ingreso: "2024-10-15", estado: "Aprobado", dias: 486, inversion: 730 },
  { nombre: "Edificio Corporativo Las Condes", titular: "Inmobiliaria Costanera", region: "Metropolitana", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2026-01-22", estado: "En calificación", dias: 129, inversion: 51 },
  { nombre: "Central Eólica Cabo Froward", titular: "Parque Eólico Costero", region: "Magallanes", sector: "Energía", tipo: "DIA", fecha_ingreso: "2025-11-17", estado: "En calificación", dias: 154, inversion: 240 },
  { nombre: "Ampliación Puerto Coronel", titular: "Puerto Pacífico S.A.", region: "Biobío", sector: "Obras Públicas", tipo: "EIA", fecha_ingreso: "2025-03-05", estado: "Aprobado", dias: 419, inversion: 560 },
  { nombre: "Fundo Frutícola Elqui", titular: "Agrícola Valle Fértil", region: "Coquimbo", sector: "Agroindustria", tipo: "DIA", fecha_ingreso: "2026-02-14", estado: "En calificación", dias: 96, inversion: 24 },
  { nombre: "Planta Tratamiento Iquique", titular: "Sanitaria Regional Ltda.", region: "Tarapacá", sector: "Saneamiento Ambiental", tipo: "DIA", fecha_ingreso: "2025-05-30", estado: "Rechazado", dias: 231, inversion: 36 },
  { nombre: "Rajo Escondido Norte", titular: "Minera Cordillera", region: "Antofagasta", sector: "Minería", tipo: "EIA", fecha_ingreso: "2026-03-01", estado: "En calificación", dias: 149, inversion: 1980 },
  { nombre: "Parque Solar Andacollo", titular: "SolarWatt Chile S.A.", region: "Coquimbo", sector: "Energía", tipo: "DIA", fecha_ingreso: "2026-03-18", estado: "En calificación", dias: 105, inversion: 118 },
  { nombre: "Torres Parque Bicentenario", titular: "Constructora Andina", region: "Metropolitana", sector: "Inmobiliario", tipo: "DIA", fecha_ingreso: "2025-07-21", estado: "Aprobado", dias: 171, inversion: 63 },
  { nombre: "Cultivo Salmón Aysén Norte", titular: "AquaChile Cultivos", region: "Los Lagos", sector: "Pesca y Acuicultura", tipo: "DIA", fecha_ingreso: "2025-09-14", estado: "Desistido", dias: 67, inversion: 21 },
  { nombre: "Central Hidroeléctrica Trancura", titular: "Hidroeléctrica del Sur", region: "Biobío", sector: "Energía", tipo: "EIA", fecha_ingreso: "2026-01-11", estado: "En calificación", dias: 204, inversion: 388 },
  { nombre: "Terminal Graneles Mejillones", titular: "Puerto Pacífico S.A.", region: "Antofagasta", sector: "Obras Públicas", tipo: "EIA", fecha_ingreso: "2025-12-28", estado: "En calificación", dias: 133, inversion: 710 },
];

// Mediana de días de tramitación por sector (histórico, base 26.345 proyectos).
const MEDIANA_SECTOR = {
  "Minería": 312, "Energía": 226, "Inmobiliario": 148,
  "Obras Públicas": 267, "Saneamiento Ambiental": 165,
  "Agroindustria": 139, "Pesca y Acuicultura": 118,
};

// Serie trimestral — días promedio de tramitación (Aprobados+Rechazados),
// con el corte en el trimestre de entrada en vigencia de la Ley 21.770.
const SERIE_TRAMITACION = [
  { q: "2023-T3", dias: 231 }, { q: "2023-T4", dias: 244 },
  { q: "2024-T1", dias: 238 }, { q: "2024-T2", dias: 252 },
  { q: "2024-T3", dias: 261 }, { q: "2024-T4", dias: 268 },
  { q: "2025-T1", dias: 274 }, { q: "2025-T2", dias: 281 },
  { q: "2025-T3", dias: 279, ley: true }, { q: "2025-T4", dias: 265 },
  { q: "2026-T1", dias: 251 }, { q: "2026-T2", dias: 239 },
];

// SEÑALES DOCUMENTALES — hallazgos ilustrativos por expediente, escritos a
// mano para la maqueta (no salen de una revisión documental real).
//   tipo "ire"  → riesgo de término anticipado por falta de información
//                 relevante o esencial (ver vista Documentos).
//   tipo "ice"  → Informe Consolidado de Evaluación ya disponible en el
//                 expediente (evaluación en etapa de cierre).
const SENALES_DOCUMENTALES = [
  { nombre: "Rajo Cordillera Sur Fase II", tipo: "ire", nivel: "alta", hallazgo: "La línea de base de fauna no cubre el ciclo anual completo; falta información esencial para evaluar efectos del art. 11." },
  { nombre: "Central Hidroeléctrica Ñuble", tipo: "ire", nivel: "alta", hallazgo: "No se identifican todas las obras del proyecto (captación y descarga) como unidad; falta información relevante." },
  { nombre: "Concentradora Sulfuros Norte", tipo: "ire", nivel: "media", hallazgo: "Modelación de calidad del aire con supuestos no justificados; el SEA podría solicitar antecedentes esenciales." },
  { nombre: "Rajo Salar Blanco", tipo: "ire", nivel: "media", hallazgo: "Plan de seguimiento de aguas subterráneas incompleto para un EIA de esta envergadura." },
  { nombre: "Rajo Escondido Norte", tipo: "ire", nivel: "alta", hallazgo: "Ausencia de caracterización de comunidades indígenas cercanas; riesgo de falta de información esencial." },
  { nombre: "Extensión Terminal Portuario", tipo: "ice", nivel: "media", hallazgo: "ICE emitido; evaluación en etapa de cierre previa a RCA." },
  { nombre: "Rajo Los Cóndores", tipo: "ice", nivel: "media", hallazgo: "ICE emitido; sin observaciones pendientes de titular." },
  { nombre: "Ampliación Puerto Coronel", tipo: "ice", nivel: "media", hallazgo: "ICE emitido; en revisión final por la Comisión de Evaluación." },
];
