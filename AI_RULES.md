# AI Development Rules for Neumann

This document outlines the core technologies and development conventions for the Neumann application. Following these rules ensures consistency, maintainability, and adherence to the project's architecture.

## Tech Stack

The application is built with a modern, type-safe, and component-driven stack:

- **Framework**: React (with TypeScript) and Vite for a fast development experience.
- **Styling**: Tailwind CSS for utility-first styling.
- **UI Components**: shadcn/ui, providing a set of reusable and accessible components built on Radix UI.
- **Routing**: React Router (`react-router-dom`) for all client-side navigation.
- **Data Fetching & Server State**: TanStack Query for managing asynchronous operations with the backend.
- **Backend & Authentication**: Supabase for the database, authentication, and serverless Edge Functions.
- **Forms**: React Hook Form combined with Zod for robust and type-safe form handling and validation.
- **Icons**: `lucide-react` for a consistent and clean set of icons.
- **Notifications**: `sonner` for toast notifications to provide user feedback.

## Library Usage and Conventions

To maintain a clean and predictable codebase, adhere to the following rules when implementing new features.

### 1. UI and Components

- **Primary Rule**: **Always** use components from the `shadcn/ui` library (`@/components/ui/...`) for all standard UI elements (Buttons, Cards, Dialogs, Inputs, etc.).
- **Styling**: Use Tailwind CSS utility classes directly in your JSX. Do not write separate CSS files. Use the `cn` utility function from `src/lib/utils.ts` for conditional class names.
- **Component Structure**: Create new components in the `src/components/` directory. Keep components small, focused, and organized into subdirectories by feature (e.g., `src/components/challenges/`, `src/components/goals/`).

### 2. State Management

- **Server State**: Use TanStack Query (`useQuery`, `useMutation`) for all data fetching, caching, and synchronization with the Supabase backend. Create custom hooks (e.g., `useLifeGoals`) to encapsulate this logic.
- **Client State**: For local component state, use React's built-in hooks (`useState`, `useReducer`). Avoid introducing global client state libraries unless absolutely necessary.

### 3. Backend Interaction (Supabase)

- **Client**: All communication with the backend must use the Supabase client instance from `@/integrations/supabase/client.ts`.
- **Security**: Any logic that modifies sensitive state (e.g., awarding XP, completing a challenge, managing subscriptions) **must** be handled in a Supabase Edge Function. Do not perform these calculations on the client-side to prevent manipulation.
- **Types**: Utilize the generated Supabase types from `src/integrations/supabase/types.ts` for type-safe database queries.

### 4. Forms and Validation

- **Forms**: Use `react-hook-form` for building all forms.
- **Validation**: Define all validation schemas using `zod` in the `src/lib/validation.ts` file. Connect schemas to your forms using the `@hookform/resolvers/zod` adapter.

### 5. Icons and Notifications

- **Icons**: Exclusively use icons from the `lucide-react` package.
- **Notifications**: Use `sonner` to display toast notifications for user feedback after actions (e.g., successful form submission, errors). Import it via `import { toast } from 'sonner';`.

### 6. Routing

- **Routes**: All application routes are defined in `src/App.tsx`. Use `react-router-dom` components (`<Route>`, `<Link>`, `useNavigate`) for navigation.
- **Pages**: Create new pages as components within the `src/pages/` directory.