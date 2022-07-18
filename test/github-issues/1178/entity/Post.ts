import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"
import { User } from "./User"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => User)
    user: User
}
