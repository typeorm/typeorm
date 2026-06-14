import { Repository } from "typeorm"

// When the file has at least one Repository-typed binding, the codemod
// tightens the scope: only tracked receivers are renamed. Unrelated
// `.exist()` calls on other objects in the same file are left alone.
declare const userRepo: Repository<{ id: number; name: string }>

// Typed Repository receiver — renamed.
const hasUser = await userRepo.exists({ where: { id: 1 } })

// `.exist()` on a non-Repository receiver — preserved.
declare const fileSystem: { exist: (path: string) => boolean }
const fsHit = fileSystem.exist("/tmp/foo")

// Redis-style cache clients commonly expose `.exist()` too — preserved.
declare const redisCache: { exist: (key: string) => boolean }
const redisHit = redisCache.exist("session:123")
