import fs from 'fs';
import { Map, List } from 'immutable';

const data = fs.readFileSync('classmap.json');
const classmap = JSON.parse(data);

const result = Object.entries(classmap).reduce(
  (map, [key, value]) => map.update(value, List(), (list) => list.push(key)),
  Map(),
);

console.log(result.toJS());
