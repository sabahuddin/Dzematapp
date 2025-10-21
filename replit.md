# Overview

DžematApp is a web-based admin dashboard application designed to manage mosque community operations. It provides a comprehensive system for administrators to handle users, announcements, events, work groups ("Sekcije"), and tasks. The application aims to streamline administrative tasks, improve communication within the community, and offer a modern, responsive user experience. It supports desktop and tablet usage with a consistent Material-UI and shadcn/ui design.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript, leveraging a component-based architecture. It uses Vite for development, Material-UI (MUI) and shadcn/ui for UI components, and Tailwind CSS for styling. Wouter handles client-side routing, and React Query manages server state. Authentication is context-based with localStorage persistence.

## Backend Architecture

The backend is an Express.js application built with TypeScript, following a REST API pattern. It uses Drizzle ORM for type-safe database operations with a PostgreSQL database backend. The application includes centralized error handling and persistent data storage.

## Data Storage Solutions

The application uses a PostgreSQL database (Neon serverless) with Drizzle ORM for type-safe schema definitions. The DatabaseStorage class provides persistent storage for all entities including users, announcements, events, work groups, tasks, access requests, messages, documents, shop items, and prayer times. All data is stored permanently in the database and persists across application restarts.

## Authentication and Authorization

The system employs a simple session-based authentication using username/password. It supports guest access for public content (announcements, events, membership application). Role-based access control is implemented with four roles: Admin, Član IO (Executive Board Member), Član (Member - default for new users), and Član porodice (Family Member). Admins can also assign work group moderators.

## Key Features and Modules

- **User Management**: CRUD operations for user accounts and profile management.
- **Announcements**: Content management for community announcements, viewable by guests.
- **Events**: Event creation, management, and RSVP functionality, viewable by guests.
- **Task Manager**: Management of work groups ("Sekcije") and task assignments.
- **Dashboard Analytics**: Overview and activity tracking.
- **Guest Access**: Public interface for viewing announcements, events, prayer times (Vaktija), and submitting membership applications. Features new mosque logo in header.
- **Notification System**: Displays unread content counts for various modules.
- **Section Visibility**: Public/private settings for work groups with access control.
- **Access Request System**: Users can request membership to private sections, with admin approval.
- **Imam Q&A**: System for submitting and archiving questions for the Imam.
- **Shop Module**: Marketplace for items with photo uploads, image viewer, edit functionality, and contact form.
- **Prayer Times (Vaktija)**: Full prayer times calendar with CSV upload capability for admins, displaying today's prayer times on dashboard for all users.
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