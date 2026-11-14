(() => {
  const h = Math.sqrt(3) / 2;
  const a = [0, 0];
  const b = [7, 0];
  const c = [3.5, 7 * h];
  const d = [14 / 3, 0];
  const e = [7 / 6, 7 * h / 3];
  const p = [4.5, h];
  const f = [35 / 6, 7 * h / 3];

  function mark(api, name, point, dx = 0, dy = 0.2) {
    api.dot(point, { size: 3 });
    api.label(name, [point[0] + dx, point[1] + dy]);
  }

  function original(api) {
    api.lines([a, b, c, a]);
    api.segment(c, d, { color: api.accent });
    api.segment(b, e, { color: api.accent });
    mark(api, 'A', a, -.31, -.28);
    mark(api, 'B', b, .18, -.28);
    mark(api, 'C', c, 0, .28);
    mark(api, 'D', d, -.1, -.3);
    mark(api, 'E', e, -.3);
    mark(api, 'P', p, .16);
  }

  const constructions = {
    4(api) {
      const g = [77 / 18, e[1]];
      api.segment(e, f, api.dashed);
      mark(api, 'F', f, .2);
      mark(api, 'G', g, -.25);
    },
    5(api) {
      const g = [91 / 18, 7 * h / 9];
      api.segment(d, f, api.dashed);
      mark(api, 'F', f, .2);
      mark(api, 'G', g, .2, -.26);
    },
    6(api) {
      const foot = [14 / 9, 0];
      api.segment(e, foot, api.dashed);
      mark(api, 'F', foot, -.08, -.3);
    },
    7(api) {
      const g = [4, 0];
      const side = [5.5, 3 * h];
      api.segment(g, side, api.dashed);
      mark(api, 'G', g, -.15, -.3);
      mark(api, 'F', side, .25);
    },
    8(api) {
      const f8 = [4, 0], g = [5, 0], h8 = [6.5, h], k = [5.5, 3 * h], l = [2.5, 5 * h], m = [.5, h];
      api.segment(f8, k, api.dashed);
      api.segment(g, l, api.dashed);
      api.segment(m, h8, api.dashed);
      mark(api, 'F', f8, -.2, -.32);
      mark(api, 'G', g, .1, -.32);
      mark(api, 'H', h8, .32, .16);
      mark(api, 'K', k, .28, .15);
      mark(api, 'L', l, -.34, .2);
      mark(api, 'M', m, -.32, -.1);
    },
    9(api) {
      api.axes(-.53, 7.6, -.38, 6.47, false);
    },
  };

  for (const [method, draw] of Object.entries(constructions)) {
    window.figureDefinitions['2021-05-8-rozw-' + method] = {
      bounds: [-.65, 7.85, -.6, 6.85],
      draw(api) {
        original(api);
        draw(api);
      },
    };
  }

  window.figureDefinitions['2021-05-8-rozw-10'] = {
    bounds: [-.48, 3.8, -2.8 * h, 1.57 * h],
    draw(api) {
      const grid = { color: api.gray, thickness: 2, layer: 0 };
      const left = -.35;
      const right = 3.63;
      const bottom = -2.4 * h;
      const top = 1.4 * h;
      for (let row = -2; row <= 1; row++) api.segment([left, row * h], [right, row * h], grid);
      for (const direction of [-1, 1]) {
        for (let col = -1; col <= 5; col++) {
          const lineAt = y => col + direction * y / Math.sqrt(3);
          api.segment([lineAt(bottom), bottom], [lineAt(top), top], grid);
        }
      }
      const A = [0, 0], B = [2, -2 * h], C = [2.5, h], D = [4 / 3, -4 * h / 3];
      const E = [5 / 6, h / 3], F = [1, -2 * h], G = [3, 0], H = [.5, h];
      const P = [1.5, -h], R = [2, 0], S = [1, 0];
      api.lines([A, B, C, A]);
      api.segment(C, F, { color: api.accent });
      api.segment(B, E, { color: api.accent });
      mark(api, 'A', A, -.18, .09);
      mark(api, 'B', B, .03, -.16);
      mark(api, 'C', C, .06, .1);
      mark(api, 'D', D, -.16, -.16);
      mark(api, 'E', E, -.14, .14);
      mark(api, 'F', F, -.1, -.14);
      mark(api, 'G', G, .12, .11);
      mark(api, 'H', H, -.05, .14);
      mark(api, 'P', P, .13, -.08);
      mark(api, 'R', R, -.09, .13);
      mark(api, 'S', S, .14, .11);
    },
  };

  window.figureDefinitions['2021-05-14-rozw'] = {
    bounds: [-3.17, 3.17, -.5, 7.46],
    draw(api) {
      const a14 = [0, 2];
      const b14 = [1, 3];
      const first = (-1 - Math.sqrt(17)) / 2;
      const last = (-1 + Math.sqrt(17)) / 2;
      const point = x => [x, x * x];
      api.axes(-3.0, 3, -.38, 7.1, false);
      api.curve('t', 't^2', -Math.sqrt(7.2), Math.sqrt(7.2), { thickness: 3 });
      api.curve('t', 't^2', first, -2, { color: api.accent, thickness: 6 });
      api.curve('t', 't^2', 1, last, { color: api.accent, thickness: 6 });
      api.segment([-3.05, 5.05], [2.35, -.35], api.dashed);
      api.segment([-3.05, 7.05], [3.05, .95], api.dashed);
      api.segment(a14, b14, { thickness: 6 });
      mark(api, 'A', a14, -.23, -.2);
      mark(api, 'B', b14, .13, .03);
      for (const [name, x, dx, dy] of [['N_2', first, .15, .22], ['N_1', -2, .19, .20],
        ['M_1', 1, -.45, -.21], ['M_2', last, .22, .11]]) {
        const boundary = point(x);
        api.dot(boundary, { size: 4, color: api.accent, open: true });
        api.label(name, [boundary[0] + dx, boundary[1] + dy], { color: api.accent });
      }
    },
  };
})();
