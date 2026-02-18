import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Unique } from "../../../../src"
@Entity()
@Unique("unique_first_name", ["first_name"])
@Unique("unique_name_pair", ["first_name", "last_name"])
export class User {
    @PrimaryGeneratedColumn()
    id: number
    @Column({ length: 100 })
    first_name: string
    @Column({ length: 100 })
    last_name: string
    @Column({ length: 100 })
    is_updated: string
}
