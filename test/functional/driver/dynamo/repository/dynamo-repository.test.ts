import { DataSource } from "../../../../../src"
import sinon from "sinon"
import { PersonRepository } from "./person-repository"
import { Person } from "../entities/Person"
import { expect } from "chai"
import { DynamoAddOptions } from "../../../../../build/package"

describe("DynamoRepository", () => {
    afterEach(() => {
        sinon.restore()
    })

    it("insert and delete", async (): Promise<any> => {
        sinon.stub(PersonRepository.prototype, "put").resolves()
        sinon.stub(PersonRepository.prototype, "deleteOne").resolves()
        const findStub = sinon.stub(PersonRepository.prototype, "findOne")
        findStub
            .onFirstCall()
            .resolves({
                id: "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451",
                firstname: "John",
                lastname: "Doe",
            } as Person)
        findStub.onSecondCall().resolves(undefined)
        const connection = await new DataSource({
            type: "dynamodb",
            entities: [Person],
        }).initialize()
        await connection.synchronize()
        const repository = await new PersonRepository(
            Person,
            connection.createEntityManager(),
        )
        const person1 = new Person()
        person1.id = "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451"
        person1.firstname = "John"
        person1.lastname = "Doe"
        await repository.put(person1)
        const result = await repository.get(person1.id)
        expect(result).not.to.eql(undefined)
        await repository.deleteOne({ id: person1.id })
        const result2 = await repository.get(person1)
        expect(result2).to.eql(undefined)
    })

    it("insert and delete many", async (): Promise<any> => {
        sinon.stub(PersonRepository.prototype, "put").resolves()
        sinon.stub(PersonRepository.prototype, "deleteMany").resolves()
        const getStub = sinon.stub(PersonRepository.prototype, "get")
        getStub
            .onFirstCall()
            .resolves({
                id: "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451",
                firstname: "John",
                lastname: "Doe",
            } as Person)
        getStub
            .onSecondCall()
            .resolves({
                id: "73cd2d1b-2251-47a9-b137-58c1ffca4cfd",
                firstname: "Jane",
                lastname: "Doe",
            } as Person)
        const connection = await new DataSource({
            type: "dynamodb",
            entities: [Person],
        }).initialize()
        await connection.synchronize()
        const repository = await new PersonRepository(
            Person,
            connection.createEntityManager(),
        )
        const person1 = new Person()
        person1.id = "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451"
        person1.firstname = "John"
        person1.lastname = "Doe"
        await repository.put(person1)
        const person2 = new Person()
        person2.id = "73cd2d1b-2251-47a9-b137-58c1ffca4cfd"
        person2.firstname = "Jane"
        person2.lastname = "Doe"
        await repository.put(person2)
        const result1 = await repository.get(
            "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451",
        )
        expect(result1).not.to.eql(undefined)
        const result2 = await repository.get(
            "73cd2d1b-2251-47a9-b137-58c1ffca4cfd",
        )
        expect(result2).not.to.eql(undefined)
        await repository.deleteMany([{ id: "123" }, { id: "456" }])
    })

    it("add", async (): Promise<any> => {
        sinon.stub(PersonRepository.prototype, "add").resolves()
        const connection = await new DataSource({
            type: "dynamodb",
            entities: [Person],
        }).initialize()
        await connection.synchronize()
        const repository = await new PersonRepository(
            Person,
            connection.createEntityManager(),
        )
        const options = new DynamoAddOptions()
        options.values = {
            total: 100,
        }
        options.where = {
            executionId: "123",
        }
        await repository.add(options)
    })
})
