import { Entity } from "../typeorm/decorator/entity/Entity"
import { User } from "./User"
import { Photo } from "./Photo"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../typeorm/decorator/relations/JoinColumn"
import { PrimaryColumn } from "../typeorm"

@Entity()
export class Profile {
    @PrimaryColumn()
    id: number

    @OneToOne((type) => User, (user) => user.profile, {
        nullable: false,
    })
    @JoinColumn()
    user: User

    @OneToOne((type) => Photo, {
        nullable: false,
        cascade: ["insert"],
    })
    @JoinColumn()
    photo: Photo
}
