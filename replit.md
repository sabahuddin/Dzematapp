# Overview

DžematApp is a Progressive Web App (PWA) designed for mosque community management with a mobile-first approach. It provides a comprehensive system for administrators to handle users, announcements, events, work groups ("Sekcije"), and tasks. The application delivers a native-app-like experience with smooth scrolling, fixed navigation, and offline support. It uses Serbian/Croatian (Bosnian ijekavica) language and features a clean visual design with light green theme (#e8f5e9), 1px borders, and 12px border radius. The project aims to enhance community engagement, improve administrative efficiency, and offer a robust platform accessible on smartphones, tablets, and desktops.

# User Preferences

- **Communication Style**: Simple, everyday language (Serbian/Croatian/Bosnian).
- **Visual Design**: Light green theme (#e8f5e9), 1px borders, 12px border radius.
- **Layout Requirements**: Fixed TopBar and BottomNavigation with zero bounce/overscroll effect on iOS.
- **Language**: Serbian/Croatian (Bosnian ijekavica dialect).

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, leveraging a component-based architecture with mobile-first design principles. It uses Vite for development, Material-UI (MUI) and shadcn/ui for UI components, and Tailwind CSS for styling. Wouter handles client-side routing, and React Query manages server state. Authentication is context-based with localStorage persistence.

### Mobile-First Design
- **Fixed Layout System**: TopBar (64px height) and BottomNavigation (88px) use position: fixed with scrollable content contained between them.
- **iOS Bounce Prevention**: Custom `useEdgeLockScroll` hook implements edge-offset clamping strategy to prevent Safari viewport rubber-banding. Content scroll is maintained at [1, maxScroll-1] to avoid WebKit's non-cancelable bounce events.
- **Spacing System**: Consistent padding using MOBILE_CONTENT_PADDING (16px). Layout padding: top 80px (64px + 16px), bottom 104px (88px + 16px), horizontal 16px.
- **Auto-Scroll Reset**: Automatic scroll position reset on route changes for consistent navigation experience.
- **PWA Configuration**: Full Progressive Web App setup with offline support, installability, and app icons optimized for iPhone home screen (72px-512px sizes).

### Branding and Visual Identity
- **Logo**: Custom transparent SVG logo (DzematLogo.tsx) displaying crescent moon and book symbol in blue (#2196F3).
- **App Icons**: Complete icon suite in PNG format for all device sizes, configured for iOS and Android PWA installation.
- **Theme**: Light green primary color (#81c784), Material-UI based design system.

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

## Custom Hooks and Utilities
- **useEdgeLockScroll**: Prevents iOS Safari bounce effect using edge-offset clamping, touchstart/scroll guards, and dynamic filler injection.

# Recent Updates (November 2024)

## Mobile Experience Improvements
- Resolved iOS Safari bounce/overscroll effect using edge-offset clamping strategy
- Implemented native-app-like scrolling with clean boundary stops
- Added transparent SVG logo component for consistent branding
- Configured complete PWA app icon suite for iPhone home screen installation
- Established consistent spacing system throughout mobile layout
- Increased BottomNavigation height to 88px to prevent icon clipping

## Technical Implementation
- Created `useEdgeLockScroll` hook for iOS bounce prevention
- Developed `DzematLogo.tsx` as reusable SVG component
- Set up PWA manifest with all required icon sizes (72px-512px)
- Configured Apple touch icons in HTML meta tags
- Implemented automatic scroll reset on route changes

## Database & Event Management Fixes (November 21, 2025)
- Fixed event creation: Added missing `tenantId` parameter to `createActivityFeedItem()` call in event storage (resolved database constraint violation)
- Fixed task transfers: Added `tenantId` parameter to `moveTaskToWorkGroup()` function for proper multi-tenant operation
- Fixed family member addition: Completely refactored `FamilySelectionDialog.tsx` to remove user selection tab - now displays only form for creating new family members (privacy improvement)

## Family Members Feature (November 22, 2025)
- **Complete Family Members System** - Users can add family members with relationship types (Supružnik, Dijete, Roditelj, Brat, Sestra, Ostalo)
- **Fixed Password Deletion Bug** - PUT `/api/users` now correctly preserves password when profile is updated without changing password
- **Multi-Tenant Support** - Added `tenantId` parameter to all family relationship endpoints (GET, POST, DELETE)
- **View & Edit Display** - Family members visible in:
  - MyProfilePage (read-only view of own profile)
  - UserModal Family Members Section (edit mode)
- **Cache Optimization** - Implemented `staleTime: 0` and `gcTime: 0` for family relationships to ensure fresh data
- **Automatic List Update** - `refetchQueries` with `type: 'all'` forces fresh server data after family member addition
- **Access Requests Fixed** - POST `/api/access-requests` now automatically includes `tenantId` before validation (resolved 400 errors)

## Shop Module Fixes (November 24, 2025)
- **Marketplace Items Creation** - Fixed schema validation for marketplace items (Prodajem/Poklanjam/Usluge):
  - Removed `userId` and `tenantId` from client-side payload (handled server-side)
  - Added proper Zod enum validation for `type` ("sale" | "gift") and `status` ("active" | "completed")
  - Activity feed integration now includes `tenantId` when creating marketplace items
- **Services (Usluge) Support** - Complete CRUD implementation:
  - Fixed schema to omit `userId` and `tenantId` (server-managed fields)
  - Added `tenantId` parameter to all service routes (GET, POST, PUT, DELETE)
  - Service creation automatically adds entry to activity feed
  - All service operations now properly multi-tenant scoped
- **Admin Protection** - Shop product creation (Džemat Trgovina) remains admin-only with `requireAdmin` middleware
- **Frontend Optimizations** - Removed redundant `userId` submission from marketplace and service mutations