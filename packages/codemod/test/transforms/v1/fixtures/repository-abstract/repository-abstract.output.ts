// TODO(typeorm-v1): `AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

const repo = dataSource.getCustomRepository(UserRepository) // TODO(typeorm-v1): `getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`
