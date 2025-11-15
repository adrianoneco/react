# ChatApp - Real-time Chat Application

## Overview

ChatApp is a modern real-time messaging platform built with React, Express, and PostgreSQL. The application features a blue-purple gradient interface with a collapsible sidebar navigation system. It's designed as a full-stack TypeScript application with authentication, session management, AI-powered assistance, and WebRTC voice/video calling capabilities.

## Recent Changes (November 2025)

**AI-Powered Features**
- Integrated Groq API for AI-powered message assistance
- Message correction feature using AI to improve grammar and clarity
- Template suggestion generation using AI based on context
- Custom message templates with dynamic variables (clientName, attendantName, protocol, conversationDate)

**WebRTC Calling System**
- Bidirectional voice and video calling between users
- Incoming call prompts with accept/decline functionality
- Media controls (mute/unmute audio, enable/disable video)
- Robust cleanup of peer connections and media tracks
- Resilient handlers for race conditions in signaling
- Differentiated handling of call decline vs call end
- Automatic state synchronization between calls

**Bug Fixes**
- Removed duplicate JSON parsing in apiRequest calls
- Fixed async mutation handling in TanStack Query
- Corrected WebRTC signaling flow for incoming calls
- Implemented defensive guards to prevent concurrent calls
- Added comprehensive error handling with recovery mechanisms

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
- Sidebar navigation with routes for Conversations, Message Assistant, and Settings

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

**Real-time Features**
- WebSocket connections for live message updates
- WebRTC peer connections for voice/video calls
- ICE candidate exchange for optimal connection paths
- SDP offer/answer negotiation for call setup

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
- AI integration routes for text correction and template generation

**Authentication & Security**
- Argon2 password hashing (argon2id variant with secure parameters)
- Session-based authentication with httpOnly cookies
- Secure cookie configuration (secure flag in production)
- 7-day session expiration (configurable)
- Password validation using Zod schemas (minimum 6 characters)
- API key management via environment variables

**WebSocket Signaling**
- Real-time message broadcasting to conversation participants
- WebRTC signaling for call setup (offer, answer, ICE candidates)
- Call lifecycle management (call-start, call-end, call-declined)
- User presence tracking via authenticated WebSocket connections

### Data Storage

**Database Architecture**
- PostgreSQL database via Neon serverless driver
- Drizzle ORM for type-safe database queries and migrations
- Schema-first design with TypeScript type inference

**Database Schema**
- `users` table with UUID primary keys (generated using `gen_random_uuid()`)
- `conversations` table with protocol numbers and status tracking
- `messages` table with content, sender info, and reply threading
- `message_templates` table with title, content, and category fields
- User fields: id, username (unique), password (hashed), createdAt
- Timestamps for audit trails

**Data Access Layer**
- Repository pattern implementation (`DatabaseStorage` class)
- Interface-based storage abstraction (`IStorage`)
- Separation of concerns between routes and data access

**Validation & Type Safety**
- Drizzle-Zod integration for schema validation
- Zod schemas for login and registration with password confirmation
- Zod schemas for message templates and AI requests
- Portuguese language error messages for user-facing validation

### External Dependencies

**AI Services**
- Groq API integration for text correction and generation
- Groq Llama 3.3 70B model for high-quality responses
- Temperature-controlled generation (0.7 for natural responses)
- Streaming support for real-time AI responses

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

## Feature Status

### Completed Features
✅ User authentication and session management
✅ Real-time messaging with WebSocket
✅ Conversation management (create, update, list)
✅ Message threading with reply support
✅ Message templates with CRUD operations
✅ AI-powered text correction via Groq
✅ AI-powered template suggestions
✅ Dynamic variables in templates (clientName, attendantName, protocol, conversationDate)
✅ WebRTC voice calling
✅ WebRTC video calling
✅ Incoming call prompts with accept/decline
✅ Media controls (mute, camera toggle)
✅ Robust resource cleanup and error handling

### Planned Features
⏳ Calendar page for scheduling meetings
⏳ Meeting system with public/private configuration
⏳ Meeting recording capability
⏳ Meeting links generation and sharing
