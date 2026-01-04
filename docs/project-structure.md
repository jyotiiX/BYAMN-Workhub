# Project Structure

This document explains the organization of the BYAMN WorkHub codebase and the reasoning behind the current structure.

## Directory Structure

```
byamn-workhub/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication-related components
│   │   ├── layout/        # Layout components (Navbar, Footer)
│   │   ├── ui/            # Base UI components (shadcn/ui)
│   │   └── NavLink.tsx    # Navigation link component
│   ├── contexts/          # React Context providers
│   │   └── AuthContext.tsx # Authentication state management
│   ├── hooks/             # Custom React hooks
│   │   ├── use-mobile.tsx # Mobile detection hook
│   │   └── use-toast.ts   # Toast notification hook
│   ├── lib/               # Utility libraries and configurations
│   │   ├── firebase.ts    # Firebase configuration
│   │   └── utils.ts       # General utility functions
│   ├── pages/             # Page components (routes)
│   │   ├── Auth.tsx       # Login/Register page
│   │   ├── Dashboard.tsx  # User dashboard
│   │   ├── Campaigns.tsx  # Campaign listing
│   │   ├── CreateCampaign.tsx # Campaign creation
│   │   ├── Leaderboard.tsx # Top earners leaderboard
│   │   ├── Wallet.tsx     # Wallet management
│   │   ├── Profile.tsx    # User profile view
│   │   ├── ProfileEdit.tsx # Profile editing
│   │   ├── MyWork.tsx     # User's submitted work
│   │   ├── AdminDashboard.tsx # Admin panel
│   │   ├── About.tsx      # About page
│   │   ├── PrivacyPolicy.tsx # Privacy policy
│   │   ├── Terms.tsx      # Terms of service
│   │   ├── Landing.tsx    # Landing page
│   │   ├── Index.tsx      # Home page
│   │   └── NotFound.tsx   # 404 page
│   ├── App.css            # Global styles
│   ├── App.tsx            # Main application component
│   ├── index.css          # Base styles and Tailwind imports
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # Vite type definitions
├── docs/                  # Documentation
├── node_modules/          # Dependencies (auto-generated)
├── bun.lockb              # Bun lockfile
├── package.json           # Project configuration and dependencies
├── package-lock.json      # npm lockfile
├── tsconfig.json          # TypeScript configuration
├── tsconfig.app.json      # App-specific TypeScript config
├── tsconfig.node.json     # Node-specific TypeScript config
├── tailwind.config.ts     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── vite.config.ts         # Vite build configuration
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML template
├── README.md              # Project README
├── LICENSE                # License file
├── SECURITY.md            # Security policy
├── CONTRIBUTING.md        # Contributing guidelines
└── CODE_OF_CONDUCT.md     # Code of conduct
```

## Organization Principles

### 1. Feature-Based Organization

The project uses a feature-based organization where related functionality is grouped together:

- **Pages**: Each page represents a distinct feature or user flow
- **Components**: Organized by purpose (auth, layout, ui) rather than feature
- **Contexts/Hooks**: Shared state and logic grouped by domain

### 2. Separation of Concerns

- **Components**: Pure UI components focused on presentation
- **Pages**: Container components that handle data fetching and state
- **Contexts**: Global state management
- **Hooks**: Reusable logic and side effects
- **Lib**: External service integrations and utilities

### 3. Scalability Considerations

The structure supports scaling by:

- **Modular Components**: UI components are reusable across features
- **Context Providers**: Global state is centralized and extensible
- **Utility Libraries**: Common functions are extracted for reuse
- **Type Definitions**: Shared types prevent duplication

## File Naming Conventions

- **Components**: PascalCase (e.g., `Navbar.tsx`, `UserProfile.tsx`)
- **Pages**: PascalCase matching route names (e.g., `Dashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Contexts**: PascalCase with `Context` suffix (e.g., `AuthContext.tsx`)
- **Utilities**: camelCase (e.g., `firebase.ts`, `utils.ts`)

## Import Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
// Use: import { Button } from '@/components/ui/button'
```

Configured in `tsconfig.json` and `vite.config.ts`.

## Why This Structure?

### Benefits

1. **Maintainability**: Related code is co-located, making changes easier
2. **Reusability**: Components and utilities can be shared across features
3. **Developer Experience**: Clear organization reduces cognitive load
4. **Scalability**: Structure supports adding new features without major refactoring
5. **Type Safety**: TypeScript integration ensures compile-time error checking

### Trade-offs

1. **Initial Learning Curve**: New developers need to understand the organization
2. **Cross-cutting Concerns**: Some utilities are spread across multiple directories
3. **Import Complexity**: Path aliases require build tool configuration

## Adding New Features

When adding new features:

1. **Create Page**: Add new page component in `src/pages/`
2. **Add Route**: Update `App.tsx` with new route
3. **Create Components**: Add feature-specific components in appropriate subfolder
4. **Update Context**: Extend existing contexts or create new ones if needed
5. **Add Types**: Define interfaces in relevant files or shared types file

## Configuration Files

Configuration files are placed in the root directory for easy access:

- **Build Tools**: `vite.config.ts`, `tsconfig.*.json`
- **Styling**: `tailwind.config.ts`, `postcss.config.js`
- **Linting**: `eslint.config.js`
- **Package Management**: `package.json`, `bun.lockb`

This organization keeps configuration separate from source code while maintaining accessibility.
