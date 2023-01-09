import {
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../src"
import { User } from "./user"
import { Tag } from "./tag"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, (user) => user.photos)
    user: User

    @OneToMany((_type) => Tag, (tag) => tag.photo)
    tags: Tag[]

    @VirtualColumn({
        query: (alias) =>
            /*sql*/ `SELECT COUNT(1) FROM "tag" WHERE "photoId" = ${alias}.id`,
    })
    tagCount: number
}
