# Samurai Mask AR

Filtro facial de Realidad Aumentada para móvil basado en un casco samurái **Kabuto** y una máscara **Menpō**.

## Objetivo

Crear una experiencia facial AR donde el casco y la máscara sigan el rostro del usuario y respondan a gestos faciales.

## Concepto

La experiencia representa un samurái tecnológico/tradicional con:

- Kabuto 3D siguiendo la parte superior de la cabeza.
- Menpō 3D siguiendo nariz, boca y mandíbula.
- Reacción al abrir la boca.
- Reacción al parpadear.
- Reacción al levantar las cejas.
- Retroalimentación visual y sonora.

## Tecnologías

- HTML, CSS y JavaScript
- A-Frame 1.6
- MindAR Face Tracking
- Web Audio API
- Vercel

## Estructura

```
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
    ├── models/
    └── audio/
```

## Estado actual

La base de tracking facial y la interfaz están preparadas. Actualmente se usan geometrías temporales para probar la posición del casco y del Menpō.

### Siguiente paso

Agregar los modelos GLB definitivos:

- `assets/models/kabuto.glb`
- `assets/models/menpo.glb`

Después se ajustarán posición, escala y rotación sobre el rostro, y se implementarán los gestos faciales.
