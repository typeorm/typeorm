# TypeORM SQLite Example

Steps to run this project:

1. Run `npm i` command
2. Run `npm start` command

## Notes

This is an ESM (ECMAScript Modules) example using TypeORM with SQLite. It demonstrates:

-   ESM module usage
-   Modern async/await patterns
-   Proper database connection handling with cleanup
-   TypeScript decorators and entity definitions

The example uses `sql.js` as the database driver, which creates an in-memory SQLite database.

## Available Commands

```bash
# Start the application
npm start

# Build the TypeScript code
npm run build

# Run TypeORM commands (if needed)
npm run typeorm
```

## What the Demo Does

When you run `npm start`, the application will:

-   Initialize an in-memory SQLite database
-   Create the User table with columns for id, firstName, lastName, email, and isActive
-   Insert a sample user (John Doe)
-   Retrieve and display the user data

## Project Structure

```
src/
  ├── entity/
  │   └── User.ts         # User entity definition
  ├── index.ts            # Main application code
  └── ormconfig.ts        # Database configuration
```

## Note

Since this project uses an in-memory database, all data is temporary and will be cleared when the application stops. This makes it perfect for testing and development purposes.

The use of sql.js makes this project compatible with browser environments like Stackblitz, as it doesn't require any native dependencies.
