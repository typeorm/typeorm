import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

export class Subcounters {
    @PrimaryColumn()
    version: number

    @Column()
    watches: number
}
