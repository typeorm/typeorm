import type {
  CallExpression,
  FunctionDeclaration,
  Literal,
  Node,
  Program,
  VariableDeclaration,
  VariableDeclarator,
} from "estree-jsx";
import type { Plugin } from "unified";

function isNamedFunction(node: FunctionDeclaration, name: string) {
  return Boolean(node.id?.name === name);
}

export const recmaProvideComponents: Plugin<any, Program> = () => {
  let id = 0;
  return (tree) => {
    const replacement = [];
    for (const _node of tree.body) {
      const node = _node as Node;
      if (node.type === "FunctionDeclaration") {
        if (
          isNamedFunction(node, "MDXContent") ||
          isNamedFunction(node, "_createMdxContent")
        ) {
          /**
           * Transforms function MDXContent (props = {}) {...}
           * to const MDXContent = _componentQrl(_inlinedQrl(function (props = {}) {...}, 'symbolName', []))
           * allows using Qwik hooks inside
           *  */
          const symbolName = `${node.id?.name || "mdx"}_${id++}`;
          const declarations: VariableDeclarator[] = [
            {
              id: node.id!,
              type: "VariableDeclarator",
              init: {
                type: "CallExpression",
                callee: {
                  type: "Identifier",
                  name: "_componentQrl",
                },
                arguments: [
                  {
                    type: "CallExpression",
                    callee: {
                      type: "Identifier",
                      name: "_inlinedQrl",
                    },
                    arguments: [
                      {
                        type: "ArrowFunctionExpression",
                        id: null,
                        params: node.params,
                        body: node.body,
                        async: node.async,
                        generator: node.generator,
                      },
                      {
                        type: "Literal",
                        value: symbolName,
                        raw: String.raw`"${symbolName}"`,
                      } as Literal,
                      {
                        type: "ArrayExpression",
                        elements: [],
                      },
                    ],
                  } as CallExpression,
                ],
              } as CallExpression,
            },
          ];
          const newNode: VariableDeclaration = {
            type: "VariableDeclaration",
            kind: "const",
            declarations,
          };
          replacement.push(newNode);
          continue;
        }
      }
      replacement.push(_node);
    }
    tree.body = replacement;

    tree.body.unshift({
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportSpecifier",
          imported: { type: "Identifier", name: "componentQrl" },
          local: { type: "Identifier", name: "_componentQrl" },
        },
        {
          type: "ImportSpecifier",
          imported: { type: "Identifier", name: "inlinedQrl" },
          local: { type: "Identifier", name: "_inlinedQrl" },
        },
      ],
      source: { type: "Literal", value: "@qwik.dev/core" },
    });
  };
};
