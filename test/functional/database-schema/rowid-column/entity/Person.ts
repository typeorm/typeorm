import { Generated } from "typeorm"
import { PrimaryColumn } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"
import { Column } from "typeorm"

@Entity()
export class Person {
    @PrimaryGeneratedColumn("rowid")
    id: string

    @PrimaryColumn()
    @Generated("rowid")
    id2: string

    @PrimaryColumn({ generated: "rowid" })
    id3: string

    @Column({ generated: "rowid" })
    id4: string
}
