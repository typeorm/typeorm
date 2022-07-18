import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"

@Entity()
export class PostWithUpdateDate {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @UpdateDateColumn()
    updateDate: Date
}
