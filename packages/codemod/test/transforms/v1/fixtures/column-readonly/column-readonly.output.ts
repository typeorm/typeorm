import { Column } from "typeorm"

class Post {
    @Column({ update: false })
    authorName: string

    @Column({ update: true })
    updatedAt: Date
}

// Should NOT be transformed — not a @Column decorator
const field = { readonly: true, name: "author" }
const setting = { readonly: false, value: 42 }
