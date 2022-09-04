import { Tokenized } from './code';

export function draw(
  context: CanvasRenderingContext2D,
  tokenized: Tokenized,
  progress: number,
) {
  const createStart = 0.7;
  const animationEnd = 0.9;

  const createProgress = Math.min(
    1,
    Math.max(0, (progress - createStart) * (1 / (1 - createStart))),
  );
  const animationProgress = physicsEase(0.3)(
    Math.min(1, progress / animationEnd),
  );

  context.save();
  context.font = '20px monospace';
  context.fillStyle = 'white';
  const w = context.measureText('X').width;
  tokenized.tokens.forEach((item) => {
    const {
      token,
      color,
      provinance,
      location: [eln, eat],
    } = item;
    if (token === '\n') return;
    context.save();
    if (color) context.fillStyle = color;
    if (provinance === 'retain') {
      const [sln, sat] = item.prior as [number, number];
      const x = w * (sat + animationProgress * (eat - sat)) + w;
      const y = 30 * (sln + animationProgress * (eln - sln)) + 30;
      context.fillText(token, x, y);
    } else if (provinance === 'create') {
      context.globalAlpha = Math.pow(createProgress, 2);
      const x = 100 * (1 - createProgress) + eat * w + w;
      const y = eln * 30 + 30;
      context.fillText(token, x, y);
    }
    context.restore();
  });
  context.restore();
}

const physicsEase = (transition: number) => {
  if (transition < 0 || 0.5 < transition) {
    throw new Error(`transition must be at least 0 and at most 0.5`);
  }
  const a = -Math.pow(2 * (transition ** 2 - transition), -1);
  return (value: number) => {
    if (value < transition) {
      return a * value ** 2;
    } else if (transition <= value && value <= 1 - transition) {
      const slope = 2 * a * transition;
      return slope * (value - transition) + a * transition ** 2;
    } else {
      return -a * value ** 2 + 2 * a * value - a + 1;
    }
  };
};
