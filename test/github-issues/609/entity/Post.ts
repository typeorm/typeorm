import {
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn({
        precision: null,
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createDate: Date
}
