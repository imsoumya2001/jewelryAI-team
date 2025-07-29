# JewelryAI Client Tracking System

## Overview

This is a sophisticated client management web application for JewelryAI, a company that provides AI-powered jewelry try-on services to jewelers worldwide. The application serves as a comprehensive dashboard for tracking client projects, team assignments, and business metrics with an emphasis on modern UI/UX and interactive visualizations.

## User Preferences

Preferred communication style: Simple, everyday language.
Data Policy: Never create sample or demo data - only work with authentic user data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom design system variables
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful API with typed routes
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

### Database Design
The system uses a relational PostgreSQL database with the following core entities:
- **Clients**: Primary business entities with comprehensive project information
- **Team Members**: Staff assignments and role management
- **Client Assignments**: Many-to-many relationship between clients and team members
- **Activities**: Audit trail and activity logging for client interactions
- **Daily Image Count**: Daily productivity tracking with automatic IST timezone reset capability
- **Transactions**: Financial tracking with multi-currency support

## Key Components

### Dashboard Features
- **KPI Cards**: Real-time metrics display with animated counters and multi-currency support
- **Interactive World Map**: Geographic client distribution visualization
- **Client Grid**: Filterable and searchable client management interface
- **Activity Feed**: Real-time activity tracking and notifications
- **Progress Tracking**: Circular and linear progress indicators
- **Daily Image Tracking**: Horizontal input bar for productivity tracking with GitHub-style heatmap calendar
- **Multi-Currency Toggle**: USD/INR conversion with real-time exchange rates

### Client Management
- **Comprehensive Client Profiles**: Contact information, project details, financial tracking
- **Status Management**: Project status tracking with color-coded indicators
- **Team Assignment**: Flexible team member assignment system
- **Progress Monitoring**: Percentage-based progress tracking with visual indicators

### UI/UX Design System
- **Color Palette**: Navy sidebar, jewelry-themed accent colors (gold, purple, blue)
- **Typography**: Modern sans-serif with proper hierarchy
- **Component Library**: Comprehensive set of reusable components
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Micro-interactions**: Smooth animations and hover effects

## Data Flow

### Client Data Management
1. Client information is stored in PostgreSQL database
2. Drizzle ORM provides type-safe database operations
3. Express API routes handle CRUD operations
4. React Query manages client-side caching and synchronization
5. UI components render real-time data with optimistic updates

### Real-time Updates
1. Database changes trigger API responses
2. React Query invalidates and refetches affected data
3. UI components automatically re-render with new data
4. Toast notifications provide user feedback

## External Dependencies

### Production Dependencies
- **Database**: Neon serverless PostgreSQL for scalable data storage
- **Session Storage**: PostgreSQL-based session management
- **UI Components**: Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography

### Development Tools
- **Type Safety**: TypeScript across the full stack
- **Code Quality**: ESLint and TypeScript compiler checks
- **Build Optimization**: Vite with esbuild for fast compilation
- **CSS Processing**: PostCSS with Tailwind CSS

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Environment variable-based Neon connection
- **Session Handling**: Development mode session configuration

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild-compiled Express server
- **Static Assets**: Served from Express with appropriate caching headers
- **Environment Configuration**: Environment-specific database and session settings

### Scalability Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **Session Storage**: PostgreSQL-based sessions support horizontal scaling
- **Frontend**: Static asset serving can be moved to CDN
- **API**: Express server can be containerized and load-balanced

The architecture prioritizes developer experience with type safety, fast development cycles, and modern tooling while maintaining production-ready scalability and performance characteristics.

## Recent Changes

### July 14, 2025 - Manual Transaction Form Enhancement
- **Added Transaction Name Field**: New top-level name field for transaction identification
- **Enhanced Currency Support**: Added 15 currencies with flag emojis (USD, EUR, GBP, INR, AED, CAD, AUD, JPY, CHF, CNY, SAR, QAR, OMR, BHD, KWD)
- **Removed Transaction Type**: Eliminated confusing transaction type field as requested
- **Standardized Categories**: Updated to Revenue/Salary/Expenses for consistency across system
- **Optional Fields**: Made all fields optional for flexible transaction entry
- **Native Select Elements**: Used native HTML select elements for better stability and performance
- **Improved UX**: Clear field labels and intuitive form flow

### July 14, 2025 - Project Progress Metric Implementation
- **Overall Progress Calculation**: Implemented comprehensive project progress metric for dashboard
- **Active Client Focus**: Progress calculation uses only active clients (Planning/Running status)
- **Combined Metrics**: Progress percentage based on both images made/requested and jewelry articles made/requested
- **Real-time Updates**: Progress bar updates automatically when client data changes
- **Detailed Breakdown**: Modal shows individual client progress with separate image and jewelry tracking
- **Mobile Responsive**: Progress section displays properly on mobile with side-by-side layout
- **Field Mapping**: Used correct database fields (imagesMade, totalImagesToMake, jewelryArticlesMade, totalJewelryArticles)

### July 14, 2025 - ResizeObserver Error Resolution & Enhanced Stability
- **Fixed Critical Runtime Errors**: Completely eliminated ResizeObserver errors that appeared when interacting with dropdown menus
- **Replaced Radix UI Select Components**: Switched to native HTML select elements for currency and status selection to prevent browser timing conflicts
- **Enhanced Error Handling**: Added comprehensive error boundaries and optimistic mutations for instant updates
- **Arabic Currency Display**: Updated Arabic currencies (AED, OMR, QAR) to display in English format
- **Delete Client Functionality**: Added delete button with confirmation dialog accessible during edit mode
- **Improved Data Synchronization**: Fixed instant update issues with proper rollback on errors
- **Native Select Styling**: Maintained design consistency while using stable HTML select elements

### July 14, 2025 - Quick-Edit Functionality Implementation
- **Replaced Complex Edit System**: Removed traditional modal-based editing in favor of inline quick-edit fields
- **Quick-Edit Field Component**: Created reusable component for inline editing of numeric values with:
  - Click-to-edit functionality with immediate save/cancel options
  - Support for currency and number types with proper formatting
  - Keyboard shortcuts (Enter to save, Escape to cancel)
  - Visual feedback with edit icons appearing on hover
- **Client Quick Cards**: New dashboard section with compact client cards featuring:
  - Inline editing for payment amounts, image counts, and article progress
  - Real-time progress calculation and visual indicators
  - Direct access to detailed client view
- **Enhanced Client Detail Modal**: Updated with inline editing for:
  - Amount paid (with currency support)
  - Images made/total images to make
  - Jewelry articles made/total articles to work on
- **Simplified Update Workflow**: Users can now update key metrics directly from:
  - Dashboard quick cards
  - Client detail modal
  - Multiple update paths for improved accessibility
- **Removed Edit Button Dependencies**: Eliminated complex state management issues and console errors
- **Improved API Integration**: Enhanced PATCH endpoint usage for granular field updates

### July 13, 2025 - Comprehensive UI/UX Enhancement
- **Enhanced Glassmorphism Design**: Applied modern glassmorphism styling across all pages with backdrop blur effects and translucent cards
- **Consistent Bento Card Design**: Standardized all metric cards across Analytics and Finances pages to match Dashboard's modern bento card layout with:
  - Gradient icon backgrounds with hover scale animations
  - Colored shadow effects matching card themes
  - Smooth translate and scale hover transitions
  - Consistent spacing and typography
- **Sidebar Enhancement**: Updated sidebar with enhanced glassmorphism effects, backdrop blur, and micro-animations
- **Interactive Elements**: Added hover effects, micro-animations, and smooth transitions throughout the application
- **Animated Backgrounds**: Implemented subtle animated gradient blobs for visual appeal
- **Mobile Responsiveness**: Ensured all enhancements work seamlessly across device sizes