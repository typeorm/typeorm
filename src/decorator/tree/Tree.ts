import {getMetadataArgsStorage} from "../../";
import {TreeMetadataArgs} from "../../metadata-args/TreeMetadataArgs";
import {TreeType} from "../../metadata/types/TreeTypes";
import {ClosureTreeOptions} from "../../metadata/types/ClosureTreeOptions";

/**
 * Marks entity to work like a tree.
 * Tree pattern that will be used for the tree entity should be specified.
 * @TreeParent decorator must be used in tree entities.
 * TreeRepository can be used to manipulate with tree entities.
 */
export function Tree(type: TreeType, options?: ClosureTreeOptions): ClassDecorator {
    return function (target: Function) {
        let args: TreeMetadataArgs = {
            target: target,
            type: type
        };
        if (type === "closure-table") {
            args.options = options;
        }
        getMetadataArgsStorage().trees.push(args);
    };
}
