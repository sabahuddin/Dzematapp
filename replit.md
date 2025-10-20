# Overview

DžematApp is a web-based admin dashboard application built for managing mosque community operations. The application serves as a comprehensive management system for administrators to handle users, announcements, events, work groups, and tasks. It features a modern, responsive interface designed for desktop and tablet use, with Material-UI components providing a consistent and professional appearance.

# Recent Changes

## October 20, 2025
- **Logo Integration**: Added mosque logo to application branding
  - Logo displayed in sidebar header next to "DžematApp" text
  - Logo displayed on login page above "DžematApp" title
  - Logo size: 32x32px in sidebar, 40x40px on login page
  - "DžematApp" text styled with "Aladin" Google Font for Middle Eastern aesthetic
- **Visual Contrast Enhancement**: Implemented global visual contrast between body background and form/card elements
  - Body background: Medium grey (#eeeeee) for clear separation
  - All cards, dialogs, forms: Pure white (#ffffff)
  - Input fields: White background with light grey border (1px solid #e0e0e0)
  - Border hover state: Darker grey (#bdbdbd)
  - Border focus state: Blue with 2px width (#1976d2)
  - Applied to: Card, Paper, Dialog, TextField, InputBase, Drawer, AppBar, Menu, Popover, Select
  - Ensures consistent visual separation across all pages including user profile, messages, forms
- **Access Request Auto-Membership**: Fixed bug where approving access request didn't automatically add user to work group
  - Backend now calls `addMemberToWorkGroup` when request status is set to 'approved'
  - User is automatically added as 'member' role upon approval
- **TaskManagerPage Bug Fix**: Fixed MenuItem import error preventing application from loading work group details
- **Terminology Finalization**: Completed comprehensive replacement of all remaining "Radna grupa/grupa" instances with "Sekcija" throughout the entire application
  - Updated user interface labels in: TasksDashboard, MemberManagementDialog, AddMemberModal, WorkGroupModal, TaskManagerPage
  - Affected components: Task overview headings, member management dialogs, success/error messages, form labels, and dropdown options
  - All user-facing text now consistently uses "Sekcija" terminology

## October 19, 2025
- **Login Authentication Update**: Changed login from email to username-based authentication. Login field now displays "Korisničko ime" instead of "E-mail" and is no longer required. Backend updated to use `getUserByUsername` method.
- **Guest Access Implementation**: Added guest access option on login page allowing non-members to view announcements, events, and membership application form without authentication. New route: `/guest` (publicly accessible).
- **Layout Improvements**: Fixed sidebar spacing issues - removed double margin when sidebar expands/collapses by eliminating manual margin-left on content area.
- **Livestream Settings Separation**: Created dedicated LivestreamSettingsPage for admin-only access with detailed instructions. Removed livestream configuration from OrganizationSettingsPage. New route: `/livestream-settings` (admin-only).
- **Superadmin Management**: Added ability for superadmins to grant admin privileges to other users. New "Superadmin pristup" toggle in UserModal allows current admins to set `isAdmin` flag on other user accounts, enabling them to manage all users and system settings.
- **Date Format Updates**: 
  - Changed all date formats from "DD. MM. YYYY." to "DD.MM.YYYY." (removed spaces between elements)
  - Event datetime display format: "DD.MM.YYYY. u HH:MM" (e.g., "19.10.2025. u 12:30")
  - Date of birth format: "DD.MM.YYYY." (e.g., "19.10.1999.")
  - Fixed Safari compatibility issues with datetime-local input by adding default value and step="60" attribute
- **Shop Photo Display Fix**: Fixed bug where shop photos were not displaying after upload - added Express static middleware to serve `/uploads` directory in development mode.
- **Shop Features Enhancement**: 
  - Photo upload support (10 photos for admin products, 3 for member marketplace items)
  - Fullscreen image viewer for all shop photos
  - Edit functionality for marketplace item owners
  - Enhanced purchase modal with size/quantity/color selection and total price calculation
  - **Duplicate/Copy functionality**: Admin can now duplicate shop products with a single click using the copy icon button
  - Admin shop tab renamed from "Prodajem" to "DžematShop"
- **Global Terminology Update**: Renamed "Radna grupa" to "Sekcija" throughout the application.
- **Event RSVP Implementation**: Full event registration functionality allowing users to RSVP for events
  - Backend: POST/PUT/DELETE routes at `/api/events/:eventId/rsvp` for creating, updating, and deleting RSVPs
  - Backend: GET route at `/api/events/:eventId/user-rsvp` to fetch current user's RSVP
  - Frontend: EventRSVPModal component for user registration with adult and children counts
  - Integration: "Prijavi se" menu option on events with rsvpEnabled flag
  - Permission control: Menu shows admin options (edit, view RSVPs, delete) only to admins
- **API Request Bug Fix**: Fixed critical bug where `apiRequest` was called with incorrect parameter order
  - Correct signature: `apiRequest(method, url, data)` 
  - Fixed in: AskImamPage (send question, reply, mark as read), MessagesPage (delete), NewMessageModal (create), MessageViewModal (mark as read), EventRSVPModal (create/update/delete)
  - This fix resolves errors when sending messages and Imam Q&A questions

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