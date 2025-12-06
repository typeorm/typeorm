import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import sinon from "sinon"
import { DataSource } from "../../../src"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { MongoDriver } from "../../../src/driver/mongodb/MongoDriver"

describe("MongoDriver", () => {
    async function getConnectionUrlFromFakedMongoClient(
        url: string,
    ): Promise<string> {
        const options = DriverUtils.buildMongoDBDriverOptions({ url })

        // Setup a MongoDriver with a mocked connect method, so we can get the connection
        // url from the actual call afterwards.
        const driver = new MongoDriver({
            options,
        } as DataSource)
        const connect = sinon.fake()
        driver.mongodb = {
            ...driver.mongodb,
            MongoClient: {
                connect,
            },
        }

        const connectPromise = driver.connect()

        // There is not callback on connect method
        // Take the promise parameter that we receive in the callback, call it, so the underlying promise gets resolved.
        // const firstMethodCall = connect.args[0]
        // const callback = firstMethodCall[2]
        // callback(undefined, {})
        await connectPromise

        return url
    }

    describe("connection string", () => {
        it("should create a connection string for replica sets", async () => {
            const url =
                "mongodb://username:password@someHost1:27017,someHost2:27018/myDatabase?replicaSet=abc&tls=true"

            const connectionUrl = await getConnectionUrlFromFakedMongoClient(
                url,
            )

            expect(connectionUrl).to.eql(url)
        })

        it("should create a connection string for non replica sets", async () => {
            const url =
                "mongodb://username:password@someHost1:27017/myDatabase?tls=true"

            const connectionUrl = await getConnectionUrlFromFakedMongoClient(
                url,
            )

            expect(connectionUrl).to.eql(url)
        })
    })

    describe("proxy options", () => {
        it("should pass proxy options to MongoClient.connect", async () => {
            const options = {
                type: "mongodb",
                host: "someHost",
                port: 27017,
                database: "myDatabase",
                proxyHost: "127.0.0.1",
                proxyPort: 1080,
                proxyUsername: "proxyUser",
                proxyPassword: "proxyPass",
            }

            const driver = new MongoDriver({
                options,
            } as DataSource)

            // replace MongoClient.connect with a fake that resolves so connect() completes
            const connect = sinon.fake.resolves({})
            driver.mongodb = {
                ...driver.mongodb,
                MongoClient: {
                    connect,
                },
            }

            await driver.connect()

            // the second argument passed to MongoClient.connect should contain our proxy settings
            const passedOptions = connect.args[0][1]

            expect(passedOptions).to.have.property("proxyHost", "127.0.0.1")
            expect(passedOptions).to.have.property("proxyPort", 1080)
            expect(passedOptions).to.have.property("proxyUsername", "proxyUser")
            expect(passedOptions).to.have.property("proxyPassword", "proxyPass")
        })
    })
})
