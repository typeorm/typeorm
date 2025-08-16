# TypeORM Development Instructions

TypeORM is a TypeScript/JavaScript Object-Relational Mapping (ORM) library that supports multiple database systems including MySQL, PostgreSQL, SQLite, MongoDB, Microsoft SQL Server, Oracle, SAP HANA, and more. It supports both Active Record and Data Mapper patterns.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Prerequisites and Setup

### Required Software
- Node.js version 16.13.0 or higher (project specifies `>=16.13.0` in engines)
- npm (comes with Node.js)
- Git
- **Optional**: Docker for database testing (recommended)

### Database Setup for Testing
- For basic development: SQLite and better-sqlite3 work without external setup
- For comprehensive testing: MySQL, PostgreSQL, MongoDB, SQL Server, Oracle, SAP HANA
- Docker setup available: `docker-compose up` starts all supported databases
- **WARNING**: SAP HANA requires minimum 10GB RAM for Docker

## Bootstrap and Build Process

### Initial Setup Commands
Run these commands in sequence for a fresh clone:

```bash
# Install dependencies - takes ~3 minutes, NEVER CANCEL
npm ci

# Create ORM configuration for testing  
cp ormconfig.sample.json ormconfig.json

# Compile TypeScript - takes ~20 seconds
npm run compile
```

### Build Commands and Timing
- `npm ci` -- Install dependencies. Takes ~3 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
- `npm run compile` -- Compile TypeScript source. Takes ~20 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
- `npm run package` -- Build distribution package. Takes ~21 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
- `npm run pack` -- Build and create .tgz package. Takes ~30 seconds. NEVER CANCEL. Set timeout to 3+ minutes.

## Testing

### Test Configuration
- Tests use Mocha with 90-second timeout per test
- Tests are in `./test/` directory with subdirectories: `functional`, `github-issues`, `integration`, `unit`, `utils`
- Test configuration in `.mocharc.json`
- Each database requires specific configuration in `ormconfig.json`

### Running Tests
```bash
# Full test suite (requires database setup) - can take 30+ minutes total
npm test

# Fast test runner (skips compilation) - use after npm run compile
npm run test:fast

# Run specific tests by pattern
npm run test:fast -- --grep "basic functionality"

# Run with specific timeout and minimal reporter
npm run test:fast -- --timeout=60000 --reporter=min
```

**TIMING WARNINGS:**
- **NEVER CANCEL test runs** - Full test suite can take 30+ minutes across all databases
- SQLite-only tests typically complete in under 5 minutes
- Individual test groups complete in seconds to minutes
- Set timeouts to 60+ minutes for full test suites, 10+ minutes for targeted tests

### Database-Specific Testing
Edit `ormconfig.json` to enable/disable specific databases:
- Set `"skip": false` to enable a database for testing
- Set `"skip": true` to disable a database
- For SQLite-only testing: `jq 'map(select(.name == "better-sqlite3"))' ormconfig.sample.json > ormconfig.json`

## Code Quality and Validation

### Pre-commit Validation
**Always run these commands before committing changes:**

```bash
# Linting - takes ~36 seconds, shows warnings (expected)
npm run lint

# Code formatting check - takes ~22 seconds
npm run format:ci

# Auto-format code (if needed)
npm run format

# Type checking without compilation
npm run typecheck
```

**VALIDATION REQUIREMENTS:**
- All linting must pass (warnings are acceptable, errors are not)
- All formatting checks must pass
- Always run `npm run compile` successfully before testing
- Run relevant tests for your changes
- **CI will fail** if linting or formatting issues exist

## Development Workflows

### Common Development Tasks

1. **Making Code Changes:**
   - Edit source files in `./src/`
   - Run `npm run compile` to build
   - Run targeted tests: `npm run test:fast -- --grep "your-feature"`
   - Always test with at least SQLite before broader testing

2. **Adding New Features:**
   - Create entities in `./src/`
   - Add corresponding tests in `./test/functional/` or appropriate subdirectory
   - Follow existing test patterns (see DEVELOPER.md for test template)
   - Test across multiple database types if database-specific

3. **Database Driver Development:**
   - Driver files in `./src/driver/[database-name]/`
   - Each driver has its own query runner and connection logic
   - Test against actual database instances (use Docker)

4. **CLI Development:**
   - CLI source in `./src/cli.ts` and `./src/commands/`
   - Test CLI: `node build/compiled/src/cli.js --help`
   - CLI binaries defined in package.json: `typeorm`, `typeorm-ts-node-commonjs`, `typeorm-ts-node-esm`

### Faster Development Cycle
Instead of running full `npm test` repeatedly:
```bash
# Start TypeScript watch mode
npm run compile -- --watch

# In another terminal, run fast tests after changes
npm run test:fast -- --grep "your-test-pattern"
```

## Project Structure and Navigation

### Key Directories
- `./src/` - Main TypeScript source code
- `./src/driver/` - Database-specific drivers (mysql, postgres, sqlite, etc.)
- `./src/decorator/` - TypeORM decorators (@Entity, @Column, etc.)  
- `./src/query-builder/` - Query builder implementation
- `./src/repository/` - Repository pattern implementation
- `./src/entity-manager/` - Entity manager implementation
- `./test/` - Test suites organized by type
- `./sample/` - Example projects demonstrating various features
- `./docs/` - Documentation source
- `./build/compiled/` - Compiled JavaScript output
- `./build/package/` - Distribution package build

### Important Files
- `package.json` - Dependencies, scripts, peer dependencies for database drivers
- `tsconfig.json` - TypeScript configuration
- `gulpfile.ts` - Build system for packaging
- `ormconfig.sample.json` - Example database configurations  
- `.mocharc.json` - Mocha test configuration
- `docker-compose.yml` - Database containers for testing

### Sample Projects
The `./sample/` directory contains 35+ example projects:
- `sample1-simple-entity` - Basic entity usage
- `sample2-one-to-one` - Relationship examples
- `sample32-migrations` - Migration examples
- `sample34-mongodb` - MongoDB usage
- See each sample's README for specific examples

## Manual Validation Scenarios

After making changes, always test real functionality:

### Basic ORM Functionality Test
```bash
# Test compiled module loading
node -e "
const { DataSource } = require('./build/compiled/src/index.js');
console.log('✓ TypeORM loaded successfully');
"

# Navigate to a simple sample and test TypeScript setup
cd sample/sample1-simple-entity

# Modify app.ts to use better-sqlite3 instead of SAP:
# Change the options object to:
# const options: DataSourceOptions = {
#   type: "better-sqlite3",
#   database: "temp.db",
#   synchronize: true,
#   logging: true,
#   entities: [Post]
# }

# Test with TypeScript (requires project setup)
# Note: Samples are configured to work within the TypeORM project structure
```

### CLI Functionality Test
```bash
# Test CLI help
node build/compiled/src/cli.js --help

# Test version
node build/compiled/src/cli.js version

# Test initialization (in temp directory)
mkdir /tmp/typeorm-test && cd /tmp/typeorm-test
node /path/to/build/compiled/src/cli.js init
```

## Docker Database Testing

### Starting Database Containers
```bash
# Start specific databases
docker-compose up mysql postgres mongodb -d

# Start all databases (requires significant RAM)
docker-compose up -d

# Check container status
docker-compose ps

# Stop containers when done
docker-compose down
```

### Database-Specific Notes
- **MySQL/MariaDB**: Available on ports 3306/3307
- **PostgreSQL**: Available on port 5432 with PostGIS extensions
- **MongoDB**: Available on port 27017
- **SQL Server**: Available on port 1433, requires 3.25GB+ RAM
- **Oracle**: Large image, requires significant resources
- **SAP HANA**: Only works on Linux, requires 10GB+ RAM

## Common Issues and Solutions

### Build Issues
- **"Cannot find module"**: Run `npm ci` to ensure all dependencies installed
- **TypeScript errors**: Check `tsconfig.json` and ensure compatible TypeScript version
- **Out of memory**: Increase Node.js memory: `node --max-old-space-size=4096`

### Test Issues  
- **Database connection failures**: Ensure Docker containers are running and ports available
- **Test timeouts**: Individual tests have 90-second timeout, use `--timeout` flag for longer
- **"Cannot find test files"**: Ensure `npm run compile` completed successfully

### Performance Notes
- Compilation is incremental - subsequent builds after changes are faster
- Full test suite across all databases is extensive - use targeted testing during development
- SQLite/better-sqlite3 tests are fastest for general development
- Use `npm run test:fast` instead of `npm test` when iterating

## Repository Maintenance

### Dependencies
- Core dependencies in `dependencies` (runtime)
- Database drivers in `peerDependencies` (optional, user-installed)
- Build/test tools in `devDependencies`
- Update carefully - many database driver versions are pinned for compatibility

### Release Process
See DEVELOPER.md for complete release process. Key steps:
1. Update version in package.json
2. Run `npm run changelog`
3. Create release branch and PR
4. GitHub Actions handles npm publishing after merge

**CRITICAL REMINDERS:**
- **NEVER CANCEL long-running builds or tests** - they may take 30+ minutes
- Always validate changes with actual database operations, not just compilation
- Use SQLite for quick iteration, then test with target databases
- The project supports many Node.js and database versions - be mindful of compatibility