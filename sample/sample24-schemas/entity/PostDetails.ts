import type { Post } from "./Post"

export interface PostDetails {
    id?: number
    metadata: string
    comment: string
    post?: Post
}
