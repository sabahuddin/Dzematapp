# Overview

DžematApp is a mobile-first Progressive Web App (PWA) designed for mosque community management. It aims to enhance community engagement and administrative efficiency by providing a comprehensive platform for managing users, announcements, events, work groups ("Sekcije"), and tasks. Key capabilities include user management, event scheduling, a task manager with role-based interfaces, expense tracking, a shop module, prayer times, and a robust notification system. The application offers a native-app-like experience with offline support and a modern "Spiritual Tech Indigo" design.

# User Preferences

- **Communication Style**: Simple, everyday language (Serbian/Croatian/Bosnian).
- **Visual Design**: "Spiritual Tech Indigo" palette - Indigo (#3949AB), Tech Blue (#1E88E5), Tirkizna (#26A69A), with subtle shadows and 16px border radius.
- **Layout Requirements**: Fixed TopBar and BottomNavigation with zero bounce/overscroll effect on iOS.
- **Language**: Serbian/Croatian (Bosnian ijekavica dialect).

# Design System - "Spiritual Tech Indigo"

## Color Palette
- **Primary (Indigo)**: #3949AB - Used for TopBar, active navigation, primary actions
- **Secondary (Tech Blue)**: #1E88E5 - Used for contained buttons, CTAs, links
- **Accent (Tirkizna)**: #26A69A - Used for success states, confirmations
- **Background (Soft Gray)**: #ECEFF1 - Main app background
- **Surface (White)**: #FFFFFF - Cards, inputs on focus, modals
- **Text Primary**: #0D1B2A - Main heading and body text
- **Text Secondary**: #546E7A - Subtle/helper text
- **Navigation Inactive**: #B0BEC5 - Bottom nav inactive icons

## Typography
- **Font Family**: Inter (primary), Roboto (fallback), SF Pro (system)
- **Weights**: 400 (body), 600 (subheadings, buttons), 700 (headings)

## Component Styling
- **Cards**: White (#FFFFFF) with subtle shadow (0 4px 6px -1px rgba(0,0,0,0.05)), 16px border-radius, no border
- **Inputs**: Filled style with soft gray (#ECEFF1) background, no border, white on focus with indigo ring
- **Buttons**: Tech Blue contained (#1E88E5), Indigo outlined (#3949AB), 10px border-radius
- **TopBar**: Indigo (#3949AB) background with white text/icons
- **BottomNavigation**: White background, gray inactive icons (#B0BEC5), Indigo active icon (#3949AB)

## Dark Mode
- Deep Navy palette based on #0D1B2A and #1C2A3A

# System Architecture

## Frontend
The frontend is a React with TypeScript application, built with Vite, Material-UI (MUI), shadcn/ui, and Tailwind CSS. It uses Wouter for routing, React Query for server state management, and context-based authentication with localStorage. The design is mobile-first, featuring a fixed layout with a 64px TopBar and 88px BottomNavigation, using a custom `useEdgeLockScroll` hook for iOS bounce prevention. The PWA is configured for offline support and installability, utilizing the "Spiritual Tech Indigo" design system with Inter font family.

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
- **Analytics Module**: SuperAdmin-only analytics dashboard with page view tracking, visitor statistics, device/browser/OS breakdown, and geographic distribution.
- **Cookie Consent**: GDPR-compliant cookie consent banner with localStorage persistence, required before analytics tracking activates.

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
- **usePageTracking**: Analytics hook that tracks page views with consent awareness.
- **useAnalytics**: Provides consent status and manual tracking functions.

## Analytics & Privacy

### Cookie Consent System
- **Component**: `CookieConsent.tsx` - GDPR-compliant banner displayed on first visit
- **Storage Key**: `dzematapp_cookie_consent` in localStorage with version tracking
- **States**: `pending`, `accepted`, `rejected`
- **Behavior**: Analytics tracking only activates after explicit user consent

### Analytics Tracking
- **Database Table**: `page_views` stores site, path, visitor/session IDs, device info, OS, browser, country
- **API Endpoints**:
  - `POST /api/analytics/track` - Public endpoint to record page views (requires cookie consent on client)
  - `GET /api/analytics/stats` - SuperAdmin only, returns aggregated statistics with filters
- **Frontend Integration**: `usePageTracking` hook in App.tsx tracks route changes via wouter's `useLocation`
- **Visitor Tracking**: Anonymous visitor ID (localStorage) and session ID (sessionStorage)
- **Site Detection**: Automatically detects `marketing` (dzematapp.com) vs `app` (app.dzematapp.com)

# Pending Integrations

## Paddle Payment Integration (PENDING)
- **Status**: Awaiting user to complete Paddle registration
- **Plans to create in Paddle**: Basic €29/mo, Standard €39/mo, Full €49/mo
- **Required from user**: Vendor ID, API Key, Product IDs
- **Implementation**: Add checkout buttons to marketing site, webhooks for subscription status in app.dzematapp.com
- **Note**: Paddle is Merchant of Record - handles VAT/taxes automatically (as specified in AGB documents)