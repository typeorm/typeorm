import { AbstractRepository } from "../../../src/repository/AbstractRepository";
import { Author } from "../entity/Author";
/**
 * First type of custom repository - extends abstract repository.
 */
export declare class AuthorRepository extends AbstractRepository<Author> {
    createAndSave(firstName: string, lastName: string): Promise<Author>;
    findMyAuthor(): Promise<Author | undefined>;
}
