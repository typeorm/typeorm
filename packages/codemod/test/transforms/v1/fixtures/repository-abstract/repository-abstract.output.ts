import * as typeorm from "typeorm"

// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

// TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`
const repo = dataSource.getCustomRepository(UserRepository)

// Namespace-access forms (`import * as typeorm from "typeorm"`) must also be flagged
// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@typeorm.EntityRepository(Post)
class PostRepository extends typeorm.AbstractRepository<Post> {}

// TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`
const nsRepo = typeorm.getCustomRepository(PostRepository)

// TypeScript `import = require` namespace binding must also be flagged
import tsns = require("typeorm")

// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@tsns.EntityRepository(Comment)
class CommentRepository extends tsns.AbstractRepository<Comment> {}

// TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`
const tsRepo = tsns.getCustomRepository(CommentRepository)
