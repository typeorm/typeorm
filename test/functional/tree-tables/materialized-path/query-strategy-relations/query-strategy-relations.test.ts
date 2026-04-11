import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src"
import { expect } from "chai"
import { Node } from "./entity/Node"
import { Fact } from "./entity/Fact"
import { Rule } from "./entity/Rule"

describe("tree-tables > materialized-path > query strategy relations", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            relationLoadStrategy: "query",
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load relations via query strategy on findDescendants", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const nodeRepository = dataSource.getTreeRepository(Node)
                const ruleRepository = dataSource.getRepository(Rule)
                const factRepository = dataSource.getRepository(Fact)

                // Entity instances setup
                const parent = await nodeRepository.save(
                    nodeRepository.create({ name: "root node" }),
                )
                const child = await nodeRepository.save(
                    nodeRepository.create({ name: "child node", parent }),
                )
                const [factA, factB] = await factRepository.save([
                    { name: "Fact A" },
                    { name: "Fact B" },
                ])
                await ruleRepository.save([
                    { name: "Rule 1", node: child, fact: factA },
                    { name: "Rule 2", node: child, fact: factA },
                    { name: "Rule 3", node: child, fact: factB },
                ])

                // Load descendants with query strategy
                const descendants = await nodeRepository.findDescendants(
                    parent,
                    {
                        relations: ["rules", "rules.fact"],
                    },
                )

                // Find the child node in results
                const loadedChild = descendants.find(
                    (n) => n.name === "child node",
                )
                expect(loadedChild).to.not.be.undefined

                // Verify rules were loaded
                expect(loadedChild?.rules).to.not.be.undefined
                expect(loadedChild?.rules).to.have.length(3)

                // Verify eager relation (fact) was loaded on each rule
                for (const rule of loadedChild?.rules ?? []) {
                    expect(rule.fact).to.not.be.undefined
                    expect(rule.fact?.name).to.be.a("string")
                }
            }),
        ))
})
