import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { Profile } from "./Profile"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne(() => Profile, (profile) => profile.user, {
        cascade: ["insert"],
        eager: true,
    })
    profile: Profile

    constructor(name?: string) {
        if (name) {
            this.name = name
        }
    }
}
