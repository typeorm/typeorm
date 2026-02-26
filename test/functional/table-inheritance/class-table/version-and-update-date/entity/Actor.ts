import { Column } from "../../../../../../src/decorator/columns/Column"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { VersionColumn } from "../../../../../../src/decorator/columns/VersionColumn"
import { UpdateDateColumn } from "../../../../../../src/decorator/columns/UpdateDateColumn"

@Entity()
@TableInheritance({ pattern: "CTI", column: { name: "type", type: String } })
export class Actor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @VersionColumn()
    version: number

    @UpdateDateColumn()
    updateDate: Date
}
