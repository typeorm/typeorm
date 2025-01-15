import type { PropsOf } from "@qwik.dev/core";
import {
  $,
  component$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@qwik.dev/core";
import { isDev } from "@qwik.dev/core/build";
import { getHighlighterCore } from "shiki";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import tsx from "shiki/langs/tsx.mjs";
import poimandres from "shiki/themes/poimandres.mjs";

export type HighlightProps = PropsOf<"div"> & {
  code: string;
  language?: "tsx" | "html" | "css";
  splitCommentStart?: string;
  splitCommentEnd?: string;
};

export const Highlight = component$(
  ({
    code,
    language = "tsx",
    splitCommentStart = "{/* start */}",
    splitCommentEnd = "{/* end */}",
    ...props
  }: HighlightProps) => {
    const codeSig = useSignal("");

    const addShiki$ = $(async () => {
      let modifiedCode: string = code;

      let partsOfCode = modifiedCode.split(splitCommentStart);
      if (partsOfCode.length > 1) {
        modifiedCode = partsOfCode[1];
      }

      partsOfCode = modifiedCode.split(splitCommentEnd);
      if (partsOfCode.length > 1) {
        modifiedCode = partsOfCode[0];
      }

      const highlighter = await getHighlighterCore({
        themes: [poimandres],
        langs: [html, css, tsx],
        loadWasm: import("shiki/wasm"),
      });

      const str = highlighter.codeToHtml(modifiedCode, {
        lang: language,
        themes: {
          light: "poimandres",
          dark: "poimandres",
        },
      });
      codeSig.value = str.toString();
    });

    useTask$(async ({ track }) => {
      track(() => code);
      if (!isDev) {
        await addShiki$();
      }
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(async ({ track }) => {
      track(() => code);
      if (isDev) {
        await addShiki$();
      }
    });

    return (
      <div class="code-example rounded-base relative max-h-[31.25rem]">
        <div
          {...props}
          class={[
            "tab-size dark:from-background dark:to-accent/30 max-h-[31.25rem] max-w-full overflow-auto rounded-sm bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-sm",
            props.class,
          ]}
        >
          <div dangerouslySetInnerHTML={codeSig.value} />
        </div>
      </div>
    );
  },
);
