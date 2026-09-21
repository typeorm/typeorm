import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { User } from "./User"
import { Column } from "../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { BaseEntity } from "../../../../../src/repository/BaseEntity"

@Entity()
export class Photo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt: Date

    @ManyToOne(() => User, (user) => user.manyPhotos)
    user: User
}
