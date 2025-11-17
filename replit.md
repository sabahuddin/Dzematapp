# Overview

DžematApp is a web-based admin dashboard application designed to manage mosque community operations. It provides a comprehensive system for administrators to handle users, announcements, events, work groups ("Sekcije"), and tasks. The application aims to streamline administrative tasks, improve communication within the community, and offer a modern, responsive user experience. It supports desktop and tablet usage with a consistent Material-UI and shadcn/ui design. The project envisions enhancing community engagement, improving administrative efficiency, and offering a robust platform for mosque management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, leveraging a component-based architecture. It uses Vite for development, Material-UI (MUI) and shadcn/ui for UI components, and Tailwind CSS for styling. Wouter handles client-side routing, and React Query manages server state. Authentication is context-based with localStorage persistence. The design adheres to Material-UI and shadcn/ui principles, providing a responsive and modern user experience across desktop and tablet devices. PWA features provide offline support and installability.

## Backend Architecture
The backend is an Express.js application built with TypeScript, following a REST API pattern. It uses Drizzle ORM for type-safe database operations with a PostgreSQL database backend. The application includes centralized error handling and persistent data storage.

## Data Storage Solutions
The application uses a PostgreSQL database (Neon serverless) with Drizzle ORM for type-safe schema definitions. All data is stored permanently in the database and persists across application restarts.

## Authentication and Authorization
The system employs a simple session-based authentication using username/password. It supports guest access for public content. Role-based access control is implemented with four roles: Admin, Član IO (Executive Board Member), Član (Member - default for new users), and Član porodice (Family Member). Admins can also assign work group moderators.

## Key Features and Modules
- **User Management**: CRUD for user accounts, profile management, bulk upload, and dynamic category filtering.
- **Announcements**: Content management for community announcements, viewable by guests.
- **Events & Important Dates**: Tab-based interface with event calendar, list, RSVP, and important dates. Events are guest-viewable.
- **Task Manager with Role-Based Interfaces**: Manages work groups ("Sekcije") with multi-user task assignments, variable point values, and archive functionality. Includes admin, executive board, and regular member interfaces with access request systems for private sections.
- **Task Archive System**: Locks completed/archived tasks from modification and provides an admin-only global archive view.
- **Moderator Proposal System**: Simplified proposal submission for work group activities, with admin review and approval.
- **Expense Tracking with Receipt Uploads**: Members can upload receipts for tasks with estimated costs.
- **Dashboard Analytics**: Provides an overview and activity tracking.
- **Guest Access**: Public interface for announcements, events, prayer times, and membership applications (Pristupnica, Akika, Marriage).
- **Notification System**: Displays unread content counts and sends automatic messages for application statuses.
- **Section Visibility**: Public/private settings for work groups with access control and request system.
- **Imam Q&A**: System for submitting and archiving questions for the Imam.
- **Shop Module**: Features DžematShop with categorized products (food, drinks, clothing with conditional fields) and a marketplace for general listings. Supports photo uploads and editing.
- **Prayer Times (Vaktija)**: Full calendar with CSV upload and dashboard integration.
- **Internationalization (i18n)**: Multi-language support (Bosnian, German, English, Albanian) with a language selector.
- **Projekti + Finansije Integration**: Links financial contributions to projects.
- **Badges & Recognition**: System for recognizing member achievements with customizable badge criteria.
- **Zahvale (Certificates)**: Template management and issuance with user notification.
- **Media/Livestream**: Settings and management for live streams and media content.
- **Documents**: Upload and management system for community resources.
- **Activity Feed**: Displays all community activities with visual distinctions for clickable and non-clickable items, auto-refreshing.

# External Dependencies

## Core Framework Dependencies
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
- **vite**: Frontend build tool.

## Validation and Forms
- **zod**: Schema validation.
- **@hookform/resolvers**: Form validation resolvers.
- **react-hook-form**: Form state management.

## Internationalization
- **react-i18next**: Internationalization framework for React.