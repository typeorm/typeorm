import { Column } from "../../../../../../src"

export class Color {
    @Column()
    name: string

    constructor(name: string) {
        this.name = name
    }
}
