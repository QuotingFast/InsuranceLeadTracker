# replit.md

## Overview

This is a full-stack web application built for insurance lead management and SMS marketing campaigns. The system captures insurance leads via webhooks, manages them in a PostgreSQL database, and executes SMS campaigns to drive lead conversion through personalized quote pages.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server for live updates
- **File Structure**: Monorepo with shared types and schemas

### Key Components

#### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless database with WebSocket support
- **Schema**: Comprehensive lead management schema including:
  - Leads with unique QF codes
  - Drivers and vehicles linked to leads
  - SMS message tracking with Twilio integration
  - Opt-out management and suppression lists
  - Quote views and call tracking
  - System alerts and compliance monitoring

#### API Layer
- **Lead Management**: CRUD operations for leads, drivers, and vehicles
- **SMS Campaigns**: Twilio integration with template-based messaging
- **Compliance**: TCPA compliance with timezone-aware scheduling
- **Analytics**: Dashboard metrics and quote performance tracking
- **Real-time Updates**: WebSocket broadcasting for live data updates

#### Frontend Components
- **Dashboard**: Main interface with metrics, recent leads, and quick actions
- **Lead Management**: Detailed lead viewing and management
- **SMS Composer**: Custom message creation and campaign management
- **Quote Pages**: Dynamic quote display with tracking
- **Compliance Monitoring**: Real-time compliance alerts and opt-out management

## Data Flow

1. **Lead Capture**: Webhook receives lead data and stores in database with generated QF code
2. **SMS Processing**: Automated SMS campaigns based on lead status and compliance rules
3. **Quote Generation**: Dynamic quote pages accessible via QF codes
4. **Tracking**: Comprehensive tracking of SMS delivery, quote views, and call conversions
5. **Real-time Updates**: WebSocket broadcasts updates to connected clients

## External Dependencies

### Core Services
- **Twilio**: SMS messaging service with delivery tracking
- **Neon**: Serverless PostgreSQL database hosting
- **WebSocket**: Real-time communication between client and server

### Frontend Libraries
- **Radix UI**: Headless UI components for accessibility
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Date-fns**: Date manipulation and formatting
- **Lucide React**: Icon library

### Backend Libraries
- **Drizzle ORM**: Type-safe database queries and migrations
- **Express**: Web framework for REST API
- **WebSocket (ws)**: WebSocket server implementation
- **Connect-pg-simple**: Session store for PostgreSQL

## Deployment Strategy

### Development
- **Environment**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module provisioned in Replit
- **Hot Reload**: Vite dev server with middleware integration
- **Process**: Single process running both frontend and backend

### Production
- **Build Process**: 
  - Frontend: Vite build outputs to `dist/public`
  - Backend: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit
- **Port Configuration**: External port 80 mapping to internal port 5000
- **Environment Variables**: DATABASE_URL, Twilio credentials required

### Configuration Files
- **Drizzle**: Schema migrations in `./migrations` directory
- **TypeScript**: Shared configuration for client, server, and shared code
- **Tailwind**: Component-specific styling with custom theme
- **Vite**: Development server with React plugin and runtime error overlay

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 25, 2025: Initial insurance lead management platform setup
- June 25, 2025: Integrated QuotePro Auto logo (https://quoteproauto.com/logo) in sidebar and quote pages
- June 25, 2025: Configured Twilio SMS integration with user credentials
- June 25, 2025: Updated database schema to handle comprehensive webhook data structure with detailed driver and vehicle information
- June 25, 2025: Fixed all navigation routing issues - all pages now functional
- June 25, 2025: Enhanced webhook processing to capture complete lead data including violations, accidents, claims, and insurance details
- June 25, 2025: Completed personalized quote page system with full lead details, call tracking, and professional branding
- June 25, 2025: Successfully tested SMS delivery to 9547905093 with personalized quote link functionality
- June 25, 2025: Implemented collapsible sidebar functionality to prevent content cutoff
- June 25, 2025: Enhanced custom SMS endpoint with automatic opt-out text, TCPA compliance validation, and suppression list checking
- June 25, 2025: Fixed database column naming issues preventing leads from loading properly
- June 25, 2025: Fixed manual SMS sending error and removed duplicate menu display issue
- June 25, 2025: Successfully tested SMS delivery with personalized quote link to user's phone (9547905093)
- June 25, 2025: Fixed all three issues: manual SMS sending error, duplicate menu display, and successfully sent test SMS with quote link
- June 25, 2025: CRITICAL ISSUE - SMS delivery failing due to Twilio credentials not properly configured, quote page showing "Not Found" error for existing QFTEST02 data
- June 25, 2025: Added comprehensive error logging to Twilio service to diagnose SMS delivery issues