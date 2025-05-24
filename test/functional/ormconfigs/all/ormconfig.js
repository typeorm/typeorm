module.exports = {
  type: "postgres",               // Database engine
  host: "localhost",              // Docker container’s mapped host
  port: 5432,                     // Exposed TCP port
  username: "test",               // POSTGRES_USER you set
  password: "test",               // POSTGRES_PASSWORD you set
  database: "test",               // POSTGRES_DB you set
  synchronize: false,             // Don’t auto-sync schemas in tests
  logging: false,                 // No SQL logging during tests
  entities: [
    "src/**/*.entity.ts"          // Your entity definitions
  ],
  migrations: [
    "src/migration/**/*.ts"       // Migration files
  ],
  cli: {
    entitiesDir: "src/entity",    
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  }
};
