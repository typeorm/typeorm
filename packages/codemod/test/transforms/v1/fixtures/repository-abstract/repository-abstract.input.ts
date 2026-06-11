import { EntityRepository, AbstractRepository } from "typeorm"
import * as typeorm from "typeorm"

@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

const repo = dataSource.getCustomRepository(UserRepository)

// Namespace-access forms (`import * as typeorm from "typeorm"`) must also be flagged
@typeorm.EntityRepository(Post)
class PostRepository extends typeorm.AbstractRepository<Post> {}

const nsRepo = typeorm.getCustomRepository(PostRepository)

// TypeScript `import = require` namespace binding must also be flagged
import tsns = require("typeorm")

@tsns.EntityRepository(Comment)
class CommentRepository extends tsns.AbstractRepository<Comment> {}

const tsRepo = tsns.getCustomRepository(CommentRepository)
