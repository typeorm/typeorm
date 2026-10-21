import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { ManyToMany } from "../../../../../src/decorator/relations/ManyToMany"
import { Photo } from "./Photo"
import { Tag } from "./Tag"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { JoinTable } from "../../../../../src/decorator/relations/JoinTable"
import { Column } from "../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { BaseEntity } from "../../../../../src/repository/BaseEntity"

@Entity()
export class User extends BaseEntity {
    // todo: check one-to-one relation as well, but in another model or test

    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt: Date

    @OneToMany(() => Photo, (photo) => photo.user, { cascade: true })
    manyPhotos: Photo[]

    @ManyToMany(() => Photo, { cascade: true })
    @JoinTable()
    manyToManyPhotos: Photo[]

    @ManyToMany(() => Tag, { cascade: ["insert"] })
    @JoinTable()
    tags: Tag[]
}
