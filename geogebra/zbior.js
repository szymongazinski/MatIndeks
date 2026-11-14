const bookFigures = {
  'zbior-2023-19': {
    bounds: [-1.75, 10.85, -0.9, 5.8],
    draw({ segment, polygon, label, dot, arc, dimension, accent, dashed }) {
      const height = 2.2;
      const dist = 10;
      const alpha = Math.atan(height / dist);
      const tip = dist * Math.tan(2 * alpha);
      segment([-0.5, 0], [dist, 0]);
      polygon([[-0.46, 0], [0, 0], [0, height], [-0.46, height]], { color: accent, fill: 0.22 });
      segment([0, height], [0, tip], { color: accent });
      segment([0, tip], [dist, 0], dashed);
      segment([0, height], [dist, 0], dashed);
      arc([dist, 0], 1.65, Math.PI - 2 * alpha, Math.PI, { thickness: 2 });
      dot([0, tip], { color: accent });
      label('A', [-0.02, tip + 0.25]);
      label('O', [10.18, 0.22]);
      label('\\alpha', [8.14, 0.19]);
      label('\\alpha', [8.16, 0.58]);
      dimension([-0.68, 0], [-0.68, height], 'h', [-0.94, height / 2]);
      dimension([-0.68, height], [-0.68, tip], 'l', [-0.94, (height + tip) / 2]);
      dimension([0, -0.3], [dist, -0.3], 'x', [5, -0.6]);
    },
  },
  'zbior-2023-20': {
    width: 430,
    bounds: [-7.15, 9, -7.05, 9],
    draw({ segment, circle, arc, lines, label }) {
      const c = [3, 3 * Math.sqrt(3)];
      const d = [-3, c[1]];
      const b = [0, -6];
      const theta = 2 * Math.asin(10 / 12);
      const a = [-6 * Math.sin(theta), -6 * Math.cos(theta)];
      circle([0, 0], 6);
      lines([a, b, c, d, a]);
      segment(d, b);
      const tangent = offset => [c[0] + offset * Math.cos(Math.PI / 6), c[1] - offset * 0.5];
      segment(tangent(-5.7), tangent(5.6));
      arc(c, 2.7, 5 * Math.PI / 6, Math.PI, { thickness: 2 });
      label('A', [a[0] - 0.4, a[1] + 0.2]);
      label('B', [b[0], b[1] - 0.43]);
      label('C', [c[0] + 0.24, c[1] + 0.31]);
      label('D', [d[0] - 0.24, d[1] + 0.22]);
      label('30^{\\circ}', [c[0] - 2.1, c[1] + 0.64]);
      label('6', [0, c[1] - 0.43]);
      label('10', [-3.85, -2.48]);
    },
  },
  'zbior-2023-22': {
    bounds: [-0.85, 10.85, -1, 7.1],
    draw(api) { triangleWithParallels(api, false); },
  },
  'zbior-2023-28': {
    bounds: [-2.45, 18.25, -2, 10.65],
    draw({ lines, label, polygon, dimension, accent, pale, dashed }) {
      const x = 2;
      polygon([[x, x], [16-x, x], [16-x, 10-x], [x, 10-x]], { color: pale, fill: 0.36 });
      for (const points of [
        [[x, 0], [16-x, 0], [16-x, x], [x, x]],
        [[x, 10-x], [16-x, 10-x], [16-x, 10], [x, 10]],
        [[0, x], [x, x], [x, 10-x], [0, 10-x]],
        [[16-x, x], [16, x], [16, 10-x], [16-x, 10-x]],
      ]) polygon(points, { color: pale, fill: 0.65 });
      lines([[0, 0], [16, 0], [16, 10], [0, 10], [0, 0]], { color: accent, thickness: 3 });
      lines([[x, x], [16-x, x], [16-x, 10-x], [x, 10-x], [x, x]], { ...dashed, thickness: 3 });
      for (const [a, b] of [
        [[0, x], [x, x]], [[0, 10-x], [x, 10-x]], [[x, 0], [x, x]], [[x, 10-x], [x, 10]],
        [[16-x, 0], [16-x, x]], [[16-x, 10-x], [16-x, 10]], [[16-x, x], [16, x]], [[16-x, 10-x], [16, 10-x]],
      ]) lines([a, b], { color: accent, thickness: 3 });
      dimension([-0.52, 0], [-0.52, 10], '10\\ \\mathrm{cm}', [-1.4, 5]);
      dimension([0, -0.48], [16, -0.48], '16\\ \\mathrm{cm}', [8, -1.25]);
      dimension([16.5, 10-x], [16.5, 10], 'x', [16.88, 9]);
    },
  },
  'zbior-2023-29': {
    bounds: [-10.7, 21.55, -1.6, 6.4],
    draw(api) { road(api); },
  },
  'zbior-2023-31': {
    width: 330,
    bounds: [-1.2, 1.2, -1.2, 1.2],
    draw({ circle, lines, ellipse, accent, dashed, ink }) {
      const r = 0.62;
      const y = -Math.sqrt(1 - r*r);
      circle([0, 0], 1);
      ellipse([0, 0], 1, 0.18, 0, 2 * Math.PI, { color: ink, lineType: 1, thickness: 2 });
      ellipse([0, y], r, 0.11, 0, Math.PI, { ...dashed, thickness: 3 });
      ellipse([0, y], r, 0.11, Math.PI, 2 * Math.PI, { color: accent, thickness: 3 });
      lines([[-r, y], [0, 1], [r, y]], { color: accent });
    },
  },
  'zbior-2023-32-1': {
    width: 350,
    bounds: [-1.8, 1.8, -0.5, 4.38],
    draw({ circle, lines, ellipse, accent, dashed, ink }) {
      const height = 4;
      const r = height / Math.sqrt(height * (height - 2));
      ellipse([0, 0], r, 0.24, 0, Math.PI, { ...dashed, thickness: 3 });
      ellipse([0, 0], r, 0.24, Math.PI, 2 * Math.PI, { color: accent, thickness: 3 });
      lines([[-r, 0], [0, height], [r, 0]], { color: accent });
      circle([0, 1], 1);
      ellipse([0, 1], 1, 0.16, 0, 2 * Math.PI, { color: ink, lineType: 1, thickness: 2 });
    },
  },
  'zbior-2023-13-rozw': {
    bounds: [-4.9, 8.0, -5.8, 5.8],
    draw({ axes, circle, dot, label, accent, ink }) {
      axes(-4.65, 7.7, -5.5, 5.5);
      circle([1, 0], 5, { color: accent });
      circle([5, 4], 1, { color: accent });
      for (const [point, text, anchor] of [
        [[1, 0], 'S_1', [1.34, 0.45]], [[5, 4], 'S_2', [5.43, 4.36]],
        [[4, 4], '(4,4)', [3.66, 4.35]], [[5, 3], '(5,3)', [5.44, 2.88]],
      ]) {
        dot(point, { color: ink });
        label(text, anchor);
      }
    },
  },
  'zbior-2023-15-rozw': {
    width: 640,
    bounds: [-8.65, 8.85, -8.55, 8.6],
    draw({ axes, segment, dot, label, accent, pale }) {
      axes(-8.25, 8.35, -8.15, 8.22);
      segment([-8.13, 5.13], [-3, 0], { color: accent, thickness: 5 });
      segment([-3, 0], [3, 6], { color: accent, thickness: 5 });
      segment([-3, 0], [3, -6], { color: pale, lineType: 1 });
      segment([3, -6], [5.15, -8.15], { color: accent, thickness: 5 });
      dot([3, 6], { color: accent, open: true });
      dot([3, -6], { color: accent, open: true });
      label('y=f(x)', [2.98, 3.7]);
    },
  },
  'zbior-2023-21-rozw': {
    bounds: [-.9, 9.3, -.7, 4.15],
    draw({ lines, segment, label, arc, angleSquare, accent, dashed }) {
      const x = 2.68;
      const u = (3 + ((2 + Math.sqrt(3))/2)**2) / 4;
      const height = x * Math.sqrt(1 - (2-u)**2);
      const a = [0,0], b = [3*x,0], c = [(u+1)*x,height], d = [u*x,height];
      const e = [d[0],0];
      const k = a.map((value,i) => value + .75*(c[i]-value));
      lines([a,b,c,d,a]);
      segment(a,c,dashed);
      segment(b,d,dashed);
      segment(d,e,dashed);
      angleSquare(e,b,d,.21);
      const alpha = Math.atan2(d[1],b[0]-d[0]);
      arc(d, .79, -alpha, 0, {color: accent, thickness: 2});
      arc(b, .9, Math.PI-2*alpha, Math.PI, {color: accent, thickness: 2});
      for (const [text,point] of [
        ['A',[-.12,-.25]],['B',[b[0]+.14,-.22]],['C',[c[0],c[1]+.29]],['D',[d[0]-.21,d[1]+.08]],
        ['E',[e[0],-.22]],['K',[k[0],k[1]-.23]],['3x',[b[0]*.37,-.26]],['x',[(b[0]+c[0])/2+.32,1.24]],
        ['x',[(d[0]+c[0])/2,c[1]+.27]],['h',[e[0]-.25,1.08]],['10',[d[0]/2-.28,1.31]],
        ['\\alpha',[d[0]+.82,d[1]-.28]],['\\alpha',[b[0]-1.07,.25]],['\\alpha',[b[0]-.57,.89]],
      ]) label(text,point);
    },
  },
  'zbior-2023-22-rozw': {
    bounds: [-0.85, 10.85, -1, 7.1],
    draw(api) { triangleWithParallels(api, true); },
  },
  'zbior-2023-26-rozw': {
    width: 450,
    bounds: [-1.2,1.2,-1.2,1.18],
    draw({ circle, segment, polygon, label, angleSquare, accent, pale, dashed }) {
      const x=.8, d=[0,-x], c=[0,1], r=Math.sqrt(1-x*x), a=[-r,-x],b=[r,-x],o=[0,0];
      circle(o,1);
      polygon([a,b,c],{color:accent,fill:.23,thickness:3,layer:1});
      segment(c,d,{thickness:3});
      segment(o,b,dashed);
      segment(o,a,dashed);
      angleSquare(d,b,c,.1);
      for(const [text,point] of [
        ['A',[-r-.04,-.9]],['B',[r+.05,-.9]],['C',[0,1.075]],['D',[-.081,-.748]],
        ['R',[.34,-.34]],['x',[.092,-.46]],['h',[-.091,.13]],
      ]) label(text,point);
    },
  },
  'zbior-2023-29-rozw-1': {
    bounds: [-10.7, 21.55, -1.65, 6.4],
    draw(api) { road(api, true, false); },
  },
  'zbior-2023-29-rozw-2': {
    bounds: [-10.7, 21.55, -1.65, 6.4],
    draw(api) { road(api, true, true); },
  },
  'zbior-2023-31-rozw': {
    width: 420,
    bounds: [-1.4, 1.4, -1.25, 1.26],
    draw({ circle, lines, segment, label, dot, accent, dashed }) {
      const y = -0.72;
      const r = Math.sqrt(1 - y*y);
      circle([0, 0], 1);
      lines([[-r, y], [0, 1], [r, y], [-r, y]], { color: accent });
      segment([0, 1], [0, y], dashed);
      segment([0, 0], [r, y]);
      dot([0, 0], { size: 3 });
      label('1', [-0.1, 0.49]);
      label('1', [0.39, -0.23]);
      label('x', [-0.1, -0.37]);
      label('r', [r / 2, y - 0.12]);
    },
  },
  'zbior-2023-32-1-rozw': {
    width: 430,
    bounds: [-2.3, 1.86, -.53, 4.46],
    draw({ circle, lines, segment, label, ellipse, angleSquare, dimension, accent, dashed, ink }) {
      const h=4, r=Math.SQRT2, o=[0,1],p=[0,0],a=[r,0],s=[0,h];
      const b=a.map((value,i) => value + .3333333333*(s[i]-value));
      ellipse([0,0],r,.22,0,Math.PI,{...dashed,thickness:3,layer:1});
      ellipse([0,0],r,.22,Math.PI,2*Math.PI,{color:accent,thickness:3,layer:1});
      lines([[-r,0],s,a],{color:accent});
      circle(o,1);
      ellipse(o,1,.145,0,2*Math.PI,{color:ink,lineType:1,thickness:2});
      segment(s,p,{thickness:2,lineType:1});
      segment(o,b,{thickness:2});
      segment(p,a,{thickness:2});
      angleSquare(b,o,s,.1);
      angleSquare(p,a,o,.1);
      dimension([-1.63,0],[-1.63,h],'h',[-1.84,h/2]);
      for(const [text,point] of [
        ['S',[0,4.13]],['P',[0,-.13]],['O',[-.09,.98]],['B',[b[0]+.11,b[1]+.07]],['A',[r+.1,.02]],
        ['r',[r/2,-.1]],['1',[.46,1.04]],['1',[-.09,.51]],
      ]) label(text,point);
    },
  },
};

function triangleWithParallels({ lines, segment, label, dashed }, construction) {
  const a = [0, 0];
  const b = [10, 0];
  const c = [3.65, 6.22];
  const k = [3, 0];
  const m = [8, 0];
  const l = [k[0] + c[0] * 0.7, c[1] * 0.7];
  const n = [c[0] * 0.8, c[1] * 0.8];
  const d = [k[0] + (m[0] - k[0]) * c[0] / b[0], (m[0] - k[0]) * c[1] / b[0]];
  lines([a, b, c, a]);
  segment(k, l, dashed);
  segment(n, m, dashed);
  for (const [name, [x, y], dx, dy] of [
    ['A', a, -.22, -.31], ['B', b, .23, -.31], ['C', c, .02, .26], ['K', k, .03, -.3],
    ['L', l, .23, .05], ['M', m, .08, -.3], ['N', n, -.24, .06], ['D', d, .08, -.28],
  ]) label(name, [x + dx, y + dy]);
  if (construction) {
    const q = [c[0] * d[1] / c[1], d[1]];
    const p = [10 - (10-c[0]) * d[1] / c[1], d[1]];
    segment(q, p, dashed);
    label('Q', [q[0] - 0.29, q[1] + 0.1]);
    label('P', [p[0] + 0.25, p[1] + 0.14]);
  }
}

function road({ segment, angleSquare, dimension, label, accent, dashed }, solution = false, fromStart = false) {
  const foot = [0, 0];
  const home = [0, 5];
  const start = [12, 0];
  segment([-10, 0], [21, 0], { color: accent, thickness: 12 });
  segment([-10, 0], [21, 0], { color: [255, 255, 255], lineType: 1, thickness: 2 });
  segment(foot, home);
  segment(start, home, { thickness: 3, lineType: solution ? 1 : 0 });
  angleSquare(foot, start, home, 0.66);
  label('D', [0.25, 5.48]);
  label('A', [12.45, 0.43]);
  label('5\\ \\mathrm{km}', [-1.45, 2.61]);
  label('13\\ \\mathrm{km}', [6.9, 3.45]);
  if (!solution) return;
  label('P', [-0.47, -0.57]);
  segment([5, 0], home, { ...dashed, lineType: 0 });
  dimension([0, -0.65], [5, -0.65], fromStart ? '12-x' : 'x', [2.5, -1.11]);
  dimension([5, -0.65], [12, -0.65], fromStart ? 'x' : '12-x', [8.5, -1.11]);
}

Object.assign(window.figureDefinitions, bookFigures);
