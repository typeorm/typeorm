import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { Region } from "./entity/Region"
import { Country } from "./entity/Country"
import { Province } from "./entity/Province"

describe("github issues > #9936 Self-referencing relations in table inheritance cause duplicate join error with query strategy", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Region, Country, Province],
                schemaCreate: true,
                dropSchema: true,
                // Skip SQL Server due to STI with self-referencing foreign key limitations
                enabledDrivers: [
                    "mysql",
                    "mariadb",
                    "postgres",
                    "sqlite",
                    "better-sqlite3",
                    "cockroachdb",
                    "oracle",
                ],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load self-referencing parent relation with query strategy without duplicate join error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const countryRepository = dataSource.getRepository(Country)
                const provinceRepository = dataSource.getRepository(Province)

                // Create a country
                const usa = new Country()
                usa.name = "United States"
                await countryRepository.save(usa)

                // Create provinces with parent country
                const california = new Province()
                california.name = "California"
                california.parent = usa
                await provinceRepository.save(california)

                const texas = new Province()
                texas.name = "Texas"
                texas.parent = usa
                await provinceRepository.save(texas)

                // Test with relationLoadStrategy: "query" - this was throwing duplicate join error before fix
                const provincesWithParentQuery = await provinceRepository.find({
                    relations: {
                        parent: true,
                    },
                    relationLoadStrategy: "query",
                })

                expect(provincesWithParentQuery).to.have.length(2)
                expect(provincesWithParentQuery[0].parent).to.exist
                expect(provincesWithParentQuery[0].parent!.id).to.equal(usa.id)
                expect(provincesWithParentQuery[0].parent!.name).to.equal(
                    "United States",
                )
                expect(provincesWithParentQuery[1].parent).to.exist
                expect(provincesWithParentQuery[1].parent!.id).to.equal(usa.id)
            }),
        ))

    it("should load self-referencing children relation with query strategy without duplicate join error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const countryRepository = dataSource.getRepository(Country)
                const provinceRepository = dataSource.getRepository(Province)

                // Create a country
                const canada = new Country()
                canada.name = "Canada"
                await countryRepository.save(canada)

                // Create provinces with parent country
                const ontario = new Province()
                ontario.name = "Ontario"
                ontario.parent = canada
                await provinceRepository.save(ontario)

                const quebec = new Province()
                quebec.name = "Quebec"
                quebec.parent = canada
                await provinceRepository.save(quebec)

                // Load country with children using query strategy - this was throwing duplicate join error before fix
                const countryWithChildrenQuery =
                    await countryRepository.findOne({
                        where: { id: canada.id },
                        relations: {
                            children: true,
                        },
                        relationLoadStrategy: "query",
                    })

                expect(countryWithChildrenQuery).to.exist
                expect(countryWithChildrenQuery!.children).to.have.length(2)

                const childNames = countryWithChildrenQuery!.children
                    .map((c) => c.name)
                    .sort()
                expect(childNames).to.deep.equal(["Ontario", "Quebec"])
            }),
        ))

    it("should handle nested self-referencing relations with query strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const countryRepository = dataSource.getRepository(Country)
                const provinceRepository = dataSource.getRepository(Province)

                // Create a country
                const uk = new Country()
                uk.name = "United Kingdom"
                await countryRepository.save(uk)

                // Create a province with parent country
                const england = new Province()
                england.name = "England"
                england.parent = uk
                await provinceRepository.save(england)

                // Create sub-province
                const london = new Province()
                london.name = "London"
                london.parent = england
                await provinceRepository.save(london)

                // Query with nested relations using query strategy
                const londonWithParents = await provinceRepository.findOne({
                    where: { name: "London" },
                    relations: {
                        parent: {
                            parent: true,
                        },
                    },
                    relationLoadStrategy: "query",
                })

                // Verify the data structure is correct
                expect(londonWithParents).to.exist
                expect(londonWithParents!.parent).to.exist
                expect(londonWithParents!.parent!.name).to.equal("England")
                expect(londonWithParents!.parent!.parent).to.exist
                expect(londonWithParents!.parent!.parent!.name).to.equal(
                    "United Kingdom",
                )
            }),
        ))

    it("should work correctly when mixing Country and Province queries", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const regionRepository = dataSource.getRepository(Region)
                const countryRepository = dataSource.getRepository(Country)
                const provinceRepository = dataSource.getRepository(Province)

                // Create test data
                const germany = new Country()
                germany.name = "Germany"
                await countryRepository.save(germany)

                const bavaria = new Province()
                bavaria.name = "Bavaria"
                bavaria.parent = germany
                await provinceRepository.save(bavaria)

                const france = new Country()
                france.name = "France"
                await countryRepository.save(france)

                const paris = new Province()
                paris.name = "Paris"
                paris.parent = france
                await provinceRepository.save(paris)

                // Query all regions with parent using base repository and query strategy
                const regionsWithParent = await regionRepository.find({
                    relations: {
                        parent: true,
                    },
                    relationLoadStrategy: "query",
                })

                // Should have 2 provinces with parents
                const provincesWithParent = regionsWithParent.filter(
                    (r) => r instanceof Province,
                )
                expect(provincesWithParent).to.have.length(2)

                provincesWithParent.forEach((province) => {
                    expect(province.parent).to.exist
                    expect(province.parent).to.be.instanceOf(Country)
                })

                // Query all regions with children
                const regionsWithChildren = await regionRepository.find({
                    relations: {
                        children: true,
                    },
                    relationLoadStrategy: "query",
                })

                // Should have 2 countries with children
                const countriesWithChildren = regionsWithChildren.filter(
                    (r) => r instanceof Country && r.children.length > 0,
                )
                expect(countriesWithChildren).to.have.length(2)
            }),
        ))
})
