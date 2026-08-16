# Sistema de Ratings - Frontend

## Problema

El proyecto PlatziFlix no tiene un sistema de calificación para cursos. Se necesita implementar un sistema de ratings (1-5 estrellas) que permita a los usuarios calificar cursos, mostrando el promedio en homepage y detalle de curso. No hay autenticación, por lo que se usará un usuario anónimo hardcodeado temporalmente.

---

## Contrato de API (Backend)

### GET /courses/{slug}/rating

**Response 200:**
```json
{
  "average": 4.5,
  "count": 10,
  "user_rating": 5
}
```

### POST /courses/{slug}/rating

**Request Body:**
```json
{
  "user_id": "anonymous_user",
  "rating": 5
}
```

**Response 201:**
```json
{
  "id": 1,
  "course_id": 1,
  "user_id": "anonymous_user",
  "rating": 5,
  "created_at": "2026-08-13T10:00:00",
  "updated_at": "2026-08-13T10:00:00"
}
```

### DELETE /courses/{slug}/rating

**Query Parameters:** `user_id=anonymous_user`

**Response 200:**
```json
{
  "message": "Rating eliminado"
}
```

---

## Componentes

### StarRating (Solo lectura)

**Props:**
```typescript
interface StarRatingProps {
  average: number;    // Promedio 0-5
  count: number;      // Cantidad de ratings
  size?: "sm" | "md" | "lg";  // Tamaño (default: "md")
}
```

**Comportamiento:**
- Muestra estrellas llenas, medias y vacías según el promedio
- Muestra conteo entre paréntesis: `(10)`
- Media estrella: CSS overflow hidden en pseudo-elemento
- Accesibilidad: `aria-label` con promedio y count

**Uso:**
- Course cards (homepage) → `size="sm"`
- Course detail header → `size="lg"`

### StarRatingInteractive (Formulario)

**Props:**
```typescript
interface StarRatingInteractiveProps {
  slug: string;                    // Slug del curso
  initialUserRating: number | null;  // Rating actual del usuario
  onRatingSubmitted?: (newAverage: number, newCount: number) => void;
}
```

**Comportamiento:**
- 5 botones de estrella interactivos
- Hover: resalta estrellas hasta la seleccionada
- Click: envía rating via POST
- Feedback: "Calificaste con X estrellas"
- Error: "No se pudo guardar tu calificación"
- Loading: "Guardando..." durante request
- `useTransition` para UI no bloqueante

**Directiva:** `"use client"` (único componente client nuevo)

---

## Tipos

### Nueva interfaz: CourseRating

```typescript
export interface CourseRating {
  average: number;
  count: number;
  userRating: number | null;
}
```

### Interfaz Course modificada

```typescript
export interface Course {
  id: number;
  title: string;
  teacher: string;
  duration: number;
  thumbnail: string;
  slug: string;
  rating?: CourseRating;  // Nuevo campo opcional
}
```

---

## Servicio API

### Crear `Frontend/src/services/api.ts`

**Constantes:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

**Funciones:**
```typescript
async function getCourseRating(slug: string): Promise<CourseRatingResponse>;
async function submitCourseRating(slug: string, rating: number): Promise<CourseRatingResponse>;
```

**Manejo de errores:**
- `getCourseRating`: 404 retorna `{ average: 0, count: 0, userRating: null }`
- `submitCourseRating`: errores propagados al componente

**Nota:** Reemplaza URL hardcodeada `http://localhost:8000` que existe en 3 archivos.

---

## Plan de Implementación

### Fase 1: Tipos y Servicio API

1. Modificar `Frontend/src/types/index.ts`
   - Agregar interfaz `CourseRating`
   - Agregar campo `rating?` a interfaz `Course`

2. Crear `Frontend/src/services/api.ts`
   - Configurar `API_BASE_URL` desde variable de entorno
   - Implementar `getCourseRating(slug)`
   - Implementar `submitCourseRating(slug, rating)`

### Fase 2: Componente StarRating

1. Crear `Frontend/src/components/StarRating/StarRating.tsx`
   - Componente server (sin "use client")
   - Cálculo de estrellas llenas, medias, vacías
   - Accesibilidad con aria-label

2. Crear `Frontend/src/components/StarRating/StarRating.module.scss`
   - Importar `vars.scss` para tokens de color
   - Media estrella con CSS overflow hidden
   - Variantes de tamaño: sm, md, lg

3. Crear `Frontend/src/components/StarRating/__test__/StarRating.test.tsx`
   - Test: renderizado de estrellas para promedio 4.5
   - Test: 5 estrellas llenas para promedio 5.0
   - Test: ocultar conteo cuando count es 0
   - Test: aria-label correcto
   - Test: aplicar clase de tamaño

### Fase 3: Componente StarRatingInteractive

1. Crear `Frontend/src/components/StarRatingInteractive/StarRatingInteractive.tsx`
   - Directiva `"use client"`
   - Estados: `hoveredStar`, `userRating`, `isPending`, `error`
   - `useTransition` para requests no bloqueantes
   - Hover effect en estrellas
   - Submit con `submitCourseRating`
   - Callback `onRatingSubmitted`

2. Crear `Frontend/src/components/StarRatingInteractive/StarRatingInteractive.module.scss`
   - Botones de estrella con hover/active states
   - Estilos para feedback, error, pending
   - Transiciones suaves

3. Crear `Frontend/src/components/StarRatingInteractive/__test__/StarRatingInteractive.test.tsx`
   - Mock de `submitCourseRating`
   - Test: renderizar 5 botones
   - Test: hover resalta estrellas
   - Test: click envía rating
   - Test: callback onRatingSubmitted
   - Test: mostrar error en fallo API
   - Test: mostrar rating inicial

### Fase 4: Integración en Course Card

1. Modificar `Frontend/src/components/Course/Course.tsx`
   - Importar `StarRating`
   - Agregar prop `rating?: CourseRating`
   - Renderizar `StarRating` cuando `rating.count > 0`

2. Modificar `Frontend/src/components/Course/__test__/Course.test.tsx`
   - Test: mostrar rating cuando se provee
   - Test: no mostrar rating cuando count es 0

### Fase 5: Integración en Course Detail

1. Modificar `Frontend/src/components/CourseDetail/CourseDetail.tsx`
   - Importar `StarRating` y `StarRatingInteractive`
   - Agregar props `rating?` y `slug`
   - Renderizar ambos en header del curso

2. Modificar `Frontend/src/components/CourseDetail/CourseDetail.module.scss`
   - Agregar estilos para `.ratingSection`

### Fase 6: Integración en Páginas

1. Modificar `Frontend/src/app/page.tsx`
   - Importar `getCourseRating`
   - Fetch paralelo con `Promise.all` para cada curso
   - Merge ratings en objetos de curso
   - Pasar `rating` a componente `Course`

2. Modificar `Frontend/src/app/course/[slug]/page.tsx`
   - Importar `getCourseRating`
   - Fetch rating junto con datos del curso
   - Pasar `rating` y `slug` a `CourseDetailComponent`

### Fase 7: Testing y Validación

1. Ejecutar tests frontend: `yarn test`
2. Ejecutar build: `yarn build`
3. Verificar TypeScript sin errores
4. Pruebas manuales:
   - Homepage: ratings visibles en cards
   - Detalle curso: rating + formulario funcional
   - Calificar: feedback inmediato
   - Re-calificar: actualiza rating

---

## Archivos a Crear/Modificar

### Archivos Nuevos (7)
```
Frontend/src/services/api.ts
Frontend/src/components/StarRating/StarRating.tsx
Frontend/src/components/StarRating/StarRating.module.scss
Frontend/src/components/StarRating/__test__/StarRating.test.tsx
Frontend/src/components/StarRatingInteractive/StarRatingInteractive.tsx
Frontend/src/components/StarRatingInteractive/StarRatingInteractive.module.scss
Frontend/src/components/StarRatingInteractive/__test__/StarRatingInteractive.test.tsx
```

### Archivos Modificados (7)
```
Frontend/src/types/index.ts
Frontend/src/components/Course/Course.tsx
Frontend/src/components/Course/__test__/Course.test.tsx
Frontend/src/components/CourseDetail/CourseDetail.tsx
Frontend/src/components/CourseDetail/CourseDetail.module.scss
Frontend/src/app/page.tsx
Frontend/src/app/course/[slug]/page.tsx
```

---

## Decisiones de Diseño

| Decisión | Elección | Justificación |
|---|---|---|
| Componente interactivo | `"use client"` | Solo StarRatingInteractive necesita interacción |
| Estado global | No aplica | Cada página maneja su propio estado |
| URL del API | Variable de entorno | Mejora sobre hardcodeado en 3 archivos |
| Media estrella | CSS overflow | Sin dependencias externas |
| Loading state | `useTransition` | UI no bloqueante durante requests |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backend no retorna ratings en lista | `Promise.all` con fetch individual como fallback |
| Sin auth (userRating siempre null) | Componente funciona con `null` graceful |
| CourseDetail sin prop `slug` | Agregar `slug` a props (ya disponible en page.tsx) |
| Media estrella cross-browser | Testing en Chrome/Firefox/Safari, fallback a SVG si necesario |

---

## Comandos de Verificación

```bash
# Ejecutar tests
yarn test

# Ejecutar tests de un componente
yarn test StarRating
yarn test StarRatingInteractive

# Build de producción
yarn build

# Verificar TypeScript
yarn tsc --noEmit
```
