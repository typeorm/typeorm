import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string

    @Column()
    uri: string

    @Column()
    userId: number

    @ManyToOne((type) => User, (user) => user.photos)
    user: User
}
