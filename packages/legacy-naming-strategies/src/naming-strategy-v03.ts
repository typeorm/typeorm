import { DefaultNamingStrategy } from "typeorm"
import { hash } from "typeorm/util/StringUtils"

export class NamingStrategyV03 extends DefaultNamingStrategy {
    protected hash(input: string): string {
        // maintain compatibility with previous versions of TypeORM, which used
        // to encode input before hashing, as a way to convert utf-16 to utf-8
        return hash(encodeURIComponent(input))
    }
}
