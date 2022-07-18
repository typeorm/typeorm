import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { User } from "./User"

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    about: string

    @OneToOne((type) => User, (user) => user.profile, { eager: true })
    user: User
}
