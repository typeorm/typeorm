import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { User } from "./User"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        rawFilterCondition(alias) {
            return `${alias} != true`
        },
    })
    isHidden: boolean

    @ManyToOne(() => User, {
        filterConditionCascade: true,
    })
    author: User
}
