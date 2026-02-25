import { expect } from "chai"
import {
    getReplicationPrimary,
    getReplicationReplicas,
    ReplicationConfig,
} from "../../../src/driver/types/ReplicationConfig"

type Credentials = { host: string }

describe("ReplicationConfig helpers", () => {
    it("should prefer legacy primary endpoint when both endpoint styles are present", () => {
        const replication: ReplicationConfig<Credentials> = {
            master: { host: "legacy-master" },
            slaves: [{ host: "legacy-slave" }],
            primary: { host: "alias-primary" },
            replicas: [{ host: "alias-replica" }],
        }

        expect(getReplicationPrimary(replication)).to.eql({
            host: "legacy-master",
        })
        expect(getReplicationReplicas(replication)).to.eql([
            { host: "legacy-slave" },
        ])
    })

    it("should support alias-only replication endpoints", () => {
        const replication: ReplicationConfig<Credentials> = {
            primary: { host: "alias-primary" },
            replicas: [{ host: "alias-replica" }],
        }

        expect(getReplicationPrimary(replication)).to.eql({
            host: "alias-primary",
        })
        expect(getReplicationReplicas(replication)).to.eql([
            { host: "alias-replica" },
        ])
    })

    it("should throw when replicas list is empty", () => {
        const replication: ReplicationConfig<Credentials> = {
            primary: { host: "alias-primary" },
            replicas: [],
        }

        expect(() => getReplicationReplicas(replication)).to.throw(
            `Replication options must define at least one "slave" or "replica".`,
        )
    })

    it("should throw when slaves is present but empty even if replicas has entries", () => {
        const replication: ReplicationConfig<Credentials> = {
            master: { host: "legacy-master" },
            slaves: [],
            replicas: [{ host: "alias-replica" }],
        }

        expect(() => getReplicationReplicas(replication)).to.throw(
            `Replication options must define at least one "slave" or "replica".`,
        )
    })

    it("should throw when neither replicas nor slaves is provided", () => {
        const invalidReplication = {
            master: { host: "legacy-master" },
        } as unknown as ReplicationConfig<Credentials>

        expect(() => getReplicationReplicas(invalidReplication)).to.throw(
            `Replication options must define at least one "slave" or "replica".`,
        )
    })

    it("should throw when primary endpoint is not an object", () => {
        const invalidReplication = {
            primary: "not-an-object",
            replicas: [{ host: "alias-replica" }],
        } as unknown as ReplicationConfig<Credentials>

        expect(() => getReplicationPrimary(invalidReplication)).to.throw(
            `Replication options must define either "primary" or "master".`,
        )
    })

    it("should throw when replicas endpoint is not an array", () => {
        const invalidReplication = {
            primary: { host: "alias-primary" },
            replicas: { host: "not-an-array" },
        } as unknown as ReplicationConfig<Credentials>

        expect(() => getReplicationReplicas(invalidReplication)).to.throw(
            `Replication options must define at least one "slave" or "replica".`,
        )
    })
})
