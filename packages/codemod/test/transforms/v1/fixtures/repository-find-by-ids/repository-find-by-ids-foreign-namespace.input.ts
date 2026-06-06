import * as typeorm from "typeorm"
import * as other from "some-other-lib"

declare class User {}

// `typeorm.Repository<User>` must be classified as a TypeORM receiver —
// `load` should have its `.findByIds` rewritten.
async function load(typeormRepo: typeorm.Repository<User>) {
    return typeormRepo.findByIds([1, 2, 3])
}

// `other.Repository<User>` has the same rightmost name but belongs to an
// unrelated namespace. The classifier must reject it so `otherRepo.findByIds`
// stays intact.
async function unrelated(otherRepo: other.Repository<User>) {
    return otherRepo.findByIds([4, 5, 6])
}
