import { expect } from "chai"
import type { DataSource } from "../../../../src"
import type { EntitySubscriberInterface } from "../../../../src"
import type { UpdateEvent } from "../../../../src"
import { PostWithLuxonDate, DateTime } from "./entity/PostWithLuxonDate"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"

describe("columns > value-transformer > change-detection", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [PostWithLuxonDate],
            enabledDrivers: ["postgres", "mysql"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not update entity if value not changed", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(PostWithLuxonDate)

                const post = new PostWithLuxonDate()
                post.date = DateTime.fromJSDate(
                    new Date("2020-01-01T00:00:00.000Z"),
                )
                await repo.save(post)

                const loadedPost = await repo.findOneByOrFail({ id: post.id })

                let updateCalled = false

                // Construct a dynamic subscriber
                const subscriber: EntitySubscriberInterface<PostWithLuxonDate> =
                    {
                        listenTo() {
                            return PostWithLuxonDate
                        },
                        beforeUpdate(event: UpdateEvent<PostWithLuxonDate>) {
                            updateCalled = true
                        },
                    }

                dataSource.subscribers.push(subscriber)

                try {
                    await repo.save(loadedPost)
                } finally {
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }

                expect(updateCalled).to.be.false
            }),
        )
    })
})
