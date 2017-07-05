import {QueryRunner} from "./QueryRunner";
import {Driver} from "../driver/Driver";

/**
 * Represents functionality to provide a new query runners, and release old ones.
 * Also can provide always same query runner.
 *
 * todo: rename to QueryExecutor ?
 */
export class QueryRunnerProvider {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    protected reusableQueryRunner: QueryRunner;

    protected reusableQueryRunnerPromise: Promise<QueryRunner>;

    /**
     * Indicates if this entity manager is released.
     * Entity manager can be released only if custom queryRunnerProvider is provided.
     * Once entity manager is released, its repositories and some other methods can't be used anymore.
     */
    protected _isReleased: boolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected driver: Driver,
                protected useSingleQueryRunner: boolean = false) {
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get isReleased() {
        return this._isReleased;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Provides a new query runner used to run repository queries.
     * If use useSingleQueryRunner mode is enabled then reusable query runner will be provided instead.
     */
    // provide(): Promise<QueryRunner> {
        // if (this.useSingleQueryRunner) {
        //     if (!this.reusableQueryRunner) {
        //         if (!this.reusableQueryRunnerPromise) {
        //             // we do this because this method can be created multiple times
        //             // this will lead to multiple query runner creations
        //             this.reusableQueryRunnerPromise = this.driver
        //                 .createQueryRunner()
        //                 .then(reusableQueryRunner => {
        //                     this.reusableQueryRunner = reusableQueryRunner;
        //                     return reusableQueryRunner;
        //                 });
        //         }
        //         return this.reusableQueryRunnerPromise;
        //     }
        //     return Promise.resolve(this.reusableQueryRunner);
        // }
        // return this.driver.createQueryRunner();
    // }

    /**
     * Releases reused query runner.
     */
    async releaseReused(): Promise<void> {
        this._isReleased = true;
        if (this.reusableQueryRunner)
            return this.reusableQueryRunner.release();
    }

}