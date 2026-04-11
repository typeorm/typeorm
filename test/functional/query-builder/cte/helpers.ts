import type { DataSource } from "../../../../src"
import type { CteCapabilities } from "../../../../src/driver/types/CteCapabilities"

export function filterByCteCapabilities(
    capability: keyof CteCapabilities,
    equalsTo: boolean = true,
): (dataSource: DataSource) => boolean {
    return (dataSource: DataSource) =>
        dataSource.driver.cteCapabilities[capability] === equalsTo
}
