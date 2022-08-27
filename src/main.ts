import './style.css'
import {parse, RenderList} from './parse'

const tree = parse(`
export default function* first(scene: Scene) {
  yield* scene.transition(/* WHO */);
  /* multi
  * line
  */
  
  // what
  scene.add(
    <Surface>
      <LinearLayout axis={Axis.Horizontal}>
        <Icon type={IconType.Object}/>
        <Text>Example</Text>
      </LinearLayout>
    </Surface>
  );
  
  scene.canFinish();
}
`, 'tsx');

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="canvas" width="1000" height="1000" />
`

const canvas = document.querySelector<HTMLCanvasElement>('#canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;
context.font = '20px monospace';
context.fillStyle = 'white';
context.strokeStyle = 'white';

function draw(root: RenderList) {
  root.forEach((line, ln) => {
    let x = 0;
    line.tokens.forEach(token => {
      context.save();
      if (token.color) {
        context.fillStyle = token.color;
      }
      context.fillText(token.text, x, 20*ln);
      const measurement = context.measureText(token.text);
      x += measurement.width;
      context.restore();
    })
  })
}

tree.then(t => draw(t))
