import type { QwikIntrinsicElements } from "@qwik.dev/core";
import { Slot, component$ } from "@qwik.dev/core";
import { CodeSnippet } from "../CodeSnippet/CodeSnippet";

export const components: Record<string, any> = {
  pre: component$<QwikIntrinsicElements["div"] & { __rawString__?: string }>(
    () => {
      return (
        <div class="relative">
          <pre class="mb-4 mt-6 max-h-[650px] overflow-x-auto rounded-lg bg-zinc-950 p-6 text-white dark:bg-zinc-950">
            <Slot />
          </pre>
        </div>
      );
    },
  ),
  code: component$<QwikIntrinsicElements["code"]>(({ ...props }) => {
    return (
      <code {...props}>
        <Slot />
      </code>
    );
  }),
  CodeSnippet,
};
