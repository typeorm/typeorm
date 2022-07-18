import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("timestamp", {
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
        onUpdate: "CURRENT_TIMESTAMP(3)",
    })
    updateAt: Date
}
