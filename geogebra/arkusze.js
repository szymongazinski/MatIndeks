const examFigures = {};

function exam(id, bounds, draw, width = 590) {
  examFigures[id] = { bounds, draw, width };
}

function between(a, b, t) {
  return a.map((value, i) => value + t * (b[i] - value));
}

function intersection(a, b, c, d) {
  const [u, v] = b.map((x, i) => x - a[i]);
  const [p, q] = d.map((x, i) => x - c[i]);
  const [e, f] = c.map((x, i) => x - a[i]);
  return between(a, b, (e * q - f * p) / (u * q - v * p));
}

function offset([x, y], dx, dy) {
  return [x + dx, y + dy];
}

function polar(center, radius, radians) {
  return offset(center, radius * Math.cos(radians), radius * Math.sin(radians));
}

function incenter(a, b, c) {
  const [la, lb, lc] = [[b, c], [a, c], [a, b]].map(([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1]));
  return a.map((x, i) => (x * la + b[i] * lb + c[i] * lc) / (la + lb + lc));
}

function project(p, a, b) {
  const v = b.map((x, i) => x - a[i]);
  const u = p.map((x, i) => x - a[i]);
  return between(a, b, (u[0] * v[0] + u[1] * v[1]) / (v[0] ** 2 + v[1] ** 2));
}

function reflect(p, a, b) {
  return between(p, project(p, a, b), 2);
}

function labels(api, entries) {
  entries.forEach(([text, [x, y], dx = 0, dy = 0]) => api.label(text, [x + dx, y + dy]));
}

function circularAngle(api, center, a, b, radius, label) {
  const start = Math.atan2(a[1] - center[1], a[0] - center[0]);
  const end = Math.atan2(b[1] - center[1], b[0] - center[0]);
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  api.arc(center, radius, Math.min(start, start + delta), Math.max(start, start + delta), { thickness: 2 });
  if (label) api.label(label, polar(center, radius * 1.28, start + delta / 2));
}

function prism(api, { a = [0, 0], b = [5, 0], depth = [1.6, 1.4], height = 4.6, triangular = false } = {}) {
  const d = offset(a, ...depth);
  const c = triangular ? offset(between(a, b, 0.5), ...depth) : offset(b, ...depth);
  const base = triangular ? [a, b, c] : [a, b, c, d];
  const upper = base.map(([x, y]) => [x, y + height]);
  const [e, f, g, h] = upper;
  const hidden = triangular ? 2 : 3;
  api.lines([...upper, e]);
  api.segment(a, b);
  if (!triangular) api.segment(b, c);
  api.lines(triangular ? [a, c, b] : [a, d, c], { lineType: 1, thickness: 3 });
  base.forEach((point, i) => api.segment(point, upper[i], i === hidden ? { lineType: 1, thickness: 3 } : {}));
  const names = triangular ? 'ABCDEF' : 'ABCDEFGH';
  const offsets = triangular
    ? [[-.19,-.28],[.22,-.28],[.23,.05],[-.19,.04],[.25,-.1],[.02,.26]]
    : [[-.18,-.23],[.15,-.25],[.24,.03],[-.26,.04],[-.18,.04],[.06,-.25],[.2,.08],[.02,.25]];
  labels(api, [...base, ...upper].map((point, i) => [names[i], point, ...offsets[i]]));
  return triangular ? { a, b, c, d:e, e:f, f:g } : { a,b,c,d,e,f,g,h };
}

exam('2015-05-1', [-9, 14.4, -1.4, 1.78], api => {
  api.vector([-8.4,0],[13.81,0],{thickness:3});
  api.lines([[-1,0],[-1,.59],[8.66,.59],[8.66,0]],{color:api.accent});
  api.dot([-1,0],{size:4});
  api.dot([8.66,0],{size:4});
  api.segment([3.83,-.11],[3.83,.11],{thickness:2});
  labels(api,[['-1',[-1,-.46]],['k',[8.66,-.46]],['x',[13.79,-.46]]]);
}, 700);

exam('2015-05-9', [-1.3, 12.7, -1.8, 12.2], api => {
  const center = [5.8, 5.4];
  const radius = 5.6;
  const [a,b,c,d] = [178,225,292,12].map(degrees => polar(center, radius, degrees * Math.PI / 180));
  const quad = [a,b,c,d];
  api.circle(center, radius);
  api.lines([...quad, a]);
  const bisectors = quad.map((vertex, i) => {
    const prev = quad[(i + 3) % 4];
    const next = quad[(i + 1) % 4];
    const dist = point => Math.hypot(point[0] - vertex[0], point[1] - vertex[1]);
    const arm = between(between(vertex, prev, 4 / dist(prev)), between(vertex, next, 4 / dist(next)), 0.5);
    api.segment(vertex, between(vertex, arm, 3.15), { color: api.gray, thickness: 2 });
    return [vertex, arm];
  });
  const [p,q,r,s] = [[0,1],[0,3],[2,3],[1,2]].map(([i,j]) => intersection(...bisectors[i], ...bisectors[j]));
  api.lines([p,q,r,s,p], { color: api.accent, thickness: 3 });
  labels(api, [['A',a,-.27,-.16],['B',b,-.2,-.32],['C',c,.12,-.43],['D',d,.26,.02],
    ['P',p,-.35,.06],['Q',q,-.10,-.29],['R',r,.31,.03],['S',s,.03,.29]]);
});

exam('2015-06-9', [-2.75, 5.35, -1.02, 6.92], api => {
  const c = [0, 0];
  const top = 4.8;
  const a = [top / Math.tan(50 * Math.PI / 180), top];
  const b = [top / Math.tan(110 * Math.PI / 180), top];
  const d = between(a, b, 0.59);
  const e = between(c, a, .29);
  const g = between(c, b, .53);
  const circle = points => 'Circle(' + points.map(point => '(' + point.join(',') + ')').join(',') + ')';
  api.create(circle([a,d,e]));
  api.create(circle([b,d,g]));
  const centers = [[a,d,e],[b,d,g]].map(([x,y,z]) => {
    const m = between(x,y,.5);
    const n = between(y,z,.5);
    return intersection(m, offset(m, x[1]-y[1],y[0]-x[0]), n, offset(n,y[1]-z[1],z[0]-y[0]));
  });
  const f = reflect(d, ...centers);
  api.lines([a,b,c,a]);
  circularAngle(api, a, b, c, .65, '50^{\\circ}');
  circularAngle(api, c, a, b, .75, '60^{\\circ}');
  labels(api, [['A',a,.19,.06],['B',b,-.23,.05],['C',c,0,-.31],['D',d,-.09,.28],['E',e,.23,-.03],['F',f,.22,-.20],['G',g,-.23,-.15]]);
});

exam('2015-przykladowy-10', [-6.5, 6.5, -6.5, 6.5], api => {
  const r = 5;
  const points = Array.from({ length: 24 }, (_, i) => polar([0,0],r,(2-i) * Math.PI / 12));
  api.circle([0,0],r);
  points.forEach((point, i) => {
    api.dot(point, { size: 3 });
    api.label('P_{' + (i + 1) + '}', polar([0,0],5.52,(2-i) * Math.PI / 12));
  });
  const p = points[10], q = points[21], s = points[0], t = points[15];
  api.segment(p,q, { color: api.accent });
  api.segment(s,t, { color: api.accent });
  const a = intersection(p,q,s,t);
  api.label('A', offset(a,.26,.07));
});

exam('2015-przykladowy-15', [-.7, 7.05, -.9, 8.55], api => {
  const a=[0,0], b=[4.6,0], c=[6.22,2], d=[1.62,2], s=[3.11,7.65];
  api.lines([a,b,c,s,a]);
  api.segment(s,b);
  api.lines([a,d,c], api.dashed);
  api.segment(d,s,api.dashed);
  circularAngle(api,b,c,s,0.81,'\\alpha');
  api.label('a', [2.2,-.33]);
});

exam('2015-przykladowy-16', [-.8, 10.8, -.85, 8.45], api => {
  const a=[0,0], b=[10,0], c=[5.6,7.4];
  const l=between(a,c,.25), m=between(a,b,1/3);
  const s=intersection(l,b,m,c), k=intersection(a,s,b,c);
  api.lines([a,b,c,a]);
  [[l,b],[m,c],[a,k]].forEach(([p,q]) => api.segment(p,q,{ color: api.accent, thickness: 3 }));
  labels(api,[['A',a,-.2,-.28],['B',b,.2,-.28],['C',c,.02,.25],['L',l,-.24,.1],['M',m,.02,-.27],['S',s,.23,.18],['K',k,.24,.09]]);
});

exam('2015-przykladowy-18', [-.68, 8.7, -.65, 5.65], api => {
  const corner = .98;
  for (const [x,y] of [[0,0],[8-corner,0],[8-corner,5-corner],[0,5-corner]]) {
    api.polygon([[x,y],[x+corner,y],[x+corner,y+corner],[x,y+corner]], { color: api.gray, fill: .68 });
  }
  api.lines([[0,0],[8,0],[8,5],[0,5],[0,0]]);
  api.lines([[corner,corner],[8-corner,corner],[8-corner,5-corner],[corner,5-corner],[corner,corner]], api.dashed);
  api.label('80\\ \\mathrm{cm}',[4,-.34]);
  api.label('50',[8.39,2.58]);
  api.label('\\mathrm{cm}',[8.39,2.25]);
});

exam('2016-05-9', [-.7, 9.3, -.65, 6.25], api => {
  const a=[0,0], b=[8.6,0], c=[8.6,5.6], d=[0,5.6];
  const s=incenter(a,b,d), o=incenter(b,c,d);
  const m=[0,s[1]], n=project(o,d,b);
  api.lines([a,b,c,d,a]);
  api.segment(d,b);
  api.segment(m,n,{ color: api.accent });
  api.circle(s,s[1]);
  api.circle(o,s[1]);
  api.dot(s,{ size: 3 });
  labels(api,[['A',a,-.21,-.27],['B',b,.19,-.26],['C',c,.21,.16],['D',d,-.23,.16],['M',m,-.25,.06],['N',n,.19,-.22],['S',s,.02,-.25]]);
});

exam('2016-05-3', [-3.5, 8.37, -3.84, 8.35], api => {
  const dashes={color:api.gray,lineType:1,thickness:3};
  api.axes(-3.2,8.05,-3.55,8.01,false);
  api.segment([-3.2,2],[7.9,2],dashes);
  api.segment([3,-3.55],[3,7.85],dashes);
  api.curve('t','2+3/(t-3)',-3.15,2.46,{color:api.accent,thickness:4});
  api.curve('t','2+3/(t-3)',3.51,7.92,{color:api.accent,thickness:4});
  for(let i=-2;i<=7;i++){
    if(!i) continue;
    api.segment([i,-.1],[i,.1],{thickness:2});
    api.segment([-.1,i],[.1,i],{thickness:2});
    api.label(String(i),[i,-.29]);
    api.label(String(i),[-.23,i]);
  }
}, 480);

exam('2016-05-16', [-3.15, 3.21, -1.35, 2.7], api => {
  api.axes(-2.85,2.93,-.98,2.36,false);
  api.curve('t','2-t^2/2',-2.56,2.56,{ color: api.accent });
  const a=[-2,0], b=[2,0], c=[1.32,2-1.32**2/2], d=[-1.32,c[1]];
  api.lines([a,b,c,d,a],{ color: api.accent, thickness: 3 });
  labels(api,[['A',a,-.18,.14],['B',b,.19,.14],['C',c,.12,.21],['D',d,-.11,.21],
    ['-2',a,0,-.16],['2',b,0,-.16],['-1',[-1,-.16]],['1',[1,-.16]],['1',[-.16,1]],['2',[-.16,2]]]);
});

exam('2016-06-11', [-.75, 7.8, -.7, 7.05], api => {
  const box=prism(api);
  const k=between(box.b,box.f,.5);
  const p=between(box.b,box.h,.25);
  api.polygon([box.a,k,box.c],{ color: api.pale, fill: .27, thickness: 2, layer:1 });
  api.segment(box.b,box.h,api.dashed);
  api.dot(p,{ color: api.accent, size: 3 });
  labels(api,[['K',k,.24,.09],['P',p,.17,-.22]]);
});

exam('2016-06-3', [-.93, 20.93, -1.04, 5.83], api => {
  const a=[0,0],b=[20,0];
  const horizontal=(100+20**2-144)/40;
  const h=Math.sqrt(100-horizontal**2);
  const c=[horizontal,h],d=[Math.sqrt(36-h*h),h];
  api.lines([a,b,c,d,a]);
  api.segment(a,c,{color:api.accent});
  circularAngle(api,a,c,d,3.02,'\\alpha');
  circularAngle(api,b,c,a,3.38,'\\alpha');
  labels(api,[['A',a,-.4,-.29],['B',b,.32,-.28],['C',c,.17,.33],['D',d,-.26,.3],
    ['6',between(a,d,.61),-.44,.02],['10',between(a,c,.6),.29,-.53],['12',between(b,c,.5),.14,.43]]);
}, 690);

exam('2017-05-3', [-2.42, 5.97, -.62, 4.79], api => {
  const a=[-2,0],d=[0,0],c=[0,2],b=[2*Math.sqrt(3),0];
  const k=between(c,a,Math.SQRT1_2),l=between(c,b,.5),m=polar(c,2,1.88);
  api.circle(c,2);
  api.lines([a,b,c,a]);
  api.segment(c,d,api.dashed);
  api.lines([k,m,l],{color:api.accent});
  api.angleSquare(d,c,b,.25);
  circularAngle(api,m,k,l,.66,'\\alpha');
  labels(api,[['A',a,-.18,-.26],['B',b,.18,-.26],['C',c,.24,.18],['D',d,-.12,-.26],
    ['K',k,-.28,.01],['L',l,.24,.04],['M',m,.01,.27]]);
});

exam('2017-06-8', [-.64, 8.45, -.65, 7], api => {
  const a=[0,0], b=[7.8,0], c=[5.8,6.3], s=incenter(a,b,c);
  const e=intersection(b,s,a,c),d=intersection(a,s,b,c);
  api.lines([a,b,c,a]);
  api.segment(a,d,{ color: api.accent });
  api.segment(b,e,{ color: api.accent });
  labels(api,[['A',a,-.2,-.2],['B',b,.22,-.2],['C',c,.08,.27],['S',s,.16,-.25],['E',e,-.21,.12],['D',d,.23,.1]]);
  circularAngle(api,a,b,c,.91,'\\alpha');
  circularAngle(api,b,a,c,.87,'\\beta');
  circularAngle(api,c,a,b,.97,'\\gamma');
});

exam('2018-05-7', [-.7, 8.6, -.7, 7.8], api => {
  const a=[0,0],b=[8,0],c=[6.45,7.1],s=incenter(a,b,c);
  const k=intersection(c,s,a,b), l=reflect(k,a,s), m=reflect(l,c,s), n=reflect(m,b,s);
  api.lines([a,b,c,a]);
  api.lines([k,n,m,l,k], { color: api.accent });
  labels(api,[['A',a,-.2,-.25],['B',b,.2,-.25],['C',c,.02,.22],['K',k,-.1,-.27],['L',l,-.23,.1],['M',m,.25,.03],['N',n,.04,-.28]]);
});

exam('2018-05-10', [-3.22, 3.22, -1.65, 6.3], api => {
  const r=2.05,R=2.68,H=5.42;
  api.ellipse([0,H], r,.74,0,2*Math.PI, { color: api.accent });
  api.ellipse([0,0], R,1.04,0,2*Math.PI,{ color: api.accent });
  api.segment([-R,0],[-r,H]);
  api.segment([R,0],[r,H]);
  api.segment([0,H],[r,H],{ thickness: 3 });
  api.segment([0,0],[R,0],{ thickness: 3 });
  api.label('r',[.85,H+.26]);
  api.label('R',[1.25,.27]);
}, 420);

function skeleton(api) {
  const width=6.7, side=4.57, rail=.65;
  const project=(x,y,z)=>[x+y*.59,z+y*.68];
  const stroke={color:api.ink,thickness:2,fill:1,layer:1};
  const front={...stroke,color:[244,241,248]};
  const right={...stroke,color:[226,220,237]};
  const top={...stroke,color:[235,229,242]};
  function beam(x,y,z,dx,dy,dz) {
    const vertices=[[x,y,z],[x+dx,y,z],[x+dx,y+dy,z],[x,y+dy,z],
      [x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]]
      .map(coordinates=>project(...coordinates));
    for(const [face,style] of [[[0,1,5,4],front],[[1,2,6,5],right],[[4,5,6,7],top]]) {
      const outline=face.map(i=>vertices[i]);
      api.polygon(outline,style);
      api.lines([...outline,outline[0]],{color:api.ink,thickness:2,layer:1});
    }
  }
  // Four vertical posts and eight crosspieces. Add the rear pieces first.
  for (const x of [0,width-rail]) beam(x,side-rail,rail,rail,rail,side-2*rail);
  for (const z of [0,side-rail]) beam(0,side-rail,z,width,rail,rail);
  for (const x of [0,width-rail]) for(const z of [0,side-rail]) {
    beam(x,rail,z,rail,side-2*rail,rail);
  }
  for (const x of [0,width-rail]) beam(x,0,rail,rail,rail,side-2*rail);
  for (const z of [0,side-rail]) beam(0,0,z,width,rail,rail);
  const backLeft=project(0,side,side),backRight=project(width,side,side),backBottom=project(width,side,0);
  const frontLeft=project(0,0,side);
  api.dimension(offset(backLeft,0,.47),offset(backRight,0,.47),'10-2x',[(backLeft[0]+backRight[0])/2,backLeft[1]+.78]);
  api.dimension(offset(backBottom,.46,0),offset(backRight,.46,0),'6',[backRight[0]+.75,(backBottom[1]+backRight[1])/2]);
  api.dimension(offset(frontLeft,-.49,.18),offset(backLeft,-.49,.18),'6',[(frontLeft[0]+backLeft[0])/2-.62,(frontLeft[1]+backLeft[1])/2+.23]);
  api.dimension([0,-.43],[rail,-.43],'x',[rail/2,-.74]);
  api.dimension([-.46,0],[-.46,rail],'x',[-.71,rail/2]);
}

exam('2018-06-15', [-1.14, 10.6, -1.03, 8.85], skeleton);
exam('2020-04-15', [-1.14, 10.6, -1.03, 8.85], skeleton);

exam('2019-06-8', [-.66, 9.25, -1.4, 5.55], api => {
  const a=[0,0], b=[4.1,-.95], c=[8.65,.04], d=[5.82,5];
  const angleRay=(u,v,w)=> {
    const np=Math.hypot(v[0]-u[0], v[1]-u[1]);
    const nq=Math.hypot(w[0]-u[0], w[1]-u[1]);
    return between(between(u,v,2/np),between(u,w,2/nq),.5);
  };
  const e=intersection(a,angleRay(a,b,d),c,angleRay(c,b,d));
  api.lines([a,b,c,d,a]);
  api.lines([a,e,c],{color:api.accent});
  api.segment(a,c,{ lineType:1, thickness:2 });
  labels(api,[['A',a,-.23,-.04],['B',b,.09,-.25],['C',c,.21,-.07],['D',d,.02,.21],['E',e,.02,.22]]);
});

exam('2019-05-3', [-5.44, 7.58, -1.48, 5.35], api => {
  const a=[-1,0],b=[1,2],c=[3,0],d=[-4,3],e=[6,3];
  api.axes(-5.18,7.23,-1.2,5.05);
  api.lines([[-5.1,4.1],a,b,c,[7.1,4.1]],{color:api.accent,thickness:5});
  [a,b,c,d,e].forEach(point=>api.dot(point,{size:3,color:api.accent}));
  labels(api,[['A',a,-.21,-.46],['B',b,.17,.29],['C',c,.22,-.42],['D',d,-.13,.36],['E',e,-.21,.3]]);
}, 690);

exam('2019-06-11', [-.8, 9.4, -.9, 7.25], api => {
  const a=[0,0.8], b=[5,.05], c=[8.66,2.12], s=[4.38,6.65], d=between(b,s,.4), e=between(c,s,.4);
  api.lines([a,b,c,s,a]);
  api.segment(s,b);
  api.segment(a,c,api.dashed);
  api.polygon([a,d,e],{ color: api.pale, fill: .32, thickness: 3 });
  labels(api,[['A',a,-.21,.04],['B',b,.09,-.25],['C',c,.23,-.02],['S',s,.03,.26],['D',d,-.28,.1],['E',e,.2,.11],
    ['6',between(a,b,.5),0,-.27],['6',between(b,c,.5),.12,-.29],['6',between(a,c,.5),.04,-.15],['4',between(d,e,.6),.1,-.23]]);
});

exam('2020-06-7', [-.68, 9.27, -.65, 5.65], api => {
  const a=[0,0],b=[8.6,0],d=[4.3,0];
  const c=[4.3, 4.3*Math.sqrt(5/4)];
  const r=c[1]*2/3;
  const k=between(c,a,1/3),l=between(c,b,1/3);
  const m=project(d,a,c);
  api.lines([a,b,c,a]);
  api.segment(k,l,{ color:api.accent });
  api.arc(d,r,0,Math.PI,{ color:api.accent });
  labels(api,[['A',a,-.22,-.27],['B',b,.21,-.27],['C',c,.02,.22],['D',d,0,-.26],
    ['M',m,-.27,-.12],['K',k,-.20,.12],['L',l,.20,.12]]);
});

exam('2020-06-15', [-.78, 9.65, -.65, 10.7], api => {
  const a=[0,0],b=[5.7,0],c=[5.7,10],d=[0,10];
  const screen=[[.58,1],[5.12,1],[5.12,9],[.58,9]];
  api.polygon(screen,{ color:api.gray, fill:.66, thickness:3 });
  api.lines([a,b,c,d,a]);
  api.dimension([2.6,9],[2.6,10],'0{,}5\\ \\mathrm{cm}',[3.65,9.54]);
  api.dimension([2.6,0],[2.6,1],'0{,}5\\ \\mathrm{cm}',[3.65,.6]);
  api.dimension([0,5.9],[.58,5.9],'0{,}3\\ \\mathrm{cm}',[1.3,6.23]);
  api.dimension([5.12,5.9],[5.7,5.9],'0{,}3\\ \\mathrm{cm}',[4.35,6.23]);
  for (const [y,text,x] of [[9.88,'brzeg',5.72],[8.5,'obramowanie',5.55],[7.15,'ekran',4.85]]) {
    api.vector([7,y],[x,y],{ thickness: 2 });
    api.label(text,[7.86,y],{math:false});
  }
});

exam('2020-07-14', [-.65, 9.76, -.72, 3.9], api => {
  const a=[0,1.45],b=[4.5,0],c=[9,1.45],d=[4.5,2.9];
  const n=between(a,b,2/3), m=between(c,d,2/3);
  api.lines([a,b,c,d,a]);
  api.segment(d,b,api.dashed);
  api.segment(d,n,{ color: api.accent });
  api.segment(m,b,{ color: api.accent });
  labels(api,[['A',a,-.21,0],['B',b,.02,-.25],['C',c,.23,0],['D',d,0,.24],['M',m,.03,.25],['N',n,0,-.23]]);
});

exam('2021-03-8', [-.75, 6.75, -.8, 7.55], api => {
  const a=[0,5],b=[5,5],d=[5,0],e=[0,0], c=polar([2.5,5],2.5,Math.PI/3.15);
  api.lines([a,b,d,e,a]);
  api.lines([a,c,b],{ color: api.accent });
  api.angleSquare(c,a,b,.32);
  labels(api,[['A',a,-.22,.04],['B',b,.22,.05],['C',c,.03,.24],['D',d,.24,-.07],['E',e,-.23,-.07]]);
});

exam('2021-03-11', [-.7, 6.3, -.65, 7.3], api => {
  const {a,b,f}=prism(api,{ height: 4.6, depth:[1.35,1.92], triangular:true });
  api.lines([a,f,b],{ color: api.accent });
});

exam('2021-03-15', [-3.9, 3.95, -.93, 4.5], api => {
  api.axes(-3.55,3.59,-.72,4.25,false);
  for (const x of [-3,-2,-1,1,2,3]) {
    api.segment([x,-.07],[x,.07],{ thickness:2 });
    api.label(String(x),[x,-.14]);
  }
  for (const y of [1,2,3,4]) {
    api.segment([-.07,y],[.07,y],{ thickness:2 });
    api.label(String(y),[-.15,y]);
  }
  const a=[1.26,9/1.26**4],b=[-1.26,a[1]],c=[0,-1/3];
  const edge=(9/4.22)**.25;
  api.curve('t','9/t^4',-3.48,-edge,{ color: api.accent });
  api.curve('t','9/t^4',edge,3.48,{ color: api.accent });
  api.lines([a,b,c,a],api.dashed);
  labels(api,[['A',a,.17,.08],['B',b,-.17,.08],['C',c,.16,-.11],['y=f(x)',[2.45,1.19]]]);
});

exam('2021-05-8', [-.73, 8.75, -.65, 7.74], api => {
  const a=[0,0],b=[8,0],c=[4,4*Math.sqrt(3)];
  const d=between(b,a,1/3),e=between(a,c,1/3);
  const p=intersection(c,d,b,e);
  api.lines([a,b,c,a]);
  api.segment(c,d,{ color:api.accent });
  api.segment(b,e,{ color:api.accent });
  labels(api,[['A',a,-.19,-.24],['B',b,.2,-.24],['C',c,0,.24],['D',d,.02,-.28],['E',e,-.27,.1],['P',p,.2,.19]]);
});

exam('2021-05-2', [-3.8*Math.PI, 3.9*Math.PI, -1.93, 4.38], api => {
  const pi = Math.PI;
  const xMin = -3.55*pi,xMax=3.55*pi,yMin=-1.6,yMax=3.85;
  const grid={color:api.gray,thickness:1,layer:0};
  for(let i=-7;i<=7;i++){
    const x=i*pi/2;
    api.segment([x,yMin],[x,yMax],grid);
    if(i && i%2===0){
      const m=i/2;
      api.label((m<0?'-':'')+(Math.abs(m)===1?'':Math.abs(m))+'\\pi',[x,-.57]);
    }
  }
  for(let i=-1;i<=3;i++) if(i) {
    api.segment([xMin,i],[xMax,i],grid);
    api.label(String(i),[-.42,i]);
  }
  api.axes(xMin-.34,xMax+.47,yMin-.16,yMax+.18,false);
  api.curve('t','(abs(cos(t))-2)/(cos(t)-2)',-3.56*pi,3.56*pi,{color:api.accent,thickness:5});
}, 920);

exam('2021-05-14', [-4.2, 4.37, -1.36, 8.14], api => {
  const a=[0,2],b=[1,3];
  api.axes(-3.85,4.02,-1.1,7.8);
  api.curve('t','t^2',-2.76,2.76,{color:api.accent,thickness:5});
  api.dot(a,{size:4});
  api.dot(b,{size:4});
  labels(api,[['A',a,.26,-.11],['B',b,.24,.22]]);
});

exam('2021-06-7', [-.78, 11.28, -.68, 5.38], api => {
  const a=[0,0],b=[10.5,0],c=[6.95,4.72],d=[3,0],e=[6,0],f=[9,0];
  const g=intersection(a,c,d,offset(d,c[0]-e[0],c[1]-e[1]));
  const h=intersection(b,c,f,offset(f,c[0]-e[0],c[1]-e[1]));
  api.lines([a,b,c,a]);
  for(const [p,q] of [[d,g],[e,c],[f,h]]) api.segment(p,q,{ color: api.accent });
  labels(api,[['A',a,-.22,-.21],['B',b,.19,-.21],['C',c,.05,.23],['D',d,.02,-.29],['E',e,.02,-.29],['F',f,.02,-.29],['G',g,-.21,.16],['H',h,.17,.18]]);
});

exam('2021-06-4', [-3.83*Math.PI, 8.75*Math.PI, -2.75*Math.PI, 2.78*Math.PI], api => {
  const pi=Math.PI;
  const grid={ color:api.gray,thickness:1,layer:0 };
  for(let i=-3;i<=8;i++) {
    const x=i*pi;
    api.segment([x,-2.41*pi],[x,2.32*pi],grid);
    if(i && i!==-3 && i!==8) api.label((i<0?'-':'')+(Math.abs(i)===1?'':Math.abs(i))+'\\pi',[x,-.92]);
  }
  for(let i=-2;i<=2;i++) if(i) {
    const y=i*pi;
    api.segment([-3.2*pi,y],[8.16*pi,y],grid);
    api.label((i<0?'-':'')+(Math.abs(i)===1?'':Math.abs(i))+'\\pi',[-1.03,y]);
  }
  api.axes(-3.5*pi,8.48*pi,-2.55*pi,2.55*pi,false);
  api.curve('t','2*pi*sin(t/2)',-3*pi,8*pi,{color:api.accent,thickness:5});
}, 830);

exam('2021-06-10', [-.75, 7.44, -.75, 6.91], api => {
  const box=prism(api);
  const s=between(box.d,box.h,.5);
  api.lines([box.c,box.f,s,box.c],{color:api.accent});
  api.label('S',offset(s,-.26,.1));
  api.label('2',offset(between(box.a,box.b,.5),0,-.3));
  api.label('2',offset(between(box.a,box.e,.5),-.25,0));
  api.label('2',offset(between(box.e,box.h,.5),-.22,.18));
});

exam('2022-05-13', [-.78, 7.45, -.75, 7.32], api => {
  const box=prism(api,{height:5.4});
  api.polygon([box.a,box.f,box.h],{color:api.pale,fill:.23,thickness:3,layer:1});
  circularAngle(api,box.a,box.f,box.h,.6,'\\alpha');
  api.label('h',offset(between(box.d,box.h,.5),-.25,0));
});

exam('2022-06-12', [-.8, 9.5, -1.9, 7.15], api => {
  const a=[0,0],b=[8.6,0],c=[7.28,1.18],d=[1.32,1.18],o=[4.3,0],height=4.8;
  const top = p => offset(p,0,height);
  api.lines([top(a),top(b),top(c),top(d),top(a)]);
  api.lines([top(a),a,b,top(b)]);
  api.lines([a,d,c,b],api.dashed);
  api.segment(d,top(d),api.dashed);
  api.segment(c,top(c),api.dashed);
  api.ellipse(o,4.3,1.64,0,Math.PI,{lineType:1,thickness:3});
  api.ellipse(o,4.3,1.64,Math.PI,2*Math.PI,{thickness:3});
  api.lines([d,o,c],{ color:api.accent, thickness:3 });
  circularAngle(api,o,c,d,.8,'2\\alpha');
  labels(api,[['A',a,-.22,-.23],['B',b,.22,-.23],['C',c,.15,.1],['D',d,-.14,.25],
    ['A_1',top(a),-.25,.02],['B_1',top(b),.26,.03],['C_1',top(c),.08,.23],['D_1',top(d),-.13,.24],
    ['O',o,.03,-.27],['R',between(a,o,.5),.02,-.28],['R',between(o,b,.5),.02,-.28]]);
});

exam('2022-12-2', [-1.9, 12.32, -1.1, 8.55], api => {
  api.axes(-1.6,11.95,-.78,8.27,false);
  api.curve('t','abs(-t^2/4+3*t-5)',-.99,11.0,{color:api.accent,thickness:5});
  api.label('y=g(x)',[7.09,4.72]);
});

exam('2023-05-5', [-.72, 8.13, -.65, 5.35], api => {
  const a=[0,4],b=[0,0],c=[4*Math.sqrt(3),0], d=between(a,c,.25);
  const k=[0,1],l=[1,0],n=intersection(k,l,b,d);
  api.lines([a,b,c,a]);
  api.segment(b,d,{ color:api.accent });
  api.segment(k,l,{ color:api.accent });
  api.angleSquare(d,a,b,.27);
  api.angleSquare(b,a,c,.26);
  circularAngle(api,a,b,c,.7,'60^{\\circ}');
  labels(api,[['A',a,-.14,.19],['B',b,-.11,-.22],['C',c,.2,-.18],['K',k,-.23,.03],['L',l,.08,-.23],
    ['D',d,.09,.24],['N',n,.2,.08],['1',[0,.52],-.21,0],['1',[.52,0],0,-.21],['2',between(a,d,.52),.12,.22]]);
});

exam('2023-05-7', [-.8, 7.31, -.72, 7.03], api => {
  const box=prism(api);
  const s=between(box.a,box.h,.5);
  api.segment(box.a,box.h,api.dashed);
  api.segment(box.e,box.d,api.dashed);
  api.segment(box.b,box.h,api.dashed);
  api.segment(box.b,s,{ color:api.accent });
  api.dot(s,{color:api.accent,size:3});
  labels(api,[['S',s,-.26,.06],['6',between(box.a,box.b,.5),0,-.26]]);
});

exam('2023-05-10', [-.78, 8.77, -.68, 8.57], api => {
  let square=[[0,0],[8,0],[8,8],[0,8]];
  for(let i=0;i<16;i++){
    api.lines([...square,square[0]], i===0 ? {color:api.accent,thickness:4}:{color:api.accent,thickness:2});
    square=square.map((p,j)=>between(p,square[(j+1)%4],.25));
  }
  api.label('a',[4,-.33]);
  api.label('a',[8.33,4]);
});

exam('2023-05-13', [-.7, 4.45, -2.05, 3.58], api => {
  const a=[.5,-1.5],b=[1.5,-.5],o=[1,-1],c=[1.1,-.3];
  api.axes(-.41,4.24,-1.85,3.35,false);
  api.curve('t','4t^2-7t+1',-.26,2.0,{color:api.accent});
  api.segment([.08,-1.92],[3.95,1.95],{color:api.accent,thickness:3});
  api.circle(o,Math.SQRT1_2,{color:api.accent});
  api.segment(a,c,{ color: api.accent, thickness: 3 });
  circularAngle(api,a,b,c,.21,'\\alpha');
  labels(api,[['A',a,-.13,-.10],['B',b,.16,-.05],['C',c,-.08,.14],['1',[1,0],0,.14],['1',[0,1],-.12,.01],
    ['x-y-2=0',[2.8,1.05]],['y=4x^2-7x+1',[1.57,2.33]],['\\mathcal{O}',[1.82,-1.43]],['l',[3.99,2.13]]]);
});

exam('2023-06-6', [-.7, 10.62, -.6, 7.21], api => {
  const a=[0,0],r=6.9/Math.sqrt(5),o=[6.9,r],p=[6.9,0];
  const q=reflect(p,a,o),b=[o[0]*.8,0];
  const d=reflect(p,b,o),c=intersection(a,q,b,d);
  api.circle(o,r,{color:api.accent});
  api.lines([[9.4,0],a,between(a,q,1.22)],{ thickness:3 });
  api.segment(b,c,{ color:api.accent });
  labels(api,[['A',a,-.15,-.22],['B',b,-.02,-.24],['P',p,.03,-.24],['Q',q,-.21,.12],['D',d,.23,.04],
    ['C',c,-.21,.08],['\\mathcal{O}',[10.03,4.48]]]);
});

exam('2023-06-12', [-4.71, 4.85, -4.75, 4.73], api => {
  const b=[4,0],d=[-4,0],e=[-2,0];
  const direction=Math.acos(1/4);
  const a=polar(e,4,-direction);
  const c=polar(e,3,Math.PI-direction);
  api.circle([0,0],4,{color:api.accent});
  api.lines([a,b,c,d,a],{color:api.accent});
  api.segment(a,c);
  api.segment(b,d);
  api.angleSquare(a,b,d,.26);
  api.angleSquare(c,b,d,.26);
  labels(api,[['A',a,.02,-.28],['B',b,.24,.04],['C',c,.05,.28],['D',d,-.25,0],['E',e,-.08,.21]]);
});

exam('2023-06-13', [-.75, 7.7, -.76, 9], api => {
  const box=prism(api,{height:7.05});
  const o=between(box.a,box.c,.5);
  api.segment(box.a,box.c,api.dashed);
  api.segment(box.b,box.d,api.dashed);
  api.segment(o,box.h,{color:api.accent});
  labels(api,[['O',o,.24,-.17],['d',between(o,box.h,.5),.24,0]]);
});

exam('2023-przykladowy-6', [-3.65, 3.65, -.92, 5.13], api => {
  const f = x => x*x;
  const g = x => 4-(x-.5)**2/2;
  const a = (1-Math.sqrt(94))/6;
  const b = (1+Math.sqrt(94))/6;
  const grid = { color:api.gray, thickness:1, layer:0 };
  for(let x=-3; x<=3; x+=.5) api.segment([x,-.3],[x,4.55],grid);
  for(let y=.5; y<=4.5; y+=.5) api.segment([-3.28,y],[3.28,y],grid);
  const area = Array.from({length:49},(_,i)=>[a+(b-a)*i/48,0]);
  api.polygon([...area.map(([x])=>[x,f(x)]),...area.reverse().map(([x])=>[x,g(x)])],{
    color:[139,178,214],fill:.40,thickness:1,layer:1
  });
  api.axes(-3.32,3.34,-.55,4.8,false);
  api.curve('t','t^2',-2.1,2.1,{color:api.accent});
  api.curve('t','4-(t-0.5)^2/2',-2.12,2.31,{color:api.accent});
  api.dot([-1,1],{size:4});
  labels(api,[['P',[-1,1],-.22,-.22],['1',[1,0],0,-.25],['1',[0,1],-.18,0],
    ['y=g(x)',[-.6,3.57]],['y=f(x)',[2.12,1.43]]]);
});

exam('2023-przykladowy-8', [-6.25, 6.3, -6.4, 5.5], api => {
  const r=2.2,top=r*r/5;
  const a=[-5,0],b=[5,0],c=[top,2*r],d=[-top,2*r],s=[0,r];
  const y=(top*top+4*r*r-25)/(4*r);
  const o=[0,y],R=Math.hypot(5,y);
  api.circle(o,R);
  api.circle(s,r);
  api.lines([a,b,c,d,a],{color:api.accent,thickness:3});
  api.segment(a,c,{color:api.accent,thickness:3});
  const end=polar(o,R,-2.14);
  api.segment(o,end,{color:api.accent,thickness:3});
  api.dot(o,{size:3});
  labels(api,[['A',a,-.29,.07],['B',b,.29,.07],['C',c,.2,.21],['D',d,-.21,.21],
    ['d',between(a,c,.37),-.12,.28],['R',between(o,end,.55),.28,-.1]]);
});

exam('2024-05-9', [-.72, 6.7, -.71, 6.81], api => {
  const a=[0,0],b=[6,0],c=[6,6],d=[0,6],e=[3,6];
  const f=intersection(a,e,d,b),g=intersection(a,c,d,b);
  api.lines([a,b,c,d,a],{color:api.accent});
  api.segment(a,e,{color:api.accent,thickness:3});
  api.segment(a,c,{color:api.accent,thickness:3});
  api.segment(b,d,{color:api.accent,thickness:3});
  labels(api,[['A',a,-.13,-.22],['B',b,.16,-.22],['C',c,.16,.2],['D',d,-.15,.2],
    ['E',e,0,.22],['F',f,-.25,-.01],['G',g,.19,-.2],['a',[3,-.24]]]);
});

exam('2024-06-1', [-1.15, 7.78, -.7, 7.6], api => {
  const start=6.4, bottom=start/9;
  api.vector([0,0],[7.4,0],{thickness:3});
  api.vector([0,0],[0,7.25],{thickness:3});
  api.segment([0,bottom],[7.04,bottom],{color:api.pale,thickness:2,lineType:1});
  api.curve('t',bottom+'+(6.4-'+bottom+')*exp(-1.04*t)',0,7.04,{color:api.accent,thickness:4});
  for(let i=1;i<=9;i++) api.segment([-.06,i*bottom],[.06,i*bottom],{thickness:2});
  labels(api,[['0',[-.18,-.15]],['m',[.03,7.34]],['t',[7.36,-.22]],['m_0',[-.48,start]],
    ['\\frac{1}{9}m_0',[-.59,bottom]]]);
});

exam('2024-12-12', [-.75, 10.8, -.73, 7.18], api => {
  const a=[0,0],b=[10,0],d=[5,0],theta=34.5*Math.PI/180;
  const c=intersection(a,polar(a,1,2*theta),b,polar(b,1,Math.PI-theta));
  api.lines([a,b,c,a]);
  api.segment(c,d,{color:api.accent});
  circularAngle(api,a,b,c,1.25,'2\\alpha');
  circularAngle(api,b,c,a,1.4,'\\alpha');
  circularAngle(api,d,a,c,1,'\\beta');
  labels(api,[['A',a,-.14,-.19],['B',b,.17,-.19],['C',c,-.02,.26],['D',d,0,-.27]]);
});

exam('2024-12-13', [-2.22, 10.2, -2.72, 13.6], api => {
  const f=x=>(12*x-84)/(x-8);
  const o=[0,0],b=[7,0],c=[4.4,f(4.4)],d=[0,f(0)];
  api.axes(-1.88,9.72,-2.32,13.23,false);
  api.segment([8,-1.8],[8,12.45],{color:api.gray,lineType:1,thickness:2});
  api.segment([-1.78,12],[8.84,12],{color:api.gray,lineType:1,thickness:2});
  api.curve('t','(12*t-84)/(t-8)',-1.7,7.15,{color:api.accent,thickness:4});
  api.lines([o,b,c,d,o],{color:[59,111,155],thickness:4});
  labels(api,[['B',b,-.24,-.36],['C',c,.39,.14],['D',d,-.37,-.12],['1',[1,0],0,-.28],['1',[0,1],-.28,0],
    ['y=f(x)',[4.49,10.51]]]);
});

exam('2025-06-4', [-.75, 10.78, -.79, 5.85], api => {
  const a=[0,0],b=[10,0],c=[10,5],d=[0,5];
  const m=[2.2,5],n=[0,.6],l=[10,1.1],k=[9.45,0];
  api.lines([a,b,c,d,a]);
  api.lines([m,l,k,n,m],{color:api.accent});
  api.angleSquare(l,m,k,.29);
  api.angleSquare(m,l,n,.29);
  labels(api,[['A',a,-.16,-.22],['B',b,.17,-.23],['C',c,.16,.23],['D',d,-.17,.22],
    ['M',m,0,.23],['N',n,-.25,.05],['L',l,.26,.01],['K',k,-.17,-.22]]);
});

exam('2026-05-4', [-.76, 6.83, -.72, 6.8], api => {
  const a=[0,0],b=[6,0],c=[6,6],d=[0,6],k=[3,0],l=[6,3],m=[6,1.5];
  const p=intersection(a,l,d,k),q=intersection(a,l,d,m);
  api.lines([a,b,c,d,a]);
  api.lines([d,k,m],{color:api.accent});
  api.segment(d,m,{color:api.accent});
  api.segment(a,l,{color:api.accent});
  api.angleSquare(k,d,m,.34);
  labels(api,[['A',a,-.12,-.24],['B',b,.11,-.24],['C',c,.13,.22],['D',d,-.13,.22],
    ['K',k,.01,-.25],['L',l,.27,.1],['M',m,.26,0],['P',p,-.22,.16],['Q',q,.08,.22],['a',[0,3],-.25,.03]]);
});

exam('2026-05-11', [-1.76, 10.98, -3.09, 10.03], api => {
  const a=[0,0],b=[9,0],d=[5,5*Math.sqrt(3)];
  const dist=Math.hypot(d[0]-b[0],d[1]-b[1]);
  const x=(dist*dist+25-36)/(2*dist);
  const y=Math.sqrt(25-x*x);
  const u=between(b,d,x/dist);
  const c=offset(u,y*(d[1]-b[1])/dist,y*(b[0]-d[0])/dist);
  const inc=incenter(a,b,intersection(a,d,b,c));
  api.create('Circle((0,0),(9,0),(5,5*sqrt(3)))',{color:api.accent});
  api.circle(inc,inc[1],{color:api.accent});
  api.lines([a,b,c,d,a]);
  circularAngle(api,a,b,d,1.87,'60^{\\circ}');
  labels(api,[['A',a,-.26,-.21],['B',b,.25,-.2],['C',c,.25,.12],['D',d,.05,.29],
    ['9',[4.5,-.29]],['10',between(a,d,.57),-.31,.08]]);
});

exam('2026-05-12', [-6.8, 6.8, -1.42, 7.39], api => {
  const a=[-4,0],b=[4,0],c=[0,16/3];
  api.polygon([a,b,c],{color:api.gray,fill:.29,thickness:3});
  api.lines([a,b,c,a],{thickness:3});
  api.circle([0,2],2,{color:api.accent,lineType:1,thickness:3});
  api.lines([[-6.4,-.58],[-4.95,-.58],[-.66,5.37],[-.66,6.77]],{color:api.gray,thickness:3});
  api.lines([[6.4,-.58],[4.95,-.58],[.66,5.37],[.66,6.77]],{color:api.gray,thickness:3});
  api.label('x',[0,-.27]);
});

exam('2026-06-12', [-.96, 8.58, -1.67, 9.02], api => {
  const a=[0,0],b=[4.7,-.82],c=[7.88,.86],d=[3.18,1.68],s=[4.14,8.05];
  const k=between(a,d,.5),l=between(b,c,.5),m=between(c,s,.25),n=between(d,s,.25);
  api.polygon([k,l,m,n],{color:api.pale,fill:.33,thickness:3,layer:1});
  api.lines([a,b,c,s,a]);
  api.segment(b,s);
  api.lines([a,d,c],{thickness:3,lineType:1});
  api.segment(d,s,{thickness:3,lineType:1});
  api.lines([k,l,m,n,k],{color:api.accent,thickness:3});
  labels(api,[['A',a,-.21,-.23],['B',b,.04,-.34],['C',c,.28,.01],['D',d,-.12,-.26],['S',s,.08,.36],
    ['K',k,-.28,.09],['L',l,.29,-.14],['M',m,.28,.12],['N',n,-.21,.24]]);
});

Object.assign(window.figureDefinitions, examFigures);
