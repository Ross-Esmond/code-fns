import {parse, RenderList} from "./parse";

export async function process(
  list: RenderList,
  options: {
    subs?: Record<string, string>,
    cond?: Record<string, boolean>,
  } = {}
): Promise<RenderList> {
  const subs = new Map(Object.entries(options.subs ?? {}));
  let code = '';
  list.lines.forEach(({tokens, tags}) => {
    tokens.forEach(({text, tag}) => {
      if (tag) {
        code += subs.get(tag) ?? '';
      } else {
        code += text;
      }
    })
  })

  return parse(code, list.language);
}
