import "reflect-metadata"
import { DataSource } from "../../src/index"
import { LibsqlConnectionOptions } from "../../src/driver/libsql/LibsqlConnectionOptions"
import { Post } from "./entity/Post"

// Test remote LibSQL configuration (won't actually connect without valid credentials)
async function testRemoteConfig() {
    console.log("Testing remote LibSQL configuration...")

    const remoteDataSource = new DataSource({
        type: "libsql",
        url: "https://example.turso.io",
        authToken: "dummy-token",
        entities: [Post],
        synchronize: false,
        logging: false,
    })

    const options = remoteDataSource.options as LibsqlConnectionOptions
    console.log(
        "Remote LibSQL driver created successfully:",
        remoteDataSource.driver.constructor.name,
    )
    console.log("Remote options:", {
        type: options.type,
        url: options.url,
        authToken: options.authToken ? "[REDACTED]" : undefined,
    })
}

// Test embedded replica configuration
async function testReplicaConfig() {
    console.log("\nTesting embedded replica LibSQL configuration...")

    const replicaDataSource = new DataSource({
        type: "libsql",
        url: "file:replica.db",
        syncUrl: "https://example.turso.io",
        authToken: "dummy-token",
        syncPeriod: 30,
        readYourWrites: true,
        entities: [Post],
        synchronize: false,
        logging: false,
    })

    const options = replicaDataSource.options as LibsqlConnectionOptions
    console.log(
        "Replica LibSQL driver created successfully:",
        replicaDataSource.driver.constructor.name,
    )
    console.log("Replica options:", {
        type: options.type,
        url: options.url,
        syncUrl: options.syncUrl,
        syncPeriod: options.syncPeriod,
        readYourWrites: options.readYourWrites,
        authToken: options.authToken ? "[REDACTED]" : undefined,
    })
}

async function main() {
    try {
        await testRemoteConfig()
        await testReplicaConfig()
        console.log("\n✅ All LibSQL configuration tests passed!")
    } catch (error) {
        console.error("Configuration test failed:", error)
    }
}

void main()
