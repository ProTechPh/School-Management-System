# Technology Stack

<cite>
**Referenced Files in This Document**   
- [package.json](file://package.json)
- [next.config.mjs](file://next.config.mjs)
- [tsconfig.json](file://tsconfig.json)
- [components.json](file://components.json)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)
- [lib/auth-store.ts](file://lib/auth-store.ts)
- [lib/analytics-store.ts](file://lib/analytics-store.ts)
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/theme-provider.tsx](file://components/theme-provider.tsx)
- [lib/utils.ts](file://lib/utils.ts)
- [app/layout.tsx](file://app/layout.tsx)
- [app/api/teacher/grades/create/route.ts](file://app/api/teacher/grades/create/route.ts)
- [components/progress-analytics.tsx](file://components/progress-analytics.tsx)
- [styles/globals.css](file://styles/globals.css)
</cite>

## Table of Contents
1. [Frontend Technologies](#frontend-technologies)
2. [Backend Technologies](#backend-technologies)
3. [State Management](#state-management)
4. [Data Visualization](#data-visualization)
5. [Third-Party Integrations](#third-party-integrations)
6. [Configuration Files](#configuration-files)
7. [Technology Integration Examples](#technology-integration-examples)
8. [Version Compatibility and Setup](#version-compatibility-and-setup)

## Frontend Technologies

The School-Management-System frontend is built on a modern technology stack centered around Next.js 16 with App Router, React Server Components, TypeScript 5, Tailwind CSS 4, and shadcn/ui component library. The application leverages React 19 features including server components for optimized performance and reduced client-side JavaScript bundle size.

Next.js App Router enables server-side rendering and route handling with a file-based routing system. The application structure follows the App Router conventions with route handlers in the `app/api` directory and page components organized by user roles (admin, teacher, student, parent). React Server Components are used extensively to render UI on the server, minimizing client-side hydration and improving performance.

TypeScript 5 provides type safety across the codebase, with type definitions for database schemas, API responses, and component props. The `tsconfig.json` configuration enables strict type checking and modern JavaScript features. Tailwind CSS 4 is used for utility-first styling with custom theme variables defined in `styles/globals.css` using the OKLCH color space for consistent light/dark mode support.

The shadcn/ui component library provides accessible, customizable UI components built on Radix UI primitives and styled with Tailwind CSS. Components are organized in the `components/ui` directory and follow the shadcn pattern of composable, unstyled primitives. The `components.json` configuration file specifies the component library settings, including the "new-york" style and Lucide icons.

**Section sources**
- [package.json](file://package.json#L57-L75)
- [tsconfig.json](file://tsconfig.json#L1-L42)
- [components.json](file://components.json#L1-L22)
- [app/layout.tsx](file://app/layout.tsx#L1-L43)
- [components/ui/button.tsx](file://components/ui/button.tsx#L1-L61)
- [styles/globals.css](file://styles/globals.css#L1-L126)

## Backend Technologies

The backend of the School-Management-System is powered by Supabase, which provides authentication, PostgreSQL database, storage, and real-time functionality. Supabase serves as a comprehensive backend-as-a-service solution, eliminating the need for a traditional backend server while providing enterprise-grade features.

Supabase Authentication handles user management with role-based access control for administrators, teachers, students, and parents. The authentication system is integrated with the application through the Supabase client SDK, with authentication state managed using React context and Zustand stores. The system implements secure authentication practices including rate limiting, session management, and security headers.

The PostgreSQL database schema is managed through Supabase migrations in the `supabase/migrations` directory, with over 100 migration files that establish tables for users, classes, attendance, grades, quizzes, lessons, schedule, communication, and school settings. Row Level Security (RLS) policies are implemented to enforce data access controls, ensuring users can only access data they are authorized to view.

Supabase Storage is used for file storage, including user avatars and lesson materials. The storage system is configured with security policies to control access to stored files. Real-time functionality is enabled through Supabase's real-time subscriptions, allowing instant updates to be pushed to clients when data changes.

The API routes in the `app/api` directory serve as the interface between the frontend and Supabase backend. These server-side routes handle data operations, implementing business logic, validation, and security checks before interacting with the Supabase database. The routes follow a role-based access pattern, with separate endpoints for admin, teacher, student, and parent functionality.

**Section sources**
- [package.json](file://package.json#L42-L43)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L1-L9)
- [app/api/teacher/grades/create/route.ts](file://app/api/teacher/grades/create/route.ts#L1-L105)
- [supabase/migrations](file://supabase/migrations)

## State Management

State management in the School-Management-System is implemented using Zustand stores, providing a lightweight and efficient solution for global state management. Zustand is used to manage authentication state, user profiles, analytics data, and other application-wide state that needs to be shared across components.

The `useAuthStore` in `lib/auth-store.ts` manages the authentication state, including the current user, profile information, and loading state. The store initializes by checking the authentication state with Supabase and subscribes to authentication state changes to keep the store synchronized. It includes methods for signing out and cleaning up subscriptions to prevent memory leaks.

Analytics data is managed by the `useAnalyticsStore` in `lib/analytics-store.ts`, which stores student analytics including grade trends, attendance trends, subject performance, and overall averages. The store provides methods to retrieve analytics data by student ID and calculate derived metrics such as attendance rates and improvement rates.

Zustand's simplicity and performance make it well-suited for this application, avoiding the complexity of larger state management solutions while providing the necessary features for global state management. The stores are designed with type safety using TypeScript interfaces, ensuring type consistency across the application.

**Section sources**
- [lib/auth-store.ts](file://lib/auth-store.ts#L1-L110)
- [lib/analytics-store.ts](file://lib/analytics-store.ts#L1-L83)
- [package.json](file://package.json#L75)

## Data Visualization

Data visualization in the School-Management-System is implemented using Recharts, a React-based charting library that provides declarative components for creating interactive charts. Recharts is used to visualize student progress, attendance patterns, grade trends, and other educational metrics.

The `ProgressAnalytics` component in `components/progress-analytics.tsx` demonstrates the use of Recharts for educational data visualization. It includes a line chart showing grade trends over time, a bar chart displaying performance by subject, and a pie chart illustrating attendance breakdown. The component fetches analytics data from the API and renders it using Recharts components such as `LineChart`, `BarChart`, and `PieChart`.

Recharts integrates seamlessly with the application's design system, using Tailwind CSS for styling and theme variables for consistent color schemes. The charts are responsive and accessible, with proper labeling and tooltip support. The library's component-based approach allows for easy customization and composition of different chart types.

The visualization components are designed to be reusable and configurable, accepting props to customize the data displayed and the appearance of the charts. This enables consistent data visualization across different parts of the application while allowing for specific customizations where needed.

**Section sources**
- [components/progress-analytics.tsx](file://components/progress-analytics.tsx#L1-L189)
- [package.json](file://package.json#L65)
- [lib/analytics-store.ts](file://lib/analytics-store.ts#L1-L83)

## Third-Party Integrations

The School-Management-System integrates with third-party services to extend functionality, with the Zoom API being a key integration for virtual meetings. The Zoom integration enables scheduling, managing, and joining virtual meetings directly within the school management system.

The Zoom API client in `lib/zoom/client.ts` implements Server-to-Server OAuth authentication, allowing the application to make authorized requests to the Zoom API without requiring user login. The client handles token management, including caching and refreshing access tokens. It provides methods for creating, retrieving, updating, and deleting Zoom meetings, as well as managing meeting registrants and retrieving meeting reports.

The integration supports meeting registration with automatic generation of unique join URLs for registered participants. This enables secure access to virtual meetings while bypassing waiting rooms for registered users. The system also implements SDK signature generation for embedding Zoom meetings directly in the application using the Zoom Web SDK.

Date manipulation is handled using date-fns, a modern JavaScript date utility library. Although the specific implementation file was not found in the repository, date-fns is listed as a dependency in package.json and is likely used throughout the application for formatting dates, calculating durations, and handling time zones in features such as the calendar, attendance tracking, and scheduling.

**Section sources**
- [lib/zoom/client.ts](file://lib/zoom/client.ts#L1-L334)
- [package.json](file://package.json#L50)
- [app/api/zoom](file://app/api/zoom)

## Configuration Files

The School-Management-System includes several configuration files that define the application's behavior, styling, and development environment. These files are critical for setting up the technology stack and ensuring consistent behavior across development, testing, and production environments.

The `next.config.mjs` file configures Next.js with image optimization settings, including supported formats (AVIF and WebP), device sizes, and remote patterns for Supabase storage. It also implements security headers through the `headers` function, setting HTTP security policies such as X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, and Strict-Transport-Security to protect against common web vulnerabilities.

The `tsconfig.json` file configures TypeScript with strict type checking, module resolution, and JSX transformation settings. It includes paths configuration for absolute imports using the `@/*` alias, which simplifies import statements throughout the codebase. The configuration enables modern JavaScript features while maintaining compatibility with the target environment.

The `components.json` file configures the shadcn/ui component library, specifying the style theme, TypeScript support, and path aliases for components and utilities. This configuration ensures consistency in component styling and enables the use of shadcn's component generation commands.

The `package.json` file lists all dependencies and devDependencies, including the core technologies used in the stack. It defines scripts for development, building, testing, and linting the application. The dependency versions are carefully selected to ensure compatibility between the different technologies in the stack.

**Section sources**
- [next.config.mjs](file://next.config.mjs#L1-L79)
- [tsconfig.json](file://tsconfig.json#L1-L42)
- [components.json](file://components.json#L1-L22)
- [package.json](file://package.json#L1-L90)

## Technology Integration Examples

The technologies in the School-Management-System work together seamlessly to create a cohesive and functional application. API routes demonstrate the integration of Next.js server components with Supabase, while UI components show how shadcn/ui primitives are used with Tailwind CSS and React.

The API route at `app/api/teacher/grades/create/route.ts` illustrates the integration of multiple technologies. It uses Next.js server components to handle HTTP requests, implements rate limiting and authentication checks, validates input data, and interacts with the Supabase database to create grade records. The route enforces business rules such as ensuring teachers can only grade their own classes and that scores are within valid ranges.

UI components such as the button component in `components/ui/button.tsx` demonstrate the integration of shadcn/ui with Tailwind CSS and class variance authority (cva). The component uses cva to define variant styles and clsx/tailwind-merge to combine class names, providing a flexible and type-safe API for different button styles and sizes.

The theme provider in `components/theme-provider.tsx` integrates next-themes with the application's styling system, enabling dark mode support that respects user preferences. It works with the CSS variables defined in `styles/globals.css` to provide a consistent visual experience across light and dark modes.

**Section sources**
- [app/api/teacher/grades/create/route.ts](file://app/api/teacher/grades/create/route.ts#L1-L105)
- [components/ui/button.tsx](file://components/ui/button.tsx#L1-L61)
- [components/theme-provider.tsx](file://components/theme-provider.tsx#L1-L12)
- [styles/globals.css](file://styles/globals.css#L1-L126)

## Version Compatibility and Setup

The School-Management-System technology stack is carefully configured to ensure version compatibility between dependencies. The package.json file specifies compatible versions of Next.js, React, TypeScript, Tailwind CSS, and other libraries to avoid conflicts and ensure stable operation.

Next.js 16.1.1 is compatible with React 19.2.1, allowing the use of React Server Components and other modern React features. TypeScript 5 is configured to target ES6 and support modern JavaScript features while maintaining compatibility with the runtime environment. Tailwind CSS 4 works with PostCSS 8.5 and Autoprefixer 10.4.20 to generate vendor-prefixed CSS rules.

The setup process involves installing dependencies with npm or yarn, configuring environment variables for Supabase and Zoom integration, and running the development server with `npm run dev`. The application uses environment variables for configuration, with a `.env.example` file providing a template for required variables.

The build process is optimized for performance, with Next.js handling code splitting, image optimization, and static generation where appropriate. The configuration includes security headers and CSP policies to protect against common web vulnerabilities while allowing necessary functionality such as Supabase storage access and Vercel analytics.

**Section sources**
- [package.json](file://package.json#L57-L87)
- [next.config.mjs](file://next.config.mjs#L1-L79)
- [tsconfig.json](file://tsconfig.json#L1-L42)
- [.env.example](file://.env.example)