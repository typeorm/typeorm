import { expect } from "chai"
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

        // Take the promise parameter that we receive in the callback, call it, so the underlying promise gets resolved.
        const firstMethodCall = connect.args[0]
        const callback = firstMethodCall[2]
        callback(undefined, {})
        await connectPromise

        return firstMethodCall[0]
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
})
