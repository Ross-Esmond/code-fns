import './style.css';
import { transition, ready, Transition } from './code';

await ready();

const addition = `

  scene.add(
    <Surface>
      <LinearLayout axis={Axis.Horizontal}>
        <Icon type={IconType.Object}/>
        <Text>Example</Text>
      </LinearLayout>
    </Surface>
  );
`;

const tran = transition(
  [
    'tsx',
    `export default function* first(scene: Scene) {
  yield* scene.transition();/*<add>*/
  
  scene.canFinish();
}
`,
  ],
  { add: '' },
  { add: addition },
);

const target = document.querySelector<HTMLDivElement>('#app');

if (target == null) throw new Error('app element not found');

target.innerHTML = `
  <canvas id="canvas" width="1000" height="1000" />
`;

const canvas = document.querySelector<HTMLCanvasElement>(
  '#canvas',
) as HTMLCanvasElement;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;
context.font = '20px monospace';
context.fillStyle = 'white';
context.strokeStyle = 'white';

function draw(root: Transition, p: number) {
  const till = 0.9;
  let main = Math.min(1, p / till);
  main = physicsEase(0.3)(main);
  context.clearRect(0, 0, 1000, 1000);
  const w = context.measureText('X').width;
  root.retain.forEach(([text, [sln, sat], [eln, eat], color]) => {
    context.save();
    if (color) context.fillStyle = color;
    const x = w * (sat + main * (eat - sat)) + w;
    const y = 30 * (sln + main * (eln - sln)) + 30;
    context.fillText(text, x, y);
    context.restore();
  });
  const when = 0.7;
  if (p > when) {
    const progress = (p - when) * (1 / (1 - when));
    root.create.forEach(([text, [ln, at], color]) => {
      context.save();
      context.globalAlpha = progress;
      if (color) context.fillStyle = color;
      context.fillText(text, 30 * (1 - progress) + at * w + w, ln * 30 + 30);
      context.restore();
    });
  }
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

let start: number | null = null;
const loop = (t: number) => {
  if (start === null) start = t;
  draw(tran, Math.min(1, (t - <number>start) / 600));
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
