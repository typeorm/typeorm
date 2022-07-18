import { Entity } from "typeorm/decorator/entity/Entity"
import { Index } from "typeorm/decorator/Index"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
@Index("index_name_english", ["nameEnglish"], { unique: true })
export class Customer {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    nameHebrew: string

    @Column()
    nameEnglish: string
}
