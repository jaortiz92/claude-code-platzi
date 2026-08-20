# Platziflix

plataforma online de cursos, cada cursos tiene clases, descripciones y no hay mucho mas, eso es el inicio.

## Stacks

### Frontend
- Typescript
- CSS modules
- SASS

### Mobile
- iOS:
    - Swift
    - SwiftUI
- Android:
    - Kotlin
    - Jetpack Compose

### Backend
- Python
- FastAPI
- PostgreSQl

## Contratos

### Entidades
1. Curso
2. Clases
3. Profesor

### Contratos


- Course
```json
{
    "id": 1,
    "title": "Curso de React",
    "description": "Curso de React",
    "thumbnail": "https://via.placeholder.com/150",
    "slug": "curso-de-react",
    "teacher": "Juan Pérez",
    "duration": 0,
    "teacher_id": [1, 2, 3]
}
```

- Clases:
```json
{
    "id": 1,
    "title": "Clase 1",
    "description": "Clase 1",
    "slug": "clase-1",
    "video": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "duration": 0
}
```

- Teacher
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2021-01-01",
    "updated_at": "2021-01-01",
    "deleted_at": "2021-01-01"
}
```

### Endpoints

- GET /courses -> Listar todos los cursos
```json
[
    {
        "id": 1,
        "title": "Curso de React",
        "description": "Curso de React",
        "thumbnail": "https://via.placeholder.com/150",
        "slug": "curso-de-react",
        "teacher": "Juan Pérez",
        "duration": 0
    }
]
```

- GET /courses/:slug -> Obtener un curso
```json
{
    "id": 1,
    "title": "Curso de React",
    "description": "Curso de React",
    "thumbnail": "https://via.placeholder.com/150",
    "slug": "curso-de-react",
    "teacher": "Juan Pérez",
    "duration": 0,
    "teacher_id": [1, 2, 3],
    "classes": [
        {
            "id": 1,
            "title": "Clase 1",
            "description": "Clase 1",
            "slug": "clase-1",
            "video": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "duration": 0
        }
    ]
}
```
- GET /courses/:slug/classes/:id -> Obtener una clase
```json
{
    "id": 1,
    "title": "Clase 1",
    "description": "Clase 1",
    "slug": "clase-1",
    "video": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "duration": 0
}
```