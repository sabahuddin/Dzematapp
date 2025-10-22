# Overview

DžematApp is a web-based admin dashboard application designed to manage mosque community operations. It provides a comprehensive system for administrators to handle users, announcements, events, work groups ("Sekcije"), and tasks. The application aims to streamline administrative tasks, improve communication within the community, and offer a modern, responsive user experience. It supports desktop and tablet usage with a consistent Material-UI and shadcn/ui design.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Updates (October 22, 2025)

## Bugfixes
- **Financial Contributions**: Members can now only view their contributions (no create/edit/delete). Added PATCH endpoint for admin compatibility. Fixed frontend to hide "Dodaj Uplatu" button for non-admins.
- **apiRequest Signature**: Fixed critical bug in queryClient.ts where apiRequest function signature was (method, url, data) but all callers used (url, method, data). Changed signature to match usage pattern, fixing 401 errors on all POST/PATCH/DELETE operations. Updated ALL 9 apiRequest calls in TaskManagerPage.tsx to use correct parameter order.
- **Phone Placeholder**: Updated to Swiss format (+41 7x xxx xx xx) in user profile modal.
- **QuickAccessSettingsModal State Sync**: Fixed critical bug where modal didn't reflect saved shortcuts. Added useEffect to sync selectedShortcuts with currentShortcuts when modal opens or preferences change.
- **Project Creation**: Fixed insertProjectSchema to omit createdById field (auto-populated by backend). Updated storage interface type signatures. Added proper form validation for project fields.
- **Activity Log - Task Completion**: Fixed logic to properly log task completions. Now logs when user marks task as "na_cekanju" (0 points, pending approval) and when admin approves as "završeno" (full points). Previously, approval transitions were not logged.
- **Activity Log - Project Contributions**: Financial contributions linked to projects now create TWO activity logs: 'contribution_made' (with points for the amount) and 'project_contribution' (0 points, for project tracking). Previously, project contributions were not specifically logged.
- **Points Settings Endpoint**: Fixed API endpoint mismatch - backend had /api/points-settings but frontend called /api/point-settings. Unified to /api/point-settings and added /:id parameter to PUT endpoint.
- **Event Creation apiRequest**: Fixed "Method is not a valid HTTP token" error by correcting 6 apiRequest calls in EventsPage.tsx from old signature (method, url, data) to new signature (url, method, data). Includes event CRUD and important dates CRUD operations.
- **Event Form - Removed Reminder Field**: Removed "Podsjetnik" (reminder time) field from event creation/editing form per user request.
- **Event Form - Moved Calendar Button**: "Dodaj u Kalendar" button now only appears when users view existing events (not in create/edit forms), allowing users to add events to their personal calendars.

## Features
- **Category Filter**: Added dropdown filter in Finances page for filtering contributions by purpose (Članarina, Donacija, Vakuf, Sergija, Ostalo).
- **Projekti + Finansije Integration**: Financial contributions can now optionally link to projects. Admin can select project from dropdown when creating/editing contribution. Backend automatically updates project currentAmount on create/edit/delete operations. Form uses Zod transform to convert empty string to null for proper validation.
- **Quick Access Dashboard**: Users can now customize their dashboard with up to 8 frequently-used shortcuts. Features include: QuickAccessWidget component with icons and hover effects, settings modal with checkbox selection (8 item limit), database persistence via userPreferences table, automatic default preferences creation, responsive grid layout (2/3/4 columns), integration on both admin and member dashboards. Available shortcuts: Obavještenja, Događaji, Korisnici, Sekcije, Zadaci, Poruke, Pitaj Imama, Dokumenti, Prodavnica, Vaktija, Finansije, Aktivnosti, Značke, Projekti.
- **Points Settings Explanation**: Added detailed explanation section on Points Settings page showing exactly when and how points are awarded for each category (Financial contributions, Completed tasks, Event RSVP, Project contributions).

## Known Issues
- **Bulk CSV Upload**: Not yet implemented for financial contributions.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript, leveraging a component-based architecture. It uses Vite for development, Material-UI (MUI) and shadcn/ui for UI components, and Tailwind CSS for styling. Wouter handles client-side routing, and React Query manages server state. Authentication is context-based with localStorage persistence.

## Backend Architecture

The backend is an Express.js application built with TypeScript, following a REST API pattern. It uses Drizzle ORM for type-safe database operations with a PostgreSQL database backend. The application includes centralized error handling and persistent data storage.

## Data Storage Solutions

The application uses a PostgreSQL database (Neon serverless) with Drizzle ORM for type-safe schema definitions. The DatabaseStorage class provides persistent storage for all entities including users, announcements, events, work groups, tasks, access requests, messages, documents, shop items, prayer times, and important dates. All data is stored permanently in the database and persists across application restarts.

## Authentication and Authorization

The system employs a simple session-based authentication using username/password. It supports guest access for public content (announcements, events, membership application). Role-based access control is implemented with four roles: Admin, Član IO (Executive Board Member), Član (Member - default for new users), and Član porodice (Family Member). Admins can also assign work group moderators.

## Key Features and Modules

- **User Management**: CRUD operations for user accounts and profile management.
- **Announcements**: Content management for community announcements, viewable by guests.
- **Events & Important Dates**: Tab-based interface with event calendar (monthly view with date markers), event list, RSVP functionality, and important dates management (recurring yearly dates in dd.mm format). Events viewable by guests.
- **Task Manager**: Management of work groups ("Sekcije") with multi-user task assignments. Moderators can assign tasks to one member, multiple specific members (2, 3, or more), or all members. All assigned users can mark tasks as complete.
- **Dashboard Analytics**: Overview and activity tracking.
- **Guest Access**: Public interface for viewing announcements, events, prayer times (Vaktija), and submitting membership applications. Features new mosque logo in header.
- **Notification System**: Displays unread content counts for various modules.
- **Section Visibility**: Public/private settings for work groups with access control.
- **Access Request System**: Users can request membership to private sections, with admin approval.
- **Imam Q&A**: System for submitting and archiving questions for the Imam.
- **Shop Module**: Marketplace for items with photo uploads, image viewer, edit functionality, and contact form.
- **Prayer Times (Vaktija)**: Full prayer times calendar with CSV upload capability for admins. Dashboard displays "Današnja vaktija" (today's prayer times) for all users. Monthly view renamed to "Mjesečne vaktije".
- **Important Dates**: Admin-managed recurring yearly dates (Bajram, Ramadan, etc.) with dd.mm format, name, and optional description. Accessible via separate tab on Events page.
- **Visual Contrast Enhancement**: Consistent visual separation between background and form/card elements.

# External Dependencies

## Core Framework Dependencies

- **@vitejs/plugin-react**: React plugin for Vite.
- **@tanstack/react-query**: Server state management.
- **wouter**: Lightweight routing library.

## UI and Styling Libraries

- **@mui/material**: Material Design components.
- **@mui/x-data-grid**: Advanced data grid.
- **@mui/x-date-pickers**: Date and time pickers.
- **@radix-ui**: Primitive UI components for shadcn/ui.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Component variant styling.

## Database and Backend

- **@neondatabase/serverless**: PostgreSQL driver.
- **drizzle-orm**: Type-safe ORM.
- **drizzle-kit**: Database migration tools.
- **express**: Node.js web framework.

## Development and Build Tools

- **typescript**: Static type checking.
- **esbuild**: JavaScript bundler.

## Validation and Forms

- **zod**: Schema validation.
- **@hookform/resolvers**: Form validation resolvers.
- **react-hook-form**: Form state management.

# Test Data Examples

User has created sample data that should be preserved for testing purposes:

## Demo Users
- **Admin**: username `admin`, password `admin123`
- **Član IO**: username `ali.alic`, password `password123`

## Sample Announcements
1. **DžematShop** - Obavještenje o korištenju DžematShop usluga putem aplikacije (kategorija: Džemat)

## Sample Events
1. **BILJANI, KUĆE S POGLEDOM NA GENOCID** - Projekcija dokumentarnog filma Avde Huseinovića (datum: 14.11.2025, 19:00, kategorija: GAM)

## Sample Shop Items
1. **Voda "OAZA"** - 6x1,5l pakovanje, cijena: 10 CHF
2. **Majica** - Dostupne veličine: S, L, XL; boje: plava, crvena, bijela; materijal: Pamuk 100%; cijena: 15 CHF

## Sample Work Group
- **Administracija** - Upravljanje džematom i administrativni poslovi (privatna vidljivost)