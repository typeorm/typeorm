import { Column } from "typeorm/decorator/columns/Column"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"

export class Subcounters {
    @VersionColumn()
    version: number

    @Column()
    watches: number
}
