import "reflect-metadata"
import type { DataSource } from "../../../src"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Book } from "./entity/Book"

describe("query runner > stream", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Book],
            enabledDrivers: [
                "cockroachdb",
                "mssql",
                "mysql",
                "oracle",
                "postgres",
                "sap",
                "spanner",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should stream data", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.manager.save(Book, { ean: "a" })
                await connection.manager.save(Book, { ean: "b" })
                await connection.manager.save(Book, { ean: "c" })
                await connection.manager.save(Book, { ean: "d" })

                const queryRunner = connection.createQueryRunner()

                const query = connection
                    .createQueryBuilder(Book, "book")
                    .select()
                    .orderBy("book.ean")
                    .getQuery()

                const readStream = await queryRunner.stream(query)

                if (!(connection.driver.options.type === "spanner"))
                    await new Promise<void>((ok) =>
                        readStream.once("readable", ok),
                    )

                const data: any[] = []

                readStream.on("data", (row) => data.push(row))

                await new Promise<void>((ok, fail) => {
                    readStream.once("end", ok)
                    readStream.once("error", fail)
                })

                expect(data).to.have.length(4)

                expect(data[0]).to.be.eql({ book_ean: "a" })
                expect(data[1]).to.be.eql({ book_ean: "b" })
                expect(data[2]).to.be.eql({ book_ean: "c" })
                expect(data[3]).to.be.eql({ book_ean: "d" })

                await queryRunner.release()
            }),
        ))
})
