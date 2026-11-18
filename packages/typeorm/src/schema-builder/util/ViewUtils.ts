import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { View } from "../view/View"

export class ViewUtils {
    /**
     * Checks if a view loaded from the database and the metadata of that view disagree about being materialized.
     * Only the drivers that report the flag when they load views (Postgres, Aurora Postgres and Oracle) can show a difference.
     * For the other drivers the loaded flag is not set, so no difference is reported.
     *
     * @param view the view as loaded from the database
     * @param metadata the metadata of the same view
     * @returns true when the loaded view and the metadata disagree about being materialized
     */
    static isMaterializedChanged(
        view: View,
        metadata: EntityMetadata,
    ): boolean {
        return (
            typeof view.materialized === "boolean" &&
            view.materialized !== !!metadata.tableMetadataArgs.materialized
        )
    }

    /**
     * Comparator for .sort() that will order views bases on dependencies in creation order
     *
     * @param metadataA
     * @param metadataB
     */
    static viewMetadataCmp(
        metadataA: EntityMetadata | undefined,
        metadataB: EntityMetadata | undefined,
    ): number {
        if (!metadataA || !metadataB) {
            return 0
        }
        if (
            metadataA.dependsOn &&
            (metadataA.dependsOn.has(metadataB.target) ||
                metadataA.dependsOn.has(metadataB.name))
        ) {
            return 1
        }
        if (
            metadataB.dependsOn &&
            (metadataB.dependsOn.has(metadataA.target) ||
                metadataB.dependsOn.has(metadataA.name))
        ) {
            return -1
        }
        return 0
    }
}
