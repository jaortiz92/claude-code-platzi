# PlatziFlix - Project Architecture

PlatziFlix is a minimalist online course platform. Each course contains lessons with descriptions and video links. Teachers are assigned to courses via a many-to-many relationship.

## Project Structure

```
claude-code-platzi/
├── Backend/          # FastAPI + PostgreSQL
├── Frontend/         # Next.js 15 App Router
├── Mobile/
│   ├── PlatziFlixAndroid/   # Kotlin + Jetpack Compose
│   └── PlatziFlixiOS/       # Swift + SwiftUI
└── AGENTS.md
```

---

## Backend (`Backend/`)

### Tech Stack
| Component | Technology |
|---|---|
| Language | Python >=3.11 |
| Web Framework | FastAPI >=0.104.0 |
| ASGI Server | Uvicorn >=0.24.0 |
| ORM | SQLAlchemy >=2.0.0 |
| Database | PostgreSQL 15 (Docker) |
| DB Driver | psycopg2-binary >=2.9.0 |
| Migrations | Alembic >=1.13.0 |
| Configuration | pydantic-settings + python-dotenv |
| Package Manager | uv (Astral) |
| Testing | pytest >=7.0.0 |
| Containerization | Docker + Docker Compose |

### Directory Structure
```
Backend/
├── app/
│   ├── main.py              # FastAPI app, routes, dependency injection
│   ├── test_main.py         # Unit tests (pytest, mock-based)
│   ├── core/
│   │   └── config.py        # Settings (pydantic-settings)
│   ├── db/
│   │   ├── base.py          # SQLAlchemy engine, SessionLocal, get_db()
│   │   └── seed.py          # Sample data seeder
│   ├── models/
│   │   ├── base.py          # BaseModel (id, created_at, updated_at, deleted_at)
│   │   ├── teacher.py       # Teacher entity
│   │   ├── course.py        # Course entity
│   │   ├── lesson.py        # Lesson entity
│   │   └── course_teacher.py# Many-to-many association table
│   ├── services/
│   │   └── course_service.py# Business logic for course queries
│   └── alembic/             # Database migrations
├── specs/
│   ├── 00_contracts.md      # API contracts (entities, endpoints, JSON schemas)
│   └── 01_setup.md          # Step-by-step build guide
├── docker-compose.yml
├── Dockerfile
├── Makefile
└── pyproject.toml
```

### API Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/` | Welcome message |
| GET | `/health` | Health check with DB connectivity |
| GET | `/courses` | List all courses |
| GET | `/courses/{slug}` | Get course detail by slug |

### Database Models
```
teachers ──M:N──> courses ──1:N──> lessons
            (course_teachers)
```

**BaseModel fields:** `id` (Integer PK), `created_at`, `updated_at`, `deleted_at` (soft delete)

**Entities:**
- Teacher: `name`, `email` (unique, indexed)
- Course: `name`, `description` (Text), `thumbnail` (URL), `slug` (unique, indexed)
- Lesson: `course_id` (FK), `name`, `description`, `slug`, `video_url`
- course_teachers: composite PK (`course_id` + `teacher_id`)

### Makefile Commands
| Command | Action |
|---|---|
| `make start` | `docker-compose up -d` |
| `make stop` | `docker-compose down` |
| `make restart` | `docker-compose restart` |
| `make build` | `docker-compose build` |
| `make logs` | `docker-compose logs -f` |
| `make clean` | Remove containers, volumes, images, orphans |
| `make migrate` | Run `alembic upgrade head` inside API container |
| `make create-migration` | Interactive prompt for migration message |
| `make seed` | Run seeder |
| `make seed-fresh` | Clear all data, then re-seed |

### Patterns
- **Layered Architecture:** core/ → models/ → services/ → main.py
- **Dependency Injection:** FastAPI's `Depends()` for service injection
- **Soft Delete:** `deleted_at` nullable timestamp on all entities
- **Abstract Base Model:** Common fields shared across all entities
- **Service Pattern:** Business logic in service classes, returns plain dicts
- **Contract-Driven:** API contracts defined in specs/00_contracts.md before implementation

### Known Gaps
- Unused `Class` model in `app/models/class.py` (legacy, superseded by `Lesson`)
- Missing endpoint: `GET /courses/:slug/classes/:id` (defined in spec, not implemented)
- No Pydantic response models (returns raw dicts)
- No routers directory (all routes in main.py)
- Hardcoded DB URL in alembic.ini

---

## Frontend (`Frontend/`)

### Tech Stack
| Component | Technology |
|---|---|
| Framework | Next.js 15.3.3 (App Router) |
| React | React 19 |
| Language | TypeScript ^5 |
| Styling | SCSS Modules (Sass) ^1.77.0 |
| Testing | Vitest + Testing Library |
| Package Manager | Yarn |
| Node Version | v18.19.0 (.npmrc) |
| Linting | ESLint 9 (flat config) |

### Directory Structure
```
Frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Geist fonts, reset.scss)
│   │   ├── page.tsx                      # Homepage - course grid
│   │   ├── page.module.scss
│   │   ├── classes/[class_id]/
│   │   │   ├── page.tsx                  # Class detail + video player
│   │   │   ├── page.test.tsx
│   │   │   └── page.module.scss
│   │   └── course/[slug]/
│   │       ├── page.tsx                  # Course detail page
│   │       ├── loading.tsx               # Loading skeleton
│   │       ├── error.tsx                 # Error boundary (client)
│   │       └── not-found.tsx             # 404 page
│   ├── components/
│   │   ├── Course/                        # Course card component
│   │   ├── CourseDetail/                  # Full course detail view
│   │   └── VideoPlayer/                   # HTML5 video wrapper
│   ├── styles/
│   │   ├── vars.scss                     # SCSS color tokens + helper function
│   │   └── reset.scss                    # CSS reset
│   ├── test/setup.ts                     # Vitest global setup
│   └── types/index.ts                    # All TypeScript interfaces
├── docs/
│   └── curso-react-reproductor-video.feature  # Gherkin BDD spec
├── next.config.ts
├── vitest.config.ts
└── package.json
```

### Routes
| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Homepage - course grid |
| `/course/[slug]` | `app/course/[slug]/page.tsx` | Course detail |
| `/classes/[class_id]` | `app/classes/[class_id]/page.tsx` | Class page + video |

### Components
- **Course:** Stateless card component (thumbnail, title, teacher, duration)
- **CourseDetail:** Full course view with class list
- **VideoPlayer:** HTML5 video wrapper with 16:9 aspect ratio

### Design Tokens (vars.scss)
```
Primary:        #ff2d2d (Platzi red)
Primary Light:  rgba(255, 45, 45, 0.1)
White:          #fff
Off-white:      #fafafa
Text Primary:   #111
Text Secondary: #222
```

### Patterns
- **Server Components:** All pages are async Server Components with direct `fetch()`
- **No Client State:** No Redux, Zustand, or Context - all data server-driven
- **CSS Modules:** Locally scoped styles with global SCSS tokens
- **Component-per-folder:** Co-located test, styles, and component files
- **Special Files:** `loading.tsx`, `error.tsx`, `not-found.tsx` for route states

### Known Gaps
- API base URL hardcoded (`http://localhost:8000`) in 3 files
- Unused TS interfaces: `Progress`, `Quiz`, `QuizOption`, `FavoriteToggle`
- No middleware, no API routes, no auth, no i18n
- Only CourseDetail has responsive design (768px breakpoint)
- Duplicated card styles between Course.module.scss and page.module.scss

---

## Mobile (`Mobile/`)

### Android (`PlatziFlixAndroid/`)

**Tech Stack:**
- Kotlin 2.0.21
- Jetpack Compose + Material 3
- Retrofit 2.9.0 + OkHttp 4.12.0
- Coil Compose 2.5.0
- Architecture: Clean Architecture + MVI

**Directory Structure:**
```
PlatziFlixAndroid/app/src/main/java/com/espaciotiago/platziflixandroid/
├── MainActivity.kt
├── di/AppModule.kt                      # Manual DI (singleton)
├── data/
│   ├── entities/CourseDTO.kt            # API DTO
│   ├── mappers/CourseMapper.kt          # DTO -> Domain
│   ├── network/ApiService.kt            # Retrofit interface
│   ├── network/NetworkModule.kt         # Retrofit/OkHttp config
│   └── repositories/
│       ├── RemoteCourseRepository.kt    # Real API
│       └── MockCourseRepository.kt      # Mock data
├── domain/
│   ├── models/Course.kt                 # Domain model
│   └── repositories/CourseRepository.kt # Interface
├── presentation/courses/
│   ├── components/CourseCard.kt, ErrorMessage.kt, LoadingIndicator.kt
│   ├── screen/CourseListScreen.kt
│   ├── state/CourseListUiState.kt       # UiState + UiEvent sealed class
│   └── viewmodel/CourseListViewModel.kt
└── ui/theme/Color.kt, Spacing.kt, Theme.kt, Type.kt
```

**API Integration:**
- Base URL: `http://10.0.2.2:8000/` (Android emulator localhost proxy)
- Endpoint: `GET /courses`
- Toggleable mock mode: `AppModule.USE_MOCK_DATA`

**State Management:**
- `StateFlow<CourseListUiState>` in ViewModel
- UiState: `isLoading`, `courses`, `error`, `isRefreshing`
- UiEvent sealed class: `LoadCourses`, `RefreshCourses`, `ClearError`

**Tests:** 4 unit tests in `CourseListViewModelTest.kt`

### iOS (`PlatziFlixiOS/`)

**Tech Stack:**
- Swift 5.0
- SwiftUI (no UIKit)
- URLSession (custom networking, zero external dependencies)
- Architecture: Clean Architecture + MVVM

**Directory Structure:**
```
PlatziFlixiOS/PlatziFlixiOS/
├── PlatziFlixiOSApp.swift               # @main entry point
├── ContentView.swift                    # Root view
├── Services/
│   ├── APIEndpoint.swift                # Protocol for endpoints
│   ├── HTTPMethod.swift                 # Enum: GET, POST, etc.
│   ├── NetworkError.swift               # Error enum
│   ├── NetworkManager.swift             # URLSession singleton
│   └── NetworkService.swift             # Protocol + decoding
├── Data/
│   ├── Entities/CourseDTO.swift, TeacherDTO.swift, ClassDetailDTO.swift
│   ├── Mapper/CourseMapper.swift, ClassMapper.swift, TeacherMapper.swift
│   └── Repositories/CourseAPIEndpoints.swift, RemoteCourseRepository.swift
├── Domain/
│   ├── Models/Course.swift, Teacher.swift, Class.swift
│   └── Repositories/CourseRepositoryProtocol.swift
├── Presentation/
│   ├── ViewModels/CourseListViewModel.swift  # @MainActor ObservableObject
│   └── Views/CourseListView.swift, CourseCardView.swift, DesignSystem.swift
```

**API Integration:**
- Base URL: `http://localhost:8000` (iOS Simulator)
- Endpoints: `GET /courses`, `GET /courses/{slug}`

**State Management:**
- `@Published` properties: `courses`, `isLoading`, `errorMessage`, `searchText`
- Combine for search debounce (300ms)
- Async/await for repository calls

**Features (more mature than Android):**
- Search functionality with debounce
- Native pull-to-refresh
- More domain models (Teacher, Class)
- More API endpoints defined
- Comprehensive accessibility support

**Tests:** Empty (only boilerplate)

### Mobile Comparison
| Aspect | Android | iOS |
|---|---|---|
| Language | Kotlin 2.0 | Swift 5.0 |
| UI | Compose + M3 | SwiftUI |
| Architecture | Clean Arch + MVI | Clean Arch + MVVM |
| Networking | Retrofit + OkHttp | URLSession custom |
| State | StateFlow + sealed | @Published + Combine |
| Tests | 4 ViewModel tests | Empty |
| Search | Not implemented | Implemented |
| External Deps | 6 libraries | 0 (all native) |
| Domain Models | Course only | Course, Teacher, Class |

---

## Cross-Cutting Concerns

### Shared API Contract
All clients consume the same FastAPI backend. Same JSON response shapes.

### Authentication
Not implemented in any component.

### Environment Variables
- Backend: `DATABASE_URL` (PostgreSQL connection string)
- Frontend: API URL hardcoded (`http://localhost:8000`)
- Android: `http://10.0.2.2:8000/` (emulator proxy)
- iOS: `http://localhost:8000` (simulator)

### Testing
| Component | Framework | Coverage |
|---|---|---|
| Backend | pytest | Unit tests with mocked services |
| Frontend | Vitest + Testing Library | 3 test files (VideoPlayer, Course, ClassPage) |
| Android | JUnit 4 | 4 ViewModel tests |
| iOS | XCTest | Empty |

### Design Tokens (shared visual language)
- Primary color: `#ff2d2d` (Platzi red)
- Corner radius: 18px (cards)
- Spacing scale: 4/8/12/16/24/32/48/64dp
- Hover effects: `translateY(-8px) scale(1.02)`

---

## Development Workflow

### Backend
```bash
cd Backend
make start          # Start containers (db + api)
make migrate        # Run migrations
make seed           # Seed sample data
make logs           # View logs
make stop           # Stop containers
```

### Frontend
```bash
cd Frontend
yarn install
yarn dev            # Start dev server on :3000
yarn test           # Run Vitest tests
```

### Mobile
- **Android:** Open `PlatziFlixAndroid/` in Android Studio, run on emulator
- **iOS:** Open `PlatziFlixiOS/PlatziFlixiOS.xcodeproj` in Xcode, run on simulator
