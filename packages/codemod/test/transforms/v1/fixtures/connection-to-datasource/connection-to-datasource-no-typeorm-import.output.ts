// Pinned: this transform must NOT touch `Connection` / `DataSource`
// identifiers in a file that doesn't import from `typeorm`. Those names
// belong to other libraries (e.g. mongoose `Connection`, generic data-source
// abstractions) and renaming their methods would break unrelated code.
import { Connection } from "mongoose"
import { DataSource } from "./local-data-source"

export async function openMongo(): Promise<void> {
    const conn = new Connection()
    await conn.connect()
    if (conn.isConnected) {
        await conn.close()
    }
}

export function ping(ds: DataSource): void {
    if (ds.isConnected) {
        void ds.connect()
    }
}
