import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Example } from "./entity/example"

// values from https://github.com/obartunov/sqljsondoc/blob/master/jsonpath.md#jsonpath-in-postgresql
const validJsonPaths = [
    "$", // the whole JSON document (context item)
    "$foo", // variable "foo"
    '"bar"', // string literal
    "12.345", // numeric literal
    "true", // boolean literal
    "null", // null
    "$.floor", // field accessor on $
    "$.floor[*]", // the same, followed by wildcard array accessor

    // complex path with filters and variables
    "$.floor[*] ? (@.level < $max_level).apt[*] ? (@.area > $min_area).no",

    // arithmetic expressions:
    "-$.a[*]", // unary
    "$.a + 3", // binary
    "2 * $.a - (3 / $.b + $x.y)", // complex expression with variables

    // parenthesized expression used as starting element of a path,
    // followed by two item methods ".abs()" and ".ceil()"
    "($ + 1).abs().ceil()",

    "$.floor[*].apt[*].area > 10",
]

describe("github issues > #10456 adds jsonpath column type", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should insert and retrieve jsonpath values as strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = connection.manager
                validJsonPaths.forEach(async (validJsonPath, i) => {
                    let exampleEntity = new Example()
                    exampleEntity.id = i
                    exampleEntity.path = validJsonPath

                    await manager.save(exampleEntity)

                    const savedExampleEntity = await manager.findOneBy(
                        Example,
                        { id: i },
                    )
                    expect(savedExampleEntity?.path).to.be.eql(validJsonPath)
                })
            }),
        ))
})
