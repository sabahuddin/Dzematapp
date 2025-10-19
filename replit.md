# Overview

DžematApp is a web-based admin dashboard application built for managing mosque community operations. The application serves as a comprehensive management system for administrators to handle users, announcements, events, work groups, and tasks. It features a modern, responsive interface designed for desktop and tablet use, with Material-UI components providing a consistent and professional appearance.

# Recent Changes

## October 19, 2025
- **Login Authentication Update**: Changed login from email to username-based authentication. Login field now displays "Korisničko ime" instead of "E-mail" and is no longer required. Backend updated to use `getUserByUsername` method.
- **Guest Access Implementation**: Added guest access option on login page allowing non-members to view announcements, events, and membership application form without authentication. New route: `/guest` (publicly accessible).
- **Layout Improvements**: Fixed sidebar spacing issues - removed double margin when sidebar expands/collapses by eliminating manual margin-left on content area.
- **Livestream Settings Separation**: Created dedicated LivestreamSettingsPage for admin-only access with detailed instructions. Removed livestream configuration from OrganizationSettingsPage. New route: `/livestream-settings` (admin-only).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript, utilizing a modern component-based architecture:

- **Framework**: React 18+ with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Dual approach using both Material-UI (MUI) and shadcn/ui components
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Authentication**: Context-based authentication system with localStorage persistence

## Backend Architecture

The backend follows a simple REST API pattern:

- **Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Storage**: In-memory storage implementation for prototype phase
- **API Design**: RESTful endpoints following standard conventions
- **Error Handling**: Centralized error handling middleware

## Data Storage Solutions

The application uses a PostgreSQL database with Drizzle ORM:

- **Database**: PostgreSQL (configured but not yet implemented in storage layer)
- **ORM**: Drizzle with type-safe schema definitions
- **Schema**: Comprehensive relational schema covering users, announcements, events, work groups, tasks, and access requests
- **Current Implementation**: In-memory storage for rapid prototyping

## Authentication and Authorization

Simple session-based authentication system:

- **Strategy**: Username/password authentication (changed from email-based)
- **Session Management**: Server-side sessions with Express session middleware
- **Guest Access**: Public access to announcements, events, and membership application form
- **Authorization**: Role-based access control with four user roles:
  - **Admin**: Full system control and permissions management
  - **Član IO** (Executive Board Member): Can view work group activities (read-only access)
  - **Član** (Member): Basic member access - **default role for new users**
    - Can edit their own: Photo, Address, Postal Code, City, Occupation, Password, Phone, Email
    - Can view but not edit: Membership Date, Status
    - Cannot view: Categories
    - Can view their own roles
    - Can add family members (requires admin approval)
  - **Član porodice** (Family Member): Family member access
- **Work Group Moderators**: Admins can assign moderators directly within work groups (future user-facing app feature)
- **Security**: Basic password validation (prototype level)

## Key Features and Modules

1. **User Management**: Complete CRUD operations for user accounts with profile management
2. **Announcements**: Content management system for community announcements (publicly viewable by guests)
3. **Events**: Event creation and management with RSVP functionality (publicly viewable by guests)
4. **Task Manager**: Work group management and task assignment system
5. **Dashboard Analytics**: Statistical overview with activity tracking
6. **Guest Access**: Public-facing interface for viewing announcements, events, and submitting membership applications

## Demo Credentials

For testing purposes, the following demo accounts are available:

- **Admin**: username: `admin`, password: `admin123`
- **Član (Member)**: username: `marko.petrovic`, password: `password123`
- **Član IO (Board Member)**: username: `ana.maric`, password: `password123`
- **Guest Access**: Click "Gost" button on login page (no credentials required)

## Development Tools and Workflow

- **Development Server**: Vite with hot module replacement
- **Database Migrations**: Drizzle Kit for schema management
- **Code Quality**: TypeScript strict mode for compile-time error checking
- **Path Aliases**: Configured for clean import statements (@/, @shared/, @assets/)

# External Dependencies

## Core Framework Dependencies

- **@vitejs/plugin-react**: React plugin for Vite build system
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React applications

## UI and Styling Libraries

- **@mui/material**: Material Design component library
- **@mui/x-data-grid**: Advanced data grid components
- **@mui/x-date-pickers**: Date and time picker components
- **@radix-ui**: Primitive UI components for shadcn/ui
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant styling utility

## Database and Backend

- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and introspection tools
- **express**: Web application framework for Node.js

## Development and Build Tools

- **typescript**: Static type checking
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling for Replit environment
- **esbuild**: Fast JavaScript bundler for server-side code

## Validation and Forms

- **zod**: Schema validation library
- **@hookform/resolvers**: Form validation resolvers
- **react-hook-form**: Form state management (inferred from resolvers)

Note: The application currently uses mock data and in-memory storage for rapid prototyping. The PostgreSQL database connection is configured but the storage layer will need to be updated to use the actual database instead of the current in-memory implementation.