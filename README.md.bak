# code-fns

A utility library for visualizing code.

## Install

```bash
npm install code-fns
```

## Purpose

Most code highlighters in JavaScript rely on HTML and CSS. When working outside
of a standard webpage, however, these formats become difficult to use. Code-fns
is domain-agnostic, and will export tokens as plain objects to be converted to
whatever format you choose. Specifically, code-fns was built for use in the
Motion Canvas project, for visualizing code in videos and animations. Code-fns
may also compute the transformation between different code blocks, so that you
may animate between them.

## Usage

You must initialize the project with `ready`.

```tsx
import { ready } from 'code-fns';

await ready();
```

### Highlighting code

Once initialized, you may highlight your code with

```tsx
import { ready, tokenColors } from 'code-fns';

await ready();

const tokens = tokenColors(['tsx', '() => true']);
```

You will receive an array of tokens, which are themselves a tuple of a string, a
location, and a color, when applicable. Colors are based on the github dark
theme, though we hope to add more themes in the future.

```tsx
// tokens
[
  ['() ', [0, 0]],
  ['=>', [0, 3], '#ff7b72'],
  [' ', [0, 5]],
  ['true', [0, 6], '#79c0ff'],
];
```

Locations are always `[line, column]`.

### Transitioning code (for animations)

Code transitions use comment templating to adjust code. For instance, in any
language with multiline comments using `/* */`, a tagged code string would look
like

```tsx
(/*< params >*/) => {};
```

You may then replace these tags using `substitute`.

```tsx
import { ready, substitute, toString } from 'code-fns';

await ready();

const code = `(/*< params >*/) => { }`;
const subbed = substitute(['tsx', code], { params: 'input: any' });
console.log(toString(subbed));
// (input: any) => { }
```

With two substitutions, however, you may build a transition, which may serve as
the basis for an animation.

```tsx
import { ready, transition, toString } from 'code-fns';

await ready();

const code = `(/*< params >*/) => { }`;
const transform = transition(
  ['tsx', code],
  { params: 'input' },
  { params: 'other' },
);
```

The `transform` object will contain three token arrays: "create", "delete", and
"retain". The `create` and `delete` arrays contains tuples with the token's
text, location, and then color, when available.

```tsx
import { ready, transition, toString } from 'code-fns';

await ready();

const transform = transition(['tsx', '/*<t>*/'], { t: 'true' }, { t: 'false' });
```

The `transform` variable is then

```tsx
{
  "create": [["false", [0, 0], "#79c0ff"]],
  "delete": [["true", [0, 0], "#79c0ff"]],
  "retain": [],
}
```

The `retain` array contains tuples with the token's text, old position, new
position, and color, when available.

```tsx
import { ready, transition, toString } from 'code-fns';

await ready();

const transform = transition(['tsx', '/*<t>*/true'], { t: '' }, { t: '    ' });
```

Here, the `transform` variable is

```tsx
{
  "create": [["    ", [0, 0]]],
  "delete": [],
  "retain": [["true", [0, 0], [0, 4], "#79c0ff"]],
}
```

By interpolating between the old and new position, you may animate notes to
their new location.
