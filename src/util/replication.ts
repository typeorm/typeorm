import { ReplicationMode } from "../driver/types/ReplicationMode"

/**
 * Maps new replication terminology to legacy internal values.
 * @param mode
 * @deprecated Will be removed when legacy terminology is dropped.
 */
export function normalizeReplicationMode(
    mode: ReplicationMode,
): "master" | "slave" {
    if (mode === "primary") return "master"
    if (mode === "replica") return "slave"
    return mode
}

let _replicationModeDeprecationWarned = false
/**
 *
 */
export function warnReplicationModeDeprecation(): void {
    if (!_replicationModeDeprecationWarned) {
        _replicationModeDeprecationWarned = true
        process.emitWarning(
            'TypeORM: "master"/"slave" replication terminology is deprecated and will be removed in a future major version. ' +
                'Use "primary"/"replica" instead.',
            { type: "DeprecationWarning" },
        )
    }
}

let _replicationConfigDeprecationWarned = false
/**
 *
 */
export function warnReplicationConfigDeprecation(): void {
    if (!_replicationConfigDeprecationWarned) {
        _replicationConfigDeprecationWarned = true
        process.emitWarning(
            'TypeORM: "master"/"slaves" replication config keys are deprecated and will be removed in a future major version. ' +
                'Use "primary"/"replicas" instead.',
            { type: "DeprecationWarning" },
        )
    }
}
