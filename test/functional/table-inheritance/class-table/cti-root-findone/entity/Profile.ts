import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

/**
 * Non-CTI entity used as a non-eager relation on the CTI root.
 * Mirrors Profile from the app.
 */
@Entity()
export class Profile {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ default: "" })
    displayName: string
}
