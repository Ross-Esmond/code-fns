import './style.css'
import {parse, RenderList} from './parse'

const tree = parse(`
export default function* first(scene: Scene) {
  yield* scene.transition(/*<<WHO*/thing/*WHO>>*/);
  
  //: next-line scene
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
  const w = context.measureText('X').width;
  root.lines.forEach(line => {
    line.tokens.forEach(token => {
      context.save();
      if (token.color) {
        context.fillStyle = token.color;
      }
      const [ln, at] = token.position;
      context.fillText(token.text, w*at, 20*ln);
      context.restore();
    })
  })
}

tree.then(t => draw(t))
