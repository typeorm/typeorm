import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Example, MockSubscriber } from "./entity/Example"

// GitHub issue #11091 - mongodb entity subscriber afterLoad not called correctly
describe("mongodb > entity subscriber", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mongodb"],
                entities: [Example],
                subscribers: [MockSubscriber],
                dropSchema: true,
                schemaCreate: true,
            })),
    )
    beforeEach(async () => {
        if (!connections.length) return
        ;(connections[0].subscribers[0] as MockSubscriber).counter = 0
        await reloadTestingDatabases(connections)
    })
    after(() => closeTestingConnections(connections))

    it("should call afterLoad once with findOne", async () => {
        if (!connections.length) return
        const connection = connections[0]
        const subscriber = connection.subscribers[0] as MockSubscriber

        const example = new Example()
        example.value = 0

        await connection.manager.save(example)

        const loadedExample = await connection.manager.findOne(Example, {
            where: { id: (example as any)._id },
        })
        expect(loadedExample!).to.be.deep.equal({
            id: example.id,
            value: 0,
        })
        expect(subscriber.counter).to.be.eql(1)
    })

    it("should call afterLoad thrice with find", async () => {
        if (!connections.length) return
        const connection = connections[0]
        const subscriber = connection.subscribers[0] as MockSubscriber
        const example1 = new Example()
        example1.value = 1
        const example2 = new Example()
        example2.value = 2
        const example3 = new Example()
        example3.value = 3

        await connection.manager.save([example1, example2, example3])

        const loadedExamples = await connection.manager.find(Example)
        expect(loadedExamples).to.have.length(3)
        expect(loadedExamples).to.deep.include.members([
            { id: example1.id, value: 1 },
            { id: example2.id, value: 2 },
            { id: example3.id, value: 3 },
        ])
        expect(subscriber.counter).to.be.eql(3)
    })
})
