# TypeORM SQLite Demo

A minimal TypeORM project demonstrating how to use TypeORM with an in-memory SQLite database.

## Features

- TypeORM with SQLite (in-memory)
- TypeScript configuration
- Basic User entity with CRUD operations
- Zero configuration database (perfect for testing)

## Prerequisites

- Node.js (v14 or higher)
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

## Running the Application

```bash
npm start
```

This will:

- Initialize an in-memory SQLite database
- Create the User table
- Insert a sample user
- Retrieve and display the user data

## Project Structure

```
src/
  ├── entity/
  │   └── User.ts         # User entity definition
  ├── data-source.ts      # Database configuration
  └── index.ts           # Main application code
```

## Technology Stack

- TypeORM
- better-sqlite3
- TypeScript
- Node.js

## Note

Since this project uses an in-memory database, all data is temporary and will be cleared when the application stops. This makes it perfect for testing and development purposes.
