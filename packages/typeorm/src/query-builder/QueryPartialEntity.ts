import type { ObjectLiteral } from "../common/ObjectLiteral"

/**
 * Make all properties in T optional
 */
export type QueryPartialEntity<T> = {
    [P in keyof T]?: T[P] | (() => string)
}

/**
 * Make all properties in T optional. Deep version.
 */
export type QueryDeepPartialEntity<T> = _QueryDeepPartialEntity<
    ObjectLiteral extends T ? unknown : T
>

type IsIdentical<A, B> =
    (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2
        ? true
        : false

/**
 * Whether `T` is identical to one of the types in `TVisited`.
 */
type IsVisited<T, TVisited> = [TVisited] extends [never]
    ? false
    : true extends (TVisited extends any ? IsIdentical<T, TVisited> : never)
      ? true
      : false

/**
 * `TVisited` holds the array types that are being expanded right now. Types
 * that contain themselves through arrays or unions only (e.g.
 * `type Json = string | Json[] | { [key: string]: Json }`) are expanded
 * eagerly and forever, so the expansion has to stop at some point. The first
 * time an array type is reached again it is expanded once more, so that
 * objects and SQL expression functions inside an array that is nested in an
 * array of the same type stay deep partial (`TRevisited` holds these array
 * types). The second time it is kept as it is. Object properties are resolved
 * lazily, they start over with empty sets.
 */
type _QueryDeepPartialEntity<T, TVisited = never, TRevisited = never> = {
    [P in keyof T]?:
        | (T[P] extends Array<infer U>
              ? Array<
                    _QueryDeepPartialEntityMember<
                        U,
                        VisitedWith<T, TVisited>,
                        RevisitedWith<T, TRevisited>
                    >
                >
              : T[P] extends ReadonlyArray<infer U>
                ? ReadonlyArray<
                      _QueryDeepPartialEntityMember<
                          U,
                          VisitedWith<T, TVisited>,
                          RevisitedWith<T, TRevisited>
                      >
                  >
                : _QueryDeepPartialEntityMember<
                      T[P],
                      VisitedWith<T, TVisited>,
                      RevisitedWith<T, TRevisited>
                  >)
        | (() => string)
}

type VisitedWith<T, TVisited> =
    T extends ReadonlyArray<any> ? TVisited | T : never

type RevisitedWith<T, TRevisited> =
    T extends ReadonlyArray<any> ? TRevisited : never

type _QueryDeepPartialEntityMember<T, TVisited, TRevisited> = 0 extends 1 & T
    ? _QueryDeepPartialEntity<T>
    : T extends any
      ? true extends IsVisited<T, TRevisited>
          ? T
          : true extends IsVisited<T, TVisited>
            ? _QueryDeepPartialEntity<T, TVisited, TRevisited | T>
            : _QueryDeepPartialEntity<T, TVisited, TRevisited>
      : never
