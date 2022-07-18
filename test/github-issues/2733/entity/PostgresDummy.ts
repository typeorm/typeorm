import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true, default: () => "NOW()" })
    UploadDate: string
}
