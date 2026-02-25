export type LegacyReplicationMode = "master" | "slave"

export type ReplicationMode = LegacyReplicationMode | "primary" | "replica"

/**
 *
 * @param mode
 */
export function normalizeReplicationMode(
    mode: ReplicationMode,
): LegacyReplicationMode {
    if (mode === "primary") return "master"
    if (mode === "replica") return "slave"

    return mode
}
