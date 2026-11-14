(() => {
  window.figureDefinitions['2017-06-11-rozw'] = {
    bounds: [-.68, 7.04, -1.34, 1.48],
    draw(api) {
      const first = 5 * Math.PI / 12;
      const second = 13 * Math.PI / 12;
      const end = 2 * Math.PI;
      api.axes(-.53, 6.68, -1.19, 1.22, false);
      api.curve('t', 'sin(t-pi/4)', 0, end, { thickness: 4 });
      api.segment([0, .5], [end, .5], api.dashed);
      for (const [x, title] of [[first, '\\frac{5\\pi}{12}'], [second, '\\frac{13\\pi}{12}']]) {
        api.segment([x, 0], [x, .5], api.dashed);
        api.dot([x, .5], { color: api.accent });
        api.label(title, [x, -.35]);
      }
      api.segment([end, -.05], [end, .05], { thickness: 2 });
      api.label('2\\pi', [end, -.19]);
      api.label('\\frac12', [-.35, .53], { color: api.accent });
      for (const y of [-1, 1]) {
        api.segment([-.05, y], [.05, y], { thickness: 2 });
        api.label(String(y), [-.23, y + .065]);
      }
    },
  };

  window.figureDefinitions['2017-06-14-rozw'] = {
    bounds: [-7.03, 7.03, -.69, 6.7],
    draw(api) {
      const a = [-6, 0];
      const b = [6, 0];
      const h = 3 * Math.sqrt(3);
      const c = [3, h];
      const d = [-3, h];
      const origin = [0, 0];
      const summit = [0, h];
      const p = [0, 2 * Math.sqrt(3)];
      const r = 12 - 6 * Math.sqrt(3);

      api.arc(origin, 6, 0, Math.PI, { color: api.gray, thickness: 2 });
      api.lines([a, b, c, d, a]);
      api.segment(a, c);
      api.segment(b, d);
      const auxiliary = { color: api.gray, thickness: 3, lineType: 1 };
      api.segment(origin, d, auxiliary);
      api.segment(origin, summit, auxiliary);
      api.circle([0, r], r, { color: api.accent, thickness: 4 });

      for (const [name, pt, shift] of [
        ['A', a, [-.22, -.45]], ['B', b, [.02, -.45]],
        ['C', c, [.13, .23]], ['D', d, [-.31, .23]],
        ['O', origin, [-.12, -.45]], ['S', summit, [-.11, .43]],
        ['P', p, [.14, .55]],
      ]) {
        api.dot(pt, { size: 3 });
        api.label(name, [pt[0] + shift[0], pt[1] + shift[1]]);
      }

      const angular = { color: api.accent, thickness: 2 };
      const step = Math.PI / 6;
      api.arc(a, 1.5, 0, step, angular);
      api.arc(a, 1.43, step, 2 * step, angular);
      api.arc(b, 1.5, 5 * step, 6 * step, angular);
      api.arc(b, 1.43, 4 * step, 5 * step, angular);
      api.arc(d, 1.12, -step, 0, angular);
      api.arc(c, 1.12, Math.PI, Math.PI + step, angular);
      for (const [name, pt] of [
        ['\\alpha', [-4.23, .21]], ['\\beta', [-4.75, 1.2]],
        ['\\alpha', [3.97, .21]], ['\\beta', [4.55, 1.2]],
        ['\\alpha', [-1.64, 4.61]], ['\\alpha', [1.29, 4.61]],
      ]) {
        api.label(name, pt, { color: api.accent });
      }
    },
  };
})();
