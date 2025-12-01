# Overview

DžematApp is a mobile-first Progressive Web App (PWA) designed for mosque community management. It aims to enhance community engagement and administrative efficiency by providing a comprehensive platform for managing users, announcements, events, work groups ("Sekcije"), and tasks. Key capabilities include user management, event scheduling, a task manager with role-based interfaces, expense tracking, a shop module, prayer times, and a robust notification system. The application offers a native-app-like experience with offline support and a consistent light-green themed design.

# User Preferences

- **Communication Style**: Simple, everyday language (Serbian/Croatian/Bosnian).
- **Visual Design**: Light green theme (#e8f5e9), 1px borders, 12px border radius.
- **Layout Requirements**: Fixed TopBar and BottomNavigation with zero bounce/overscroll effect on iOS.
- **Language**: Serbian/Croatian (Bosnian ijekavica dialect).

# System Architecture

## Frontend
The frontend is a React with TypeScript application, built with Vite, Material-UI (MUI), shadcn/ui, and Tailwind CSS. It uses Wouter for routing, React Query for server state management, and context-based authentication with localStorage. The design is mobile-first, featuring a fixed layout with a 64px TopBar and 88px BottomNavigation, using a custom `useEdgeLockScroll` hook for iOS bounce prevention. The PWA is configured for offline support and installability, utilizing a custom transparent SVG logo (crescent moon and book symbol in blue #2196F3) and a light-green Material-UI based theme.

## Backend
The backend is an Express.js application written in TypeScript, providing a REST API. It uses Drizzle ORM for type-safe database interactions with PostgreSQL. It includes centralized error handling.

## Data Storage
A PostgreSQL database, hosted on Hetzner, is used for all persistent data storage, managed via Drizzle ORM. The application automatically synchronizes the database schema on every startup, ensuring all tables and columns exist, with a fail-fast approach if migration fails in production.

## Authentication and Authorization
The system employs session-based authentication with username/password, supporting guest access. Role-based access control includes Admin, Executive Board Member, Member, and Family Member roles.

## Multi-Tenancy Architecture
DžematApp operates as a SaaS platform with strict tenant isolation:
- **SuperAdmin Global Tenant** (`tenant-superadmin-global`): A hidden tenant for SuperAdmin users with global management scope.
- **Regular Tenants**: Each organization receives a dedicated, isolated tenant with no data inheritance.
- **User Isolation**: Users belong to a single tenant; SuperAdmins can manage all tenants.
- **Tenant Creation**: New tenants are provisioned empty, with an automatically generated admin user (`admin/admin123`).
- **Security**: Session-based authentication uses `session.tenantId` for authoritative tenant sourcing, preventing cross-tenant data manipulation in all POST/PUT operations.

## Key Features
- **User & Profile Management**: CRUD operations, bulk upload, dynamic filtering.
- **Announcements & Events**: Content management, event calendar, RSVP, guest-viewable.
- **Task Manager**: Multi-user task assignments, work group management ("Sekcije"), role-based interfaces.
- **Expense Tracking**: Members can upload receipts.
- **Shop Module**: DžematShop for products and marketplace listings.
- **Prayer Times (Vaktija)**: Calendar with CSV upload.
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

## Mobile App
A companion React Native + Expo application for iOS and Android is located in the `mobile/` directory, featuring Expo Router, login/authentication, dashboard, tab navigation, and a robust API client, all built with TypeScript.

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
- **pg**: PostgreSQL TCP driver.
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