import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { User } from "./User"

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    bio: string

    @Column({ nullable: true })
    userId: number

    @OneToOne(() => User, (user) => user.profile, {
        orphanedRowAction: "delete",
    })
    @JoinColumn({ name: "userId" })
    user: User

    constructor(bio?: string) {
        if (bio) {
            this.bio = bio
        }
    }
}
