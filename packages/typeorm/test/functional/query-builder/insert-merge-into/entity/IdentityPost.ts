import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Unique } from "../../../../../src/decorator/Unique"
import { Entity } from "../../../../../src/decorator/entity/Entity"

@Entity()
@Unique(["email"])
export class IdentityPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    email: string
}
