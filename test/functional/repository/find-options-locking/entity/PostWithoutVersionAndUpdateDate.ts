import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("post_without_v_ud")
export class PostWithoutVersionAndUpdateDate {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
