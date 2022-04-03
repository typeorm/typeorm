import { File } from "./File"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    fileId: string

    @OneToOne(() => File, {
        cascade: true,
        nullable: true,
        orphanedRowAction: "delete",
    })
    @JoinColumn({ name: "fileId" })
    file: File
}
