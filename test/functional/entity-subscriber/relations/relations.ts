import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { CategorySubscriber } from "./subscribers/CategorySubscriber"
import { Category } from "./entity/Category"
import { Image } from "./entity/Image"

describe("entity subscriber > one-to-one", () => {
    let datasources: DataSource[]

    before(async () => {
        datasources = await createTestingConnections({
            entities: [Category, Image],
            subscribers: [CategorySubscriber],
            dropSchema: true,
            schemaCreate: true,
            enabledDrivers: ["sqlite"],
            logging: true,
        })
    })

    after(() => closeTestingConnections(datasources))

    it("passes related entity from one-to-one relation to subscriber", async () => {
        if (!datasources.length) return

        const subscriber = datasources[0].subscribers[0] as CategorySubscriber

        const category = new Category()
        await datasources[0].manager.save(category)

        const image = new Image()
        image.defaultImageOf = category
        await datasources[0].manager.save(image)

        expect(subscriber.events[0].entity).to.be.eql(category)
    })
})
