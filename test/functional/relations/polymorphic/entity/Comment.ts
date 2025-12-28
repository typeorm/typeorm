import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../../src"
import { Article } from "./Article"
import { Video } from "./Video"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    targetId: number

    @Column()
    targetType: string

    @ManyToOne(() => Article, {
        polymorphic: {
            idColumnName: "targetId",
            entityColumnName: "targetType",
            value: "articles",
        },
        createForeignKeyConstraints: false,
        nullable: true,
    })
    article?: Article

    @ManyToOne(() => Video, {
        polymorphic: {
            idColumnName: "targetId",
            entityColumnName: "targetType",
            value: "videos",
        },
        createForeignKeyConstraints: false,
        nullable: true,
    })
    video?: Video
}
