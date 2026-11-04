import { expect } from "chai"
import {
    And,
    DataSource,
    EntitySchema,
    Equal,
    ILike,
    Like,
    MssqlParameter,
    Not,
    Or,
    Raw,
} from "../../../src"
import type { FindOperator } from "../../../src"

class MetadataDataSource extends DataSource {
    prepareMetadata() {
        return this.buildMetadatas()
    }
}

describe("SQL Server LIKE parameter lengths", () => {
    const entity = new EntitySchema({
        name: "LikeParameter",
        columns: {
            id: { type: "int", primary: true },
            unicode: { type: "nvarchar", length: 20 },
            ascii: { type: "varchar", length: 20 },
            unlimited: { type: "nvarchar", length: "MAX" },
            inferred: { type: "nvarchar" },
        },
    })
    const dataSource = new MetadataDataSource({
        type: "mssql",
        host: "localhost",
        database: "test",
        entities: [entity],
    })

    before(() => dataSource.prepareMetadata())

    function parameters(property: string, condition: FindOperator<string>) {
        return dataSource
            .getRepository(entity)
            .createQueryBuilder("row")
            .setFindOptions({ where: { [property]: condition } })
            .getQueryAndParameters()[1] as MssqlParameter[]
    }

    for (const type of ["nvarchar", "varchar"] as const) {
        const property = type === "nvarchar" ? "unicode" : "ascii"
        for (const operator of [Like, ILike]) {
            for (const length of [18, 19, 20, 100]) {
                it(`binds ${operator.name} with ${length + 2} characters for ${type}(20)`, () => {
                    const pattern = `%${"A".repeat(length)}%`
                    const [parameter] = parameters(property, operator(pattern))

                    expect(parameter).to.be.instanceOf(MssqlParameter)
                    expect(parameter.type).to.equal(type)
                    expect(parameter.value).to.equal(pattern)
                    expect(Number(parameter.params[0])).to.equal(
                        Math.max(20, pattern.length),
                    )
                    expect(
                        dataSource
                            .getMetadata(entity)
                            .findColumnWithPropertyName(property)!.length,
                    ).to.equal("20")
                })
            }

            for (const combine of [And, Or]) {
                it(`widens ${operator.name} inside ${combine.name} and Not for ${type}(20)`, () => {
                    const pattern = `%${"A".repeat(20)}%`
                    const bound = parameters(
                        property,
                        combine(Not(Not(operator(pattern))), Equal("short")),
                    )

                    expect(
                        bound.map((parameter) => parameter.value),
                    ).to.deep.equal([pattern, "short"])
                    expect(
                        bound.map((parameter) => Number(parameter.params[0])),
                    ).to.deep.equal([22, 20])
                })
            }
        }

        it(`preserves non-pattern ${type} parameter lengths`, () => {
            const [parameter] = parameters(property, Equal("A".repeat(21)))
            expect(parameter.params).to.deep.equal(["20"])
        })
    }

    it("counts UTF-16 code units in Unicode patterns", () => {
        const pattern = `%${"😀".repeat(10)}%`
        const [parameter] = parameters("unicode", Like(pattern))
        expect(parameter.params).to.deep.equal([22])
    })

    it("preserves MAX and inferred lengths", () => {
        const pattern = `%${"A".repeat(100)}%`
        expect(parameters("unlimited", Like(pattern))[0].params).to.deep.equal([
            "MAX",
        ])
        expect(parameters("inferred", Like(pattern))[0].params).to.deep.equal(
            [],
        )
    })

    it("preserves independently bound raw patterns", () => {
        const pattern = `%${"A".repeat(20)}%`
        expect(
            parameters(
                "unicode",
                Raw((column) => `${column} LIKE :pattern`, { pattern }),
            ),
        ).to.deep.equal([pattern])
    })
})
