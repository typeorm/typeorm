import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { User } from "../entity/User"

describe("database schema > partitioning > postgres > hash", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [User],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create a table with HASH partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify table exists and is partitioned
                const result = await queryRunner.query(`
                    SELECT
                        pg_get_partkeydef(c.oid) AS partition_key
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relname = 'user'
                      AND c.relkind = 'p'
                      AND n.nspname = 'public'
                `)

                expect(result).to.have.lengthOf(1)
                expect(result[0].partition_key).to.include("HASH")
                expect(result[0].partition_key).to.include("user_id")

                await queryRunner.release()
            }),
        ))

    it("should create HASH partitions with modulus and remainder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create 4 hash partitions (modulus 4, remainder 0-3)
                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_p0",
                        values: ["4", "0"], // MODULUS 4, REMAINDER 0
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_p1",
                        values: ["4", "1"],
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_p2",
                        values: ["4", "2"],
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_p3",
                        values: ["4", "3"],
                    },
                    "HASH",
                )

                // Verify partitions exist
                const partitions = await queryRunner.getPartitions!("user")
                expect(partitions).to.have.lengthOf(4)
                expect(partitions).to.include.members([
                    "user_p0",
                    "user_p1",
                    "user_p2",
                    "user_p3",
                ])

                await queryRunner.release()
            }),
        ))

    it("should distribute data evenly across HASH partitions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create 4 hash partitions
                for (let i = 0; i < 4; i++) {
                    await queryRunner.createPartition!(
                        "user",
                        {
                            name: `user_p${i}`,
                            values: ["4", i.toString()],
                        },
                        "HASH",
                    )
                }

                // Insert data
                const repo = connection.getRepository(User)
                const users = []
                for (let i = 1; i <= 100; i++) {
                    users.push({
                        user_id: i,
                        username: `user${i}`,
                        email: `user${i}@example.com`,
                    })
                }
                await repo.save(users)

                // Verify data is distributed (each partition should have some data)
                // Note: Hash distribution is not perfectly even but should be reasonable
                for (let i = 0; i < 4; i++) {
                    const count = await queryRunner.query(
                        `SELECT COUNT(*) FROM user_p${i}`,
                    )
                    const partitionCount = parseInt(count[0].count)
                    expect(partitionCount).to.be.greaterThan(0)
                    expect(partitionCount).to.be.lessThan(100)
                }

                // Verify total count
                const allUsers = await repo.find()
                expect(allUsers).to.have.lengthOf(100)

                await queryRunner.release()
            }),
        ))

    it("should handle different modulus values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create 2 hash partitions (modulus 2)
                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_even",
                        values: ["2", "0"],
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "user",
                    {
                        name: "user_odd",
                        values: ["2", "1"],
                    },
                    "HASH",
                )

                const partitions = await queryRunner.getPartitions!("user")
                expect(partitions).to.have.lengthOf(2)

                await queryRunner.release()
            }),
        ))
})
