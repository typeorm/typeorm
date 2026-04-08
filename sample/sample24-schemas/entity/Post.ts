import type { Image } from "./Image"
import type { Category } from "./Category"
import type { PostDetails } from "./PostDetails"

export interface Post {
    id?: number
    title: string
    text: string
    details?: PostDetails
    images?: Image[]
    secondaryImages?: Image[]
    categories?: Category[]
}
