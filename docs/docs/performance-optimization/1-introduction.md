# Introduction

In applications using ORM like TypeORM, performance optimization is crucial to ensure the system runs smoothly, minimizes latency, and uses resources efficiently.

Common challenges when using ORM include unnecessary data retrieval, N+1 query problems, and not leveraging optimization tools such as indexing or caching.

The main goals of optimization include:

- Reducing the number of SQL queries sent to the database.
- Optimizing complex queries to run faster.
- Using caching and indexing to speed up data retrieval.
- Ensuring efficient data retrieval using appropriate loading methods (Lazy vs. Eager loading).
