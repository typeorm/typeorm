import { Connection } from "typeorm"
import { CteCapabilities } from "typeorm/driver/types/CteCapabilities"

export function filterByCteCapabilities(
    capability: keyof CteCapabilities,
    equalsTo: boolean = true,
): (conn: Connection) => boolean {
    return (conn) => conn.driver.cteCapabilities[capability] === equalsTo
}
