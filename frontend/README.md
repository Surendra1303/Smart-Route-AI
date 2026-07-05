# LearnFlow Frontend

Personalized Learning Roadmap - AI-powered platform for skill gap analysis, learning roadmaps, and interview preparation.

## 🚀 Installation

### Prerequisites

* Node.js v20+
* pnpm

### Setup

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd frontend
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open:

```txt
http://localhost:5173
```

## 📜 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build production bundle
pnpm preview      # Preview production build

pnpm lint         # Run lint checks
pnpm format       # Format code
pnpm check        # Run Biome checks
pnpm check:fix    # Automatically fix issues
```

## � Features

### Authentication
- Google OAuth integration
- GitHub OAuth integration
- Zustand-based authentication state management
- Persistent auth sessions with localStorage

### Profile Analysis
- **Resume Analysis**
  - AI-powered resume scoring with company-level strictness
  - ATS optimization tips and keyword analysis
  - Quantifiable achievement detection
  - Career fit scoring based on role requirements
  - Compact, user-friendly UI

- **GitHub Analysis**
  - GitHub profile integration (bio, location, followers, following, public repos)
  - Separate GitHub avatar storage (doesn't overwrite Google avatar)
  - Repository analysis with language breakdown
  - AI-powered insights and recommendations
  - Resync button for updating GitHub data
  - Real-time profile statistics

### Skill Gap Analysis
- AI-driven skill gap identification
- Personalized learning roadmaps
- Career coach recommendations
- Assessment and interview preparation

### UI/UX Improvements
- Clean, modern interface with consistent design
- Removed unnecessary UI elements (dashboard arrows, username display)
- Compact layouts for better readability
- Responsive design for all screen sizes
- Improved navigation and user experience

## �🏗️ Architecture

The application follows a **Feature-Based Architecture**.

Each feature owns its:

* Components
* Hooks
* Services
* Store
* Schemas
* Types
* Utilities
* Static Data

This keeps business logic close to the feature it belongs to and prevents the codebase from becoming difficult to maintain as it grows.

### Rule of Thumb

Before creating a file in a root-level directory, ask:

> Will this be used by multiple features?

If yes → place it in a shared/global directory.

If no → keep it inside the feature.

## 📂 Project Structure

```txt
src
│
├── assets/

├── components/
│   ├── common/              # Shared reusable components
│   └── ui/                  # Shadcn UI components

├── constants/              # Global constants
├── hooks/                  # Shared hooks
├── layouts/                # Application layouts
├── providers/              # Global providers
├── routes/                 # TanStack Router routes
├── schemas/                # Shared schemas
├── services/               # Shared services
├── store/                  # Global stores
├── types/                  # Shared types
├── lib/                    # Shared
│
├── features/
│   │
│   ├── authentication/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── schemas/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── data/
│   │   └── index.ts
│   │
│   ├── profile-analysis/
│   ├── skill-gap-analysis/
│   ├── roadmap-generation/
│   ├── recommendations/
│   ├── progress-tracking/
│   ├── interview-preparation/
│   ├── mentor-feedback/
│   └── chatbot/
│
├── main.tsx
└── ...
```

## 📁 Folder Responsibilities

| Folder            | Responsibility                  |
| ----------------- | ------------------------------- |
| features          | Feature-specific business logic |
| components/common | Shared reusable components      |
| components/ui     | Shadcn UI components            |
| types             | Shared TypeScript types         |
| schemas           | Shared Zod schemas             |
| utils             | Shared utility functions        |
| providers         | Application providers          |
| store             | Global Zustand stores           |
| routes            | Route definitions              |
| layouts           | Application layouts            |
| constants         | Application-wide constants      |

## 🔒 Environment Variables

```env
VITE_API_URL=http://localhost:5001
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### OAuth Redirect URIs

Google: `http://localhost:5173/auth/google/callback`  
GitHub: `http://localhost:5173/auth/callback`

## 🗄️ Database Schema

The application uses PostgreSQL with the following key user fields:

- `avatarUrl` - Google/OAuth avatar (used in dashboard)
- `githubAvatarUrl` - GitHub profile avatar (used in GitHub analysis)
- `githubUsername` - GitHub username
- `githubBio` - GitHub profile bio
- `githubLocation` - GitHub profile location
- `githubFollowers` - GitHub followers count
- `githubFollowing` - GitHub following count
- `githubPublicRepos` - GitHub public repositories count

## 🎨 Design System

- **Colors**: Primary `#171C4A`, Background `#F8F6E8`, Accent `#F2DD85`
- **Typography**: Bold headings, clean sans-serif fonts
- **Components**: Rounded corners (rounded-2xl, rounded-3xl), consistent spacing
- **Icons**: Lucide React icons and emoji for visual elements
