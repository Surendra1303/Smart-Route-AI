# LearnFlow Backend

Express + TypeScript REST API with Prisma ORM and PostgreSQL.

## Features

### Authentication
- Google OAuth integration with account linking
- GitHub OAuth integration with repository syncing
- JWT-based authentication
- User profile management

### Profile Analysis
- **Resume Analysis**
  - AI-powered resume scoring with company-level strictness
  - ATS optimization analysis and keyword density checking
  - Quantifiable achievement detection
  - Career fit scoring based on role requirements
  - Strict scoring criteria (30% keywords, 25% achievements, 20% experience, 15% ATS, 10% education)

- **GitHub Analysis**
  - GitHub profile data fetching (bio, location, followers, following, public repos)
  - Separate GitHub avatar storage (githubAvatarUrl)
  - Repository syncing and analysis
  - Language breakdown and statistics
  - Real-time profile updates

### Skill Gap Analysis
- AI-driven skill gap identification
- Personalized learning roadmaps
- Career coach recommendations
- Assessment generation

## Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
    ├── config/          # Environment variables
    ├── lib/             # Prisma client, auth, resume helpers
    ├── middleware/      # JWT authentication
    ├── routes/          # API route modules
    ├── services/        # AI, analysis, career goals, GitHub
    ├── app.ts           # Express app setup
    └── server.ts        # Entry point
```

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate dev
```

## Run

```bash
pnpm dev
```

API runs at **http://localhost:5001**

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start with nodemon |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled server |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run migrations |

## Environment

See `.env.example` for all variables. `DATABASE_URL` is required — the server exits if PostgreSQL is unreachable.

## Database Schema

### User Model
- `avatarUrl` - Google/OAuth avatar (used in dashboard)
- `githubAvatarUrl` - GitHub profile avatar (used in GitHub analysis)
- `githubUsername` - GitHub username
- `githubBio` - GitHub profile bio
- `githubLocation` - GitHub profile location
- `githubFollowers` - GitHub followers count
- `githubFollowing` - GitHub following count
- `githubPublicRepos` - GitHub public repositories count
- `careerGoal` - User's target career goal
- `skills` - Array of user skills
- `resumeData` - JSON resume analysis data

### Repository Model
- Stores synced GitHub repositories
- Includes language, stars, forks, and metadata
- Linked to user account

### SkillGap Model
- Stores skill gap analysis results
- Includes match score, skill categories, and roadmap
- Linked to user account

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth callback
- `POST /api/auth/github` - GitHub OAuth callback

### User
- `GET /api/user/profile` - Get user profile with GitHub data
- `PATCH /api/user/career-goal` - Update career goal
- `POST /api/user/resume` - Save resume data
- `GET /api/user/dashboard` - Get dashboard data

### Resume
- `POST /api/resume/analyze` - Analyze resume with AI

### GitHub
- `POST /api/github/sync` - Sync GitHub repositories
- `POST /api/github/analyze` - Analyze GitHub data

### Skill Gap
- `POST /api/skill-gap/analyze` - Analyze skill gaps
- `GET /api/skill-gap/latest` - Get latest skill gap analysis

### Assessment
- `POST /api/assessment/submit` - Submit assessment answers
