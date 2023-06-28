import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { User } from "./User"

@Entity({ versioning: true })
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, (user) => user.photos)
    user: User
}
