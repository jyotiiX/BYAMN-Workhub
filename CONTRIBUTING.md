# Contributing to BYAMN-Workhub

Thank you for your interest in contributing to BYAMN-Workhub! We welcome contributions from the community and appreciate your effort to improve this project.

## How to Contribute

### Reporting Bugs
If you find a bug, please create an issue on the repository with:
- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or logs (if applicable)
- Your environment details (OS, browser, Node version, etc.)

### Suggesting Enhancements
Enhancement suggestions are also welcome! Please create an issue with:
- A clear title and description of the enhancement
- Why you think this enhancement would be useful
- Possible implementation approach (optional)

### Submitting Pull Requests
1. Fork the repository
2. Create a new branch for your feature or bugfix (`git checkout -b feature/your-feature-name`)
3. Make your changes following the code style guidelines
4. Commit your changes with clear, descriptive commit messages
5. Push to your fork (`git push origin feature/your-feature-name`)
6. Open a Pull Request with a clear description of your changes

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Bun package manager

### Installation
```bash
git clone https://github.com/yourusername/BYAMN-Workhub.git
cd BYAMN-Workhub
bun install
```

### Running the Development Server
```bash
bun run dev
```

The application will be available at `http://localhost:5173`

### Building for Production
```bash
bun run build
```

## Code Style Guidelines

- **Language**: TypeScript
- **Framework**: React
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui

### Code Standards
- Use TypeScript for all new code
- Write functional components with hooks
- Follow the existing project structure
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure code is properly formatted (the project uses ESLint)

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (e.g., "Add", "Fix", "Update", "Remove")
- Keep the first line under 50 characters
- Reference related issues when applicable (e.g., "Fixes #123")

## Project Structure

- `src/components/` - Reusable React components
- `src/pages/` - Page components
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React context providers
- `src/lib/` - Utility functions and configurations
- `src/ui/` - shadcn/ui component library

## Pull Request Process

1. Update the README.md with any new features or changes
2. Ensure your code follows the existing code style
3. Test your changes thoroughly
4. Request review from maintainers
5. Address any feedback or requested changes
6. Once approved, your PR will be merged

## Code of Conduct

By contributing to this project, you agree to uphold a respectful and inclusive community. Be kind to others, respect differing opinions, and help create a positive environment for all contributors.

## Questions?

If you have questions or need help with contributing, feel free to:
- Create a discussion in the repository
- Open an issue with your question
- Contact the maintainers

Thank you for contributing to BYAMN-Workhub! 🎉
