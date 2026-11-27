import { Column } from "../../../../../src/decorator/columns/Column"
import { Information } from "./Information"

export class Counters {
    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number

    @Column(() => Information, { prefix: "info" })
    information: Information

    @Column(() => Information, { prefix: "testData" })
    data: Information

    @Column(() => Information, { prefix: "" })
    dataWithoutPrefix: Information
}
