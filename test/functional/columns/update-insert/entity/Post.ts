import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column({ update: false, default: "Default" })
    authorFirstName: string

    @Column({ insert: false, default: "Default" })
    authorMiddleName: string

    @Column({ insert: false, update: false, default: "Default" })
    authorLastName: string
}
