import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Contact } from "./entity/contact"
import { Country } from "./entity/country"
import { Translation } from "./entity/translation"
import { User } from "./entity/user"

describe("other issues > multiple relations with the same columns should generate valid SQL", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "mssql", "oracle"],
        })
        await reloadTestingDatabases(dataSources)
    })

    after(() => closeTestingConnections(dataSources))

    const correctCountry = {
        code: "UA",
        nameTranslationId: 2,
        currencyTranslationId: 6,
        nameTranslations: [
            { id: 2, lang: "en", text: "Ukraine" },
            { id: 2, lang: "uk", text: "Україна" },
        ],
        currencyTranslations: [
            { id: 6, lang: "en", text: "Hryvnia" },
            { id: 6, lang: "uk", text: "Гривня" },
        ],
    }

    const correctContact = {
        id: 1,
        createdById: 1,
        updatedById: 2,
        createdBy: {
            id: 1,
            lastNameTranslationId: 9,
            firstNameTranslationId: 8,
            firstNameTranslations: [
                { id: 8, lang: "en", text: "John" },
                { id: 8, lang: "uk", text: "Джон" },
            ],
            lastNameTranslations: [
                { id: 9, lang: "en", text: "Malkovich" },
                { id: 9, lang: "uk", text: "Малкович" },
            ],
        },
        updatedBy: {
            id: 2,
            lastNameTranslationId: 10,
            firstNameTranslationId: 8,
            firstNameTranslations: [
                { id: 8, lang: "en", text: "John" },
                { id: 8, lang: "uk", text: "Джон" },
            ],
            lastNameTranslations: [
                { id: 10, lang: "en", text: "Doe" },
                { id: 10, lang: "uk", text: "Доу" },
            ],
        },
    }

    it("should persist entities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(Translation).save([
                    { id: 1, lang: "en", text: "United States" },
                    { id: 1, lang: "uk", text: "Сполучені Штати" },
                    { id: 2, lang: "en", text: "Ukraine" },
                    { id: 2, lang: "uk", text: "Україна" },
                    { id: 3, lang: "en", text: "France" },
                    { id: 3, lang: "uk", text: "Франція" },
                    { id: 4, lang: "en", text: "Germany" },
                    { id: 4, lang: "uk", text: "Німеччина" },
                    { id: 5, lang: "en", text: "Dollar" },
                    { id: 5, lang: "uk", text: "Долар" },
                    { id: 6, lang: "en", text: "Hryvnia" },
                    { id: 6, lang: "uk", text: "Гривня" },
                    { id: 7, lang: "en", text: "Euro" },
                    { id: 7, lang: "uk", text: "Євро" },
                    { id: 8, lang: "en", text: "John" },
                    { id: 8, lang: "uk", text: "Джон" },
                    { id: 9, lang: "en", text: "Malkovich" },
                    { id: 9, lang: "uk", text: "Малкович" },
                    { id: 10, lang: "en", text: "Doe" },
                    { id: 10, lang: "uk", text: "Доу" },
                    { id: 11, lang: "en", text: "Smith" },
                    { id: 11, lang: "uk", text: "Сміт" },
                ])

                await dataSource.getRepository(Country).save([
                    { code: "US", nameTranslationId: 1 },
                    {
                        code: "UA",
                        nameTranslationId: 2,
                        currencyTranslationId: 6,
                    },
                    {
                        code: "FR",
                        nameTranslationId: 3,
                        currencyTranslationId: 7,
                    },
                    {
                        code: "DE",
                        nameTranslationId: 4,
                        currencyTranslationId: 7,
                    },
                ])

                await dataSource.getRepository(User).save([
                    {
                        id: 1,
                        firstNameTranslationId: 8,
                        lastNameTranslationId: 9,
                    },
                    {
                        id: 2,
                        firstNameTranslationId: 8,
                        lastNameTranslationId: 10,
                    },
                    {
                        id: 3,
                        firstNameTranslationId: 8,
                        lastNameTranslationId: 11,
                    },
                ])

                await dataSource.getRepository(Contact).save([
                    { id: 1, createdById: 1, updatedById: 2 },
                    { id: 2, createdById: 1, updatedById: 3 },
                    { id: 3, createdById: 2, updatedById: 1 },
                ])
            }),
        ))

    it("should load entities with correct relation with find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const country = await dataSource
                    .getRepository(Country)
                    .findOne({
                        where: { code: "UA" },
                        relations: {
                            nameTranslations: true,
                            currencyTranslations: true,
                        },
                        order: {
                            nameTranslations: { lang: "ASC" },
                            currencyTranslations: { lang: "ASC" },
                        },
                    })

                country!.should.be.deep.include(correctCountry)

                const contact = await dataSource
                    .getRepository(Contact)
                    .findOne({
                        where: { id: 1 },
                        relations: {
                            createdBy: {
                                firstNameTranslations: true,
                                lastNameTranslations: true,
                            },
                            updatedBy: {
                                firstNameTranslations: true,
                                lastNameTranslations: true,
                            },
                        },
                        order: {
                            createdBy: {
                                firstNameTranslations: { lang: "ASC" },
                                lastNameTranslations: { lang: "ASC" },
                            },
                            updatedBy: {
                                firstNameTranslations: { lang: "ASC" },
                                lastNameTranslations: { lang: "ASC" },
                            },
                        },
                    })

                contact!.should.be.deep.include(correctContact)
            }),
        ))

    it("should load entities with correct relation with query builder", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const country = await dataSource
                    .createQueryBuilder(Country, "countries")
                    .leftJoinAndSelect(
                        "countries.nameTranslations",
                        "nameTranslations",
                    )
                    .leftJoinAndSelect(
                        "countries.currencyTranslations",
                        "currencyTranslations",
                    )
                    .where("countries.code = :code", { code: "UA" })
                    .orderBy({
                        "nameTranslations.lang": "ASC",
                        "currencyTranslations.lang": "ASC",
                    })
                    .getOne()

                country!.should.be.deep.include(correctCountry)

                const contact = await dataSource
                    .createQueryBuilder(Contact, "contacts")
                    .leftJoinAndSelect("contacts.createdBy", "createdBy")
                    .leftJoinAndSelect("contacts.updatedBy", "updatedBy")
                    .leftJoinAndSelect(
                        "createdBy.firstNameTranslations",
                        "createdByFirstNameTranslations",
                    )
                    .leftJoinAndSelect(
                        "createdBy.lastNameTranslations",
                        "createdByLastNameTranslations",
                    )
                    .leftJoinAndSelect(
                        "updatedBy.firstNameTranslations",
                        "updatedByFirstNameTranslations",
                    )
                    .leftJoinAndSelect(
                        "updatedBy.lastNameTranslations",
                        "updatedByLastNameTranslations",
                    )
                    .where("contacts.id = :id", { id: 1 })
                    .orderBy({
                        "createdByFirstNameTranslations.lang": "ASC",
                        "createdByLastNameTranslations.lang": "ASC",
                        "updatedByFirstNameTranslations.lang": "ASC",
                        "updatedByLastNameTranslations.lang": "ASC",
                    })
                    .getOne()

                contact!.should.be.deep.include(correctContact)
            }),
        ))
})
