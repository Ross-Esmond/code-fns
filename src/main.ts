import './style.css';
import { transition, Transition } from './code';

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
  'tsx',
  `export default function* first(scene: Scene) {
  yield* scene.transition();/*<add>*/
  
  scene.canFinish();
}
`,
  { add: '' },
  { add: addition },
);

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
  p = easeOutExpo(p);
  context.clearRect(0, 0, 1000, 1000);
  const w = context.measureText('X').width;
  root.retain.forEach(([text, color, [eln, eat], [sln, sat]]) => {
    context.save();
    if (color) context.fillStyle = color;
    const x = w * (sat + p * (eat - sat)) + w;
    const y = 20 * (sln + p * (eln - sln)) + 20;
    context.fillText(text, x, y);
    context.restore();
  });
  if (p > 0.95) {
    root.create.forEach(([text, color, [ln, at]]) => {
      context.save();
      context.globalAlpha = (p - 0.95) * 20;
      if (color) context.fillStyle = color;
      context.fillText(text, at * w + w, ln * 20 + 20);
      context.restore();
    });
  }
}

export function linear(from: number, to: number, value: number) {
  return from + (to - from) * value;
}
export function easeInOutCirc(value: number, from = 0, to = 1) {
  value =
    value < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * value, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * value + 2, 2)) + 1) / 2;
  return linear(from, to, value);
}
export function easeOutExpo(value: number, from = 0, to = 1) {
  value = value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
  return linear(from, to, value);
}
export function easeInOutCubic(value: number, from = 0, to = 1) {
  value =
    value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  return linear(from, to, value);
}

tran.then((tran) => {
  console.log(tran);
  let start: number | null = null;
  const loop = (t: number) => {
    if (start === null) start = t;
    draw(tran, Math.min(1, (t - <number>start) / 1000));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
