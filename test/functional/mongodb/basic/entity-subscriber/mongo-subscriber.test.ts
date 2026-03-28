import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { AnotherExample, Example } from "./entity/Example"
import {
    AnotherMockSubscriber,
    MockSubscriber,
} from "./subscriber/MockSubscriber"

// GitHub issue #11091 - mongodb entity subscriber afterLoad not called correctly
describe("mongodb > entity subscriber", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [Example, AnotherExample],
            subscribers: [MockSubscriber, AnotherMockSubscriber],
            dropSchema: true,
            schemaCreate: true,
        })
    })
    beforeEach(async () => {
        if (!dataSources.length) return
        ;(dataSources[0].subscribers[0] as MockSubscriber).counter = 0
        ;(dataSources[0].subscribers[1] as AnotherMockSubscriber).counter = 0
        await reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("should call afterLoad once with findOne", async () => {
        if (!dataSources.length) return
        const connection = dataSources[0]
        const subscriber = connection.subscribers[0] as MockSubscriber

        const example = new Example()
        example.value = 0

        await connection.manager.save(example)

        const loadedExample = await connection.manager.findOne(Example, {
            where: { _id: example._id },
        })
        expect(loadedExample!).to.be.deep.equal({
            _id: example._id,
            value: 0,
        })
        expect(subscriber.counter).to.be.eql(1)
    })

    it("should call afterLoad thrice with find", async () => {
        if (!dataSources.length) return
        const dataSource = dataSources[0]
        const subscriber = dataSource.subscribers[0] as MockSubscriber
        const example1 = new Example()
        example1.value = 1
        const example2 = new Example()
        example2.value = 2
        const example3 = new Example()
        example3.value = 3

        await dataSource.manager.save([example1, example2, example3])

        const loadedExamples = await dataSource.manager.find(Example)
        expect(loadedExamples).to.have.length(3)
        expect(loadedExamples).to.deep.include.members([
            { _id: example1._id, value: 1 },
            { _id: example2._id, value: 2 },
            { _id: example3._id, value: 3 },
        ])
        expect(subscriber.counter).to.be.eql(3)
    })

    it("should call afterLoad when any entity is loaded", async () => {
        if (!dataSources.length) return
        const dataSource = dataSources[0]
        const subscriber = dataSource.subscribers[1] as AnotherMockSubscriber
        const example1 = new Example()
        example1.value = 10

        await dataSource.manager.save(example1)

        const loadedExample = await dataSource.manager.findOneBy(Example, {
            _id: example1._id,
        })
        expect(loadedExample).to.be.deep.equal({
            _id: example1._id,
            value: 10,
        })
        expect(subscriber.counter).to.be.eql(1)

        const anotherExample = new AnotherExample()
        anotherExample.name = "test name"

        await dataSource.manager.save(anotherExample)

        const loadedAnotherExample = await dataSource.manager.findOneBy(
            AnotherExample,
            { _id: anotherExample._id },
        )
        expect(loadedAnotherExample).to.be.deep.equal({
            _id: anotherExample._id,
            name: "test name",
        })
        expect(subscriber.counter).to.be.eql(2)
    })
})
