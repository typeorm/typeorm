# TypeORM sql.js Example

A minimal TypeORM project demonstrating how to use TypeORM with sql.js.

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
  │   └── User.ts         # User entity definition (~20 lines)
  ├── data-source.ts      # Database configuration (~10 lines)
  └── index.ts           # Main application code (~25 lines)
```

## Note

Since this project uses an in-memory database, all data is temporary and will be cleared when the application stops. This makes it perfect for testing and development purposes.

The use of sql.js makes this project compatible with browser environments like Stackblitz, as it doesn't require any native dependencies.
