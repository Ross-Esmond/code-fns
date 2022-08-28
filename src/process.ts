import {parse, RenderList} from "./parse";

export async function process(
  list: RenderList,
  options: {
    subs?: Record<string, string>,
    cond?: Record<string, boolean>,
  } = {},
): Promise<RenderList> {
  const subs = new Map(Object.entries(options.subs ?? {}));
  let code = '';
  list.lines.forEach(({tokens}) => {
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

export class TransformList {
  constructor(
    readonly language: string,
    readonly lines: TransformLine[],
  ) {
  }
}
export class TransformLine {
  constructor(
    readonly tokens: TransformToken[],
    readonly tags: string[],
  ) {
  }
}
export abstract class TransformToken {
  public readonly color?: string;
  public readonly type?: string;
  public abstract readonly transform: 'create' | 'delete' | 'keep';

  constructor(
    readonly text: string,
    options?: {
      color?: string,
      type?: string,
    },
  ) {
    this.color = options?.color ?? '';
    this.type = options?.type;
  }
}
export class KeepToken extends TransformToken {
  public readonly transform = 'keep';

  constructor(
    text: string,
    readonly from: [number, number],
    readonly to: [number, number],
    options?: {
      color?: string,
      type?: string,
    },
  ) {
    super(text, options);
  }
}
export class FadeToken extends TransformToken {
  constructor(
    text: string,
    readonly position: [number, number],
    readonly transform: 'create' | 'delete',
    options?: {
      color?: string,
      type?: string,
    },
  ) {
    super(text, options);
  }
}

export async function transform(
  tree: RenderList,
  initial: {
    subs?: Record<string, string>,
    cond?: Record<string, boolean>,
  },
  final: {
    subs?: Record<string, string>,
    cond?: Record<string, boolean>,
  },
): Promise<TransformList> {
  const first = await process(tree, initial);
  const last = await process(tree, initial);
  // positions in the first and last
  const fpos = [0, 0];
  const lpos = [0, 0];
  const lines = [];
  for (let ln = 0; ln < tree.lines.length; ln++) {
    const line = tree.lines[ln];
    const tokens = [];
    for (let at = 0; at < line.tokens.length; at++) {
      const token = line.tokens[at];
      if (token.tag == null) {
        // TODO split text
        lpos[1]++;
        fpos[1]++;
        tokens.push(new KeepToken(
          token.text,
          token.position,
          token.position,
          token,
        ))
      } else {
        // TODO
      }
    }
    lines.push(new TransformLine(
      tokens,
      [],
    ))
    lpos[0]++;
    fpos[0]++;
  }
  return new TransformList(tree.language, lines);
}
