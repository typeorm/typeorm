import { Entity, OneToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { MainEntity } from "./MainEntity"

@Entity()
export class OptionA {
    @PrimaryGeneratedColumn("increment")
    id: number

    @OneToOne(() => MainEntity, (m) => m.optionA, { lazy: true })
    main: Promise<MainEntity | null>
}
