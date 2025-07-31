# Redis 5 Support Migration Guide

## Overview
This document describes the changes needed to support Redis 5 in TypeORM's cache implementation.

## Changes Required

### 1. Package.json
- Update `peerDependencies` to include Redis 5: `"redis": "^3.1.1 || ^4.0.0 || ^5.0.0"`
- Update `devDependencies` to use Redis 5: `"redis": "^5.0.0"`

### 2. RedisQueryResultCache.ts
Main changes needed:
- Remove `legacyMode` for Redis 5 (only needed for v4)
- Update to use Promise-based API instead of callbacks
- Add version detection logic

### 3. Key API Changes

#### Redis 4 (current):
```javascript
// Callback-based with legacyMode
client.get(key, (err, result) => {
    if (err) return fail(err)
    ok(result)
})
```

#### Redis 5 (new):
```javascript
// Promise-based
const result = await client.get(key)
```

### 4. Methods to Update
- `connect()` - Remove legacyMode for v5
- `disconnect()` - Use Promise-based quit()
- `getFromCache()` - Convert to Promise API
- `storeInCache()` - Convert to Promise API with new options format
- `clear()` - Use flushDb() instead of flushdb()
- `deleteKey()` - Convert to Promise API

### 5. Testing
- Test with Redis 3, 4, and 5
- Ensure backward compatibility
- Add specific tests for Redis 5 features
