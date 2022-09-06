# code-fns

A utility library for visualizing code.

## Install

```bash
npm install code-fns
```

## Purpose

Most code highlighters in JavaScript rely on HTML and CSS. When working outside
of a standard web page, however, these formats become difficult to use. Code-fns
is domain-agnostic, and will export tokens as plain objects to be converted to
whatever format you choose. Specifically, code-fns was built for use in the
Motion Canvas project, for visualizing code in videos and animations. Code-fns
may also compute the transformation between different code blocks, so that you
may animate between them.

## Compatibility

Supports all browsers and all [maintained node
versions](https://github.com/nodejs/Release), though you will need to use your
own transpiler, as the package files are left mostly alone. This ensures that
you may configure your build as you wish.

## Usage

You must initialize the project with `ready`.

```tsx
import { ready } from 'code-fns';

await ready();
```

### Highlighting code

Once initialized, you may highlight your code with

```tsx
import { ready, color } from 'code-fns';

await ready();

const code = color(['tsx', '() => true']);
```

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

The `transform` object will contain an array of tokens, each of which with a
provinance property of either "create", "delete", or "retain".

```tsx
import { ready, transition, toString } from 'code-fns';

await ready();

const transform = transition(['tsx', '/*<t>*/'], { t: 'true' }, { t: 'false' });
```
