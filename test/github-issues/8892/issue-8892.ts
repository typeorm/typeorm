import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import { City as CityCountry } from "./entity-2/city"
import { Zip as ZipCountry } from "./entity-2/zip"
import { Country } from "./entity-2/country"
import { City } from "./entity-1/city"
import { DataSource, Repository } from "../../../src"

describe('github issues > #8892 ManyToMany relations save throws "Violation of PRIMARY KEY constraint"', async () => {
    let connections: DataSource[]

    const country: Country = new Country()
    country.code = "de"
    country.caption = "Germany"

    const city: CityCountry = new CityCountry()
    city.caption = "Test city"

    const zip1: ZipCountry = new ZipCountry()
    zip1.countryCode = "de"
    zip1.code = "12345"

    const zip2: ZipCountry = new ZipCountry()
    zip2.countryCode = "de"
    zip2.code = "54321"

    let entityFolder = 1

    beforeEach(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity-" + entityFolder + "/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
        entityFolder++
    })
    afterEach(() => closeTestingConnections(connections))

    const insertCityAndZip = async (
        cityRepository: Repository<CityCountry | City>,
    ) => {
        const foundCity = await cityRepository.save(
            {
                caption: city.caption,
            },
            {
                reload: true,
            },
        )

        if (foundCity) {
            expect(foundCity.caption).to.deep.equal(city.caption)

            const foundCityId = foundCity.id

            await cityRepository.save({
                id: foundCityId,
                zips: [
                    {
                        countryCode: zip1.countryCode,
                        code: zip1.code,
                    },
                    {
                        countryCode: zip2.countryCode,
                        code: zip2.code,
                    },
                ],
            })

            await cityRepository.save({
                id: foundCityId,
                zips: [
                    {
                        countryCode: zip2.countryCode,
                        code: zip2.code,
                    },
                ],
            })

            const existingCity = await cityRepository.find({
                where: {
                    id: foundCityId,
                },
                relations: ["zips"],
            })

            if (existingCity[0]) {
                expect(existingCity[0].zips.length).to.deep.equal(1)
                expect(existingCity[0].zips[0].code).to.deep.equal(zip2.code)
                expect(existingCity[0].zipCodes[0]).to.deep.equal({
                    countryCode: zip2.countryCode,
                    code: zip2.code,
                })
            } else {
                throw new Error("city not found")
            }
        }
    }

    it("should work perfectly with with many to many relation with normal primary keys", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                await insertCityAndZip(connection.getRepository(City))
            }),
        )
    })

    it("should work perfectly with with many to many relation with primary key from related object is a primary key from an many to one relation", async () =>
        await Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Country).insert({
                    code: country.code,
                    caption: country.caption,
                })

                await insertCityAndZip(connection.getRepository(CityCountry))
            }),
        ))
})
