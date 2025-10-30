import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { User } from "./user"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @Column()
    ownerId: number

    @ManyToOne(() => User, (user) => user.items)
    owner: User
}
