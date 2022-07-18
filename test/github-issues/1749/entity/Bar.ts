import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm"

@Entity("bar", { schema: "foo" })
export class Bar {
    @PrimaryGeneratedColumn()
    id: string
}
