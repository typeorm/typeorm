import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { PostDetails } from "./PostDetails"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => PostDetails)
    @JoinColumn()
    details: PostDetails

    @Column()
    title: string
}
