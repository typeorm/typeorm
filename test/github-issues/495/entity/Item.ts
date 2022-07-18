import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { User } from "./User"

@Entity()
@Index("table_index_userId_mid", (post: Item) => [post.userId, post.mid])
export class Item {
    @PrimaryGeneratedColumn()
    postId: number

    @OneToOne((type) => User, (users) => users.userId)
    @JoinColumn({ name: "userId" })
    userData: User

    @Column()
    userId: number

    @Column()
    mid: number
}
