import { Shim } from "../shim"
import { Photo } from "./Photo"

// NOTE: The relations in here make no sense, we just care for the types.
// In real applications, this would of course not work!

@Shim.Entity()
export class User {
    @Shim.PrimaryGeneratedColumn()
    id: number

    @Shim.Column()
    name: string

    @Shim.Column()
    someDate: Date

    @Shim.OneToOne(() => Photo)
    @Shim.JoinColumn()
    oneToOnePhoto: Photo

    @Shim.OneToMany(() => Photo, (photo: Photo) => photo.user)
    oneToManyPhotos: Photo[]

    @Shim.ManyToOne(() => Photo)
    @Shim.JoinColumn()
    manyToOnePhoto: Photo

    @Shim.ManyToMany(() => Photo)
    @Shim.JoinColumn()
    manyToManyPhotos: Photo[]

    @Shim.TreeParent()
    treeParentPhoto: Photo
}
