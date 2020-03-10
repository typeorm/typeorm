/**
 * Possible types of temporal clause, two times are expected for all clauses apart from ALL,
 * if timeTwo is not specified it will be set to the value of timeOne
 */
type TemporalClauseType = 'AS OF' | 'FROM' | 'BETWEEN' | 'CONTAINED IN' | 'ALL'

/**
 * Configuration object used to configure temporal clause,
 * If passed will add "FOR SYSTEM TIME" clause to line of query
 * NOTE: passing in a Date object will only give 3 digits of precision for milliseconds;
 * if you are on mariadb you will need to pass in a full string for complete accuracy
 */
export interface TemporalClauseConfig {
        type: TemporalClauseType
        timeOne: Date | string
        timeTwo?: Date | string
}