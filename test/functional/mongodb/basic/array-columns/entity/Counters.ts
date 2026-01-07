import { Column } from "../../../../../../src/decorator/columns/Column"
import { Color } from "./Color"

export class Counters {
    @Column()
    likes: number

    @Column()
    text: string

    @Column((type) => Color)
    color: Color

    constructor(likes: number, text: string, color: Color) {
        this.likes = likes
        this.text = text
        this.color = color
    }
}
