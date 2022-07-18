import { Column } from "typeorm/decorator/columns/Column"

export class Subcounters {
    @Column()
    version: number

    @Column()
    watches: number
}
