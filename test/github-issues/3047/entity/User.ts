import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Index } from "typeorm/decorator/Index"
@Entity()
@Index("unique_idx", ["first_name", "last_name"], { unique: true })
export class User {
    @PrimaryGeneratedColumn()
    id: number
    @Column({ length: 100 })
    first_name: string
    @Column({ length: 100 })
    last_name: string
    @Column({ length: 100 })
    is_updated: string
}
