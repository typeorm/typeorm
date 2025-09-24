import "reflect-metadata"
import { JsonPathExample } from "./entity/JsonPathExample"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column types > postgres > jsonpath", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // Based on:
    // * https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSONPATH
    // * https://www.postgresql.org/docs/current/functions-json.html#FUNCTIONS-SQLJSON-PATH
    ;[
        ["$"], // the whole JSON document (context item)
        ["$foo", `$"foo"`], // variable "foo"
        ['"bar"'], // string literal
        ["12.345"], // numeric literal
        ["true"], // boolean literal
        ["null"], // null
        ["$.floor"], // field accessor on $
        ["$.floor[*]"], // the same, followed by wildcard array accessor

        // complex path with filters and variables
        [
            "$.floor[*] ? (@.level < $max_level).apt[*] ? (@.area > $min_area).no",
        ],

        // arithmetic expressions:
        ["-$.a[*]"], // unary
        ["$.a + 3"], // binary
        ["2 * $.a - (3 / $.b + $x.y)"], // complex expression with variables

        // parenthesized expression used as starting element of a path,
        // followed by two item methods ".abs()" and ".ceil()"
        ["($ + 1).abs().ceil()"],

        ["$.floor[*].apt[*].area > 10"],
    ].forEach(([path, canonical]) => {
        it(`should insert and retrieve jsonpath values as strings for: ${path}`, () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repository = connection.getRepository(JsonPathExample)
                    const createdEntity = new JsonPathExample()

                    createdEntity.path = path

                    await repository.save(createdEntity)

                    const loadedEntity = (await repository.findOneBy({
                        id: createdEntity.id,
                    }))!

                    loadedEntity.path.should.be.equal(canonical ?? path)

                    const loadedCanonicalEntity = (await repository
                        .createQueryBuilder()
                        .select("path::text as path")
                        .where({ id: createdEntity.id })
                        .getOne())!

                    loadedCanonicalEntity.path.should.be.equal(path)
                }),
            ))
    })
})
