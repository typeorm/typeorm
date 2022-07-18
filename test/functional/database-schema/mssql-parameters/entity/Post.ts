import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    category: string

    @Column()
    text: string

    @CreateDateColumn()
    createDate: Date

    @UpdateDateColumn()
    updateDate: Date
}
