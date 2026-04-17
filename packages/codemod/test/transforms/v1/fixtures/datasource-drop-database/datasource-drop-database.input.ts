import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "postgres",
    database: "test",
})

async function resetSchema() {
    await dataSource.dropDatabase()
}

async function withRunner() {
    const queryRunner = dataSource.createQueryRunner()
    // QueryRunner#dropDatabase(name, ifExists?) should NOT be renamed
    await queryRunner.dropDatabase("myTestDatabase")
    await queryRunner.dropDatabase("non_existent_database", true)
}
