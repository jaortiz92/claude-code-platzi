# Análisis Técnico: Sistema de Ratings para PlatziFlix

## Problema

El proyecto PlatziFlix no tiene un sistema de calificación para cursos. Se necesita implementar un sistema de ratings (1-5 estrellas) que permita a los usuarios calificar cursos, mostrando el promedio en homepage, detalle de curso y página de clase. No hay autenticación, por lo que se usará un usuario anónimo hardcodeado temporalmente.

---

## Impacto Arquitectural

### Backend: FastAPI + PostgreSQL

**Componentes Nuevos:**

| Componente | Archivo | Descripción |
|---|---|---|
| Modelo | `Backend/app/models/course_rating.py` | Entidad CourseRating con relación a Course |
| Migración | `Backend/app/alembic/versions/[timestamp]_add_course_ratings.py` | Crear tabla course_ratings |
| Schema | `Backend/app/schemas/course_rating.py` | Pydantic models para request/response |
| Servicio | `Backend/app/services/rating_service.py` | Lógica de negocio para ratings |
| Endpoints | `Backend/app/main.py` (modificar) | 3 nuevos endpoints REST |

**Componentes Modificados:**

| Archivo | Cambios |
|---|---|
| `Backend/app/models/__init__.py` | ExportarCourseRating |
| `Backend/app/models/course.py` | Agregar relación `course_ratings` (1:N) |
| `Backend/app/services/course_service.py` | Incluir rating summary en respuestas |
| `Backend/app/test_main.py` | Tests para nuevos endpoints |

### Frontend: Next.js 15 + TypeScript

**Componentes Nuevos:**

| Componente | Archivo | Descripción |
|---|---|---|
| StarRating | `Frontend/src/components/StarRating/` | Componente solo lectura (muestra promedio) |
| StarRatingInteractive | `Frontend/src/components/StarRatingInteractive/` | Input para calificar (1-5 estrellas) |
| API Service | `Frontend/src/services/api.ts` | Cliente para endpoints de ratings |

**Componentes Modificados:**

| Archivo | Cambios |
|---|---|
| `Frontend/src/types/index.ts` | Agregar interfaz `CourseRating`, actualizar `Course` |
| `Frontend/src/components/Course/Course.tsx` | Mostrar rating promedio en card |
| `Frontend/src/components/CourseDetail/CourseDetail.tsx` | Mostrar rating + formulario de calificación |
| `Frontend/src/app/page.tsx` | Fetch y pasar ratings |
| `Frontend/src/app/course/[slug]/page.tsx` | Fetch rating summary |

### Base de datos

**Nueva tabla: `course_ratings`**

| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Integer | PK |
| `course_id` | Integer | FK → courses.id, NOT NULL |
| `user_id` | String(100) | NOT NULL |
| `rating` | Integer | NOT NULL, CHECK (1-5) |
| `created_at` | DateTime | Heredado de BaseModel |
| `updated_at` | DateTime | Heredado de BaseModel |

- Constraint único: `(course_id, user_id)` → un usuario solo puede calificar un curso una vez
- Relación: `Course.course_ratings` (1:N)

---

## Propuesta de Solución

### Diagrama de Relaciones

```
teachers ──M:N──> courses ──1:N──> lessons
            (course_teachers)
                │
                │ 1:N
                ▼
         course_ratings
```

### API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/courses/{slug}/rating` | Obtener resumen de rating (promedio, count, rating del usuario) |
| `POST` | `/courses/{slug}/rating` | Crear o actualizar rating |
| `DELETE` | `/courses/{slug}/rating` | Eliminar rating del usuario |

### Contratos de API (Request/Response)

#### GET /courses/{slug}/rating

Response 200:
```json
{
  "average": 4.5,
  "count": 10,
  "userRating": 5
}
```

#### POST /courses/{slug}/rating

Request Body:
```json
{
  "rating": 5
}
```

Response 200:
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

#### DELETE /courses/{slug}/rating

Response 200:
```json
{
  "message": "Rating eliminado"
}
```

---

## Plan de Implementación

### Fase 1: Backend - Modelo y Migración
1. Crear `Backend/app/models/course_rating.py`
2. Modificar `Backend/app/models/course.py` (agregar relación)
3. Modificar `Backend/app/models/__init__.py` (exportar modelo)
4. Crear migración Alembic: `make create-migration`
5. Ejecutar migración: `make migrate`

### Fase 2: Backend - Schema y Servicio
1. Crear `Backend/app/schemas/` (directorio)
2. Crear `Backend/app/schemas/course_rating.py`
3. Crear `Backend/app/services/rating_service.py`
4. Modificar `Backend/app/services/course_service.py` (incluir ratings)

### Fase 3: Backend - Endpoints y Tests
1. Modificar `Backend/app/main.py` (3 nuevos endpoints)
2. Actualizar tests existentes en `Backend/app/test_main.py`
3. Agregar tests para nuevos endpoints

### Fase 4: Frontend - Tipos y Servicio
1. Modificar `Frontend/src/types/index.ts` (agregar CourseRating)
2. Crear `Frontend/src/services/api.ts`

### Fase 5: Frontend - Componentes
1. Crear `Frontend/src/components/StarRating/`
2. Crear `Frontend/src/components/StarRatingInteractive/`
3. Modificar `Frontend/src/components/Course/Course.tsx`
4. Modificar `Frontend/src/components/CourseDetail/CourseDetail.tsx`

### Fase 6: Frontend - Integración en Páginas
1. Modificar `Frontend/src/app/page.tsx`
2. Modificar `Frontend/src/app/course/[slug]/page.tsx`
3. Modificar `Frontend/src/app/classes/[class_id]/page.tsx`

### Fase 7: Testing y Validación
1. Ejecutar tests backend: `make test`
2. Ejecutar tests frontend: `yarn test`
3. Pruebas manuales E2E

---

## Archivos a Crear/Modificar

### Archivos Nuevos (6)
```
Backend/app/models/course_rating.py
Backend/app/schemas/course_rating.py
Backend/app/services/rating_service.py
Frontend/src/components/StarRating/StarRating.tsx
Frontend/src/components/StarRatingInteractive/StarRatingInteractive.tsx
Frontend/src/services/api.ts
```

### Archivos Modificados (8)
```
Backend/app/models/__init__.py
Backend/app/models/course.py
Backend/app/services/course_service.py
Backend/app/main.py
Backend/app/test_main.py
Frontend/src/types/index.ts
Frontend/src/components/Course/Course.tsx
Frontend/src/components/CourseDetail/CourseDetail.tsx
Frontend/src/app/page.tsx
Frontend/src/app/course/[slug]/page.tsx
```

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Sin autenticación real | Usar header hardcodeado temporal, preparar para JWT futuro |
| Performance en homepage | Usar query con agregación SQL, no N+1 |
| Frontend type mismatch pre-existente | Corregir durante implementación o documentar |
| Migración en producción | Usar transacciones, testear en desarrollo primero |

---

## Decisiones de Diseño

| Decisión | Elección | Justificación |
|---|---|---|
| Autenticación | Sin auth (temporal) | No hay sistema de auth en el proyecto |
| Almacenamiento user_id | Hardcodeado `"anonymous_user"` | Temporal hasta implementar auth |
| Edición de rating | Permitida | Mejor UX, un usuario puede cambiar de opinión |
| Ubicación del rating | En todas partes | Homepage cards, detalle curso, página clase |
| Validación rating | CHECK constraint (1-5) | Validación en BD y backend |
