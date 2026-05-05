# TypeORM Legacy Naming Strategies

## `NamingStrategyV03`

In TypeORM v1, the SHA1 hashing algorithm used in the naming strategy is applied directly to the input. In the previous versions (v0.3), the input was first encoded using [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

Use this naming strategy to avoid changes in the database if your table or column names contain characters other than:

```
A–Z a–z 0–9 - _ . ! ~ * ' ( )
```

### Example:

```typescript
const dataSource = new DataSource({
    ...
    namingStrategy: new NamingStrategyV03(),
    ...
})
```

## `LegacyOracleNamingStrategy`

Prior to Oracle 12.2, identifiers were not allowed to exceed 30 characters. Use this naming strategy to keep column names up to 30 characters.

### Arguments

- `shortenStrategy`: can be either `hash` (default) or `truncate`.

### Example:

```typescript
const dataSource = new DataSource({
    ...
    namingStrategy: new LegacyOracleNamingStrategy("hash"),
    ...
})
```
