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

1. Crear `Backend/app/models/course_rating.py`
   - Heredar de `BaseModel`
   - Campo `course_id` con FK a `courses.id`
   - Campo `user_id` (String 100)
   - Campo `rating` (Integer)
   - `__table_args__` con CheckConstraint y UniqueConstraint
   - Relationship `course` con `back_populates`

2. Modificar `Backend/app/models/__init__.py`
   - Agregar import de `CourseRating`
   - Agregar a `__all__`

3. Modificar `Backend/app/models/course.py`
   - Agregar relationship `ratings = relationship("CourseRating", back_populates="course")`

4. Crear migración Alembic
   - Ejecutar `make create-migration` con mensaje "add course_ratings table"
   - En la migración, crear partial unique index:
     ```python
     op.create_index(
         'uq_course_ratings_active',
         'course_ratings',
         ['course_id', 'user_id'],
         unique=True,
         postgresql_where='deleted_at IS NULL'
     )
     ```

5. Ejecutar migración
   - `make migrate`

### Fase 2: Schema y Servicio

1. Crear directorio `Backend/app/schemas/`
2. Crear `Backend/app/schemas/__init__.py` (vacío)
3. Crear `Backend/app/schemas/course_rating.py`
   - `RatingCreate` (user_id, rating con validación 1-5)
   - `RatingResponse` (id, course_id, user_id, rating, created_at, updated_at)
   - `RatingSummary` (average, count, user_rating nullable)

4. Crear `Backend/app/services/rating_service.py`
   - `get_rating_summary(slug, user_id=None)` → dict con average, count, user_rating
   - `upsert_rating(slug, user_id, rating)` → dict con rating creado/actualizado
   - `delete_rating(slug, user_id)` → bool

5. Modificar `Backend/app/services/course_service.py`
   - En `get_course_by_slug()`, agregar campo `rating` al response
   - Query de agregación: `func.avg()` y `func.count()` sobre `CourseRating`

### Fase 3: Endpoints

1. Modificar `Backend/app/main.py`
   - Importar `RatingService` y schemas
   - Crear dependencia `get_rating_service`
   - Agregar 3 endpoints:
     - `GET /courses/{slug}/rating`
     - `POST /courses/{slug}/rating` (status 201)
     - `DELETE /courses/{slug}/rating`

### Fase 4: Tests

1. Modificar `Backend/app/test_main.py`
   - Agregar fixture `mock_rating_service`
   - Actualizar fixture `client` para incluir override de `get_rating_service`
   - Agregar clase `TestRatingEndpoints`:
     - `test_get_rating_summary_success`
     - `test_get_rating_summary_no_user`
     - `test_get_rating_summary_course_not_found`
     - `test_create_rating_success`
     - `test_update_existing_rating`
     - `test_create_rating_invalid_rating_too_low` (422)
     - `test_create_rating_invalid_rating_too_high` (422)
     - `test_create_rating_course_not_found`
     - `test_delete_rating_success`
     - `test_delete_rating_not_found`

---

## Archivos a Crear/Modificar

### Archivos Nuevos (4)
```
Backend/app/models/course_rating.py
Backend/app/schemas/__init__.py
Backend/app/schemas/course_rating.py
Backend/app/services/rating_service.py
```

### Archivos Modificados (5)
```
Backend/app/models/__init__.py
Backend/app/models/course.py
Backend/app/services/course_service.py
Backend/app/main.py
Backend/app/test_main.py
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
