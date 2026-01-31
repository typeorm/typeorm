# Driver Extensibility: Capability-Based Architecture

## Summary

Replaces hardcoded `is*Family()` checks with fine-grained capability declarations, enabling custom drivers to be registered without modifying TypeORM core.

## Key Changes

### ✨ New Features

- **`DriverCapabilities` interface**: Declarative feature flags for all SQL dialect differences (~30 capabilities)
- **`DriverRegistry`**: Register custom drivers without touching core code
- **Capability helper methods**: `DriverUtils.supportsX()` and `getXStyle()` methods replace family checks

### 🔄 Migrations

- All built-in drivers now declare capabilities explicitly
- Query builders migrated from `is*Family()` to capability checks
- `DatabaseType` extended to support custom driver types: `BuiltInDatabaseType | (string & {})`

### 📝 Backward Compatibility

- `is*Family()` methods marked as `@deprecated` but still functional
- Existing code continues to work unchanged
- Custom drivers can be registered via `DriverRegistry.register()`

## Example: Custom Driver Registration

```typescript
import { DriverRegistry, DriverCapabilities } from "typeorm"

class MyCustomDriver implements Driver {
    capabilities: DriverCapabilities = {
        stringAggregation: "STRING_AGG",
        pagination: "LIMIT_OFFSET",
        upsertStyle: "ON_CONFLICT",
        // ... declare all capabilities
    }
    // ... implement Driver interface
}

DriverRegistry.register("my-db", MyCustomDriver)

const dataSource = new DataSource({
    type: "my-db", // Custom type works!
    // ... other options
})
```

## Files Changed

- **New**: `DriverCapabilities.ts`, `DriverRegistry.ts`
- **Modified**: All driver implementations, query builders, metadata builders
- **Deprecated**: `DriverUtils.isSQLiteFamily()`, `isMySQLFamily()`, `isPostgresFamily()`

## Benefits

- ✅ Custom drivers without forking TypeORM
- ✅ Reduced maintenance burden (no hardcoded type arrays)
- ✅ Better testability (capability-based feature detection)
- ✅ Non-breaking change (deprecated methods still work)
