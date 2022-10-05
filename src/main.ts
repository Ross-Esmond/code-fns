import './style.css';

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
  context.clearRect(0, 0, 1000, 1000);
  // TODO
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
