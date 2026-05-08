import { Column } from "typeorm"

// Two-arg decorator form: type string as first positional arg, options object
// as second arg. `readonly` was renamed to `update` (negated) in v1 — the
// rewrite must fire on the options object regardless of positional type.
class Post {
    @Column("varchar", { update: false })
    authorName: string

    @Column("timestamp", { update: true, nullable: true })
    updatedAt: Date
}
