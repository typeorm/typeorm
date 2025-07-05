import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src/index"

@Entity("transaction_test")
class TransactionTest {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}

describe("libsql transactions", () => {
    let dataSource: DataSource

    beforeEach(async () => {
        dataSource = new DataSource({
            type: "libsql",
            url: "file:./temp/transaction_debug.db",
            entities: [TransactionTest],
            synchronize: true,
            logging: false,
            dropSchema: true,
        })
        await dataSource.initialize()
    })

    afterEach(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    it("should support basic transactions", async () => {
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()

        console.log(
            "isTransactionActive before start:",
            queryRunner.isTransactionActive,
        )
        await queryRunner.startTransaction()
        console.log(
            "isTransactionActive after start:",
            queryRunner.isTransactionActive,
        )

        try {
            const entity = new TransactionTest()
            entity.name = "test"
            await queryRunner.manager.save(entity)

            await queryRunner.commitTransaction()
            console.log("Transaction committed successfully")

            const repository = dataSource.getRepository(TransactionTest)
            const count = await repository.count()
            expect(count).to.equal(1)
        } catch (error) {
            console.log("Error occurred:", error.message)
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction()
            }
            throw error
        } finally {
            await queryRunner.release()
        }
    })
})
