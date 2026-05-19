import typeorm from "typeorm"

declare class User {}

// Default-only typeorm import — `import X from "typeorm"` has an
// `ImportDefaultSpecifier` but no `ImportSpecifier`, so pushing a named
// specifier into it would produce `import X, { In } from "typeorm"`
// which silently promotes a default-only declaration into a mixed one.
// `ensureInValueImport` must emit a fresh `import { In } from "typeorm"`
// line instead.
async function load(repo: typeorm.Repository<User>) {
    return repo.findByIds([1, 2, 3])
}
