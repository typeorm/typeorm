import { Column } from "../typeorm"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "My photo" })
    name: string
}
