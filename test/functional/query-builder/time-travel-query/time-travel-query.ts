import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    sleep,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/index"
import { Account } from "./entity/Account"
import { Person } from "./entity/Person"

describe("query builder > time-travel-query", () => {
    // -------------------------------------------------------------------------
    // Prepare
    // -------------------------------------------------------------------------

    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["cockroachdb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Reusable functions
    // -------------------------------------------------------------------------

    it("should execute time travel query without options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = await connection.getRepository(Account)
                // create account
                let account = new Account()
                account.name = "Edna Barath"
                account.balance = 100
                await repository.save(account)

                // wait for 5 seconds
                await sleep(5000)

                // update account balance
                account.balance = 200
                await repository.save(account)

                // check if balance updated
                account = await repository
                    .createQueryBuilder("account")
                    .getOneOrFail()
                account.balance.should.be.equal(200)

                // load account state on 5 seconds back
                account = await repository
                    .createQueryBuilder("account")
                    .timeTravelQuery()
                    .getOneOrFail()
                account.balance.should.be.equal(100)
            }),
        ))

    it("should execute time travel query with options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = await connection.getRepository(Account)
                // create account
                let account = new Account()
                account.name = "Edna Barath"
                account.balance = 100
                await repository.save(account)

                // wait for 2 seconds
                await sleep(2000)

                // update account balance
                account.balance = 200
                await repository.save(account)

                // load current account state
                account = await repository
                    .createQueryBuilder("account")
                    .getOneOrFail()
                account.balance.should.be.equal(200)

                // load account state on 2 seconds back
                account = await repository
                    .createQueryBuilder("account")
                    .timeTravelQuery("'-2s'")
                    .getOneOrFail()
                account.balance.should.be.equal(100)
            }),
        ))

    it("should execute time travel query with 'skip' and 'take' options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = await connection.getRepository(Account)
                // create accounts
                for (let i = 1; i < 6; i++) {
                    const account = new Account()
                    account.name = `Person_${i}`
                    account.balance = 100 * i
                    await repository.save(account)
                }

                // wait for 2 seconds
                await sleep(2000)

                let accounts = await repository
                    .createQueryBuilder("account")
                    .getMany()

                // update accounts
                for (const account of accounts) {
                    account.balance = account.balance + 100
                    await repository.save(account)
                }

                // load current accounts state
                accounts = await repository
                    .createQueryBuilder("account")
                    .skip(2)
                    .take(3)
                    .getMany()

                accounts.length.should.be.equal(3)
                accounts[0].balance.should.be.equal(400)
                accounts[1].balance.should.be.equal(500)
                accounts[2].balance.should.be.equal(600)

                // load accounts state on 2 seconds back
                accounts = await repository
                    .createQueryBuilder("account")
                    .timeTravelQuery(`'-2s'`)
                    .skip(2)
                    .take(3)
                    .getMany()

                accounts.length.should.be.equal(3)
                accounts[0].balance.should.be.equal(300)
                accounts[1].balance.should.be.equal(400)
                accounts[2].balance.should.be.equal(500)
            }),
        ))

    it("should execute time travel query with JOIN and skip/take options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const accountRepository = await connection.getRepository(
                    Account,
                )
                const personRepository = await connection.getRepository(Person)

                // create persons and accounts
                for (let i = 1; i < 6; i++) {
                    const account = new Account()
                    account.name = `Person_${i}`
                    account.balance = 100 * i
                    await accountRepository.save(account)

                    const person = new Person()
                    person.account = account
                    await personRepository.save(person)
                }

                // wait for 2 seconds
                await sleep(2000)

                const accounts = await accountRepository
                    .createQueryBuilder("account")
                    .getMany()

                // update accounts
                for (const account of accounts) {
                    account.balance = account.balance + 100
                    await accountRepository.save(account)
                }

                // load current accounts state
                let persons = await personRepository
                    .createQueryBuilder("person")
                    .innerJoinAndSelect("person.account", "account")
                    .skip(2)
                    .take(3)
                    .getMany()

                persons.length.should.be.equal(3)
                persons[0].account.balance.should.be.equal(400)
                persons[1].account.balance.should.be.equal(500)
                persons[2].account.balance.should.be.equal(600)

                // load accounts state on 2 seconds back
                persons = await personRepository
                    .createQueryBuilder("person")
                    .innerJoinAndSelect("person.account", "account")
                    .timeTravelQuery(`'-2s'`)
                    .skip(2)
                    .take(3)
                    .getMany()

                persons.length.should.be.equal(3)
                persons[0].account.balance.should.be.equal(300)
                persons[1].account.balance.should.be.equal(400)
                persons[2].account.balance.should.be.equal(500)
            }),
        ))

    it("should execute time travel query with JOIN and limit/offset options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const accountRepository = await connection.getRepository(
                    Account,
                )
                const personRepository = await connection.getRepository(Person)

                // create persons and accounts
                for (let i = 1; i < 6; i++) {
                    const account = new Account()
                    account.name = `Person_${i}`
                    account.balance = 100 * i
                    await accountRepository.save(account)

                    const person = new Person()
                    person.account = account
                    await personRepository.save(person)
                }

                // wait for 2 seconds
                await sleep(2000)

                const accounts = await accountRepository
                    .createQueryBuilder("account")
                    .getMany()

                // update accounts
                for (const account of accounts) {
                    account.balance = account.balance + 100
                    await accountRepository.save(account)
                }

                // load current accounts state
                let persons = await personRepository
                    .createQueryBuilder("person")
                    .innerJoinAndSelect("person.account", "account")
                    .offset(2)
                    .limit(3)
                    .getMany()

                persons.length.should.be.equal(3)
                persons[0].account.balance.should.be.equal(400)
                persons[1].account.balance.should.be.equal(500)
                persons[2].account.balance.should.be.equal(600)

                // load accounts state on 2 seconds back
                persons = await personRepository
                    .createQueryBuilder("person")
                    .innerJoinAndSelect("person.account", "account")
                    .timeTravelQuery(`'-2s'`)
                    .offset(2)
                    .limit(3)
                    .getMany()

                persons.length.should.be.equal(3)
                persons[0].account.balance.should.be.equal(300)
                persons[1].account.balance.should.be.equal(400)
                persons[2].account.balance.should.be.equal(500)
            }),
        ))
})
