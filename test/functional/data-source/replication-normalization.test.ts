import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"

const BASE_OPTIONS: PostgresDataSourceOptions = {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    entities: [],
}

const MASTER = {
    host: "legacy-master",
    port: 5432,
    username: "test",
    password: "test",
    database: "legacy_db",
}

const PRIMARY = {
    host: "alias-primary",
    port: 5432,
    username: "test",
    password: "test",
    database: "alias_db",
}

const SLAVE = {
    host: "legacy-slave",
    port: 5432,
    username: "test",
    password: "test",
    database: "legacy_replica_db",
}

const REPLICA = {
    host: "alias-replica",
    port: 5432,
    username: "test",
    password: "test",
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
})
