import { Entity, ObjectIdColumn, Column, ObjectId } from "../../../../src"

export class Page {
    @Column()
    number: number
}

export class Chapter {
    @Column()
    title: string

    @Column(() => Page)
    pages: Page[]
}

@Entity()
export class Book {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column(() => Chapter)
    chapters: Chapter[]
}
