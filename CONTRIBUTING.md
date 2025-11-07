# Contributing to PAI Voice Server

Thank you for your interest in contributing to PAI Voice Server! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **Bun**: Latest version ([install Bun](https://bun.sh))
- **Task**: For task automation ([install Task](https://taskfile.dev))
- **macOS**: Required for full testing (uses LaunchAgent)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/pai/voice-server.git
cd voice-server

# Setup development environment
task setup

# Build the package
task build

# Link for local testing
task test:install
```

## Project Structure

```
voice-server/
├── setup/                  # NPM installation package
│   ├── lib/                # Core modules
│   │   ├── commands/       # Command implementations
│   │   ├── core/           # Core functionality
│   │   └── utils/          # Utility functions
│   ├── tests/              # Test suites
│   │   ├── unit/           # Unit tests
│   │   └── integration/    # Integration tests
│   ├── install.js          # CLI entry point
│   └── package.json        # Package configuration
├── server.ts               # Voice server implementation
├── voices.json             # Voice configuration
├── Taskfile.yml            # Task automation
└── .github/workflows/      # CI/CD workflows
```

## Development Workflow

### Using Taskfile

We use [Task](https://taskfile.dev) for local development automation:

```bash
# Show available tasks
task --list

# Show detailed help
task help

# Common development tasks
task setup              # Initialize environment
task build              # Build distribution
task test               # Run all tests
task lint               # Check code style
task lint:fix           # Auto-fix issues
```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   task test               # Run tests
   task lint               # Check code style
   task build              # Build package
   task test:cli           # Test CLI commands
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Adding tests
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

## Testing

### Running Tests

```bash
# Run all tests
task test

# Run specific test suites
task test:unit              # Unit tests only
task test:integration       # Integration tests only

# Watch mode
task test:watch             # Re-run on changes

# Coverage report
task test:coverage          # Generate coverage report
```

### Writing Tests

- Place unit tests in `setup/tests/unit/`
- Place integration tests in `setup/tests/integration/`
- Follow the existing test structure
- Aim for high code coverage
- Test both success and error cases

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Code Quality

### Linting

We use ESLint for code quality:

```bash
# Check for issues
task lint

# Auto-fix issues
task lint:fix
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Always use semicolons
- Follow Unix line endings
- No trailing whitespace
- One newline at end of file

### ESLint Rules

See `setup/.eslintrc.json` for complete rules.

### Security

```bash
# Run security audit
task security:audit
```

## Submitting Changes

### Pull Request Process

1. **Ensure all tests pass:**
   ```bash
   task test
   task lint
   task build
   ```

2. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request:**
   - Go to GitHub and create a PR
   - Provide a clear description of changes
   - Link any related issues
   - Ensure CI/CD checks pass

4. **Address review comments:**
   - Make requested changes
   - Push updates to your branch
   - Request re-review when ready

### PR Requirements

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No merge conflicts
- [ ] CI/CD checks pass

## Release Process

### Version Bumping

Use Task commands for version management:

```bash
# Bump patch version (1.0.x)
task version:patch

# Bump minor version (1.x.0)
task version:minor

# Bump major version (x.0.0)
task version:major
```

This will:
1. Update version in package.json
2. Create a git commit
3. Create a git tag
4. Display push instructions

### Publishing

Publishing is automated via GitHub Actions:

1. **Push the tag:**
   ```bash
   git push origin main
   git push origin v1.0.0
   ```

2. **GitHub Actions will:**
   - Run full test suite
   - Build the package
   - Publish to npm
   - Create GitHub release

3. **Verify the release:**
   - Check npm: https://npmjs.com/package/pai-voice-server
   - Check GitHub releases
   - Test installation: `npm install -g pai-voice-server`

### Pre-release Checklist

- [ ] All tests passing locally
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Documentation updated
- [ ] No open critical issues
- [ ] CI/CD passing on main

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/pai/voice-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pai/voice-server/discussions)
- **Documentation**: See README.md and CLAUDE.md

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PAI Voice Server! 🎉
