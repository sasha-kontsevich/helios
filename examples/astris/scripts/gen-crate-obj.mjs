import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const obj = `# unit box
v -0.5 -0.5 -0.5
v 0.5 -0.5 -0.5
v 0.5 0.5 -0.5
v -0.5 0.5 -0.5
v -0.5 -0.5 0.5
v 0.5 -0.5 0.5
v 0.5 0.5 0.5
v -0.5 0.5 0.5
f 1 2 3 4
f 5 6 7 8
f 1 5 8 4
f 2 6 7 3
f 1 2 6 5
f 4 3 7 8
`;
fs.mkdirSync(path.join(dir, "../public/assets/models/crate"), { recursive: true });
fs.writeFileSync(path.join(dir, "../public/assets/models/crate/source.obj"), obj);
