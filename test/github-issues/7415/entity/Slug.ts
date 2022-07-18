import { PrimaryColumn } from "typeorm"

export class Slug {
    @PrimaryColumn()
    slug: string

    constructor(slug: string) {
        this.slug = slug
    }
}
