import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { User } from "./User"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => User, (user) => user.manyPhotos)
    user: User

    constructor(name: string) {
        this.name = name
    }
}
