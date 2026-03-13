import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("repository > sql injection", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)
                const seed = new Post()
                seed.id = 1
                seed.version = 1
                seed.name = "seed"
                seed.text = "text"
                seed.tag = "tag"
                await repo.save(seed)

                const other = new Post()
                other.id = 2
                other.version = 2
                other.name = "other"
                other.text = "other text"
                other.tag = "other tag"
                await repo.save(other)
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    const maliciousInputs = [
        "'; DROP TABLE post; --",
        "test' OR '1'='1",
        "1; DELETE FROM post;",
        "' UNION SELECT * FROM post --",
        "\\'; DROP TABLE post; --",
        '"; DROP TABLE post; --',
        "'/**/OR/**/1=1--",
        "'' OR ''='",
        "0x27 OR 1=1--",
        "\x00'; DROP TABLE post;--",
        "' OR SLEEP(5)--",
        "1 OR 1=1",
    ]

    function verifyIntegrity(dataSource: DataSource) {
        return async () => {
            const count = await dataSource.getRepository(Post).count()
            expect(count).to.equal(2)
        }
    }

    describe("find", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .getRepository(Post)
                                .find({ where: { name: malicious } })
                            expect(results).to.have.length(0)
                        } catch {
                            // some drivers reject certain byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("findOne", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const result = await dataSource
                                .getRepository(Post)
                                .findOne({ where: { name: malicious } })
                            expect(result).to.be.null
                        } catch {
                            // some drivers reject certain byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })
})
