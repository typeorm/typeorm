import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ConsumingEntity } from "./entity/consuming"
import { NodeEntity } from "./entity/node"
import { RootEntity } from "./entity/root"

describe("github issues > #11132 Composite FK with shared columns causes invalid query builder SQL", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const rootRepository = dataSource.getRepository(RootEntity)
                const nodeRepository = dataSource.getRepository(NodeEntity)
                const consumingRepository =
                    dataSource.getRepository(ConsumingEntity)

                const root = await rootRepository.save({})
                const node = await nodeRepository.save({
                    rootId: root.id,
                })
                await consumingRepository.save({
                    rootId: root.id,
                    nodeId: node.id,
                })
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should have data stored in all tables", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const rootEntity = await dataSource
                    .getRepository(RootEntity)
                    .find()
                const nodeEntity = await dataSource
                    .getRepository(NodeEntity)
                    .find()
                const consumingEntity = await dataSource
                    .getRepository(ConsumingEntity)
                    .find()
                expect(rootEntity).to.have.length(1)
                expect(nodeEntity).to.have.length(1)
                expect(consumingEntity).to.have.length(1)
            }),
        ))

    it("should be able to query consuming entity with node entity", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryBuilder = dataSource
                    .createQueryBuilder(ConsumingEntity, "consuming")
                    .leftJoinAndSelect("consuming.node", "node")

                const consumingEntity = await queryBuilder.getRawMany()
                expect(consumingEntity).to.have.length(1)
            }),
        ))

    it("should be able to query consuming entity with root entity", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryBuilder = dataSource
                    .createQueryBuilder(ConsumingEntity, "consuming")
                    .leftJoinAndSelect("consuming.root", "root")

                const consumingEntity = await queryBuilder.getRawMany()
                expect(consumingEntity).to.have.length(1)
            }),
        ))

    it("should be able to query consuming entity with node and root entity", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryBuilder = dataSource
                    .createQueryBuilder(ConsumingEntity, "consuming")
                    .leftJoinAndSelect("consuming.node", "node")
                    .leftJoinAndSelect("consuming.root", "root")

                const consumingEntity = await queryBuilder.getRawMany()
                expect(consumingEntity).to.have.length(1)
            }),
        ))
})
