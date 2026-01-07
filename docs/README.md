# BYAMN WorkHub Architecture Documentation

This documentation provides comprehensive information about the BYAMN WorkHub application's architecture, design patterns, and implementation details.

## Overview

BYAMN WorkHub is a React TypeScript application that serves as a platform for users to create and complete micro-tasks (campaigns) for monetary rewards. The application uses Firebase for authentication and real-time database operations.

## Documentation Structure

### Core Architecture
- **[Project Structure](./project-structure.md)** - Organization of files, folders, and why pages are structured this way
- **[Component Hierarchy](./component-hierarchy.md)** - Component organization, props documentation, and UI patterns
- **[Authentication Flow](./authentication-flow.md)** - User authentication, authorization, and session management

### Data & Backend
- **[Firebase Schema](./firebase-schema.md)** - Database models, data structures, and relationships
- **[API Interactions](./api-interactions.md)** - Database operation patterns and Firebase integration

## Quick Start

### Prerequisites
- Node.js 18+
- npm or bun
- Firebase project with Authentication and Realtime Database enabled

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd byamn-workhub

# Install dependencies
bun install

# Start development server
bun run dev
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase Authentication, Firebase Realtime Database
- **State Management**: React Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner for toasts

## Key Features

- User registration and authentication
- Campaign creation and management
- Work submission and approval system
- Wallet and payment tracking
- Leaderboard and user profiles
- Admin panel for moderation
- Responsive design for mobile and desktop

## Contributing

When contributing to the codebase, please refer to this documentation to understand the architecture and follow established patterns. For new features, ensure to update relevant documentation sections.

## Support

For questions about the architecture or implementation details, please refer to the specific documentation files or create an issue in the repository.
