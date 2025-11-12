# Dashboard Dev Notes

## 🚀 Quick Start

### Initial Setup
```bash
# Install dependencies and setup database
pnpm run setup

# Start development server with Turbo mode
pnpm run dev
```

### Development Servers

#### Standard Development (with Turbo)
```bash
pnpm run dev          # Fast development with --turbo
pnpm run dev:debug    # Debug mode with Node inspector
pnpm run dev:clean    # Clean .next cache and start fresh
```

#### Fixed-port Development (Windows PowerShell)
```powershell
# Default port 3051
pnpm run dev:strict

# Custom port
$env:PORT=3000; pnpm run dev:strict
```

### Debugging

#### VS Code Debug Configurations
- **Next.js: debug server-side** - Server-side debugging
- **Next.js: debug client-side** - Client-side debugging
- **Next.js: debug full stack** - Both server and client debugging
- **Debug Tests** - Unit/integration test debugging
- **Debug E2E Tests** - End-to-end test debugging

#### Manual Debug Commands
```bash
# Debug development server
pnpm run dev:debug

# Debug specific test file
pnpm test -- --run path/to/test.spec.ts
```

## 🧪 Testing

### Test Commands
```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with UI
pnpm test:ui

# Run coverage report
pnpm test:coverage

# Run specific test types
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
pnpm test:e2e         # E2E tests only
pnpm test:all         # All test types

# Quality check (lint + typecheck + coverage)
pnpm run quality
```

### Test Structure
- `__tests__/api/` - API route tests
- `__tests__/components/` - Component tests
- `__tests__/hooks/` - Custom hook tests
- `__tests__/integration/` - Integration tests
- `e2e/` - End-to-end tests

## 🔧 Development Tools

### Code Quality
```bash
# Lint and fix
pnpm run lint:fix

# Type checking
pnpm run typecheck
pnpm run typecheck:watch

# Full quality check
pnpm run check
pnpm run check:fix
```

### Database
```bash
# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Prisma Studio
pnpm db:seed        # Seed database
pnpm db:reset       # Reset database
```

### Build & Preview
```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Start production server
pnpm run start
```

## 🌐 Health Checks & Troubleshooting

### Health Check
```powershell
curl.exe -sS http://localhost:3000/api/health
```

### Port Issues
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
Stop-Process -Id <PID> -Force
```

### Browser Access
- **Development**: <http://localhost:3000> → redirects to /dashboard
- **Fixed Port**: <http://localhost:3051> → redirects to /dashboard

## 📋 Development Workflow

1. **Setup**: `pnpm run setup`
2. **Develop**: `pnpm run dev`
3. **Test**: `pnpm run quality`
4. **Build**: `pnpm run build`
5. **Preview**: `pnpm run preview`

## 🔍 Performance Monitoring

- **Hot Reload**: Optimized with Turbo mode
- **Type Checking**: Watch mode available
- **Bundle Analysis**: Check `.next/static/chunks/` for bundle sizes
- **Test Coverage**: View `coverage/` directory after running tests
