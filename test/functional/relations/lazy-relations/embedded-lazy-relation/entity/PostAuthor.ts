import { Column } from "../../../../../../src/decorator/columns/Column"
import { Author } from "./Author"

export class PostAuthor {
    @Column(() => Author)
    author: Author
}
