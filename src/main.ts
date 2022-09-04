import './style.css';
import { ready } from './code';
import { draw } from './draw';
import { transition } from './transition';

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

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;

let startTime: number | null = null;
function loop(t: number) {
  if (startTime === null) startTime = t;
  const time = t - startTime;
  context.clearRect(0, 0, 1000, 1000);
  draw(context, tran, time / 1000);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
