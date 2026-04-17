import { Column } from "typeorm"

class Post {
    @Column({ readonly: true })
    authorName: string

    @Column({ readonly: false })
    updatedAt: Date
}

// Should NOT be transformed — not a @Column decorator
const field = { readonly: true, name: "author" }
const setting = { readonly: false, value: 42 }
