import { language, highlight } from './tags';
import { expect, test } from 'vitest';

const tsx = language.tsx;

test('should highlight code', async () => {
  const code = tsx`const name = true;`;
  expect(await highlight(code)).toMatchInlineSnapshot(`
    [
      [
        "const",
        "#ff7b72",
      ],
      " ",
      [
        "name",
        "#79c0ff",
      ],
      " ",
      [
        "=",
        "#ff7b72",
      ],
      " ",
      [
        "true",
        "#79c0ff",
      ],
      ";",
    ]
  `);
});
