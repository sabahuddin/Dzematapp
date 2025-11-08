# Overview

DžematApp is a web-based admin dashboard application designed to manage mosque community operations. It provides a comprehensive system for administrators to handle users, announcements, events, work groups ("Sekcije"), and tasks. The application aims to streamline administrative tasks, improve communication within the community, and offer a modern, responsive user experience. It supports desktop and tablet usage with a consistent Material-UI and shadcn/ui design.

# Recent Changes (November 8, 2025)

- Removed quick access shortcuts widget from Dashboard (admin and member views)
- Users table restructured: firstName/lastName in separate columns, username/categories/skills columns removed, column sorting added for all fields
- Category filtering now dynamically includes custom categories from database
- Badge criteria types display human-readable translations (e.g., "Tasks completed" instead of "tasks_completed")
- Proposal creation simplified: "Ko izvodi" field removed, only "Šta" required, all other fields optional
- Akika applications now require email field for notifications
- Akika approval triggers automatic message notifications to IO members and admins
- Completed/archived tasks protected from deletion (403 error on delete attempts, matching existing update protection)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, leveraging a component-based architecture. It uses Vite for development, Material-UI (MUI) and shadcn/ui for UI components, and Tailwind CSS for styling. Wouter handles client-side routing, and React Query manages server state. Authentication is context-based with localStorage persistence.

## Backend Architecture
The backend is an Express.js application built with TypeScript, following a REST API pattern. It uses Drizzle ORM for type-safe database operations with a PostgreSQL database backend. The application includes centralized error handling and persistent data storage.

## Data Storage Solutions
The application uses a PostgreSQL database (Neon serverless) with Drizzle ORM for type-safe schema definitions. The DatabaseStorage class provides persistent storage for all entities. All data is stored permanently in the database and persists across application restarts.

## Authentication and Authorization
The system employs a simple session-based authentication using username/password. It supports guest access for public content. Role-based access control is implemented with four roles: Admin, Član IO (Executive Board Member), Član (Member - default for new users), and Član porodice (Family Member). Admins can also assign work group moderators.

## Key Features and Modules
- **User Management**: CRUD operations for user accounts and profile management. User table displays firstName and lastName in separate columns with column sorting functionality (ascending/descending). Username, categories, and skills columns removed from display. Category filtering dynamically includes custom categories from database. Bulk upload functionality with Excel template supporting 11 columns (Ime, Prezime, Korisničko ime, Šifra, Email, Telefon, Ulica i broj, Broj pošte, Naziv mjesta, Član od, Status članstva).
- **Announcements**: Content management for community announcements, viewable by guests.
- **Events & Important Dates**: Tab-based interface with event calendar, event list, RSVP functionality, and important dates management. Events viewable by guests.
- **Task Manager with Role-Based Interfaces**: 
  - **Admin**: Full access to all sections, task management, member management, and proposals. Can archive/delete sections. Access to global task archive.
  - **Član IO (Executive Board)**: Two main tabs - "Moje sekcije" with three sub-tabs (Moje sekcije, Ostale sekcije, Prijedlozi read-only) and "Zatraži pristup" for public sections. Can view proposals but cannot approve/reject.
  - **Član (Regular Member)**: Two tabs - "Moje sekcije" (sections where member) and "Zatraži pristup" (public sections with confirmation dialog).
  - Work groups ("Sekcije") with multi-user task assignments and variable point values (10, 20, 30, or 50 points).
  - Section archive functionality: Admins can archive or delete sections. Archived sections are hidden from non-admin users.
  - Access request confirmation: Two-step process requiring user confirmation before sending join requests.
- **Task Archive System**: 
  - Completed tasks automatically become read-only and cannot be edited or deleted by anyone (including moderators).
  - Tasks with status "završeno" or "arhiva" are locked at the backend level (403 error on edit/delete attempts).
  - Each section has separate "Aktivni" and "Arhiva" tabs for managing active and archived tasks.
  - Admin-only "Arhiva svih zadataka" tab shows all archived tasks across all sections with filtering by section, user, and date period.
  - Completed tasks display completion timestamp (completedAt field).
- **Moderator Proposal System**: Moderators can submit simplified proposals for work group activities. Only "Šta" (What) field is required; "Gdje" (Where), "Kada" (When), "Kako" (How), "Zašto" (Why), and "Budžet" (Budget) are optional. "Ko izvodi" (Who) field removed. Admins can review, approve, or reject. Član IO can view proposals (read-only).
- **Expense Tracking with Receipt Uploads**: Members can upload receipts (images/PDFs) for completed tasks that have estimated costs.
- **Dashboard Analytics**: Overview and activity tracking.
- **Guest Access**: Public interface for viewing announcements, events, prayer times, and submitting membership applications (Pristupnica, Akika, Marriage). Akika applications require email for notifications.
- **Notification System**: Displays unread content counts for various modules. Automatic message notifications sent to IO members and admins when Akika applications are approved.
- **Section Visibility**: Public/private settings for work groups with access control. Private sections require access requests with admin approval.
- **Access Request System**: Users can request membership to private sections with two-step confirmation ("Jeste li sigurni da želite biti član ove sekcije?" - DA/OTKAŽI).
- **Imam Q&A**: System for submitting and archiving questions for the Imam.
- **Shop Module**: Marketplace for items with photo uploads, image viewer, edit functionality, and contact form.
- **Prayer Times (Vaktija)**: Full prayer times calendar with CSV upload capability and accordion view for monthly times. Dashboard displays today's prayer times.
- **Internationalization (i18n)**: Multi-language support using react-i18next (Bosnian, German, English, Albanian) with a language selector.
- **Projekti + Finansije Integration**: Financial contributions can optionally link to projects, automatically updating project amounts.
- **Points Settings Explanation**: Detailed explanation section on how points are awarded for various activities.
- **Badges & Recognition**: Badge system for recognizing member achievements. Badge criteria types (tasks_completed, contributions_amount, events_attended, points) display with human-readable translations in all supported languages.
- **Zahvale (Certificates)**: Certificate template management and issuance system with user notification.
- **Media/Livestream**: Livestream settings and media management.
- **Documents**: Document upload and management system for community resources.

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