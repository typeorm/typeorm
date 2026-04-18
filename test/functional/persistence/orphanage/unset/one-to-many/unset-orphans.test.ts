import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../../src/data-source/DataSource"
import type { Logger } from "../../../../../../src/logger/Logger"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"

describe("persistence > orphanage > unset > one-to-many", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seedParent(dataSource: DataSource) {
        const parentRepo = dataSource.getRepository(Parent)
        const parent = new Parent("test")
        parent.children = [
            Object.assign(new Child(), { name: "child1" }),
            Object.assign(new Child(), { name: "child2" }),
        ]
        await parentRepo.save(parent)
        return parent
    }

    function captureLogger(dataSource: DataSource): () => string[] {
        const messages: string[] = []
        const originalLogger = dataSource.logger
        const spy: Logger = {
            logQuery: originalLogger.logQuery.bind(originalLogger),
            logQueryError: originalLogger.logQueryError.bind(originalLogger),
            logQuerySlow: originalLogger.logQuerySlow.bind(originalLogger),
            logSchemaBuild: originalLogger.logSchemaBuild.bind(originalLogger),
            logMigration: originalLogger.logMigration.bind(originalLogger),
            log: (level, message, queryRunner) => {
                if (level === "warn") messages.push(String(message))
                return originalLogger.log(level, message, queryRunner)
            },
        }
        dataSource.logger = spy
        return () => {
            dataSource.logger = originalLogger
            return messages
        }
    }

    it("should not touch children when relation is not loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const loaded = await parentRepo.findOneByOrFail({
                    id: parent.id,
                })
                expect(loaded.children).to.be.undefined
                loaded.name = "updated"
                await parentRepo.save(loaded)

                expect(await childRepo.count()).to.equal(2)
            }),
        ))

    it("should not touch children when relation is loaded but not modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const loaded = await parentRepo.findOneOrFail({
                    where: { id: parent.id },
                    relations: { children: true },
                })
                expect(loaded.children).to.have.lengthOf(2)

                loaded.name = "updated"
                await parentRepo.save(loaded)

                expect(await childRepo.count()).to.equal(2)
            }),
        ))

    it("should nullify orphaned children and log a deprecation warning when unset and modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const getMessages = captureLogger(dataSource)
                try {
                    const loaded = await parentRepo.findOneOrFail({
                        where: { id: parent.id },
                        relations: { children: true },
                    })
                    loaded.children = loaded.children.filter(
                        (c) => c.name === "child1",
                    )
                    await parentRepo.save(loaded)
                } finally {
                    const messages = getMessages()
                    const deprecation = messages.find((m) =>
                        m.includes("[DEPRECATION]"),
                    )
                    expect(deprecation).to.not.be.undefined
                    expect(deprecation).to.include("Parent.children")
                    expect(deprecation).to.include("orphans")
                }

                // Legacy behavior: FK is nullified on the orphan
                const children = await childRepo.find()
                expect(children).to.have.lengthOf(2)

                const orphan = children.find((c) => c.name === "child2")
                expect(orphan).to.not.be.undefined
                expect(orphan?.parentId).to.be.null

                const retained = children.find((c) => c.name === "child1")
                expect(retained).to.not.be.undefined
                expect(retained?.parentId).to.equal(parent.id)
            }),
        ))
})
