import { EntitySchemaOptions } from "../../../../src/entity-schema/EntitySchemaOptions";
import { Post } from "./Post";
export declare class Author {
    id: number;
    name: string;
    posts: Post[];
}
export declare const AuthorSchema: EntitySchemaOptions<Author>;
