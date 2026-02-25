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
    if ("primary" in replication && replication.primary) {
        return replication.primary as TCredentials
    }

    if ("master" in replication && replication.master) {
        return replication.master as TCredentials
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
    if ("replicas" in replication && replication.replicas) {
        return Array.from(replication.replicas) as TCredentials[]
    }

    if ("slaves" in replication && replication.slaves) {
        return Array.from(replication.slaves) as TCredentials[]
    }

    return []
}
