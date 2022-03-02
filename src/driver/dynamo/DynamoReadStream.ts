import { Stream } from "stream";
import { ScanOptions } from "./models/ScanOptions";
import { DynamoRepository } from "../../repository/DynamoRepository";

export class DynamoReadStream<Entity> extends Stream.Readable {
    repository: DynamoRepository<Entity>;
    options: ScanOptions;

    constructor (repository: DynamoRepository<Entity>, options: ScanOptions) {
        super();
        this.repository = repository;
        this.options = options;
    }

    _read () {
        this.repository.scan(this.options).then((items: any) => {
            if (items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    this.push(item);
                }

                if (items.LastEvaluatedKey) {
                    this.options.exclusiveStartKey = items.LastEvaluatedKey;
                } else {
                    this.push(null);
                }
            } else {
                this.push(null);
            }
        }).catch((error: any) => {
            console.error(error);
            throw new Error("failed to stream dynamodb results");
        });
    }
}
