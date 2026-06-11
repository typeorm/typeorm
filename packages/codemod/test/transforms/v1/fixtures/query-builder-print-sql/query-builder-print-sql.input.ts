import "typeorm"

const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .printSql()
    .getMany()
