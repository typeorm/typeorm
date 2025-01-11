import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity({ database: `./${(process.env.STRYKER_MUTATOR_WORKER || "0")}/subdir/relative-subdir-sqlite.attach.db` })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
