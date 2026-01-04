import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { ManyToMany } from "../../../../../../src/decorator/relations/ManyToMany"
import { Photo } from "./Photo"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { JoinTable } from "../../../../../../src/decorator/relations/JoinTable"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../../src/decorator/columns/DeleteDateColumn"

@Entity()
export class User {
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
}
