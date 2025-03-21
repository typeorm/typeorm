import { OrmUtils } from "../../src/util/OrmUtils"
import { expect } from "chai"

describe(`orm-utils`, () => {
    describe("parseSqlCheckExpression", () => {
        it("parses a simple CHECK constraint", () => {
            // Spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO', 'BAR', 'BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members(["FOO", "BAR", "BAZ"])

            // No spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO','BAR','BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members(["FOO", "BAR", "BAZ"])
        })

        it("returns undefined when the column doesn't have a CHECK", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.equal(undefined)
        })

        it("parses a CHECK constraint with values containing special characters", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN (
                                    'a,b', 
                                    ',c,', 
                                    'd''d', 
                                    '''e''', 
                                    'f'',''f', 
                                    ''')', 
                                    ')'''
                                )
                            ) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members([
                "a,b",
                ",c,",
                "d'd",
                "'e'",
                "f','f",
                "')",
                ")'",
            ])
        })
    })

    describe("extractConstraints", () => {
        it("should correctly identify unique constraints in the SQL statement regardless of the number of white spaces", () => {
            const uniqueRegex = /CONSTRAINT "([^"]*)" UNIQUE ?\((.*?)\)/g
            const result = OrmUtils.extractConstraints(
                `CREATE TABLE "foo_table_options" (                "rank" integer NOT NULL,                "isDefaultSelected" boolean NOT NULL,                "fooID" varchar NOT NULL,                "fooCol" varchar NOT NULL,                "buzID" varchar NOT NULL,                "buzCol" varchar NOT NULL,                "barCol" varchar,                "barID" varchar,                CONSTRAINT "REL_f549bbcf58127bef87b9003d99" UNIQUE ("barID", "barCol"),       CONSTRAINT "REL_f52871a9129b190a91002" UNIQUE ("buzID", "buzCol"),         CONSTRAINT "FK_764fb473800a7a60dbe148b3b56" FOREIGN KEY (                    "fooID",                    "fooCol"                ) REFERENCES "foo" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                CONSTRAINT "FK_f549bbcf58127bef87b9003d99e" FOREIGN KEY ("barID", "barCol") REFERENCES "bar" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                CONSTRAINT "FK_f0a30f25454246f6b91ee5448ed" FOREIGN KEY (                    "buzID",                    "buzCol"                ) REFERENCES "buz" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                PRIMARY KEY (                    "fooID",                    "fooCol",                    "buzID",                    "buzCol"                )            )`,
                uniqueRegex,
            )
            const expectedResult = [
                {
                    columns: ["barID", "barCol"],
                    name: "REL_f549bbcf58127bef87b9003d99",
                },
                {
                    columns: ["buzID", "buzCol"],
                    name: "REL_f52871a9129b190a91002",
                },
            ]

            expect(result).to.have.lengthOf(2)
            expectedResult.forEach(({ columns, name }, index) => {
                expect(result[index].name).to.equal(name)
                expect(result[index].columns).to.deep.equal(columns)
                expect(result[index].referencedTableName).to.be.undefined
            })
        })

        it("should correctly identify foreign key constraints in the SQL statement regardless of the number of white spaces - should return proper referencedTableName", () => {
            const fkRegex =
                /CONSTRAINT "([^"]*)" FOREIGN KEY ?\((.*?)\) REFERENCES "([^"]*)"/g
            const result = OrmUtils.extractConstraints(
                `CREATE TABLE "foo_table_options" (               "isDefault" boolean NOT NULL,                "fooID" varchar NOT NULL,                "fooCol" varchar NOT NULL,                "buzID" varchar NOT NULL,                "buzCol" varchar NOT NULL,                "barCol" varchar,                "barID" varchar,                CONSTRAINT "REL_f549bbcf58127bef87b9003d99" UNIQUE ("barID", "barCol"),                CONSTRAINT "FK_764fb473800a7a60dbe148b3b56" FOREIGN KEY (                    "fooID",                    "fooCol"                ) REFERENCES "foo" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                CONSTRAINT "FK_f549bbcf58127bef87b9003d99e" FOREIGN KEY ("barID", "barCol") REFERENCES "bar" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                CONSTRAINT "FK_f0a30f25454246f6b91ee5448ed" FOREIGN KEY (                    "buzID",                    "buzCol"                ) REFERENCES "buz" ("id", "Etag") ON DELETE NO ACTION ON UPDATE NO ACTION,                PRIMARY KEY (                    "fooID",                    "fooCol",                    "buzID",                    "buzCol"                )            )`,
                fkRegex,
                (result) => ({
                    referencedTableName: result[3],
                }),
            )

            const expectedResult = [
                {
                    columns: ["fooID", "fooCol"],
                    name: "FK_764fb473800a7a60dbe148b3b56",
                    referencedTableName: "foo",
                },
                {
                    columns: ["barID", "barCol"],
                    name: "FK_f549bbcf58127bef87b9003d99e",
                    referencedTableName: "bar",
                },
                {
                    columns: ["buzID", "buzCol"],
                    name: "FK_f0a30f25454246f6b91ee5448ed",
                    referencedTableName: "buz",
                },
            ]

            expect(result).to.have.lengthOf(3)
            expectedResult.forEach(
                ({ columns, name, referencedTableName }, index) => {
                    expect(result[index].name).to.equal(name)
                    expect(result[index].columns).to.deep.equal(columns)
                    expect(result[index].referencedTableName).to.deep.equal(
                        referencedTableName,
                    )
                },
            )
        })
    })
})
