import { Entity, OneToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { MainEntity } from "./MainEntity"

@Entity()
export class OptionB {
    @PrimaryGeneratedColumn("increment")
    id: number

    @OneToOne(() => MainEntity, (m) => m.optionB, { lazy: true })
    main: Promise<MainEntity | null>
}
