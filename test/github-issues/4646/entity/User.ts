import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Photo } from "./Photo"

@Entity({
    versioning: {
        columnFrom: "row_start",
        columnTo: "row_end",
        historyTable: "user_history",
    },
})
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Photo, (photo) => photo.user)
    photos: Photo[]
}
