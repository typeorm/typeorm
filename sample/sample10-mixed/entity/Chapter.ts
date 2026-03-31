import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { PostDetails } from "./PostDetails"

@Entity("sample10_chapter")
export class Chapter {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    about: string

    @OneToMany(() => PostDetails, (postDetails) => postDetails.chapter)
    postDetails: PostDetails[]
}
