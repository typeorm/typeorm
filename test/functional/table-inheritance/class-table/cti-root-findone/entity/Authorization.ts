import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

/**
 * Non-CTI entity used as an eager relation on the CTI root.
 * Mirrors AuthorizationPolicy from the app.
 */
@Entity()
export class Authorization {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ default: "" })
    credentialRules: string
}
