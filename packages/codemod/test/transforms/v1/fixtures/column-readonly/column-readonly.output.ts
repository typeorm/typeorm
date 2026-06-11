import { Column } from "typeorm"
import { Column as ORMColumn } from "typeorm"

declare const isReadonly: boolean
declare const flag: boolean

class Post {
    @Column({ update: false })
    authorName: string

    @Column({ update: true })
    updatedAt: Date

    // Non-literal value — must be negated, not just renamed
    @Column({ update: !isReadonly })
    title: string

    // Existing `!<expr>` — the NOT should be stripped rather than doubled
    @Column({ update: flag })
    body: string

    // Aliased import — `@ORMColumn` must also be rewritten
    @ORMColumn({ update: false })
    slug: string
}

// Should NOT be transformed — not a @Column decorator
const field = { readonly: true, name: "author" }
const setting = { readonly: false, value: 42 }
