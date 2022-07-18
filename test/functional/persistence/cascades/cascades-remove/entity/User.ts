import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { Photo } from "./Photo"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"
import { Column } from "../typeorm/decorator/columns/Column"

@Entity()
export class User {
    // todo: check one-to-one relation as well, but in another model or test

    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Photo, (photo) => photo.user, { cascade: true })
    manyPhotos: Photo[]

    @ManyToMany((type) => Photo, { cascade: true })
    @JoinTable()
    manyToManyPhotos: Photo[]
}
