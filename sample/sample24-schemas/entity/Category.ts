import type { Post } from "./Post"

export interface Category {
    id?: number
    description: string
    posts?: Post[]
}
