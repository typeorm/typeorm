import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { User } from "./User"
import { Column } from "typeorm/decorator/columns/Column"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt: Date

    @ManyToOne((type) => User, (user) => user.manyPhotos)
    user: User

    constructor(name: string) {
        this.name = name
    }
}
