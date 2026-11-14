import { Entity, OneToMany, PrimaryColumn } from "../../../../../../src"
import { Chapter } from "./Chapter"

@Entity()
export class Edition {
    @PrimaryColumn()
    series: string

    @PrimaryColumn()
    volume: number

    @OneToMany(() => Chapter, (chapter) => chapter.edition)
    chapters: Chapter[]
}
