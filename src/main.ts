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
    line.forEach(token => {
      context.save();
      if (token.length === 2) {
        context.fillStyle = token[1] as string;
      }
      context.fillText(token[0], x, 20*ln);
      const measurement = context.measureText(token[0]);
      x += measurement.width;
      context.restore();
    })
  })
}

tree.then(t => draw(t))

/*
const classType = new Map([
  ['pl-c', 'comment'],
  ['pl-k', 'keyword'],
  ['pl-en', 'entity.name'],
  ['pl-ent', 'entity.name.tag'],
  ['pl-v', 'variable'],
  ['pl-c1', 'constant'],
  ['pl-e', 'entity'],
  ['pl-pse', 'punctuation.section.embedded'],
  ['pl-smi', 'storage.modifier.import'],
  ['pl-s', 'storage'],
  ['pl-s1', 'string'],
  ['pl-kos', 'keyword.other.special-method'],
  ['pl-pds', 'punctuation.definition.string'],
  ['pl-sr', 'string.regexp'],
]);
*/
