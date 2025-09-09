# 🏗️ SASGOAPP Architecture Overview

## System Architecture

SASGOAPP is a modern fullstack travel planning application built with a clean, scalable architecture that separates concerns and enables real-time collaboration through AI-powered features.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript Frontend (Vite)                         │
│  ├── PWA Capabilities                                           │
│  ├── Real-time WebSocket Client                                │
│  ├── AI Service Integration                                     │
│  └── State Management (Context + Hooks)                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                        HTTP/WebSocket
                               │
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                               │
├─────────────────────────────────────────────────────────────────┤
│  Express.js + TypeScript Backend                               │
│  ├── Authentication Middleware (JWT)                            │
│  ├── Rate Limiting & Security                                  │
│  ├── WebSocket Server (Yjs)                                    │
│  └── Request Validation (Zod)                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                         Application Layer
                               │
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC                              │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                  │
│  ├── Trip Management Service                                    │
│  ├── User Authentication Service                               │
│  ├── Real-time Collaboration Service                           │
│  ├── AI Recommendation Service                                 │
│  └── Notification Service                                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                         Data Access Layer
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Primary Database (SQLite/PostgreSQL + Prisma ORM)             │
│  ├── Users & Authentication                                    │
│  ├── Trips & Itineraries                                       │
│  ├── Expenses & Budget Tracking                                │
│  └── Collaborative Documents                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  ├── Google Gemini AI (Recommendations)                        │
│  ├── Google Maps API (Geocoding & Maps)                        │
│  ├── Weather API (Forecasts)                                   │
│  └── Email Service (Notifications)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture (React + TypeScript)

```
src/
├── components/                 # UI Components
│   ├── budget/                # Budget tracking components
│   │   ├── BudgetInsights.tsx # AI-powered budget analysis
│   │   ├── AddExpenseDialog.tsx
│   │   └── ExpenseList.tsx
│   ├── dashboard/             # Dashboard widgets
│   ├── itinerary/            # Itinerary management
│   ├── maps/                 # Google Maps integration
│   ├── onboarding/           # User onboarding flow
│   ├── packing/              # Smart packing lists
│   └── pwa/                  # PWA specific components
├── contexts/                  # React Context Providers
│   ├── AuthContext.tsx       # Authentication state
│   ├── ThemeContext.tsx      # Theme management
│   └── TripContext.tsx       # Current trip state
├── hooks/                    # Custom React Hooks
│   ├── useAuth.ts           # Authentication logic
│   ├── useCollaboration.ts  # Real-time features
│   ├── useExpenses.ts       # Expense management
│   └── useTrips.ts          # Trip operations
├── services/                # External Services
│   ├── api.ts              # REST API client
│   ├── geminiService.ts    # AI service integration
│   ├── googleMapsService.ts # Maps service
│   └── weatherService.ts   # Weather integration
├── lib/                    # Utility Libraries
│   ├── itinerary-time.ts   # Time calculations
│   ├── packingTemplates.ts # Smart packing logic
│   └── expenseSuggestions.ts # AI expense categorization
└── utils/                  # Utility Functions
    └── pwaUtils.ts         # PWA management
```

### Backend Architecture (Node.js + Express + TypeScript)

```
backend/src/
├── controllers/            # HTTP Request Controllers
│   ├── auth.controller.ts  # Authentication endpoints
│   ├── trip.controller.ts  # Trip management
│   ├── expense.controller.ts # Expense tracking
│   └── collaboration.controller.ts # Real-time features
├── services/              # Business Logic Services
│   ├── auth.service.ts    # User authentication
│   ├── trip.service.ts    # Trip operations
│   ├── packing.service.ts # Packing list management
│   ├── collaboration.service.ts # Real-time sync
│   └── notification.service.ts # Email/push notifications
├── middleware/            # Express Middleware
│   ├── auth.middleware.ts # JWT verification
│   ├── csrf.middleware.ts # CSRF protection
│   ├── validation.middleware.ts # Request validation
│   └── rateLimit.middleware.ts # Rate limiting
├── routes/               # API Route Definitions
│   ├── auth.routes.ts    # Authentication routes
│   ├── trip.routes.ts    # Trip management routes
│   ├── expense.routes.ts # Expense routes
│   └── collaboration.routes.ts # WebSocket routes
├── validators/           # Request Validation Schemas
│   ├── auth.validator.ts  # Auth request validation
│   ├── trip.validator.ts  # Trip request validation
│   └── expense.validator.ts # Expense validation
└── utils/               # Backend Utilities
    ├── jwt.ts           # JWT token management
    ├── crypto.ts        # Encryption utilities
    └── email.ts         # Email service
```

## Data Architecture

### Database Schema (Prisma + SQLite/PostgreSQL)

```sql
-- Core Entities Relationships

User (1) ────── (N) Trip
User (1) ────── (N) Expense
User (1) ────── (N) PackingList

Trip (1) ────── (N) TripMember
Trip (1) ────── (1) Itinerary  
Trip (1) ────── (N) Expense
Trip (1) ────── (1) PackingList

Itinerary (1) ─ (N) ItineraryDay
ItineraryDay (1) ── (N) ItineraryBlock

PackingList (1) ─ (N) PackingListItem
```

### Key Data Models

#### User Model
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  preferences: UserProfile;
  createdAt: Date;
  refreshTokens: RefreshToken[];
  trips: Trip[];
  expenses: Expense[];
}
```

#### Trip Model
```typescript
interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string[];
  dates: { start: string; end: string };
  travelers: number;
  budget: number;
  pace: 'relaxed' | 'moderate' | 'intense';
  interests: string[];
  privacy: 'private' | 'link' | 'public';
  members: TripMember[];
  itinerary?: Itinerary;
  packingList?: PackingList;
  expenses: Expense[];
  createdAt: Date;
  version: number; // For optimistic locking
}
```

#### Real-time Collaboration Model
```typescript
interface CollaborationSession {
  tripId: string;
  users: Map<string, UserCursor>;
  document: Yjs.Doc;
  lastModified: Date;
}

interface UserCursor {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  selection?: TextSelection;
  color: string;
}
```

## Authentication & Authorization

### JWT Token Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Access Token  │    │   Refresh Token  │    │   CSRF Token    │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ Short-lived     │    │ Long-lived       │    │ Request-specific│
│ (15 minutes)    │    │ (7 days)         │    │ (Per session)   │
│                 │    │                  │    │                 │
│ Contains:       │    │ Contains:        │    │ Contains:       │
│ - User ID       │    │ - User ID        │    │ - Random token  │
│ - Permissions   │    │ - Token family   │    │ - Session ID    │
│ - Issued time   │    │ - Issued time    │    │ - Expiration    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Authorization Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│ Extract Tokens  │ ◄─── Headers: Authorization, X-CSRF-Token
├─────────────────┤
│ Validate Access │
│ Token           │
└─────────┬───────┘
          │
     Valid? ──No──► Return 401 Unauthorized
          │
         Yes
          ▼
┌─────────────────┐
│ Validate CSRF   │
│ Token           │
└─────────┬───────┘
          │
     Valid? ──No──► Return 403 Forbidden
          │
         Yes
          ▼
┌─────────────────┐
│ Check User      │
│ Permissions     │
└─────────┬───────┘
          │
  Authorized? ──No──► Return 403 Forbidden
          │
         Yes
          ▼
┌─────────────────┐
│ Process         │
│ Request         │
└─────────────────┘
```

## Real-time Collaboration Architecture

### WebSocket + Yjs Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                                  │
├─────────────────────────────────────────────────────────────────┤
│  React Components                                               │
│  ├── useSharedItinerary Hook                                   │
│  ├── Yjs Document Binding                                      │
│  ├── Conflict Resolution                                       │
│  └── Live Cursors                                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │ WebSocket Connection
                  │ (Y.js sync protocol)
┌─────────────────▼───────────────────────────────────────────────┐
│                   SERVER SIDE                                   │
├─────────────────────────────────────────────────────────────────┤
│  WebSocket Server                                               │
│  ├── Room Management                                            │
│  ├── User Presence Tracking                                    │
│  ├── Document State Persistence                                │
│  └── Conflict Resolution                                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   PERSISTENCE                                   │
├─────────────────────────────────────────────────────────────────┤
│  Database Storage                                               │
│  ├── Trip Version Control                                      │
│  ├── Change History                                            │
│  └── Offline Sync Queue                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Collaboration Features
- **Real-time Editing**: Multiple users can edit itineraries simultaneously
- **Conflict Resolution**: Automatic merge of conflicting changes
- **Live Cursors**: See where other users are working
- **Presence Awareness**: Show online collaborators
- **Version History**: Track changes and revert if needed
- **Offline Support**: Queue changes when offline, sync when reconnected

## AI Integration Architecture

### Google Gemini AI Service

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND REQUEST                             │
├─────────────────────────────────────────────────────────────────┤
│  User Action                                                    │
│  ├── Request Itinerary Suggestion                             │
│  ├── Ask for Packing Recommendations                          │
│  ├── Get Budget Insights                                      │
│  └── Activity Recommendations                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                  AI SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Gemini Service (geminiService.ts)                             │
│  ├── Request Preprocessing                                     │
│  ├── Context Building                                          │
│  ├── Prompt Engineering                                        │
│  ├── Response Parsing                                          │
│  └── Error Handling & Fallbacks                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                 GOOGLE GEMINI API                               │
├─────────────────────────────────────────────────────────────────┤
│  AI Processing                                                  │
│  ├── Natural Language Understanding                            │
│  ├── Context Analysis                                          │
│  ├── Intelligent Recommendations                               │
│  └── Structured Response Generation                            │
└─────────────────────────────────────────────────────────────────┘
```

### AI Features Implementation

#### Smart Itinerary Generation
```typescript
interface ItineraryRequest {
  destination: string[];
  dates: { start: string; end: string };
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'intense';
  budget: number;
  travelers: number;
}

interface AIItineraryResponse {
  days: ItineraryDay[];
  totalEstimatedCost: number;
  tips: string[];
  alternativeActivities: Activity[];
}
```

#### Intelligent Budget Insights
```typescript
interface BudgetInsight {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  icon: string;
  actionable?: boolean;
}

// AI analyzes:
// - Spending pace vs trip progress
// - Category distribution
// - Historical patterns
// - Seasonal price variations
// - Local cost of living
```

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSPORT SECURITY                           │
├─────────────────────────────────────────────────────────────────┤
│ HTTPS/TLS 1.3 │ HSTS Headers │ Certificate Pinning             │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION SECURITY                         │
├─────────────────────────────────────────────────────────────────┤
│ CORS │ CSP │ CSRF Protection │ XSS Prevention │ Rate Limiting  │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION SECURITY                        │
├─────────────────────────────────────────────────────────────────┤
│ JWT Tokens │ Refresh Rotation │ Session Management │ 2FA Ready │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SECURITY                                │
├─────────────────────────────────────────────────────────────────┤
│ Input Validation │ SQL Injection Prevention │ Data Encryption  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Measures

#### Input Validation & Sanitization
```typescript
// Zod schemas for all endpoints
const createTripSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100),
    destination: z.array(z.string().min(1)),
    dates: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    budget: z.number().positive().max(1000000),
  }),
});
```

#### Rate Limiting Strategy
```typescript
// Different limits for different endpoints
const rateLimits = {
  auth: '5 requests per minute',
  api: '100 requests per minute',
  ai: '10 requests per minute',
  upload: '5 requests per minute',
};
```

## Performance Architecture

### Frontend Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                   LOADING PERFORMANCE                           │
├─────────────────────────────────────────────────────────────────┤
│ Code Splitting │ Lazy Loading │ Tree Shaking │ Bundle Analysis │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   RUNTIME PERFORMANCE                           │
├─────────────────────────────────────────────────────────────────┤
│ React.memo │ useMemo │ useCallback │ Virtual Scrolling         │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   CACHING STRATEGY                              │
├─────────────────────────────────────────────────────────────────┤
│ Browser Cache │ Service Worker │ API Response Cache            │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Performance Optimizations

```typescript
// Database Query Optimization
const optimizedTripQuery = await prisma.trip.findMany({
  select: {
    id: true,
    title: true,
    destination: true,
    dates: true,
    budget: true,
    // Only select needed fields
  },
  where: { userId },
  take: 20, // Pagination
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});

// Response Caching
app.use('/api', cacheMiddleware({
  '/trips': '5 minutes',
  '/expenses': '2 minutes',
  '/weather': '1 hour',
}));
```

## Scalability Considerations

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER                             │
├─────────────────────────────────────────────────────────────────┤
│ Nginx/HAProxy │ SSL Termination │ Health Checks              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┐
        │                   │             │
┌───────▼────────┐ ┌────────▼──────┐ ┌───▼──────────┐
│ App Server 1   │ │ App Server 2  │ │ App Server N │
├────────────────┤ ├───────────────┤ ├──────────────┤
│ Node.js        │ │ Node.js       │ │ Node.js      │
│ Express        │ │ Express       │ │ Express      │
│ WebSocket      │ │ WebSocket     │ │ WebSocket    │
└────────────────┘ └───────────────┘ └──────────────┘
        │                   │             │
        └─────────┬─────────┴─────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   SHARED SERVICES                               │
├─────────────────────────────────────────────────────────────────┤
│ Database │ Redis Cache │ File Storage │ Message Queue         │
└─────────────────────────────────────────────────────────────────┘
```

### Database Scaling

```sql
-- Read Replicas for Query Distribution
Master DB (Write) ──────► Replica 1 (Read)
    │                      Replica 2 (Read)
    │                      Replica N (Read)
    │
    ▼
Connection Pooling
    │
    ▼
Query Optimization
    │
    ▼
Caching Layer (Redis)
```

## Deployment Architecture

### Multi-Environment Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT                                │
├─────────────────────────────────────────────────────────────────┤
│ Local Machine │ SQLite │ Mock Services │ Hot Reload           │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                       STAGING                                   │
├─────────────────────────────────────────────────────────────────┤
│ Staging Server │ PostgreSQL │ Test APIs │ CI/CD Pipeline      │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION                                 │
├─────────────────────────────────────────────────────────────────┤
│ Cloud Platform │ Managed DB │ Production APIs │ Monitoring     │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

### Application Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGGING                                     │
├─────────────────────────────────────────────────────────────────┤
│ Structured Logs │ Log Aggregation │ Error Tracking            │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                     METRICS                                     │
├─────────────────────────────────────────────────────────────────┤
│ Response Times │ Throughput │ Error Rates │ Resource Usage    │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                     ALERTING                                    │
├─────────────────────────────────────────────────────────────────┤
│ Uptime Monitoring │ Performance Alerts │ Error Notifications  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Decision Rationale

### Frontend Technology Choices

| Technology | Rationale |
|------------|-----------|
| **React 19** | Latest features, excellent TypeScript support, large ecosystem |
| **TypeScript** | Type safety, better developer experience, fewer runtime errors |
| **Vite** | Fast development builds, optimized production bundles |
| **Tailwind CSS** | Utility-first approach, consistent design system |
| **Framer Motion** | Smooth animations, excellent React integration |

### Backend Technology Choices

| Technology | Rationale |
|------------|-----------|
| **Node.js** | JavaScript everywhere, excellent async performance |
| **Express.js** | Mature, flexible, extensive middleware ecosystem |
| **Prisma** | Type-safe database access, excellent migration support |
| **JWT** | Stateless authentication, scalable across services |
| **Yjs** | Excellent real-time collaboration, CRDT-based |

## Future Architecture Considerations

### Microservices Migration Path

```
Current Monolith
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FUTURE MICROSERVICES                         │
├──────────────────────────────────────────────────────────────────┤
│ User Service │ Trip Service │ AI Service │ Collaboration Service │
├──────────────────────────────────────────────────────────────────┤
│ API Gateway │ Service Mesh │ Message Queue │ Service Discovery  │
└──────────────────────────────────────────────────────────────────┘
```

### Advanced Features Roadmap
- **GraphQL API** for flexible queries
- **Event Sourcing** for audit trails
- **CQRS Pattern** for read/write optimization
- **Message Queues** for async processing
- **Machine Learning** for advanced recommendations

---

This architecture documentation provides a comprehensive overview of the SASGOAPP system design. For implementation details, see the [development guide](./development.md) or [API reference](./api.md).