# LessonGo - School Management System

A comprehensive school management system with role-based dashboards for administrators, teachers, students, and parents.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

## 🎯 Overview

EduManager is a modern school management platform featuring:

- **4 Role-Based Portals** - Admin, Teacher, Student, and Parent dashboards
- **Assignment System** - Create, submit, and grade assignments with file uploads
- **Parent Portal** - Monitor children's academic progress and communicate with teachers
- **Calendar Integration** - School-wide calendar with iCal export support
- **Progress Analytics** - Visual grade trends, attendance patterns, and performance insights
- **QR Attendance** - Quick check-in with location verification
- **Real-time Communication** - In-app messaging and announcements
- **AI Assistant** - Educational support powered by OpenAI

## ✨ New Features (Recently Added)

### 1. 📝 Assignment Submission System
- Teachers create assignments with due dates and scoring
- Students submit work with file uploads
- Inline grading with scores and feedback
- Track submission status (pending, submitted, graded, late)

### 2. 👨‍👩‍👧 Parent Portal
- View children's grades and attendance
- Monitor academic progress with charts
- Access child's schedule and calendar
- Communicate directly with teachers
- View school announcements

### 3. 📅 Calendar Integration
- School-wide event calendar
- Color-coded event types (classes, quizzes, exams, holidays)
- Create and manage events (teachers/admins)
- Export to iCal format (Google Calendar, Apple Calendar, Outlook)
- Role-based event filtering

### 4. 📊 Progress Analytics Dashboard
- Interactive grade trend charts
- Subject performance breakdown
- Attendance pattern visualization
- Improvement rate tracking
- Teacher view of class analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd School-Management-System

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
pnpm build
pnpm start
```

## 📖 Documentation

- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature documentation
- **[QUICK_START.md](./QUICK_START.md)** - Step-by-step testing guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and data flow
- **[NEW_FEATURES_SUMMARY.md](./NEW_FEATURES_SUMMARY.md)** - Implementation summary

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Secure data access policies
- Type-safe database queries with generated TypeScript types

### State Management
- **Zustand** - Lightweight state management
- Supabase for persistent data storage

### Key Libraries
- **Recharts** - Data visualization and charts
- **date-fns** - Date manipulation and formatting
- **Lucide React** - Icon library
- **Vercel AI SDK** - AI chat integration

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── teacher/           # Teacher dashboard
│   ├── student/           # Student dashboard
│   ├── parent/            # Parent portal (NEW)
│   └── api/               # API routes
│
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── assignment-list.tsx           # Student assignments (NEW)
│   ├── teacher-assignment-manager.tsx # Teacher assignments (NEW)
│   ├── calendar-view.tsx             # Calendar component (NEW)
│   ├── progress-analytics.tsx        # Analytics dashboard (NEW)
│   └── ...
│
├── lib/                   # Utilities and stores
│   ├── supabase/         # Supabase client & queries (NEW)
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   ├── queries.ts    # Database queries
│   │   └── types.ts      # Query helpers
│   ├── database.types.ts # Generated Supabase types (NEW)
│   ├── assignment-store.ts    # Assignment state (NEW)
│   ├── parent-store.ts        # Parent state (NEW)
│   ├── calendar-store.ts      # Calendar state (NEW)
│   ├── analytics-store.ts     # Analytics state (NEW)
│   └── ...
│
├── supabase/             # Database migrations (NEW)
│   └── migrations/       # SQL migration files
│
└── docs/                  # Documentation
    └── SUPABASE_MIGRATION_PLAN.md  # Migration guide (NEW)
```

## 🎭 User Roles

### Admin
- Full system access
- User management
- School-wide calendar management
- System analytics

### Teacher
- Class management
- Create assignments and quizzes
- Grade submissions
- Track attendance
- View class analytics
- Manage calendar events

### Student
- View classes and schedule
- Submit assignments
- Take quizzes
- Check grades
- View progress analytics
- QR code check-in

### Parent
- View children's grades
- Monitor attendance
- Access calendar
- Message teachers
- View announcements

## 🔑 Key Features

### Assignment System
- Create assignments with due dates
- File upload for submissions
- Inline grading with feedback
- Status tracking (pending, submitted, graded, late)
- Late submission control

### Calendar
- Month view with navigation
- Multiple event types (class, quiz, assignment, exam, holiday, meeting)
- iCal export for external calendars
- Role-based filtering
- All-day and timed events

### Analytics
- Grade trend line charts
- Subject performance bar charts
- Attendance pie charts
- Improvement rate indicators
- Class-wide analytics for teachers

### Parent Portal
- Multi-child support
- Grade trends with charts
- Attendance breakdown
- Calendar view
- Teacher communication

## 🧪 Testing

The application includes comprehensive mock data for immediate testing:

- **3 sample assignments** across different classes
- **4 parent accounts** with linked children
- **6 calendar events** of various types
- **Analytics data** for 2 students with trends

See [QUICK_START.md](./QUICK_START.md) for detailed testing instructions.

## 🛠️ Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Assistant (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

The application uses Supabase for data persistence:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/` directory
3. Configure environment variables with your project credentials
4. Database types are auto-generated in `lib/database.types.ts`

See [docs/SUPABASE_MIGRATION_PLAN.md](./docs/SUPABASE_MIGRATION_PLAN.md) for detailed migration information.

## 📊 Build Status

✅ All TypeScript files compile successfully  
✅ Production build passes  
✅ No linting errors  
✅ All routes generated correctly  

## 🤝 Contributing

This project uses Supabase for database management with:

- PostgreSQL database with Row Level Security (RLS)
- Type-safe queries using generated TypeScript types
- Migration-based schema management
- Real-time subscriptions for live updates

For development:

1. Set up Supabase project and configure `.env.local`
2. Run database migrations from `supabase/migrations/`
3. Generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts`
4. Follow TypeScript strict mode conventions

## 📝 License

This project is for educational and demonstration purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Charts powered by [Recharts](https://recharts.org)

---

**Note:** This application uses Supabase for data persistence with PostgreSQL and Row Level Security. Database schema is managed through migrations in the `supabase/migrations/` directory.

For detailed feature documentation, see [FEATURES.md](./FEATURES.md).  
For database migration information, see [docs/SUPABASE_MIGRATION_PLAN.md](./docs/SUPABASE_MIGRATION_PLAN.md).
