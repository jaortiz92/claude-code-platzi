# Sistema de Ratings - Backend

## Problema

El proyecto PlatziFlix no tiene un sistema de calificación para cursos. Se necesita implementar un sistema de ratings (1-5 estrellas) que permita a los usuarios calificar cursos. No hay autenticación, por lo que se usará un usuario anónimo hardcodeado temporalmente.

---

## Entidad: CourseRating

### Tabla: `course_ratings`

| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Integer | PK |
| `course_id` | Integer | FK → courses.id, NOT NULL, INDEX |
| `user_id` | String(100) | NOT NULL |
| `rating` | Integer | NOT NULL, CHECK (1-5) |
| `created_at` | DateTime | Heredado de BaseModel |
| `updated_at` | DateTime | Heredado de BaseModel |
| `deleted_at` | DateTime | Nullable (soft-delete) |

### Constraints

- **Único activo:** `UNIQUE (course_id, user_id) WHERE deleted_at IS NULL` (partial index)
- **Relación:** `Course.course_ratings` (1:N)

### Nota sobre Soft-Delete

Se usa un **partial unique index** para permitir soft-delete sin conflicto con la restricción UNIQUE:

```sql
CREATE UNIQUE INDEX uq_course_ratings_active 
ON course_ratings (course_id, user_id) 
WHERE deleted_at IS NULL;
```

Esto permite:
1. Soft-delete (set `deleted_at` en vez de eliminar)
2. Re-calificar después de eliminar (nueva fila activa)
3. Unicidad solo para ratings activos

---

## Diagrama de Relaciones

```
teachers ──M:N──> courses ──1:N──> lessons
            (course_teachers)
                │
                │ 1:N
                ▼
         course_ratings
```

---

## API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/courses/{slug}/rating` | Obtener resumen de rating (promedio, count, rating del usuario) |
| `POST` | `/courses/{slug}/rating` | Crear o actualizar rating |
| `DELETE` | `/courses/{slug}/rating` | Eliminar rating del usuario |

---

## Contratos de API

### GET /courses/{slug}/rating

**Query Parameters:**
- `user_id` (string, optional): ID del usuario para obtener su rating

**Response 200:**
```json
{
  "average": 4.5,
  "count": 10,
  "user_rating": 5
}
```

**Response 404:**
```json
{
  "detail": "Course not found"
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

**Response 404:**
```json
{
  "detail": "Course not found"
}
```

**Response 422 (validación):**
```json
{
  "detail": [
    {
      "loc": ["body", "rating"],
      "msg": "ensure this value is greater than or equal to 1",
      "type": "value_error.number_not_ge"
    }
  ]
}
```

### DELETE /courses/{slug}/rating

**Query Parameters:**
- `user_id` (string, required): ID del usuario

**Response 200:**
```json
{
  "message": "Rating eliminado"
}
```

**Response 404:**
```json
{
  "detail": "Rating not found"
}
```

---

## Plan de Implementación

### Fase 1: Modelo y Migración

- [x] Crear `Backend/app/models/course_rating.py`
   - [x] Heredar de `BaseModel`
   - [x] Campo `course_id` con FK a `courses.id`
   - [x] Campo `user_id` (String 100)
   - [x] Campo `rating` (Integer)
   - [x] `__table_args__` con CheckConstraint y UniqueConstraint
   - [x] Relationship `course` con `back_populates`

- [x] Modificar `Backend/app/models/__init__.py`
   - [x] Agregar import de `CourseRating`
   - [x] Agregar a `__all__`

- [x] Modificar `Backend/app/models/course.py`
   - [x] Agregar relationship `ratings = relationship("CourseRating", back_populates="course")`

- [x] Crear migración Alembic
   - [x] Crear archivo `Backend/app/alembic/versions/a1b2c3d4e5f6_add_course_ratings_table.py`
   - [x] Partial unique index `uq_course_ratings_active` con `postgresql_where='deleted_at IS NULL'`

- [x] Ejecutar migración
   - [x] `make migrate` ejecutado correctamente

### Fase 2: Schema y Servicio

- [x] Crear directorio `Backend/app/schemas/`
- [x] Crear `Backend/app/schemas/__init__.py` (vacío)
- [x] Crear `Backend/app/schemas/course_rating.py`
   - [x] `RatingCreate` (user_id, rating con validación 1-5)
   - [x] `RatingResponse` (id, course_id, user_id, rating, created_at, updated_at)
   - [x] `RatingSummary` (average, count, user_rating nullable)

- [x] Crear `Backend/app/services/rating_service.py`
   - [x] `get_rating_summary(slug, user_id=None)` → dict con average, count, user_rating
   - [x] `upsert_rating(slug, user_id, rating)` → dict con rating creado/actualizado
   - [x] `delete_rating(slug, user_id)` → bool

- [x] Modificar `Backend/app/services/course_service.py`
   - [x] En `get_course_by_slug()`, agregar campo `rating` al response
   - [x] Query de agregación: `func.avg()` y `func.count()` sobre `CourseRating`

### Fase 3: Endpoints

- [x] Modificar `Backend/app/main.py`
   - [x] Importar `RatingService` y schemas
   - [x] Crear dependencia `get_rating_service`
   - [x] Agregar 3 endpoints:
     - [x] `GET /courses/{slug}/rating`
     - [x] `POST /courses/{slug}/rating` (status 201)
     - [x] `DELETE /courses/{slug}/rating`

### Fase 4: Tests

- [x] Modificar `Backend/app/test_main.py`
   - [x] Agregar fixture `mock_rating_service`
   - [x] Actualizar fixture `client` para incluir override de `get_rating_service`
   - [x] Agregar clase `TestRatingEndpoints`:
     - [x] `test_get_rating_summary_success`
     - [x] `test_get_rating_summary_no_user`
     - [x] `test_get_rating_summary_course_not_found`
     - [x] `test_create_rating_success`
     - [x] `test_update_existing_rating`
     - [x] `test_create_rating_invalid_rating_too_low` (422)
     - [x] `test_create_rating_invalid_rating_too_high` (422)
     - [x] `test_create_rating_course_not_found`
     - [x] `test_delete_rating_success`
     - [x] `test_delete_rating_not_found`

---

## Archivos a Crear/Modificar

### Archivos Nuevos (4)
```
[x] Backend/app/models/course_rating.py
[x] Backend/app/schemas/__init__.py
[x] Backend/app/schemas/course_rating.py
[x] Backend/app/services/rating_service.py
```

### Archivos Modificados (5)
```
[x] Backend/app/models/__init__.py
[x] Backend/app/models/course.py
[x] Backend/app/services/course_service.py
[x] Backend/app/main.py
[x] Backend/app/test_main.py
```

---

## Decisiones de Diseño

| Decisión | Elección | Justificación |
|---|---|---|
| Soft-delete | Partial unique index | Permite re-calificar después de eliminar sin conflicto UNIQUE |
| Autenticación | Sin auth (temporal) | No hay sistema de auth en el proyecto |
| Almacenamiento user_id | Request body / query param | Temporal hasta implementar auth |
| Edición de rating | Upsert (crear o actualizar) | Mejor UX, un usuario puede cambiar de opinión |
| Validación rating | CHECK constraint (1-5) + Pydantic | Validación en BD y backend |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Sin autenticación real | User ID en request body/params, preparar para JWT futuro |
| Performance en homepage | Usar query con agregación SQL en course_service, no N+1 |
| Partial index en desarrollo | Asegurar PostgreSQL 12+ (soporta WHERE en UNIQUE INDEX) |
| Migración en producción | Usar transacciones, testear en desarrollo primero |

---

## Comandos de Verificación

```bash
# Ejecutar tests
make test

# Ejecutar solo tests de ratings
pytest Backend/app/test_main.py::TestRatingEndpoints -v

# Verificar migración
make migrate

# Verificar endpoints manualmente
curl http://localhost:8000/courses/curso-de-react/rating
```
