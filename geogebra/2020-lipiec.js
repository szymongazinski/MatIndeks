(() => {
  const center = [0, 2];
  const radius = 3;
  const halfChord = Math.sqrt(5);
  const a = [-halfChord, 0];
  const b = [halfChord, 0];
  const point = angle => [radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
  const c = point(.34);
  const d = point(1.82);
  const boundAngle = Math.asin(center[1] / radius);

  function draw(api, showLocus) {
    const auxiliary = { color: api.gray, thickness: 3 };
    const angleStyle = { color: api.accent, thickness: 4 };
    api.circle(center, radius, { color: showLocus ? api.gray : api.ink });
    if (showLocus) {
      api.circle([0, -2], radius, auxiliary);
      api.arc(center, radius, -boundAngle, Math.PI + boundAngle, angleStyle);
      api.arc([0, -2], radius, Math.PI - boundAngle, 2 * Math.PI + boundAngle, angleStyle);
    } else {
      api.lines([a, d, c, b, a]);
    }
    api.segment(a, b);
    api.segment(a, center, auxiliary);
    api.segment(b, center, auxiliary);
    api.segment(a, c, auxiliary);
    api.segment(d, b, auxiliary);
    if (showLocus) {
      api.segment(a, d, auxiliary);
      api.segment(c, b, auxiliary);
    }
    for (const vertex of [c, d]) {
      const angles = [a,b].map(([x,y]) => Math.atan2(y - vertex[1], x - vertex[0]));
      if (angles[1] < angles[0]) angles[1] += 2 * Math.PI;
      const middle = (angles[0] + angles[1]) / 2;
      api.arc(vertex, .52, ...angles, angleStyle);
      api.label('\\alpha', [vertex[0] + .78 * Math.cos(middle), vertex[1] + .78 * Math.sin(middle)]);
    }
    for (const [label, points, dx, dy] of [
      ['A', a, -.23, -.20], ['B', b, .21, -.19], ['C', c, .21, .16],
      ['D', d, -.05, .22], ['S', center, -.18, .18],
    ]) {
      api.dot(points, { size: 3 });
      api.label(label, [points[0] + dx, points[1] + dy]);
    }
  }

  Object.assign(window.figureDefinitions, {
    '2020-07-7-rozw-1': { bounds: [-3.46, 3.46, -1.37, 5.44], width: 480, draw: api => draw(api, false) },
    '2020-07-7-rozw-2': { bounds: [-3.46, 3.46, -5.37, 5.44], width: 480, draw: api => draw(api, true) },
  });
})();
