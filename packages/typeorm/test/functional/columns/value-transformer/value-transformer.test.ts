import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

import type { DataSource } from "../../../../src/data-source/DataSource"
import { PhoneBook } from "./entity/PhoneBook"
import { Complex, Post } from "./entity/Post"
import { User } from "./entity/User"
import { Category } from "./entity/Category"
import { View } from "./entity/View"
import { expect } from "chai"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Generated } from "../../../../src/decorator/Generated"
import type { ValueTransformer } from "../../../../src/decorator/options/ValueTransformer"

class DefaultCountingTransformer implements ValueTransformer {
    static fromCallCount = 0
    to(value?: number): number | undefined {
        return value == null ? value : value + 1
    }
    from(value: number | null): number | null {
        if (value === null) return null
        DefaultCountingTransformer.fromCallCount++
        return value - 1
    }
}

@Entity()
class DefaultWithCountingTransformer {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        type: "integer",
        default: 101,
        transformer: new DefaultCountingTransformer(),
    })
    defaultValue!: number

    @Column({ type: "integer", transformer: new DefaultCountingTransformer() })
    regularValue!: number
}

@Entity()
class NullableDefaultWithCountingTransformer {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        type: "integer",
        nullable: true,
        default: 101,
        transformer: new DefaultCountingTransformer(),
    })
    value!: number | null
}

@Entity()
class UuidAndDefaultEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", length: 36 })
    @Generated("uuid")
    uuid!: string

    @Column({
        type: "integer",
        default: 101,
        transformer: new DefaultCountingTransformer(),
    })
    defaultValue!: number
}

@Entity()
class InsertFalseDefaultEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        type: "integer",
        insert: false,
        default: 101,
        transformer: new DefaultCountingTransformer(),
    })
    value!: number
}

class ArrayTransformerOne implements ValueTransformer {
    static fromCalls = 0
    to(value: number | null | undefined): number | null | undefined {
        return value == null ? value : value + 1
    }
    from(value: number | null): number | null {
        if (value == null) return value
        ArrayTransformerOne.fromCalls++
        return value - 1
    }
}
class ArrayTransformerTwo implements ValueTransformer {
    static fromCalls = 0
    to(value: number | null | undefined): number | null | undefined {
        return value == null ? value : value * 2
    }
    from(value: number | null): number | null {
        if (value == null) return value
        ArrayTransformerTwo.fromCalls++
        return value / 2
    }
}

@Entity()
class ArrayTransformerDefaultEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        type: "integer",
        default: 202,
        transformer: [new ArrayTransformerOne(), new ArrayTransformerTwo()],
    })
    value!: number
}

class EmbeddedDefaults {
    @Column({
        type: "integer",
        default: 101,
        transformer: new DefaultCountingTransformer(),
        name: "custom_default_value",
    })
    defaultValue!: number
}

@Entity()
class EmbeddedDefaultEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column(() => EmbeddedDefaults, { prefix: "defaults" })
    defaults!: EmbeddedDefaults
}

describe("columns > value-transformer functionality", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, PhoneBook, User, Category, View],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should marshal data using the provided value-transformer", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.tags = ["simple", "transformer"]
                await postRepository.save(post)

                // then update all its properties and save again
                post.title = "About columns1"
                post.tags = ["very", "simple"]
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.title).to.be.equal("About columns1")
                expect(loadedPost.tags).to.deep.eq(["very", "simple"])

                const phoneBookRepository = dataSource.getRepository(PhoneBook)
                const phoneBook = new PhoneBook()
                phoneBook.name = "George"
                phoneBook.phones = new Map()
                phoneBook.phones.set("work", 123456)
                phoneBook.phones.set("mobile", 1234567)
                await phoneBookRepository.save(phoneBook)

                const loadedPhoneBook =
                    await phoneBookRepository.findOneByOrFail({
                        id: phoneBook.id,
                    })
                expect(loadedPhoneBook.name).to.be.equal("George")
                expect(loadedPhoneBook.phones).not.to.be.undefined
                expect(loadedPhoneBook.phones.get("work")).to.equal(123456)
                expect(loadedPhoneBook.phones.get("mobile")).to.equal(1234567)
            }),
        ))

    it("should apply three transformers in the right order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const email = `${dataSource.options.type}@JOHN.doe`
                const user = new User()
                user.email = email

                await userRepository.save(user)

                const dbUser = await userRepository.findOneByOrFail({
                    id: user.id,
                })
                expect(dbUser.email).to.equal(email.toLocaleLowerCase())
            }),
        ))

    it("should apply all the transformers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepository = dataSource.getRepository(Category)
                const description = `  ${dataSource.options.type}-DESCRIPTION   `
                const category = new Category()
                category.description = description

                await categoryRepository.save(category)

                const dbCategory = await categoryRepository.findOneByOrFail({
                    id: category.id,
                })
                expect(dbCategory.description).to.equal(
                    description.toLocaleLowerCase().trim(),
                )
            }),
        ))

    it("should apply no transformer", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const viewRepository = dataSource.getRepository(View)
                const title = `${dataSource.options.type}`
                const view = new View()
                view.title = title

                await viewRepository.save(view)

                const dbView = await viewRepository.findOneByOrFail({
                    id: view.id,
                })
                expect(dbView.title).to.equal(title)
            }),
        ))

    it("should marshal data using a complex value-transformer", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "Complex transformers!"
                post.tags = ["complex", "transformer"]
                await postRepository.save(post)

                let loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.complex).to.eq(null)

                // then update all its properties and save again
                post.title = "Complex transformers2!"
                post.tags = ["very", "complex", "actually"]
                post.complex = new Complex("3 2.5")
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.title).to.be.equal("Complex transformers2!")
                expect(loadedPost.tags).to.deep.eq([
                    "very",
                    "complex",
                    "actually",
                ])
                expect(loadedPost.complex).to.not.be.null
                expect(loadedPost.complex?.x).to.eq(3)
                expect(loadedPost.complex?.y).to.eq(2.5)

                // then update all its properties and save again
                post.title = "Complex transformers3!"
                post.tags = ["very", "lacking", "actually"]
                post.complex = null
                await postRepository.save(post)

                loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.complex).to.eq(null)

                // then update all its properties and save again
                post.title = "Complex transformers4!"
                post.tags = ["very", "here", "again!"]
                post.complex = new Complex("0.5 0.5")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.complex).to.not.be.null
                expect(loadedPost.complex?.x).to.eq(0.5)
                expect(loadedPost.complex?.y).to.eq(0.5)

                // then update all its properties and save again
                post.title = "Complex transformers5!"
                post.tags = ["now", "really", "lacking!"]
                post.complex = new Complex("1.05 2.3")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.complex).to.not.be.null
                expect(loadedPost.complex?.x).to.eq(1.05)
                expect(loadedPost.complex?.y).to.eq(2.3)
            }),
        ))
})

describe("columns > value-transformer > reselected defaults", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                DefaultWithCountingTransformer,
                NullableDefaultWithCountingTransformer,
                UuidAndDefaultEntity,
                InsertFalseDefaultEntity,
                ArrayTransformerDefaultEntity,
                EmbeddedDefaultEntity,
            ],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["better-sqlite3", "mysql"],
        })
    })
    beforeEach(async () => {
        DefaultCountingTransformer.fromCallCount = 0
        await reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("preserves explicit values and hydrates reselected values once", async () => {
        for (const dataSource of dataSources) {
            const entity = new DefaultWithCountingTransformer()
            entity.defaultValue = 7
            entity.regularValue = 8
            DefaultCountingTransformer.fromCallCount = 0
            await dataSource.getRepository(DefaultWithCountingTransformer).save(entity)
            expect(entity.defaultValue).to.equal(7)
            expect(entity.regularValue).to.equal(8)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)
        }
    })

    it("hydrates an omitted default from the database", async () => {
        for (const dataSource of dataSources) {
            const entity = new DefaultWithCountingTransformer()
            entity.regularValue = 8
            DefaultCountingTransformer.fromCallCount = 0
            await dataSource.getRepository(DefaultWithCountingTransformer).save(entity)
            expect(entity.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)
        }
    })

    it("preserves explicit and omitted defaults in a batch save", async () => {
        for (const dataSource of dataSources) {
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9

            await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .save([explicit, omitted])

            expect(explicit.defaultValue).to.equal(7)
            expect(omitted.defaultValue).to.equal(100)
        }
    })

    it("preserves generated maps for direct insert values", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9
            DefaultCountingTransformer.fromCallCount = 0

            const result = await dataSource
                .createQueryBuilder()
                .insert()
                .into(DefaultWithCountingTransformer)
                .values([explicit, omitted])
                .execute()

            expect(result.generatedMaps).to.have.length(2)
            expect(result.generatedMaps[0].defaultValue).to.equal(7)
            expect(result.generatedMaps[1].defaultValue).to.equal(100)
            expect(explicit.defaultValue).to.equal(7)
            expect(omitted.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(2)
        }
    })

    it("returns transformed generated maps from repository insert", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9
            DefaultCountingTransformer.fromCallCount = 0

            const result = await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .insert([explicit, omitted])

            expect(result.generatedMaps).to.have.length(2)
            expect(result.generatedMaps[0].defaultValue).to.equal(7)
            expect(result.generatedMaps[1].defaultValue).to.equal(100)
            expect(explicit.defaultValue).to.equal(7)
            expect(omitted.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(2)
        }
    })

    it("does not reload defaults when save is called with reload false", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9
            DefaultCountingTransformer.fromCallCount = 0

            await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .save([explicit, omitted], { reload: false })

            expect(explicit.defaultValue).to.equal(7)
            expect(omitted.defaultValue).to.be.undefined
            expect(DefaultCountingTransformer.fromCallCount).to.equal(0)

            DefaultCountingTransformer.fromCallCount = 0
            const stored = await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .find()
            expect(stored.map((value) => value.defaultValue)).to.include.members([
                7,
                100,
            ])
            expect(DefaultCountingTransformer.fromCallCount).to.equal(
                stored.length * 2,
            )
        }
    })

    it("does not update entities when insert updateEntity is disabled", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9
            DefaultCountingTransformer.fromCallCount = 0

            const result = await dataSource
                .createQueryBuilder()
                .insert()
                .into(DefaultWithCountingTransformer)
                .values([explicit, omitted])
                .updateEntity(false)
                .execute()

            expect(result.generatedMaps).to.have.length(0)
            expect(explicit.defaultValue).to.equal(7)
            expect(omitted.defaultValue).to.be.undefined
            expect(DefaultCountingTransformer.fromCallCount).to.equal(0)

            DefaultCountingTransformer.fromCallCount = 0
            const stored = await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .find()
            expect(stored.map((value) => value.defaultValue)).to.include.members([
                7,
                100,
            ])
            expect(DefaultCountingTransformer.fromCallCount).to.equal(
                stored.length * 2,
            )
        }
    })

    it("distinguishes zero, null, and omitted nullable defaults", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const zero = new NullableDefaultWithCountingTransformer()
            zero.value = 0
            const nil = new NullableDefaultWithCountingTransformer()
            nil.value = null
            const omitted = new NullableDefaultWithCountingTransformer()
            DefaultCountingTransformer.fromCallCount = 0

            await dataSource
                .getRepository(NullableDefaultWithCountingTransformer)
                .save([zero, nil, omitted])

            expect(zero.value).to.equal(0)
            expect(nil.value).to.equal(null)
            expect(omitted.value).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(2)

            DefaultCountingTransformer.fromCallCount = 0
            const stored = await dataSource
                .getRepository(NullableDefaultWithCountingTransformer)
                .find()
            expect(stored.map((row) => row.value)).to.include.members([
                0,
                null,
                100,
            ])
            expect(DefaultCountingTransformer.fromCallCount).to.equal(2)
        }
    })

    it("tracks locally generated UUID and transformed default independently", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const entity = new UuidAndDefaultEntity()
            DefaultCountingTransformer.fromCallCount = 0

            await dataSource.getRepository(UuidAndDefaultEntity).save(entity)

            expect(entity.uuid).to.match(/^[0-9a-f-]{36}$/)
            expect(entity.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)
        }
    })

    it("uses the database default for insert false transformed columns", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const entity = new InsertFalseDefaultEntity()
            entity.value = 7
            DefaultCountingTransformer.fromCallCount = 0

            await dataSource.getRepository(InsertFalseDefaultEntity).save(entity)

            expect(entity.value).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)
            const stored = await dataSource
                .getRepository(InsertFalseDefaultEntity)
                .findOneByOrFail({ id: entity.id })
            expect(stored.value).to.equal(100)
        }
    })

    it("applies transformer arrays in reverse order exactly once", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "better-sqlite3") continue
            const omitted = new ArrayTransformerDefaultEntity()
            const explicit = new ArrayTransformerDefaultEntity()
            explicit.value = 7
            ArrayTransformerOne.fromCalls = 0
            ArrayTransformerTwo.fromCalls = 0

            await dataSource.getRepository(ArrayTransformerDefaultEntity).save([
                omitted,
                explicit,
            ])

            expect(omitted.value).to.equal(100)
            expect(explicit.value).to.equal(7)
            expect(ArrayTransformerOne.fromCalls).to.equal(2)
            expect(ArrayTransformerTwo.fromCalls).to.equal(2)
        }
    })

    it("supports defaults in embeddeds with custom database names", async () => {
        for (const dataSource of dataSources) {
            const entity = new EmbeddedDefaultEntity()
            entity.defaults = new EmbeddedDefaults()
            DefaultCountingTransformer.fromCallCount = 0
            await dataSource.getRepository(EmbeddedDefaultEntity).save(entity)
            expect(entity.defaults.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)

            const column = dataSource
                .getMetadata(EmbeddedDefaultEntity)
                .columns.find(
                    (candidate) => candidate.propertyPath === "defaults.defaultValue",
                )
            expect(column?.databaseName).to.equal("defaultsCustom_default_value")
        }
    })

    it("preserves a trigger override of an explicit default on MySQL", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.options.type !== "mysql") continue
            await dataSource.query(
                "CREATE TRIGGER default_with_counting_transformer_before_insert BEFORE INSERT ON default_with_counting_transformer FOR EACH ROW SET NEW.`defaultValue` = 42",
            )
            try {
                const entity = new DefaultWithCountingTransformer()
                entity.defaultValue = 7
                entity.regularValue = 8
                await dataSource
                    .getRepository(DefaultWithCountingTransformer)
                    .save(entity)
                expect(entity.defaultValue).to.equal(41)
            } finally {
                await dataSource.query(
                    "DROP TRIGGER default_with_counting_transformer_before_insert",
                )
            }
        }
    })
})

describe("columns > value-transformer > postgres returning defaults", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [DefaultWithCountingTransformer],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(async () => {
        DefaultCountingTransformer.fromCallCount = 0
        await reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("hydrates native RETURNING explicit and omitted defaults once", async () => {
        for (const dataSource of dataSources) {
            const explicit = new DefaultWithCountingTransformer()
            explicit.defaultValue = 7
            explicit.regularValue = 8
            DefaultCountingTransformer.fromCallCount = 0
            await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .save(explicit)
            expect(explicit.defaultValue).to.equal(7)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)

            const omitted = new DefaultWithCountingTransformer()
            omitted.regularValue = 9
            DefaultCountingTransformer.fromCallCount = 0
            await dataSource
                .getRepository(DefaultWithCountingTransformer)
                .save(omitted)
            expect(omitted.defaultValue).to.equal(100)
            expect(DefaultCountingTransformer.fromCallCount).to.equal(1)
        }
    })
})
