import {
  Slot,
  component$,
  createContextId,
  useContext,
  useContextProvider,
  type Component,
} from "@qwik.dev/core";

export const MDXContext = createContextId<Components>("MDXContext");

export interface Components {
  [tag: string]: Component<any>;
}

/**
 * Get current components from the MDX Context.
 */
export function useMDXComponents() {
  return useContext(MDXContext, {});
}

export const DefaultWrapper = component$(() => {
  return <Slot />;
});

/**
 * Provider for MDX context
 */
export const MDXProvider = component$(
  ({
    components,
    disableParentContext,
  }: {
    components: Components;
    disableParentContext?: boolean;
  }) => {
    let allComponents = useMDXComponents();
    if (disableParentContext) {
      allComponents = components;
    } else {
      allComponents = { ...allComponents, ...components };
    }
    useContextProvider(MDXContext, {
      wrapper: DefaultWrapper,
      ...allComponents,
    });
    return <Slot />;
  },
);
