import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { WrappedString, wrappedStringTransformer } from "../wrapped-string"

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: String, transformer: wrappedStringTransformer })
    value: WrappedString
}
