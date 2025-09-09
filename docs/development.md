# 🛠️ SASGOAPP Development Guide

## Getting Started

This guide will help you set up the SASGOAPP development environment and understand the codebase architecture.

## Prerequisites

### Required Software
- **Node.js 18+** - JavaScript runtime
- **npm 9+** - Package manager (comes with Node.js)
- **Git** - Version control
- **VS Code** (recommended) - Code editor with extensions

### Recommended VS Code Extensions
- **TypeScript and JavaScript** - Enhanced TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind CSS class suggestions
- **Prisma** - Database schema support
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **GitLens** - Enhanced Git capabilities

## Project Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/elagu123/sasgoapp.git
cd sasgoapp

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Frontend Environment (.env)
```bash
# Copy the example file
cp .env.example .env

# Edit with your configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
VITE_API_BASE_URL=http://localhost:3001
```

#### Backend Environment (backend/.env)
```bash
# Copy the example file
cd backend
cp .env.example .env

# Edit with your configuration
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=your_super_secure_access_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_32_chars_minimum
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup
```bash
cd backend
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # (Optional) Seed with sample data
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend server
cd backend
npm run dev

# Terminal 2 - Frontend server (new terminal)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database Studio**: Run `npm run db:studio` in backend folder

## Project Architecture

### Frontend Structure
```
src/
├── components/           # Reusable UI components
│   ├── budget/          # Budget tracking components
│   ├── dashboard/       # Dashboard widgets
│   ├── itinerary/       # Itinerary management
│   ├── maps/           # Google Maps integration
│   ├── onboarding/     # User onboarding flow
│   ├── packing/        # Packing list management
│   └── pwa/            # Progressive Web App components
├── contexts/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── services/           # API and external services
├── utils/              # Utility functions
├── types.ts            # TypeScript type definitions
└── constants.ts        # Application constants
```

### Backend Structure
```
backend/src/
├── controllers/        # HTTP request handlers
├── middleware/         # Express middleware
├── routes/            # API route definitions
├── services/          # Business logic services
├── validators/        # Request validation schemas
├── utils/             # Utility functions
└── index.ts           # Main server entry point
```

## Key Technologies & Patterns

### Frontend Technologies
- **React 19.1.1** with TypeScript for type safety
- **Vite** for fast development builds
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Hook Form** + **Zod** for form validation
- **@dnd-kit** for drag-and-drop functionality
- **@tanstack/react-virtual** for performance optimization

### Backend Technologies
- **Express.js** with TypeScript
- **Prisma ORM** for database operations
- **JWT** for authentication
- **Zod** for request validation
- **bcrypt** for password hashing
- **WebSocket** for real-time features

### State Management Patterns
- **React Context** for global state (auth, theme)
- **Custom hooks** for component logic
- **Server state** with React Query patterns
- **Local state** with useState/useReducer

## Development Workflow

### 1. Feature Development Process
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Development Cycle**
   - Write TypeScript interfaces in `types.ts`
   - Create backend API endpoints with validation
   - Implement frontend components with proper error handling
   - Add tests for new functionality
   - Update documentation

3. **Code Quality Checks**
   ```bash
   # Frontend type checking
   npm run type-check
   
   # Backend type checking
   cd backend
   npx tsc --noEmit
   
   # Run tests
   npm run test
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   git push origin feature/new-feature-name
   ```

### 2. Database Changes
```bash
# 1. Update schema in prisma/schema.prisma
# 2. Generate migration
cd backend
npx prisma migrate dev --name describe_changes

# 3. Generate updated client
npm run db:generate
```

### 3. Adding New API Endpoints
1. **Define route** in `backend/src/routes/`
2. **Create controller** in `backend/src/controllers/`
3. **Add validation** in `backend/src/validators/`
4. **Implement service logic** in `backend/src/services/`
5. **Update API client** in `src/services/api.ts`

### 4. Adding New Components
1. **Create component** in appropriate `src/components/` subfolder
2. **Add TypeScript interfaces** if needed
3. **Implement with proper error boundaries**
4. **Add to parent components or pages**
5. **Write unit tests** in `__tests__` folder

## Testing Strategy

### Frontend Testing
```bash
# Unit tests with Vitest
npm run test

# E2E tests with Playwright
npm run test:e2e

# Run specific test file
npm run test -- ComponentName
```

### Backend Testing
```bash
cd backend
npm run test                    # All tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:watch             # Watch mode
```

### Test Structure
- **Unit tests**: Individual functions and components
- **Integration tests**: API endpoints with database
- **E2E tests**: Complete user workflows
- **Real-time tests**: WebSocket collaboration features

## Debugging

### Frontend Debugging
- **React DevTools** - Component state and props inspection
- **Browser DevTools** - Network requests and console logs
- **Vite DevTools** - Build and hot reload information

### Backend Debugging
- **VS Code Debugger** - Set breakpoints in TypeScript
- **Console logs** - Structured logging with timestamps
- **Prisma Studio** - Database content inspection
- **API testing** - Use Postman or curl for endpoint testing

### Common Debug Commands
```bash
# Frontend
npm run dev -- --debug        # Verbose output
npm run build -- --debug      # Build debugging

# Backend  
npm run dev                    # Auto-restart with logs
npm run db:studio             # Database GUI
npm run db:reset              # Reset database
```

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Use React.lazy() for route components
- **Virtualization**: @tanstack/react-virtual for long lists
- **Memoization**: React.memo, useMemo, useCallback
- **Image Optimization**: Proper sizing and formats
- **Bundle Analysis**: Use `npm run build -- --analyze`

### Backend Performance
- **Database Queries**: Optimize with Prisma insights
- **Caching**: Implement Redis for frequent queries
- **Rate Limiting**: Prevent API abuse
- **Connection Pooling**: Database connection management

## Security Guidelines

### Frontend Security
- **Input Validation**: Always validate user inputs
- **XSS Prevention**: Sanitize HTML content
- **Environment Variables**: Never expose secrets
- **HTTPS Only**: Use secure connections in production

### Backend Security
- **Authentication**: JWT tokens with proper expiration
- **Authorization**: Role-based access control
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: Prevent brute force attacks
- **Input Sanitization**: Validate all incoming data

## Common Issues & Solutions

### Development Issues

#### Port Already in Use
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

#### Database Connection Issues
```bash
# Reset database
cd backend
npm run db:reset

# Check database file permissions
ls -la dev.db
```

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

#### Build Errors
```bash
# Clear build cache
rm -rf .vite dist
npm run build
```

### Production Issues

#### Environment Variables Not Loading
- Ensure `.env` files are in correct locations
- Check variable naming (VITE_ prefix for frontend)
- Verify production environment setup

#### Database Migration Errors
```bash
cd backend
npx prisma migrate reset
npx prisma migrate deploy
```

## Useful Commands Reference

### Development Commands
```bash
# Frontend
npm run dev                    # Start development server
npm run build                  # Production build
npm run preview               # Preview production build
npm run type-check            # TypeScript checking

# Backend
npm run dev                    # Start development server
npm run build                  # Compile TypeScript
npm run start                  # Run production build

# Database
npm run db:generate           # Generate Prisma client
npm run db:migrate           # Run migrations
npm run db:studio            # Database GUI
npm run db:seed              # Seed database
npm run db:reset             # Reset database
```

### Git Workflow
```bash
git checkout main             # Switch to main branch
git pull origin main         # Get latest changes
git checkout -b feature/name  # Create feature branch
git add .                     # Stage changes
git commit -m "type: message" # Commit with conventional format
git push origin feature/name  # Push feature branch
```

## Contributing Guidelines

### Code Style
- **TypeScript**: Use strict mode and proper types
- **React**: Functional components with hooks
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for components)
- **Comments**: Document complex logic and business rules
- **Formatting**: Automatic with Prettier

### Commit Message Format
```
type(scope): description

feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for trip service
refactor: improve error handling
```

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Request code review
4. Address feedback
5. Merge when approved

## Getting Help

### Resources
- **Main Documentation**: [README.md](../README.md)
- **API Reference**: [api.md](./api.md)
- **Deployment Guide**: [deployment.md](./deployment.md)

### Support Channels
- **GitHub Issues**: Technical problems and bug reports
- **Email**: agsasmoda@gmail.com for development questions
- **Code Review**: Use GitHub pull requests for code feedback

---

Happy coding! 🚀