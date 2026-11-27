import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { AfterLoad } from "../../../../../src/decorator/listeners/AfterLoad"

/**
 * Carries an @AfterLoad listener, which streamEntities() rejects unless
 * listeners are disabled: the broadcast happens while the stream is paused.
 */
@Entity()
export class Audited {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    loadedAt: number

    @AfterLoad()
    stampLoadedAt() {
        this.loadedAt = 1
    }
}
