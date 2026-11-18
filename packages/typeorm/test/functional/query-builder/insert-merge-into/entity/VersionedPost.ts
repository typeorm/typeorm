import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { VersionColumn } from "../../../../../src/decorator/columns/VersionColumn"

@Entity()
export class VersionedPost {
    @PrimaryColumn()
    id: string

    @Column()
    title: string

    @VersionColumn()
    version: number
}
