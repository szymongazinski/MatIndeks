(() => {
  function mark(api, name, point, dx = 0, dy = .18) {
    api.dot(point, { size: 3 });
    api.label(name, [point[0] + dx, point[1] + dy]);
  }

  const width = 4 * Math.SQRT2;
  const height = 4;
  const d = [0, 0], b = [width, 0], f = [width, height], h = [0, height];
  const l = [width / 2, 0], k = [width, height / 2];
  const s = [width / 2, height / 2], p = [3 * width / 4, height / 4];
  const q = [p[0], 0], m = [1.5 * width, height];
  const theta = Math.atan2(height, width);

  for (const [suffix, rightEdge, construct] of [
    ['', width, api => {
      api.segment(d, f, { color: api.gray, thickness: 3 });
      mark(api, 'S', s, -.03, .42);
    }],
    ['-2', m[0], api => {
      api.segment(f, m, { color: api.gray, thickness: 3 });
      api.segment(k, m, { color: api.accent });
      mark(api, 'M', m, .16, .18);
    }],
    ['-3', width, api => {
      api.segment(p, q, api.dashed);
      api.angleSquare(q, l, p, .16);
      api.arc(l, .73, 0, theta, { color: api.accent, thickness: 2 });
      api.arc(b, .73, Math.PI - theta, Math.PI, { color: api.accent, thickness: 2 });
      api.label('\\beta', [l[0] + .84, .24], { color: api.accent });
      api.label('\\alpha', [b[0] - .98, .24], { color: api.accent });
      mark(api, 'Q', q, -.09, -.38);
    }],
    ['-4', width, api => {
      const centerLine = { color: api.gray, thickness: 3 };
      api.segment([0, height / 2], k, centerLine);
      api.segment(l, [width / 2, height], centerLine);
      mark(api, 'S', s, .15, .38);
    }],
  ]) {
    window.figureDefinitions['2016-06-11-rozw' + suffix] = {
      bounds: [-.65, rightEdge + .69, -.65, height + .5],
      draw(api) {
        api.lines([d, b, f, h, d]);
        api.segment(h, b);
        api.segment(l, k, { color: api.accent });
        mark(api, 'D', d, -.27, -.36);
        mark(api, 'B', b, .06, -.36);
        mark(api, 'F', f, .02, .20);
        mark(api, 'H', h, -.26, .19);
        mark(api, 'L', l, -.07, -.36);
        mark(api, 'K', k, .17, 0);
        mark(api, 'P', p, -.08, .50);
        construct(api);
      },
    };
  }

  window.figureDefinitions['2016-06-13-rozw'] = {
    bounds: [-.69, 7.09, -1.35, 1.46],
    draw(api) {
      const first = 7 * Math.PI / 6, last = 11 * Math.PI / 6, end = 2 * Math.PI;
      api.axes(-.54, 6.73, -1.17, 1.21, false);
      api.curve('t', 'sin(t)', 0, end, { color: api.ink, thickness: 3 });
      api.curve('t', 'sin(t)', first, last, { color: api.accent, thickness: 6 });
      api.segment([0, -.5], [end, -.5], api.dashed);
      api.segment([first, 0], [last, 0], { color: api.accent, thickness: 6 });
      for (const [x, label] of [[first, '\\frac{7\\pi}{6}'], [last, '\\frac{11\\pi}{6}']]) {
        api.segment([x, 0], [x, -.5], api.dashed);
        api.dot([x, -.5], { color: api.accent, open: true });
        api.dot([x, 0], { color: api.accent, open: true });
        api.label(label, [x, .31]);
      }
      for (const [x, label] of [[Math.PI / 2, '\\frac{\\pi}{2}'], [Math.PI, '\\pi'],
        [3 * Math.PI / 2, '\\frac{3\\pi}{2}']]) {
        api.segment([x, -.045], [x, .045], { thickness: 2 });
        api.label(label, [x, x > Math.PI ? .29 : -.32]);
      }
      for (const y of [-1, 1]) {
        api.segment([-.045, y], [.045, y], { thickness: 2 });
        api.label(String(y), [-.23, y + .06]);
      }
      api.label('-\\frac12', [-.33, -.43], { color: api.accent });
      api.dot([0, 0], { open: true });
      api.dot([end, 0], { open: true });
      api.label('2\\pi', [end, -.19]);
    },
  };

  window.figureDefinitions['2015-06-11-rozw'] = {
    bounds: [-1.8, 21.45, -1.8, 16.25],
    draw(api) {
      const a = [0, 15], b = [20, 0], c = [0, 0];
      const d = [8, 9], center = [5, 5];
      api.lines([a, b, c, a]);
      api.circle(center, 5, { color: api.gray, thickness: 3 });
      api.segment(c, d, { color: api.accent, thickness: 5 });
      for (const point of [[0, 5], [5, 0], d]) api.segment(center, point, api.dashed);
      api.angleSquare(c, a, b, .77);
      api.angleSquare(d, b, center, .62);
      mark(api, 'A', a, -.71, .19);
      mark(api, 'B', b, .55, -.07);
      mark(api, 'C', c, -.56, -.65);
      mark(api, 'D', d, .61, .67);
      api.dot(center, { color: api.accent, size: 3 });
      api.label('r', [5.45, 2.47]);
      api.label('15', [-.78, 7.45]);
      api.label('20', [10.15, -.63]);
    },
  };

  window.figureDefinitions['2015-06-14-rozw'] = {
    bounds: [-9.05, 9.1, -1.0, 9.7],
    draw(api) {
      const depth = 4 * Math.sqrt(3);
      const a = [-8, 0, 0], b = [8, 0, 0], c = [4, depth, 0], d = [-4, depth, 0];
      const o = [0, 0, 0], s = [0, 0, 4];
      const k = d.map((coordinate, i) => (coordinate + 4 * s[i]) / 5);
      const project = ([x, y, z]) => [x, .33 * y + 2.17 * z];
      const segment = (first, last, style) => api.segment(project(first), project(last), style);
      const hidden = { color: api.gray, thickness: 3, lineType: 1 };

      for (const [u, v] of [[a, d], [d, c], [c, b], [a, c], [s, d], [s, c]]) {
        segment(u, v, hidden);
      }
      for (const [u, v] of [[a, b], [b, s], [s, a], [s, o]]) segment(u, v);
      segment(o, d, { thickness: 4 });
      segment(o, k, { color: api.accent, thickness: 5 });

      function rightAngle(vertex, first, second, size) {
        const step = point => {
          const direction = point.map((value, i) => value - vertex[i]);
          const scale = size / Math.hypot(...direction);
          return direction.map(value => scale * value);
        };
        const u = step(first), v = step(second);
        api.lines([
          vertex.map((value, i) => value + u[i]),
          vertex.map((value, i) => value + u[i] + v[i]),
          vertex.map((value, i) => value + v[i]),
        ].map(project), { thickness: 2, color: api.accent });
      }

      rightAngle(c, a, b, .78);
      rightAngle(k, d, o, .6);
      api.curve('-8+2.4*cos(t)', '.792*sin(t)', 0, Math.PI / 6,
        { color: api.accent, thickness: 2 });
      api.label('30^\\circ', [-5.09, .37], { color: api.accent });

      for (const [name, pt, dx, dy] of [
        ['A', a, -.43, -.24], ['B', b, .40, -.24], ['C', c, .29, .16],
        ['D', d, -.33, .24], ['O', o, 0, -.51], ['S', s, 0, .46], ['K', k, -.44, .29],
      ]) {
        mark(api, name, project(pt), dx, dy);
      }
      api.label('H', [.31, 4.96]);
    },
  };
})();
