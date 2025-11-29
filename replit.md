# Overview

DžematApp is a mobile-first Progressive Web App (PWA) for mosque community management. It provides a comprehensive system for administrators to manage users, announcements, events, work groups ("Sekcije"), and tasks. The application aims to enhance community engagement and administrative efficiency, offering a robust platform accessible on various devices with a native-app-like experience, offline support, and a clean, light-green themed design. Key features include user management, event scheduling, a task manager with role-based interfaces, expense tracking, a shop module, prayer times, and a robust notification system.

# User Preferences

- **Communication Style**: Simple, everyday language (Serbian/Croatian/Bosnian).
- **Visual Design**: Light green theme (#e8f5e9), 1px borders, 12px border radius.
- **Layout Requirements**: Fixed TopBar and BottomNavigation with zero bounce/overscroll effect on iOS.
- **Language**: Serbian/Croatian (Bosnian ijekavica dialect).

# System Architecture

## Frontend
The frontend is a React with TypeScript application, employing a component-based, mobile-first design. It uses Vite, Material-UI (MUI), shadcn/ui, and Tailwind CSS. Wouter is used for routing, React Query for server state management, and context-based authentication with localStorage.

### Mobile-First Design
Features a fixed layout system with a 64px TopBar and 88px BottomNavigation, preventing iOS Safari bounce with a custom `useEdgeLockScroll` hook. It utilizes a consistent 16px padding system and automatically resets scroll positions on route changes. The PWA is configured for offline support and installability with optimized app icons.

### Branding
The application uses a custom transparent SVG logo (crescent moon and book symbol in blue #2196F3), a complete suite of app icons, and a light-green Material-UI based theme.

## Backend
The backend is an Express.js application written in TypeScript, providing a REST API. It uses Drizzle ORM for type-safe database interactions with PostgreSQL. It includes centralized error handling and persistent data storage.

## Data Storage
A PostgreSQL database, hosted on Hetzner, is used for all persistent data storage, managed via Drizzle ORM for type-safe schema definitions.

### Automatic Schema Synchronization
The application automatically synchronizes the database schema on every startup (both development and production). The `migrateProductionSchema()` function in `server/migrate-production.ts` runs before the server starts, ensuring all tables and columns exist. In production, if migration fails, the application will not start (fail-fast approach).

## Authentication and Authorization
The system uses session-based authentication with username/password, supporting guest access. Role-based access control includes Admin, Executive Board Member, Member, and Family Member roles, with administrators capable of assigning work group moderators.

## Multi-Tenancy Architecture
DžematApp is a SaaS platform with strict tenant isolation:

### Tenant Isolation Rules
- **SuperAdmin Global Tenant** (`tenant-superadmin-global`): A hidden tenant exclusively for SuperAdmin users. Never visible in regular tenant listings.
- **Regular Tenants**: Each organization (džemat) gets its own tenant with completely isolated data.
- **User Isolation**: Users belong to exactly one tenant. SuperAdmin users live in the global tenant and can manage all tenants.
- **New Tenant Creation**: New tenants start empty with 0 users - no data inheritance from other tenants.

### SuperAdmin Access
- **Login**: Use `/api/auth/superadmin/login` with `admin/admin123`
- **Scope**: Can manage all tenants via SuperAdmin Panel
- **Visibility**: SuperAdmin users are NEVER shown in regular tenant user lists (filtered by `isSuperAdmin` check)

### Key Implementation Files
- `server/seed-tenant.ts`: Creates global SuperAdmin tenant and SuperAdmin user
- `server/storage.ts`: `getAllUsers()` excludes SuperAdmin users, `getAllTenants()` excludes global tenant
- `server/index.ts`: Auth middleware resolves SuperAdmin to global tenant

## Key Features
- **User & Profile Management**: CRUD operations, bulk upload, dynamic filtering.
- **Announcements & Events**: Content management, event calendar, RSVP, guest-viewable.
- **Task Manager**: Multi-user task assignments, work group management ("Sekcije"), role-based interfaces, and archiving.
- **Expense Tracking**: Members can upload receipts with estimated costs.
- **Shop Module**: DžematShop with categorized products and a marketplace for general listings (sale/gift/services).
- **Prayer Times (Vaktija)**: Full calendar with CSV upload.
- **Internationalization (i18n)**: Multi-language support (Bosnian, German, English, Albanian).
- **Guest Access**: Public interfaces for announcements, events, prayer times, and membership applications.
- **Notification System**: Displays unread content counts and application status messages.
- **Moderator Proposal System**: For work group activity proposals.
- **Imam Q&A**: System for submitting and archiving questions.
- **Badges & Recognition**: System for member achievements.
- **Zahvale (Certificates)**: Template management and issuance.
- **Media/Livestream**: Management for live streams and media.
- **Documents**: Upload and management system.
- **Activity Feed**: Real-time display of community activities.

## Mobile App (React Native + Expo)
A complete React Native + Expo application for iOS and Android is available in the `mobile/` directory, featuring Expo Router, login/authentication, dashboard, tab navigation, and a robust API client with token management, all built with TypeScript.

# External Dependencies

## Core Frameworks
- **@tanstack/react-query**: Server state management.
- **wouter**: Lightweight client-side routing.

## UI and Styling
- **@mui/material**: Material Design components.
- **@mui/x-data-grid**: Advanced data grid.
- **@mui/x-date-pickers**: Date and time pickers.
- **@radix-ui**: Primitive UI components for shadcn/ui.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Component variant styling.

## Database and Backend
- **pg**: PostgreSQL TCP driver (for production Hetzner deployment).
- **drizzle-orm**: Type-safe ORM.
- **drizzle-kit**: Database migration tools.
- **express**: Node.js web framework.

## Development Tools
- **typescript**: Static type checking.
- **vite**: Frontend build tool.

## Validation and Forms
- **zod**: Schema validation.
- **@hookform/resolvers**: Form validation resolvers.
- **react-hook-form**: Form state management.

## Internationalization
- **react-i18next**: Internationalization framework for React.

## Custom Utilities
- **useEdgeLockScroll**: Custom hook for iOS Safari bounce prevention.