/**
 * Used to specify what entity relations should be loaded.
 *
 * Example:
 *  const options: JoinOptions = {
 *     alias: "photo",
 *     leftJoin: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoin: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     leftJoinAndSelect: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoinAndSelect: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     }
 * };
 */
export interface JoinOptions {

    /**
     * Alias of the main entity.
     */
    alias: string;

    /**
     * Array of columns to LEFT JOIN.
     */
    leftJoinAndSelect?: { [key: string]: string };

    /**
     * Array of columns to INNER JOIN.
     */
    innerJoinAndSelect?: { [key: string]: string };

    /**
     * Array of columns to LEFT JOIN.
     */
    leftJoin?: { [key: string]: string };

    /**
     * Array of columns to INNER JOIN.
     */
    innerJoin?: { [key: string]: string };

}
