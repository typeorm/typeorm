import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import Offer from "./entity/offer.entity"
import Lender from "./entity/lender.entity"
import { Repository, SelectQueryBuilder } from "../../../src"

describe("github issues > #9293 No quotes while using orderBy, groupBy by custom column", () => {
    console.log("github issues > #9293")

    let connections: DataSource[]

    const getBaseQuery = (
        repo: Repository<Offer>,
        rateSumAlias: string,
    ): SelectQueryBuilder<Offer> => {
        return repo
            .createQueryBuilder("Offer")
            .addSelect("1", rateSumAlias)
            .innerJoinAndSelect("Offer.lender", "Lender")
            .groupBy("Offer.id")
            .addGroupBy("Lender.id")
            .addGroupBy(rateSumAlias)
            .orderBy("Lender.id", "ASC")
            .addOrderBy("Offer.id", "ASC")
            .addOrderBy(rateSumAlias, "ASC")
    }

    const prepareData = async (connection: DataSource): Promise<void> => {
        const lender = new Lender()
        lender.name = "lender"
        await connection.manager.save(lender)

        const offer = new Offer()
        offer.lenderId = lender.id
        offer.rate = 1
        await connection.manager.save(offer)
    }

    const alias = "rateSum"

    const getEscapedAliasByDbType = (
        connection: DataSource,
        alias: string,
    ): string => {
        const quoteSymbol =
            connection.driver.constructor.name === "PostgresDriver" ? '"' : "`"

        return `${quoteSymbol}${alias}${quoteSymbol}`
    }

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should quoted alias in the query with SELECT DISTINCT", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            const baseQuery = getBaseQuery(
                connection.getRepository(Offer),
                getEscapedAliasByDbType(connection, alias),
            )

            const { entities, raw } = await baseQuery
                .skip(1)
                .take(10)
                .getRawAndEntities()

            expect(entities).to.be.an("array")
            expect(raw).to.be.an("array")
        }
    })

    it("should quoted alias in the query without SELECT DISTINCT", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            const baseQuery = getBaseQuery(
                connection.getRepository(Offer),
                getEscapedAliasByDbType(connection, alias),
            )

            const { entities, raw } = await baseQuery.getRawAndEntities()

            expect(entities).to.be.an("array")
            expect(raw).to.be.an("array")
        }
    })
})
