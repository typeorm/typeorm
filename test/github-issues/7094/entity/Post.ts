import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { CreateDateColumn } from "../../../../src/decorator/columns/CreateDateColumn"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @CreateDateColumn()
    createdAt?: Date
}
