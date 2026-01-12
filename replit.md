# AirTransfer - Airport Transfer Booking Service

## Overview

AirTransfer is a premium airport transfer booking platform that enables customers to book airport transportation services through a streamlined, multi-step booking form. The application features a public-facing landing page with vehicle fleet information and an admin dashboard for managing bookings, drivers, zones, rates, and pricing rules.

The platform emphasizes conversion-focused design with professional imagery, transparent pricing, and a simplified booking experience inspired by leading travel and transportation services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for component-based UI development
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens

**Design System:**
- Typography: Poppins for headings, Inter for body text (Google Fonts)
- Color scheme: Custom HSL-based color system with CSS variables for theming
- Component library: Extensive set of pre-built UI components (40+ components including forms, dialogs, tables, etc.)
- Responsive design with mobile-first approach

**Key UI Patterns:**
- Multi-step booking form with validation at each step
- Admin layout with sidebar navigation for management features
- Toast notifications for user feedback
- Modal dialogs for CRUD operations
- Server-side data fetching with optimistic updates

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- Session-based authentication for admin users
- RESTful API endpoints under `/api` prefix

**Development Environment:**
- Vite for fast development with HMR (Hot Module Replacement)
- Custom middleware for request/response logging
- Development-only features (runtime error overlay, dev banner)

**API Structure:**
- Admin authentication: `/api/admin/login`, `/api/admin/logout`, `/api/admin/me`
- Resource management endpoints for drivers, zones, rates, pricing rules, and bookings
- CRUD operations with proper HTTP methods (GET, POST, PUT, DELETE)

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database queries and schema management
- Connection pooling for efficient database access

**Schema Design:**
- Admin users table with bcrypt-hashed passwords
- Drivers table with contact info, vehicle details, and active status
- Zones table for 17 St. Lucia service zones (seeded on first run)
- Zone routes table for zone-to-zone pricing with unique constraint on origin/destination pairs
- Hotels table with zoneId foreign key linking to zones
- Rates table for base pricing by vehicle class and party size
- Pricing rules table for dynamic pricing adjustments
- Bookings table with comprehensive trip details and status tracking

**Zone Management:**
- 17 St. Lucia zones: Gros Islet, Babonneau, Castries (North/East/Central/South/South East), Anse-La-Raye/Canaries, Soufriere, Choiseul, Laborie, Vieux-Fort (South/North), Micoud (South/North), Dennery (South/North)
- Zone-to-zone pricing: Admin selects origin zone, then sets prices to each destination zone
- Pricing uses upsert logic to update existing routes or create new ones
- Unique database constraint prevents duplicate zone route entries

**Data Models:**
- Zod schemas for runtime validation
- TypeScript types inferred from Drizzle schemas
- Insert schemas for data validation on create/update operations

### Authentication & Authorization

**Admin Authentication:**
- Username/password-based login with bcrypt password hashing
- Session management using express-session
- Session data stored server-side (session middleware configured but storage details in routes)
- Protected admin routes requiring authenticated session

**Security Considerations:**
- Password hashing with bcrypt (salt rounds: 10)
- Session-based auth prevents token exposure
- Admin-only endpoints require session validation

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui for pre-styled component implementations
- Lucide React for icon library

**State Management:**
- TanStack Query for server state, caching, and synchronization
- React Hook Form with Zod resolvers for form state and validation

**Styling:**
- Tailwind CSS v3 with custom configuration
- PostCSS for CSS processing
- Custom CSS variables for theme customization

**Database & ORM:**
- @neondatabase/serverless for PostgreSQL connection
- Drizzle ORM for type-safe database operations
- WebSocket support for Neon serverless via ws package

**Build Tools:**
- Vite for frontend bundling and dev server
- esbuild for backend bundling in production
- TypeScript compiler for type checking

**Development Tools:**
- @replit/vite-plugin-runtime-error-modal for error overlay
- @replit/vite-plugin-cartographer for code visualization
- tsx for running TypeScript in development

**Form Validation:**
- Zod for schema validation
- @hookform/resolvers for React Hook Form integration

**Date Handling:**
- date-fns for date manipulation and formatting
- react-day-picker for calendar UI component

**Session Management:**
- connect-pg-simple for PostgreSQL session store (configured but implementation details in server routes)

### Payment Processing (Stripe)

**Integration:**
- Stripe sandbox environment via Replit connector (stripe-replit-sync)
- Payment links created dynamically for each booking
- Webhook processing for payment status updates

**Payment Flows:**
- Hotel bookings: Fixed $30 booking fee, payment link sent after booking
- Destination bookings: Custom quote set by admin, payment link sent after pricing confirmed
- Idempotency: Payment links check paymentLinkSent flag (use force=true to resend)

**Key Files:**
- `server/stripeClient.ts`: Stripe client and webhook sync initialization
- `server/webhookHandlers.ts`: Stripe webhook event handlers

### Email Notifications (Resend)

**Integration:**
- Resend API via Replit connector
- HTML email templates for all workflows

**Email Workflows:**
1. **Booking Confirmation**: Sent when customer completes booking form
2. **Quote Notification**: Sent when admin sets pricing for destination bookings (idempotent - only first time)
3. **Payment Link**: Sent when admin triggers payment link (includes Stripe payment URL)
4. **Payment Confirmation**: Sent when customer completes payment via Stripe (triggered by checkout.session.completed webhook)
5. **Driver Assignment**: Sent to driver when admin assigns them to a booking (includes trip details, customer info, and driver fee)

**Key Files:**
- `server/resendClient.ts`: Resend API client
- `server/emailService.ts`: Email template generation and sending functions