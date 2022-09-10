import { DynamoPagingAndSortingRepository } from "../../../../../src"
import { Person } from "../entities/Person"

export class PersonRepository extends DynamoPagingAndSortingRepository<Person> {}
