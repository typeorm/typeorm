import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("table-inheritance > single-table > embedded-columns-nullable", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should keep parent-defined embedded columns as NOT NULL when nullable: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("content")
                await queryRunner.release()

                expect(table).to.not.be.undefined

                // Parent-defined embedded columns should be NOT NULL
                const likesColumn = table!.findColumnByName("likes")
                const commentsColumn = table!.findColumnByName("comments")
                const favoritesColumn = table!.findColumnByName("favorites")

                expect(likesColumn).to.not.be.undefined
                expect(likesColumn!.isNullable).to.be.false

                expect(commentsColumn).to.not.be.undefined
                expect(commentsColumn!.isNullable).to.be.false

                expect(favoritesColumn).to.not.be.undefined
                expect(favoritesColumn!.isNullable).to.be.false
            }),
        ))

    it("should make child-defined embedded columns nullable in STI", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("content")
                await queryRunner.release()

                expect(table).to.not.be.undefined

                // Child-defined embedded columns should be nullable
                const sharesColumn = table!.findColumnByName("shares")
                const viewsColumn = table!.findColumnByName("views")

                expect(sharesColumn).to.not.be.undefined
                expect(sharesColumn!.isNullable).to.be.true

                expect(viewsColumn).to.not.be.undefined
                expect(viewsColumn!.isNullable).to.be.true
            }),
        ))

    it("should make child-specific regular columns nullable in STI", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("content")
                await queryRunner.release()

                expect(table).to.not.be.undefined

                // Child-specific regular columns should be nullable
                const sizeColumn = table!.findColumnByName("size")
                const viewCountColumn = table!.findColumnByName("viewCount")

                expect(sizeColumn).to.not.be.undefined
                expect(sizeColumn!.isNullable).to.be.true

                expect(viewCountColumn).to.not.be.undefined
                expect(viewCountColumn!.isNullable).to.be.true
            }),
        ))

    it("should correctly save and load entities with parent-defined embeds", () =>
        Promise.all(
            connections.map(async (connection) => {
                const photo = new Photo()
                photo.title = "My Photo"
                photo.size = "1024x768"
                photo.counters = {
                    likes: 10,
                    comments: 5,
                    favorites: 3,
                }
                await connection.manager.save(photo)

                const post = new Post()
                post.title = "My Post"
                post.viewCount = 100
                post.counters = {
                    likes: 20,
                    comments: 15,
                    favorites: 8,
                }
                post.childCounters = {
                    shares: 50,
                    views: 200,
                }
                await connection.manager.save(post)

                const loadedPhoto = await connection.manager.findOne(Photo, {
                    where: { id: photo.id },
                })
                expect(loadedPhoto).to.not.be.null
                expect(loadedPhoto!.title).to.equal("My Photo")
                expect(loadedPhoto!.size).to.equal("1024x768")
                expect(loadedPhoto!.counters.likes).to.equal(10)
                expect(loadedPhoto!.counters.comments).to.equal(5)
                expect(loadedPhoto!.counters.favorites).to.equal(3)

                const loadedPost = await connection.manager.findOne(Post, {
                    where: { id: post.id },
                })
                expect(loadedPost).to.not.be.null
                expect(loadedPost!.title).to.equal("My Post")
                expect(loadedPost!.viewCount).to.equal(100)
                expect(loadedPost!.counters.likes).to.equal(20)
                expect(loadedPost!.counters.comments).to.equal(15)
                expect(loadedPost!.counters.favorites).to.equal(8)
                expect(loadedPost!.childCounters.shares).to.equal(50)
                expect(loadedPost!.childCounters.views).to.equal(200)
            }),
        ))
})
