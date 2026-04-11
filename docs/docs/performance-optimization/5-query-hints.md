# Query Hints

Query Hints are instructions sent along with SQL queries, helping the database decide on more efficient execution strategies.

Different RDBMS systems support different kinds of hints, such as suggesting index usage or choosing the appropriate JOIN type.

```typescript
await dataSource.query(`
    SELECT /*+ MAX_EXECUTION_TIME(1000) */ *
    FROM user
    WHERE email = 'example@example.com'
`)
```

In the example above, `MAX_EXECUTION_TIME(1000)` instructs MySQL to stop the query if it takes more than 1 second.
