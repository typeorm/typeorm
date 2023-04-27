import { Entity, ObjectIdColumn, Column, ObjectId } from "../../../../src"

export class Page {
    @Column()
    number: number
}

export class Chapter {
    @Column()
    title: string

    @Column((type) => Page)
    pages: Page[]
}

@Entity()
export class Book {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column((type) => Chapter)
    chapters: Chapter[]
}
