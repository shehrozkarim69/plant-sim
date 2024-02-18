const dimensions = [50,50];
const pxSize = 10;
let cells = new Float32Array(dimensions[0]*dimensions[1]);
let cellbuffer = new Float32Array(dimensions[0]*dimensions[1]);
cells.fill(0);
let cellplantId = new Float32Array(dimensions[0]*dimensions[1]);
cells.fill(0);

console.clear();

const c = document.createElement('canvas');
c.width=c.height=dimensions[0]*pxSize;
const ctx = c.getContext('2d');
container.appendChild(c);

const getCellIndex = (x, y) => {
  const [w,h]=dimensions;
  // if(x >= w) x = x-w;
  // else if(x<0) x = w+x;
  // if(y >= h) y = y-h;
  // else if(y<0) y = h+y;
  if(x >= w || x<0 || y >= h || y<0) return -1;
  return y*dimensions[0] + x;
}
const getCellPosition = (i) => {
  return [i%dimensions[0], Math.floor(i/dimensions[0])];
}
function getMousePos(canvas, evt) {

  const rect = canvas.getBoundingClientRect(); // Get canvas position and size

  const scaleX = canvas.width / rect.width;   // Scale factors for accurate coords

  const scaleY = canvas.height / rect.height;

  // Adjust mouse coordinates by subtracting offsets and applying scaling

  return {

    x: (evt.clientX - rect.left) * scaleX,

    y: (evt.clientY - rect.top) * scaleY

  };

}
let plantID=0;
c.addEventListener('pointerdown', (e)=> {
  const {x,y}=getMousePos(c,e)
  
  
  
  const i = getCellIndex(x, y);
  if(cells[i] == 0) {
    cells[i] = 1;
    cellplantId[i] = plantID++;
  }
  
  draw();
});

for(let i=0;i<dimensions[0]*dimensions[1];i++) {
  const [x,y]=getCellPosition(i);
  if(x>5&&x<dimensions[0]-5&&y>5&&y<dimensions[1]-5) {
    if(Math.random() < .04) {
      cells[i] = 1;
      cellplantId[i] = plantID++;
    }
  }
}

const maxDist = 5;
const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const findBranchDirection = (ii,x,y,attempted=[]) => {
  let d = Math.floor(Math.random()*4);
  if(attempted.length >= 4) return null;
  if(attempted.indexOf(d)!=-1) return findBranchDirection(ii, x,y,attempted);
  let [dx, dy] = directions[d];
  for(let dist = 1; dist < maxDist; dist++) {
    const i = getCellIndex(x + dx*dist, y + dy*dist);
    if(
      cellbuffer[i] != 0
    ) {
      attempted.push(d);
      d = findBranchDirection(ii, x,y,attempted);
      if(d==null) return null;
      break;
    }
  }
  
  [dx, dy] = directions[d];
  const [nx, ny] = [x+dx,y+dy];
  for(let u=-1;u<2;u++) {
    for(let v=-1;v<2;v++) {
      const [tx,ty]=[nx+u,ny+v];
      const ni = getCellIndex(tx,ty);
      if(tx==x&&ty==y) continue;
      if(
        (
          cellplantId[ni] !== cellplantId[ii]
          || cellbuffer[ni] < .85
        ) &&
        cellbuffer[ni] != 0
      ) {
        attempted.push(d);
        d = findBranchDirection(ii, x,y,attempted);
      }
    }
  }
  return d;
}

const solve = ()=> {
  cellbuffer.set(cells);
  for(let i=0;i<cells.length;i++) {
    let neighbours=0;
    let state = cells[i];
    if(state == 1) {
      let cell = getCellPosition(i);
      const dir = findBranchDirection(i, ...cell);
      if(dir !== null) {
        const [dx, dy] = directions[dir];
        const j = getCellIndex(cell[0]+dx,cell[1]+dy);
        cellbuffer[j]=1;
        cellplantId[j]=cellplantId[i];
      }
    }
    if(state > 0) {
      cellbuffer[i]=Math.max(.01, state*.95);
    }
  }
  cells.set(cellbuffer);
}

const cs = [
  '#338811',
  '#22aa33',
  '#226633',
  '#446622',
  '#118855'
];
const draw = () => {
  ctx.clearRect(0,0,c.width,c.height);
  for(let i=0;i<cells.length;i++) {
    if(cells[i]==1) {
      const cell = getCellPosition(i).map((v)=>v*pxSize);
      ctx.fillStyle='black'
      ctx.fillRect(...cell, pxSize, pxSize);
    }
    else if(cells[i]>0) {
      const cell = getCellPosition(i).map((v)=>v*pxSize);
      ctx.fillStyle=cs[cellplantId[i]%cs.length]
      ctx.fillRect(...cell, pxSize, pxSize);
    }
  }
}

let running = true;
const fps = 15;
let now;
let then = Date.now();
let interval = 1000/fps;
let delta, g=0;
const run = (d) => {
  if(running) requestAnimationFrame(run);
  now = Date.now();
  delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    solve();
    draw();
  }
}
run();