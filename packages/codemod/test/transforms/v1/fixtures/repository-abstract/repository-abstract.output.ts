import * as typeorm from "typeorm"

// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

const repo = dataSource.getCustomRepository(UserRepository) // TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`

// Namespace-access forms (`import * as typeorm from "typeorm"`) must also be flagged
// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@typeorm.EntityRepository(Post)
class PostRepository extends typeorm.AbstractRepository<Post> {}

const nsRepo = typeorm.getCustomRepository(PostRepository) // TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`

// TypeScript `import = require` namespace binding must also be flagged
import tsns = require("typeorm")

// TODO(typeorm-v1): `@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`
// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@tsns.EntityRepository(Comment)
class CommentRepository extends tsns.AbstractRepository<Comment> {}

const tsRepo = tsns.getCustomRepository(CommentRepository) // TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`
