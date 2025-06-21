# İşlem Takibi - Process Tracking Application

## Overview

İşlem Takibi is a Turkish-language process tracking application built as a full-stack web application. The system allows users to record work processes, track them by month, and manage administrative settings. It's designed to work primarily with client-side storage using localStorage, with minimal backend functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React state with localStorage persistence
- **UI Components**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack React Query (though minimal API usage)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution
- **Build**: esbuild for production bundling
- **Session Management**: connect-pg-simple (configured but not actively used)

### Database Strategy
- **Primary Storage**: Browser localStorage for client-side data persistence
- **Database Ready**: Drizzle ORM configured with PostgreSQL support
- **Schema**: Defined in shared/schema.ts with Zod validation
- **Migration Ready**: Drizzle Kit configured for future database integration

## Key Components

### Data Models
1. **ProcessRecord**: Core entity for tracking work processes
   - Fields: id, date, name, productCode, operationType, operationMeasure, quantity, description, createdAt
2. **AdminSettings**: Configuration management
   - Fields: password, companyName, productCodes, operationTypes, operationMeasures
3. **CSVFile**: File management for exports
   - Fields: id, name, month, year, data, createdAt

### Core Features
1. **Process Recording**: Form-based data entry with validation
2. **Monthly Summaries**: View and manage records by month
3. **CSV Export/Import**: Generate and download CSV files
4. **Admin Panel**: Password-protected settings management
5. **Data Management**: CRUD operations for configuration data

### UI Components
- **ProcessTracker**: Main application component handling all screens
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Form Validation**: Zod schemas for type-safe validation
- **Toast Notifications**: User feedback for actions

## Data Flow

### Client-Side Storage
1. **LocalStorage**: Primary data persistence layer
2. **Data Operations**: 
   - Records stored as JSON arrays
   - Settings stored as configuration objects
   - Recent names cached for user convenience
3. **State Management**: React state synchronized with localStorage

### File Operations
1. **CSV Generation**: Client-side CSV creation from stored data
2. **File Download**: Browser-based file download mechanism
3. **Import Capability**: CSV parsing and data import

### Screen Navigation
1. **Multi-Screen Architecture**: Single component managing multiple views
2. **Screen States**: 'record', 'summary', 'archive', 'admin-login', 'admin-panel', 'data-management'
3. **Authentication**: Session-based admin login state

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Framework**: Radix UI components, Tailwind CSS
- **Validation**: Zod for schema validation
- **Build Tools**: Vite, esbuild, TypeScript
- **Database (Ready)**: Drizzle ORM, @neondatabase/serverless
- **Utilities**: date-fns, clsx, class-variance-authority

### Development Dependencies
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ES modules, modern JavaScript features
- **Development Experience**: Hot module replacement, fast builds

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20, PostgreSQL 16 ready
- **Build Process**: 
  - Development: `npm run dev` with tsx
  - Production: Vite build + esbuild bundling
- **Port Configuration**: Internal 5000, external 80
- **Auto-scaling**: Configured for production deployment

### Build Pipeline
1. **Frontend Build**: Vite processes React application
2. **Backend Build**: esbuild bundles server code
3. **Static Assets**: Served from dist/public
4. **Production**: Single process serving both frontend and API

### Database Migration Path
- **Current**: localStorage-based storage
- **Future**: PostgreSQL with Drizzle ORM migrations
- **Migration Strategy**: Drizzle Kit configured for schema deployment

## Changelog
- June 21, 2025. Initial setup
- June 21, 2025. Updated branding and added features:
  - Changed "Developed by Yns TİGO" to "Developed by İlyas Yeşil" across all screens
  - Set default company name to "Eko Tek" 
  - Added company name display in top bar and footer of all screens
  - Added WhatsApp send functionality for individual CSV files in archive screen
  - Integrated intro video support (intro_1750486595677.mp4) with skip option
  - Enhanced mobile UI consistency across all screens

## User Preferences

Preferred communication style: Simple, everyday language.
Default company name: Eko Tek
Developer attribution: İlyas Yeşil