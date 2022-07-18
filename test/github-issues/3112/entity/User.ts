import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 100, nullable: true, default: null })
    first: string

    @Column({
        length: 100,
        nullable: true,
        default: () => "null",
    })
    second: string
}
