import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 100, nullable: true, default: null })
    first: string

    @Column({
        type: "varchar",
        length: 100,
        nullable: true,
        default: () => "null",
    })
    second: string
}
