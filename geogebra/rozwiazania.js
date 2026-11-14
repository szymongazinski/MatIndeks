function construction2026May4(api) {
  const a=[0,0],b=[6,0],c=[6,6],d=[0,6],k=[3,0],l=[6,3],m=[6,1.5];
  const p=intersection(a,l,d,k),q=intersection(a,l,d,m);
  api.lines([a,b,c,d,a]);
  api.lines([d,k,m],{color:api.accent});
  api.segment(d,m,{color:api.accent});
  api.segment(a,l,{color:api.accent});
  api.angleSquare(k,d,m,.34);
  api.angleSquare(p,k,q,.27);
  labels(api,[['A',a,-.12,-.24],['B',b,.11,-.24],['C',c,.13,.22],['D',d,-.13,.22],
    ['K',k,.01,-.25],['L',l,.27,.1],['M',m,.26,0],['P',p,-.24,.22],['Q',q,.08,.22],
    ['a',[0,3],-.25,.03],['\\frac{1}{2}a',[6.51,4.57]],['\\frac{1}{2}a',[4.5,-.23]],['\\frac{1}{2}a',[1.5,-.23]]]);
  circularAngle(api,d,a,k,.75,'\\alpha');
  circularAngle(api,a,b,l,.81,'\\alpha');
}

function construction2026May9(api) {
  const a=[1,-1],b=[4,0],c=[2,1],m=[1.2,-.6],e=[1.6,-.8],d=[1.3,-.9];
  api.axes(-.31,4.82,-2.1,1.96,false);
  api.lines([a,b,c,a],{color:api.accent,thickness:4});
  api.segment(m,e,api.dashed);
  api.segment(d,m,api.dashed);
  [a,b,c,m,e,d].forEach(point=>api.dot(point,{size:3,color:api.accent}));
  labels(api,[['A',a,-.19,-.21],['B',b,.17,.17],['C',c,.19,.21],['D',d,.0,-.26],['E',e,.08,.19],['M',m,-.23,.08],
    ['x+2y-4=0',[3.72,.92]],['ME\\parallel BC',[2.82,-1.53]],['MD\\perp AB',[.63,-1.71]]]);
}

function construction2026May11(api) {
  const a=[0,0],b=[9,0],d=[5,5*Math.sqrt(3)];
  const dist=Math.hypot(d[0]-b[0],d[1]-b[1]);
  const x=(dist*dist+25-36)/(2*dist);
  const y=Math.sqrt(25-x*x);
  const u=between(b,d,x/dist);
  const c=offset(u,y*(d[1]-b[1])/dist,y*(b[0]-d[0])/dist);
  const center=incenter(a,b,intersection(a,d,b,c));
  api.create('Circle((0,0),(9,0),(5,5*sqrt(3)))',{color:api.accent});
  api.circle(center,center[1],{color:api.accent});
  api.lines([a,b,c,d,a]);
  api.segment(b,d,{color:api.accent});
  circularAngle(api,a,b,d,1.87,'60^{\\circ}');
  circularAngle(api,c,d,b,1.12,'120^{\\circ}');
  labels(api,[['A',a,-.26,-.21],['B',b,.25,-.2],['C',c,.25,.12],['D',d,.05,.29],
    ['9',[4.5,-.29]],['10',between(a,d,.57),-.31,.08],['d',between(b,d,.53),-.36,0],
    ['x',between(b,c,.4),.31,.02],['y',between(c,d,.4),.21,.25]]);
}

function construction2026May12(api) {
  const a=[-4,0],b=[4,0],c=[0,16/3],s=[0,2],d=[0,0],e=project(s,a,c);
  api.lines([a,b,c,a]);
  api.circle(s,2,{color:api.accent});
  api.segment(c,d,api.dashed);
  api.segment(e,s,api.dashed);
  api.angleSquare(e,c,s,.16);
  labels(api,[['A',a,-.18,-.24],['B',b,.2,-.24],['C',c,.02,.24],['D',d,0,-.22],['E',e,-.22,.18],
    ['S',s,.25,.05],['b',between(a,c,.48),-.3,.06],['b',between(b,c,.45),.24,.25],
    ['2',between(e,s,.5),.02,.2],['2',[.24,1]],['h-2',[.54,3.31]],
    ['\\frac{x}{2}',[-2,-.23]],['\\frac{x}{2}',[2,-.23]]]);
}

function construction2026June5(api, withBoth) {
  const a=[-2,0],b=[2,0],c=[0,5.05],d=[0,0],k=[0,1.63];
  const l=project(k,b,c);
  const m=intersection(k,l,a,b);
  const o=between(c,m,.5);
  const radius=Math.hypot(c[0]-o[0],c[1]-o[1]);
  api.circle(o,radius,{color:[91,130,58],thickness:3});
  if (withBoth) {
    const asText=point=>'('+point.join(',')+')';
    api.create('Circle('+[m,a,c].map(asText).join(',')+')',{color:[185,91,104],thickness:3});
    api.segment(c,a,api.dashed);
    api.segment(a,k,api.dashed);
  }
  api.lines([a,b,c,a]);
  api.segment(d,c);
  api.vector(offset(m,-.5,-.2),offset(l,3.33,1.32),{thickness:3});
  api.segment(m,c,api.dashed);
  api.segment(m,a,api.dashed);
  api.angleSquare(l,c,k,.29);
  api.angleSquare(d,m,c,.23);
  circularAngle(api,m,c,l,.74,'\\beta');
  circularAngle(api,c,b,d,1.05,'\\alpha');
  labels(api,[['A',a,0,-.24],['B',b,.16,-.27],['C',c,.24,.19],['D',d,-.06,-.25],
    ['K',k,.21,-.15],['L',l,.27,-.07],['M',m,-.05,-.27],['p',offset(l,3.12,1.51)],['o_1',[-4.44,4.52]]]);
  if (withBoth) api.label('o_2',[-4.77,5.45]);
}

function construction2026June9(api) {
  const a=[0,0],b=[4,0],c=[4,7],o=between(a,c,.5);
  const cLength=Math.hypot(...c);
  const v=[4/cLength,7/cLength];
  const hor=1/cLength;
  const perp=8/cLength;
  const d=[hor*v[0]-perp*v[1],hor*v[1]+perp*v[0]];
  const e=project(d,a,c);
  api.circle(o,cLength/2,{color:api.ink});
  api.lines([a,b,c,d,a],{color:api.accent});
  api.segment(a,c,{color:api.accent});
  api.segment(d,e,api.dashed);
  api.angleSquare(b,a,c,.28);
  api.angleSquare(d,c,a,.28);
  api.angleSquare(e,c,d,.22);
  labels(api,[['A',a,-.28,-.19],['B',b,.28,-.19],['C',c,.25,.25],['D',d,-.28,.12],['E',e,.32,.19],
    ['4',between(a,b,.5),.02,.25],['7',between(b,c,.5),.28,0]]);
}

function construction2026June12(api) {
  const a=[0,0],b=[4.7,-.82],c=[7.88,.86],d=[3.18,1.68],s=[4.14,8.05];
  const k=between(a,d,.5),l=between(b,c,.5),m=between(c,s,.25),n=between(d,s,.25);
  const p=between(a,c,.5),q=between(d,c,.5),r=between(q,s,.25);
  api.polygon([k,l,m,n],{color:api.pale,fill:.29,thickness:3,layer:1});
  api.lines([a,b,c,s,a]);
  api.segment(b,s);
  api.lines([a,d,c],{thickness:3,lineType:1});
  api.segment(d,s,{thickness:3,lineType:1});
  api.lines([k,l,m,n,k],{color:api.accent,thickness:3});
  api.lines([s,p,q,s],api.dashed);
  api.segment(p,r,api.dashed);
  labels(api,[['A',a,-.21,-.23],['B',b,.04,-.34],['C',c,.28,.01],['D',d,-.12,-.26],['S',s,.08,.36],
    ['K',k,-.28,.09],['L',l,.29,-.14],['M',m,.28,.12],['N',n,-.21,.24],['P',p,.01,-.36],['Q',q,.34,-.25],['R',r,.21,.18]]);
  const base=[10,0],top=[10,5.88],end=[10+5.88/Math.sqrt(3),0];
  const cross=project(base,top,end);
  api.lines([base,top,end,base],{color:api.accent});
  api.segment(base,cross,api.dashed);
  api.angleSquare(cross,top,base,.25);
  circularAngle(api,base,end,cross,.8,'30^{\\circ}');
  labels(api,[['P',base,-.05,-.24],['Q',end,.14,-.24],['S',top,.02,.28],['R',cross,.3,.1],
    ['H',between(base,top,.53),-.26,0],['\\frac{1}{2}a',between(base,end,.5),.02,-.24]]);
}

function construction2024December2(api) {
  const a=[0,0],b=[7.2,0],c=[3.6,5.5],s=[3.6,.77];
  const d=project(s,a,c),e=project(s,b,c);
  const r=Math.hypot(s[0]-d[0],s[1]-d[1]);
  const dx=Math.sqrt(r*r-s[1]*s[1]);
  const m=[s[0]-dx,0],n=[s[0]+dx,0];
  api.circle(s,r);
  api.lines([a,b,c,a],{color:api.accent});
  for (const point of [d,e,m,n,s]) api.dot(point,{size:3});
  labels(api,[['A',a,-.19,-.22],['B',b,.21,-.22],['C',c,.08,.24],['S',s,.13,.2],
    ['D',d,-.24,.16],['E',e,.25,.19],['M',m,-.14,-.28],['N',n,.17,-.28]]);
}

function construction2024December12(api, method) {
  const a=[0,0],b=[10,0],d=[5,0],theta=39.5*Math.PI/180;
  const c=intersection(a,polar(a,1,2*theta),b,polar(b,1,Math.PI-theta));
  const e=[c[0],0];
  const f=[b[0]-c[0],c[1]];
  const style={color:api.accent,thickness:3};
  api.lines([a,b,c,a],style);
  api.segment(c,d,style);
  circularAngle(api,a,b,c,1.12,'2\\alpha');
  circularAngle(api,b,c,a,1.21,'\\alpha');
  circularAngle(api,d,a,c,1.2,'\\beta');
  labels(api,[['A',a,-.13,-.29],['B',b,.16,-.3],['C',c,-.11,.28],['D',d,.09,-.31]]);
  if (method===1 || method===3) {
    api.segment(c,e,style);
    api.angleSquare(e,c,b,.47);
    api.label('E',offset(e,-.05,-.31));
  }
  if (method===1) {
    api.lines([c,f,b],{...style,lineType:1});
    api.segment([d[0],-.5],[d[0],f[1]+.34],{thickness:2,lineType:1});
    api.angleSquare(d,c.map((value,i)=>i?value:d[0]),b,.49);
    circularAngle(api,c,f,b,1.24,'\\alpha');
    circularAngle(api,b,f,c,1.3,'\\alpha');
    labels(api,[['F',f,.18,.24],['k',[d[0]+.29,c[1]*.73]]]);
  } else {
    labels(api,[['a',between(c,b,.57),.32,.38],['b',between(a,c,.49),-.29,.09],['d',between(c,d,.5),.29,.05],
      ['c',between(d,b,.5),.01,-.29]]);
    if (method===2) api.label('c',offset(between(a,d,.5),.02,-.26));
    if (method===3) {
      api.label('h',offset(between(c,e,.54),.26,0));
      api.label('x',offset(between(e,d,.5),.04,-.27));
      api.dimension([a[0],-.57],[e[0],-.57],'c-x',[(a[0]+e[0])/2,-.82]);
    }
  }
}

function construction2024May9(api, method) {
  const size=12;
  const a=[0,0],b=[size,0],c=[size,size],d=[0,size],e=[size/2,size];
  const f=[size/3,2*size/3],g=[size/2,size/2];
  const style={color:api.accent,thickness:4};
  if(method===9) {
    const grid={color:api.gray,thickness:1,layer:0};
    for(let i=0;i<=size;i++) {
      api.segment([i,0],[i,size],grid);
      api.segment([0,i],[size,i],grid);
    }
    api.dimension([size+.71,size-1],[size+.71,size],'m',[size+1.1,size-.5]);
  }
  if(method===8) api.axes(-.65,13.31,-.54,13.4,false);
  api.lines([a,b,c,d,a],style);
  api.segment(a,e,style);
  api.segment(a,c,{...style,thickness:3});
  api.segment(b,d,{...style,thickness:3});
  const baseLabel=method===8?'A=O':'A';
  labels(api,[[baseLabel,a,method===8?.58:-.31,-.33],['B',b,.22,-.34],['C',c,.23,.27],['D',d,-.25,.3],
    ['E',e,.02,.31],['F',f,-.33,.05],['G',g,.33,-.35]]);
  if(method!==8) api.label('a',[size/2,-.45]);
  if(method===5 || method===9) {
    const m=[f[0],0],n=[f[0],size];
    api.segment(m,n,{color:api.ink,thickness:2,lineType:1});
    labels(api,[[method===5?'M':'L',m,-.16,-.32],[method===5?'N':'K',n,-.07,.33]]);
  }
  if(method===6) {
    const p=between(b,c,.5),q=intersection(e,p,a,c);
    api.segment(e,p,api.dashed);
    labels(api,[['P',p,.3,.18],['Q',q,-.22,-.31]]);
  }
  if(method===7) {
    api.segment(e,g,api.dashed);
    labels(api,[['x',[3.12,10.74]],['x',[3.71,5.6]],['y',[5.38,8.37]],['4y',[1.54,5.67]]]);
  }
}

function construction2022May9(api) {
  const style={color:api.accent,thickness:5};
  api.axes(-2.09,3.77,-1.75,1.28,false);
  api.curve('t','0.12*(t+1)*(t-3)*(t+0.5)',-2.02,3.57,style);
  for(const x of [-1,-.5,3]) api.dot([x,0],{color:api.accent,size:3});
  labels(api,[['-1',[-1.055,-.15]],['-\\tfrac12',[-.4,-.24]],['3',[3,-.2]],['y=W(x)',[2.25,1.01]]]);
}

function construction2023May5(api, method) {
  const a=[0,4],b=[0,0],c=[4*Math.sqrt(3),0],d=between(a,c,.25),k=[0,1],l=[1,0];
  const n=intersection(k,l,b,d);
  const main={color:api.accent,thickness:4};
  const auxiliary={color:[68,106,143],thickness:3,lineType:1};
  if(method===5) api.axes(-.28,7.49,-.18,4.59,false);
  api.lines([a,b,c,a]);
  api.segment(b,d,main);
  api.segment(k,l,main);
  api.angleSquare(d,a,b,.22);
  circularAngle(api,a,b,c,.59,'60^{\\circ}');
  labels(api,[['A',a,-.12,.22],['B',b,-.2,-.18],['C',c,.14,-.19],['D',d,.19,.2],
    ['K',k,-.17,.07],['L',l,.07,-.21],['N',n,.23,.1],['1',[0,.5],-.16,-.04],['1',[.5,0],0,-.22]]);
  if(method===3) {
    const e=[n[0],0];
    api.segment(n,e,auxiliary);
    labels(api,[['E',e,.03,-.21],['x',[.1,-.32]],['1-x',[.74,-.37]]]);
  }
  if(method===5) {
    api.curve('t','1-t',-.2,1.65,auxiliary);
    api.label('y=1-x',[1.79,-.55]);
    api.label('y=\\sqrt3x',[2.14,3.15]);
  }
  if(method===6) {
    const e=[d[0],0],f=[d[0]+d[1],0];
    api.segment(d,e,auxiliary);
    api.segment(f,d,auxiliary);
    api.angleSquare(e,d,f,.22);
    labels(api,[['E',e,0,-.24],['F',f,.1,-.24]]);
  }
  if(method===7) {
    const e=[-2,d[1]],f=[0,d[1]];
    api.segment(k,e,auxiliary);
    api.segment(e,d,auxiliary);
    labels(api,[['E',e,-.16,.21],['F',f,.15,.24]]);
  }
}

function construction2023May7(api, method) {
  if(method===5) {
    const box=prism(api);
    const s=between(box.a,box.h,.5);
    const p=between(box.b,box.h,2/3);
    const base={color:api.accent,thickness:3,lineType:1};
    api.lines([box.d,box.e,box.g,box.d],base);
    api.segment(box.b,box.h,base);
    api.lines([box.b,s,box.g],{color:api.accent});
    labels(api,[['S',s,-.27,.15],['P',p,.21,.23],['6',between(box.a,box.b,.5),.03,-.27]]);
    return;
  }
  const a=[0,0],b=[6,0],h=[0,6*Math.SQRT2],s=between(a,h,.5);
  const p=project(s,b,h),r=between(b,h,.5),k=project(a,b,h);
  api.lines([a,h,b,a],{color:api.accent});
  api.segment(s,b,{color:api.accent,thickness:3});
  api.segment(s,p,api.dashed);
  api.segment(s,r,{color:api.accent,thickness:3});
  api.angleSquare(a,b,h,.39);
  api.angleSquare(p,s,h,.45);
  labels(api,[['A',a,-.16,-.24],['B',b,.15,-.24],['H',h,-.15,.23],['S',s,-.24,.09],
    ['P',p,.27,.08],['R',r,.27,.08],['6',[3,-.24]]]);
  if(method===4) {
    api.segment(a,k,api.dashed);
    api.angleSquare(k,a,h,.36);
    api.label('K',offset(k,.28,.07));
  }
}

Object.assign(window.figureDefinitions, {
  '2022-05-9-rozw': {bounds:[-2.38,4,-2.05,1.6],width:590,draw:construction2022May9},
  '2023-05-5-rozw-3': {bounds:[-.65,7.68,-.7,4.82],width:620,draw:api=>construction2023May5(api,3)},
  '2023-05-5-rozw-5': {bounds:[-.65,7.89,-.82,4.9],width:630,draw:api=>construction2023May5(api,5)},
  '2023-05-5-rozw-6': {bounds:[-.65,7.68,-.71,4.82],width:620,draw:api=>construction2023May5(api,6)},
  '2023-05-5-rozw-7': {bounds:[-2.56,7.68,-.69,4.82],width:650,draw:api=>construction2023May5(api,7)},
  '2023-05-7-rozw': {bounds:[-.7,6.72,-.66,9.25],width:470,draw:api=>construction2023May7(api,1)},
  '2023-05-7-rozw-4': {bounds:[-.7,6.72,-.66,9.25],width:470,draw:api=>construction2023May7(api,4)},
  '2023-05-7-rozw-5': {bounds:[-.71,7.22,-.75,7.06],width:560,draw:api=>construction2023May7(api,5)},
  '2024-05-9-rozw-5': {bounds:[-.88,13.1,-.88,13.18],width:520,draw:api=>construction2024May9(api,5)},
  '2024-05-9-rozw-6': {bounds:[-.88,13.1,-.88,13.18],width:520,draw:api=>construction2024May9(api,6)},
  '2024-05-9-rozw-7': {bounds:[-.88,13.1,-.88,13.18],width:520,draw:api=>construction2024May9(api,7)},
  '2024-05-9-rozw-8': {bounds:[-.88,13.8,-.88,13.7],width:520,draw:api=>construction2024May9(api,8)},
  '2024-05-9-rozw-9': {bounds:[-.88,13.98,-.88,13.18],width:520,draw:api=>construction2024May9(api,9)},
  '2024-12-2-rozw': {bounds:[-.73,7.99,-2.18,6.22],width:520,draw:construction2024December2},
  '2024-12-12-rozw-1': {bounds:[-.75,10.85,-.82,8.15],width:620,draw:api=>construction2024December12(api,1)},
  '2024-12-12-rozw-2': {bounds:[-.75,10.85,-.82,8.15],width:620,draw:api=>construction2024December12(api,2)},
  '2024-12-12-rozw-3': {bounds:[-.75,10.85,-1.12,8.15],width:620,draw:api=>construction2024December12(api,3)},
  '2026-05-4-rozw': {bounds:[-.78,7.05,-.76,6.84],width:585,draw:construction2026May4},
  '2026-05-9-rozw': {bounds:[-.76,5.38,-2.35,2.15],width:640,draw:construction2026May9},
  '2026-05-11-rozw': {bounds:[-1.76,10.98,-3.09,10.03],width:580,draw:construction2026May11},
  '2026-05-12-1-rozw': {bounds:[-4.83,4.83,-.8,5.95],width:630,draw:construction2026May12},
  '2026-06-5-rozw-1': {bounds:[-5.38,5.25,-.95,6.15],width:635,draw:api=>construction2026June5(api,false)},
  '2026-06-5-rozw-2': {bounds:[-7.5,5.9,-1.6,8.5],width:635,draw:api=>construction2026June5(api,true)},
  '2026-06-9-rozw': {bounds:[-3.22,7.32,-1.14,8.45],width:550,draw:construction2026June9},
  '2026-06-12-rozw': {bounds:[-.96,14.06,-1.24,8.66],width:805,draw:construction2026June12},
});
