import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Account } from "./entity/Account"

describe("github issues > #1805 bigint PK incorrectly returning as a number (expecting a string)", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should return `bigint` column as string", () =>
        Promise.all(
            connections.map(async (connection) => {
                const bigIntId = "76561198016705746"
                const account = new Account()
                account.id = bigIntId

                const accountRepository = connection.getRepository(Account)

                await accountRepository.save(account)

                const loadedAccount = await accountRepository.findOneBy({
                    id: bigIntId,
                })
                loadedAccount!.id.should.be.equal(bigIntId)
            }),
        ))
})
