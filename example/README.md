# TypeORM sql.js Example

A minimal TypeORM project demonstrating how to use TypeORM with sql.js, a JavaScript SQL database engine that runs in memory.

## Features

- TypeORM with sql.js (in-memory)
- TypeScript configuration
- Basic User entity with CRUD operations
- Zero configuration database (perfect for testing)
- Browser-compatible (works in environments like Stackblitz)
- No native dependencies required

## Prerequisites

- Node.js (v14 or higher)
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

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

- Initialize an in-memory SQL.js database
- Create the User table with columns for id, firstName, lastName, email, and isActive
- Insert a sample user (John Doe)
- Retrieve and display the user data

## Project Structure

```
src/
  ├── entity/
  │   └── User.ts         # User entity definition (~20 lines)
  ├── data-source.ts      # Database configuration (~10 lines)
  └── index.ts           # Main application code (~25 lines)
```

## Technology Stack

- TypeORM (^0.3.20)
- sql.js (^1.8.0)
- TypeScript (^5.3.3)
- Node.js (v14 or higher)

## Note

Since this project uses an in-memory database, all data is temporary and will be cleared when the application stops. This makes it perfect for testing and development purposes.

The use of sql.js makes this project compatible with browser environments like Stackblitz, as it doesn't require any native dependencies. This is particularly useful for:

- Online demonstrations
- Quick prototyping
- Learning TypeORM without complex setup
- Browser-based development environments
