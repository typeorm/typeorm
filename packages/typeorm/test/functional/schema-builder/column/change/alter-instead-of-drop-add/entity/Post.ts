import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    name: string

    @Column({ nullable: true })
    description: string

    @Column({ type: "int", default: 0 })
    version: number
}
