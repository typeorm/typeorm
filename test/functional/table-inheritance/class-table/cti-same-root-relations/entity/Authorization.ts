import { Column } from "../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Authorization {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "default" })
    credentialRules: string
}
