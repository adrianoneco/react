# ChatApp - Real-time Chat Application

## Overview

ChatApp is a modern real-time messaging platform built with React, Express, and PostgreSQL. The application features a blue-purple gradient interface with a collapsible sidebar navigation system. It's designed as a full-stack TypeScript application with authentication, session management, and a component-based UI architecture using shadcn/ui components.

The application is currently in development, with authentication and basic navigation implemented. Future features include real-time messaging, contact management, and user settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- React Router (wouter) for lightweight client-side routing

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Component-based architecture with reusable UI elements in `client/src/components/ui/`
- Custom gradient theme (blue-purple) defined in design guidelines

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management
- Custom query client configuration with credential-based requests
- Context API for authentication state (`AuthContext`)
- Session-based authentication with automatic query invalidation

**Design System**
- Custom color palette using HSL variables for light/dark mode support
- Typography using Inter, DM Sans, and Fira Code fonts via Google Fonts CDN
- Consistent spacing system using Tailwind units (2, 3, 4, 6, 8)
- Collapsible sidebar with smooth transitions (300ms ease-in-out)
- Gradient header with fixed positioning and shadow depth

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ESM module system for modern JavaScript features
- Session management using express-session with configurable secrets

**API Design**
- RESTful API endpoints under `/api` prefix
- Modular route registration pattern (`registerRoutes`, `registerAuthRoutes`)
- JSON-based request/response handling
- Session-based authentication with cookie storage

**Authentication & Security**
- Argon2 password hashing (argon2id variant with secure parameters)
- Session-based authentication with httpOnly cookies
- Secure cookie configuration (secure flag in production)
- 7-day session expiration (configurable)
- Password validation using Zod schemas (minimum 6 characters)

### Data Storage

**Database Architecture**
- PostgreSQL database via Neon serverless driver
- Drizzle ORM for type-safe database queries and migrations
- Schema-first design with TypeScript type inference

**Database Schema**
- `users` table with UUID primary keys (generated using `gen_random_uuid()`)
- User fields: id, username (unique), password (hashed), createdAt
- Timestamps for audit trails

**Data Access Layer**
- Repository pattern implementation (`DatabaseStorage` class)
- Interface-based storage abstraction (`IStorage`)
- Separation of concerns between routes and data access

**Validation & Type Safety**
- Drizzle-Zod integration for schema validation
- Zod schemas for login and registration with password confirmation
- Portuguese language error messages for user-facing validation

### External Dependencies

**Database Services**
- Neon serverless PostgreSQL (via `@neondatabase/serverless`)
- WebSocket support for serverless connection pooling

**UI & Component Libraries**
- Radix UI primitives (20+ component packages)
- Tailwind CSS for utility-first styling
- Lucide React for iconography
- date-fns with Portuguese locale for date formatting

**Development Tools**
- Replit-specific plugins (vite-plugin-runtime-error-modal, cartographer, dev-banner)
- TypeScript for type checking across the stack
- Drizzle Kit for database migrations

**Build & Runtime**
- tsx for TypeScript execution in development
- esbuild for server-side production builds
- Vite for client-side bundling and HMR

**Session Storage**
- Express-session with in-memory store (development)
- connect-pg-simple ready for PostgreSQL session storage (production-ready)

**Form Handling**
- React Hook Form for form state management
- @hookform/resolvers for Zod schema integration
- Client-side validation with server-side verification