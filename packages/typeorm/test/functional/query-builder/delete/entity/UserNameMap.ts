import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity()
export class UserNameMap {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    oldName: string

    @Column()
    newName: string
}
