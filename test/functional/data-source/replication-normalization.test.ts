import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"

const TEST_SECRET = process.env.TYPEORM_TEST_SECRET ?? ""

const BASE_OPTIONS: PostgresDataSourceOptions = {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: TEST_SECRET,
    database: "test",
    entities: [],
}

const MASTER = {
    host: "legacy-master",
    port: 5432,
    username: "test",
    password: TEST_SECRET,
    database: "legacy_db",
}

const PRIMARY = {
    host: "alias-primary",
    port: 5432,
    username: "test",
    password: TEST_SECRET,
    database: "alias_db",
}

const SLAVE = {
    host: "legacy-slave",
    port: 5432,
    username: "test",
    password: TEST_SECRET,
    database: "legacy_replica_db",
}

const REPLICA = {
    host: "alias-replica",
    port: 5432,
    username: "test",
    password: TEST_SECRET,
    database: "alias_replica_db",
}

describe("DataSource replication option normalization", () => {
    it('should throw when "master" and "primary" are both defined with different values', () => {
        const options: PostgresDataSourceOptions = {
            ...BASE_OPTIONS,
            replication: {
                master: MASTER,
                primary: PRIMARY,
                slaves: [SLAVE],
                replicas: [SLAVE],
            },
        }

        expect(() => new DataSource(options)).to.throw(
            `Replication options cannot define both "master" and "primary" with different values.`,
        )
    })

    it('should throw when "slaves" and "replicas" are both defined with different values', () => {
        const options: PostgresDataSourceOptions = {
            ...BASE_OPTIONS,
            replication: {
                master: MASTER,
                primary: MASTER,
                slaves: [SLAVE],
                replicas: [REPLICA],
            },
        }

        expect(() => new DataSource(options)).to.throw(
            `Replication options cannot define both "slaves" and "replicas" with different values.`,
        )
    })

    it("should preserve replication endpoints when setOptions updates only defaultMode", () => {
        const dataSource = new DataSource({
            ...BASE_OPTIONS,
            replication: {
                master: MASTER,
                slaves: [SLAVE],
            },
        })

        dataSource.setOptions({
            replication: {
                defaultMode: "replica",
            },
        } as Partial<DataSourceOptions>)

        const replication = (dataSource.options as PostgresDataSourceOptions)
            .replication
        expect(replication).to.deep.equal({
            master: MASTER,
            slaves: [SLAVE],
            defaultMode: "slave",
        })
    })

    it("should preserve replicas when setOptions updates only alias primary endpoint", () => {
        const dataSource = new DataSource({
            ...BASE_OPTIONS,
            replication: {
                master: MASTER,
                slaves: [SLAVE],
            },
        })

        dataSource.setOptions({
            replication: {
                primary: PRIMARY,
            },
        } as Partial<DataSourceOptions>)

        const replication = (dataSource.options as PostgresDataSourceOptions)
            .replication
        expect(replication).to.deep.equal({
            master: PRIMARY,
            slaves: [SLAVE],
            primary: PRIMARY,
        })
    })

    it("should allow clearing replication via setOptions", () => {
        const dataSource = new DataSource({
            ...BASE_OPTIONS,
            replication: {
                master: MASTER,
                slaves: [SLAVE],
            },
        })

        dataSource.setOptions({
            replication: undefined,
        } as Partial<DataSourceOptions>)

        expect(
            (dataSource.options as PostgresDataSourceOptions).replication,
        ).to.equal(undefined)
    })
})
