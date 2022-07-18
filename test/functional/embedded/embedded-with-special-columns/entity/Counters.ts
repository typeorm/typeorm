import { Column } from "typeorm/decorator/columns/Column"
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"
import { Subcounters } from "./Subcounters"

export class Counters {
    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number

    @Column(() => Subcounters, { prefix: "subcnt" })
    subcounters: Subcounters

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date

    @DeleteDateColumn()
    deletedDate: Date
}
