/**
 * Used to declare a class as a custom repository.
 * Custom repository can manage some specific entity or just be generic.
 * Custom repository optionally can extend AbstractRepository, Repository or TreeRepository.
 */
export declare function EntityRepository(entity?: Function): Function;
