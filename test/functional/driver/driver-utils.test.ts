import { expect } from "chai"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { DataSource, Raw } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { FirstElement, SecondElement, ThirdElement } from "./entity/entities"

describe("DriverUtils", () => {
    describe("parse mongo url", () => {
        it("should return a mongo url with a replica set", () => {
            const url =
                "mongodb://username:password@someHost1:27017,someHost2:27018/myDatabase?replicaSet=abc&tls=true"
            const result = DriverUtils.buildMongoDBDriverOptions({ url })

            expect(result).to.eql({
                database: "myDatabase",
                hostReplicaSet: "someHost1:27017,someHost2:27018",
                password: "password",
                replicaSet: "abc",
                tls: "true",
                type: "mongodb",
                url,
                username: "username",
            })
        })

        it("should return a mongo url without a replica set", () => {
            const url =
                "mongodb://username:password@someHost1:27017/myDatabase?tls=true"
            const result = DriverUtils.buildMongoDBDriverOptions({ url })

            expect(result).to.eql({
                database: "myDatabase",
                host: "someHost1",
                port: 27017,
                password: "password",
                tls: "true",
                type: "mongodb",
                url,
                username: "username",
            })
        })
    })
    describe("Generated hash aliases", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should not cause SQL syntax errors in raw queries by generating hash aliases starting with digits", async () => {
            return Promise.all(
                connections.map(async (connection) => {
                    const thirdElement: ThirdElement = new ThirdElement()
                    const secondElement: SecondElement = new SecondElement()
                    const firstElement: FirstElement = new FirstElement()
                    secondElement.third = thirdElement
                    firstElement.second = secondElement
                    await connection.manager.save(thirdElement)
                    await connection.manager.save(secondElement)
                    await connection.manager.save(firstElement)
                    await connection.manager.findOne(FirstElement, {
                        where: {
                            second: {
                                third: {
                                    id: Raw(
                                        (alias) => `EXISTS (
                                            SELECT 1 
                                            FROM "third_element"
                                            WHERE "id"= ${alias}
                                          )`,
                                    ),
                                },
                            },
                        },
                    })
                }),
            )
        })
    })
})
