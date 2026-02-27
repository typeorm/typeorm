import { TypeORMError } from "../../error/TypeORMError"

/**
 * Describes replication server endpoints.
 * Supports both legacy `master`/`slaves` and preferred `primary`/`replicas` names.
 */
export type ReplicationConfig<TCredentials> =
    | ({
          readonly master: TCredentials
          readonly slaves: readonly TCredentials[]
          readonly primary?: TCredentials
          readonly replicas?: readonly TCredentials[]
      } & object)
    | ({
          readonly primary: TCredentials
          readonly replicas: readonly TCredentials[]
          readonly master?: TCredentials
          readonly slaves?: readonly TCredentials[]
      } & object)

/**
 *
 * @param replication
 */
export function getReplicationPrimary<TCredentials extends object>(
    replication: ReplicationConfig<TCredentials>,
): TCredentials {
    if ("master" in replication && replication.master !== undefined) {
        if (
            typeof replication.master !== "object" ||
            replication.master === null
        ) {
            throw new TypeORMError(
                `Replication options must define either "primary" or "master".`,
            )
        }

        return replication.master as TCredentials
    }

    if ("primary" in replication && replication.primary !== undefined) {
        if (
            typeof replication.primary !== "object" ||
            replication.primary === null
        ) {
            throw new TypeORMError(
                `Replication options must define either "primary" or "master".`,
            )
        }

        return replication.primary as TCredentials
    }

    throw new TypeORMError(
        `Replication options must define either "primary" or "master".`,
    )
}

/**
 *
 * @param replication
 */
export function getReplicationReplicas<TCredentials extends object>(
    replication: ReplicationConfig<TCredentials>,
): TCredentials[] {
    const validateEndpoints = (endpoints: unknown[]): TCredentials[] => {
        if (endpoints.length === 0) {
            throw new TypeORMError(
                `Replication options must define at least one "slave" or "replica".`,
            )
        }

        for (const endpoint of endpoints) {
            if (typeof endpoint !== "object" || endpoint === null) {
                throw new TypeORMError(
                    `Replication options must define at least one "slave" or "replica".`,
                )
            }
        }

        return endpoints as TCredentials[]
    }

    if ("slaves" in replication && replication.slaves !== undefined) {
        if (!Array.isArray(replication.slaves)) {
            throw new TypeORMError(
                `Replication options must define at least one "slave" or "replica".`,
            )
        }

        return validateEndpoints(replication.slaves)
    }

    if ("replicas" in replication && replication.replicas !== undefined) {
        if (!Array.isArray(replication.replicas)) {
            throw new TypeORMError(
                `Replication options must define at least one "slave" or "replica".`,
            )
        }

        return validateEndpoints(replication.replicas)
    }

    throw new TypeORMError(
        `Replication options must define at least one "slave" or "replica".`,
    )
}
