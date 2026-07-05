# SmartRoute: Intelligent Navigation & Infotainment Platform

SmartRoute is a production-grade, high-fidelity intelligent cockpit navigation and driver assistance platform comparable to modern commercial systems like Tesla Navigation, Rivian HUD, and Google Maps.

The platform combines real-time Mapbox 3D vector and satellite terrain renderings, crowdsourced incident alert grids, OBD-II vehicle telemetry simulations, offline map downloads via IndexedDB, and an interactive generative AI co-pilot.

---

## 🏗️ Architecture Design

```mermaid
graph TD
    subgraph Client Layer (Frontend)
        A[React + TS Web Client]
        B[Mapbox GL JS HUD]
        C[IndexedDB Offline Cache]
        A --> B
        A --> C
    end

    subgraph Service Layer (Backend)
        D[Express Router]
        E[OBD-II Engine Simulator]
        F[AI Context Agent]
        G[Redis Cache Middleware]
        
        D --> E
        D --> F
        D --> G
    end

    subgraph Storage Layer
        H[(PostgreSQL DB)]
        I[(Redis Session Store)]
    end

    A -->|HTTPS REST| D
    E --> H
    F -->|Gemini API| J[Google Generative AI]
    G --> I
```

---

## 📊 Database Schema (Prisma ERD)

- **User**: Driving preferences, Eco scores, and accumulated badges.
- **Vehicle**: OBD-II real-time diagnostics parameters.
- **Trip**: History logs tracking distance, efficiency, carbon emissions, and safety scores.
- **IncidentReport**: Crowdsourced hazards (Potholes, Accidents, Floods, Police checkposts).
- **SavedPlace**: Navigation quick links (Home, Work, Charging stations).
- **AIConversation**: Chat history backups for context awareness.

---

## ⚙️ Environment Configuration

### Frontend Config (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:5001
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### Backend Config (`backend/.env`)
```bash
PORT=5001
DATABASE_URL=postgresql://postgres:postgree123@localhost:5432/smartroute?schema=public
JWT_SECRET=production_random_hash_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🚀 Getting Started

### Local Setup

1. **Start the backend server**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run build
   npm run dev
   ```
2. **Start the frontend interface**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
3. Open browser at `http://localhost:5173`.

---

## 🐳 Docker Deployment

The platform is fully containerized and ready for production deployment using Docker Compose:

```bash
docker-compose up --build -d
```
This boots:
- PostgreSQL database container
- Redis caching layer container
- Node.js Express Backend container
- Vite React Frontend container