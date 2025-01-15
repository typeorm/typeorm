import { cn } from "~/utils/cn";
import { component$, useSignal, $, useOnWindow } from '@qwik.dev/core';
import { ContentHeading } from '@qwik.dev/router';

export const TOC = component$(
  ({ headings }: { headings: ContentHeading[] }) => {
    if (headings.length === 0) {
      return null;
    }
    return (
      <div class="space-y-2 sticky top-24 max-h-[calc(80vh)] p-1 dark:text-white text-black hidden xl:block">
        <div class="font-medium">On This Page</div>
        <TableOfContents headings={headings} />
      </div>
    );
  },
);

type TableOfContentsProps = { headings: ContentHeading[] };

interface Node extends ContentHeading {
  children: Node[];
  activeItem: string;
}
type Tree = Array<Node>;

const TableOfContents = component$<TableOfContentsProps>(({ headings }) => {
  const sanitizedHeadings = headings.map(({ text, id, level }) => ({ text, id, level }));
  const itemIds = headings.map(({ id }) => id);
  const activeHeading = useActiveItem(itemIds);
  const tree = buildTree(sanitizedHeadings);
  const fixStartingBug: Node = { ...tree, children: [tree] };
  return <RecursiveList tree={fixStartingBug} activeItem={activeHeading.value ?? ''} />;
});

function deltaToStrg(
  currNode: Node,
  nextNode: Node,
): 'same level' | 'down one level' | 'up one level' | 'upwards discontinuous' {
  const delta = currNode.level - nextNode.level;
  if (delta > 1) {
    return 'upwards discontinuous';
  }
  if (delta === 1) {
    return 'up one level';
  }
  if (delta === 0) {
    return 'same level';
  }
  if (delta === -1) {
    return 'down one level';
  }

  return 'down one level';
  // throw new Error(
  //   `bad headings: are downwards discontinous from: #${currNode.id} to #${nextNode.id} bc from ${currNode.level} to ${nextNode.level}`,
  // );
}

function buildTree(nodes: ContentHeading[]) {
  let currNode = nodes[0] as Node;
  currNode.children = [];
  const tree = [currNode];
  const childrenMap = new Map<number, Tree>();
  childrenMap.set(currNode.level, currNode.children);
  for (let index = 1; index < nodes.length; index++) {
    const nextNode = nodes[index] as Node;
    nextNode.children = [];
    childrenMap.set(nextNode.level, nextNode.children);
    const deltaStrg = deltaToStrg(currNode, nextNode);
    switch (deltaStrg) {
      case 'upwards discontinuous': {
        const delta = currNode.level - nextNode.level;
        if (childrenMap.has(delta - 1)) {
          const nthParent = childrenMap.get(delta - 1);
          nthParent?.push(nextNode);
        }
        break;
      }
      case 'up one level': {
        const grandParent = childrenMap.get(currNode.level - 2);
        grandParent?.push(nextNode);
        break;
      }
      case 'same level': {
        const parent = childrenMap.get(currNode.level - 1);
        parent?.push(nextNode);
        break;
      }
      case 'down one level': {
        currNode.children.push(nextNode);
        break;
      }
      default:
        break;
    }
    currNode = nextNode;
  }
  return tree[0];
}

type RecursiveListProps = {
  tree: Node;
  activeItem: string;
  limit?: number;
};

const RecursiveList = component$<RecursiveListProps>(
  ({ tree, activeItem, limit = 3 }) => {
    return tree?.children?.length && tree.level < limit ? (
      <ul class={cn('m-0 list-none', { 'pl-4': tree.level !== 1 })}>
        {tree.children.map((childNode) => (
          <li key={childNode.id} class="mt-0 list-none pt-2">
            <Anchor node={childNode} activeItem={activeItem} />
            {childNode.children.length > 0 && (
              <RecursiveList tree={childNode} activeItem={activeItem} />
            )}
          </li>
        ))}
      </ul>
    ) : null;
  },
);

const useActiveItem = (itemIds: string[]) => {
  const activeId = useSignal<string>();

  useOnWindow(
    'scroll',
    $(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              activeId.value = entry.target.id;
            }
          });
        },
        { rootMargin: '0% 0% -85% 0%' },
      );

      itemIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });

      return () => {
        itemIds.forEach((id) => {
          const element = document.getElementById(id);
          if (element) {
            observer.unobserve(element);
          }
        });
      };
    }),
  );

  return activeId;
};

type AnchorProps = {
  node: Node;
  activeItem: string;
};

const Anchor = component$<AnchorProps>(({ node, activeItem }) => {
  const isActive = node.id === activeItem;
  return (
    <a
      href={`#${node.id}`}
      onClick$={[
        $(() => {
          const element = document.getElementById(node.id);
          if (element) {
            const navbarHeight = 90;
            const position =
              element.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: position, behavior: 'auto' });
          }
        }),
      ]}
      class={cn(
        node.level > 2 && 'ml-2',
        'inline-block no-underline transition-colors',
        isActive ? 'text-blue-500 dark:text-blue-300' : 'text-muted-foreground',
      )}
    >
      {node.text}
    </a>
  );
});