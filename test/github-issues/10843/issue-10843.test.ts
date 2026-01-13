import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Node } from "./entity/node"
import { expect } from "chai"

describe("github issues > #10843 TreeRepository does not update mpath if parentId was soft-deleted", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                relationLoadStrategy: "query",
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("Should update mpath even if parent was soft deleted", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const nodeRepository = dataSource.getTreeRepository(Node)

                // Entity instances setup
                const parent = await nodeRepository.save(
                    nodeRepository.create({ name: "root node" }),
                )
                const child = await nodeRepository.save(
                    nodeRepository.create({ name: "child node", parent }),
                )

                // Validate mpath
                let [mpath] = await dataSource.query(
                    "SELECT mpath FROM node WHERE id = ?",
                    [child.id],
                )
                expect(mpath?.mpath).to.be.equal(`${parent.id}.${child.id}.`)
                // Soft delete parent
                await nodeRepository.softDelete(parent)

                // Assign new parent
                const newParent = await nodeRepository.save(
                    nodeRepository.create({ name: "root node 2" }),
                )
                child.parent = newParent
                await nodeRepository.save(child)
                ;[mpath] = await dataSource.query(
                    "SELECT mpath FROM node WHERE id = ?",
                    [child.id],
                )

                expect(mpath?.mpath).to.be.equal(`${newParent.id}.${child.id}.`)
            }),
        ))
})
