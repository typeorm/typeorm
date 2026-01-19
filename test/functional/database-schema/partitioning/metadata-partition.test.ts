import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Measurement } from "./entity/Measurement"
import { Order } from "./entity/Order"
import { User } from "./entity/User"
import { Sale } from "./entity/Sale"
import { Product } from "./entity/Product"

// GitHub Issue #9620: Enable creation of Partitioned Tables in Postgres
describe("database schema > partitioning > metadata flow", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Measurement, Order, User, Sale, Product],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(connections))

    it("should flow partition config from decorator to EntityMetadata for RANGE", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Measurement)

                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("RANGE")
                expect(metadata.partition?.columns).to.deep.equal(["logdate"])
                expect(metadata.partition?.expression).to.be.undefined
                expect(metadata.partition?.partitions).to.be.undefined
            }),
        ))

    it("should flow partition config from decorator to EntityMetadata for LIST", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Order)

                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("LIST")
                expect(metadata.partition?.columns).to.deep.equal(["region"])
            }),
        ))

    it("should flow partition config from decorator to EntityMetadata for HASH", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(User)

                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("HASH")
                expect(metadata.partition?.columns).to.deep.equal(["user_id"])
            }),
        ))

    it("should flow partition config with expression to EntityMetadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Sale)

                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("RANGE")
                expect(metadata.partition?.expression).to.equal(
                    "YEAR(sale_date)",
                )
                expect(metadata.partition?.columns).to.be.undefined
                expect(metadata.partition?.partitions).to.have.lengthOf(2)
            }),
        ))

    it("should flow partition config with inline partitions to EntityMetadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Product)

                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("LIST")
                expect(metadata.partition?.columns).to.deep.equal(["category"])
                expect(metadata.partition?.partitions).to.have.lengthOf(2)
                expect(metadata.partition?.partitions?.[0].name).to.equal(
                    "p_electronics",
                )
                expect(
                    metadata.partition?.partitions?.[0].values,
                ).to.deep.equal(["electronics", "computers"])
            }),
        ))

    it("should have partition configuration in EntityMetadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Measurement)

                // Verify the metadata has partition configuration
                expect(metadata.partition).to.exist
                expect(metadata.partition?.type).to.equal("RANGE")
                expect(metadata.partition?.columns).to.deep.equal(["logdate"])
                expect(metadata.tableName).to.equal("measurement")
            }),
        ))

    it("should include tableName in partition metadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Measurement)

                expect(metadata.tableName).to.equal("measurement")
                expect(metadata.partition).to.exist
            }),
        ))

    it("should handle multiple entities with different partition types", () =>
        Promise.all(
            connections.map(async (connection) => {
                const measurementMeta = connection.getMetadata(Measurement)
                const orderMeta = connection.getMetadata(Order)
                const userMeta = connection.getMetadata(User)

                expect(measurementMeta.partition?.type).to.equal("RANGE")
                expect(orderMeta.partition?.type).to.equal("LIST")
                expect(userMeta.partition?.type).to.equal("HASH")
            }),
        ))

    it("should verify partition columns exist in entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Measurement)

                const partitionColumn = metadata.columns.find(
                    (col) => col.propertyName === "logdate",
                )
                expect(partitionColumn).to.exist
                expect(partitionColumn?.propertyName).to.equal("logdate")

                // Verify partition column is in primary key (PostgreSQL requirement)
                const isPrimary = metadata.primaryColumns.some(
                    (col) => col.propertyName === "logdate",
                )
                expect(isPrimary).to.be.true
            }),
        ))

    it("should verify LIST partition columns exist in entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Order)

                const partitionColumn = metadata.columns.find(
                    (col) => col.propertyName === "region",
                )
                expect(partitionColumn).to.exist

                // Verify partition column is in primary key
                const isPrimary = metadata.primaryColumns.some(
                    (col) => col.propertyName === "region",
                )
                expect(isPrimary).to.be.true
            }),
        ))

    it("should verify HASH partition columns exist in entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(User)

                const partitionColumn = metadata.columns.find(
                    (col) => col.propertyName === "user_id",
                )
                expect(partitionColumn).to.exist

                // user_id is the only primary key column
                expect(metadata.primaryColumns).to.have.lengthOf(1)
                expect(metadata.primaryColumns[0].propertyName).to.equal(
                    "user_id",
                )
            }),
        ))

    it("should preserve partition config across metadata builder", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Get metadata multiple times to ensure consistency
                const meta1 = connection.getMetadata(Measurement)
                const meta2 = connection.getMetadata(Measurement)

                expect(meta1.partition).to.deep.equal(meta2.partition)
            }),
        ))
})
