// TODO: `AbstractRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

const repo = dataSource.getCustomRepository(UserRepository) // TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1
