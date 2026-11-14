window.figureDefinitions = {};

window.drawFigure = function (api, key) {
  const { bounds, draw, width = 700 } = window.figureDefinitions[key];
  const [left, right, bottom, top] = bounds;
  const height = Math.ceil(width * (top - bottom) / (right - left));
  const ink = [37, 45, 56];
  const accent = [105, 60, 146];
  const pale = [191, 156, 219];
  const gray = [172, 181, 191];

  api.newConstruction();
  api.setErrorDialogsActive(false);
  api.setRepaintingActive(false);
  api.setAxesVisible(false, false);
  api.setGridVisible(false);
  api.setSize(width, height);
  api.setCoordSystem(left, right, bottom, top);
  let index = 0;

  function command(expression) {
    if (!api.evalCommand(expression)) throw new Error(`${key}: ${expression}`);
  }

  function create(expression, style = {}) {
    const { color = ink, thickness = 4, lineType = 0, fill = 0, layer = 2 } = style;
    const name = `obj_${++index}`;
    command(`${name}=${expression}`);
    api.setLabelVisible(name, false);
    api.setColor(name, ...color);
    api.setLineThickness(name, thickness);
    api.setLineStyle(name, lineType);
    api.setFilling(name, fill);
    api.setLayer(name, layer);
    return name;
  }

  function coordinates(point) {
    return Array.isArray(point) ? '(' + point.map(value => value.toFixed(10)).join(',') + ')' : point;
  }

  const segment = (a, b, style) => create(`Segment(${coordinates(a)},${coordinates(b)})`, style);
  const vector = (a, b, style) => create(`Vector(${coordinates(a)},${coordinates(b)})`, style);
  const circle = (center, radius, style) => create(`Circle(${coordinates(center)},${radius})`, style);
  const polygon = (points, style) => create(`Polygon(${points.map(coordinates).join(',')})`, style);
  const curve = (x, y, from, to, style) => create(`Curve(${x},${y},t,${from},${to})`, style);
  const dashed = { color: accent, lineType: 1 };

  function label(text, point, options = {}) {
    const { math = true, color = ink } = options;
    if (/["\r\n]/.test(text)) throw new Error(`${key}: nieprawidłowa etykieta`);
    const name = create(`Text("${text}",${coordinates(point)},false,${math},0,0)`, { color, layer: 9 });
    return name;
  }

  function dot(point, style = {}) {
    const { size = 4, open = false, color = ink } = style;
    const name = `P_${++index}`;
    command(`${name}=${coordinates(point)}`);
    if (api.getObjectType(name) !== 'point') throw new Error(`${key}: ${name} nie jest punktem`);
    api.setLabelVisible(name, false);
    api.setColor(name, ...color);
    api.setLayer(name, 7);
    api.setPointSize(name, size);
    api.setPointStyle(name, open ? 2 : 0);
    return name;
  }

  function lines(points, style) {
    points.slice(1).forEach((point, i) => segment(points[i], point, style));
  }

  function arc(center, radius, from, to, style) {
    return curve(`${center[0]}+${radius}*cos(t)`, `${center[1]}+${radius}*sin(t)`, from, to, style);
  }

  function ellipse(center, horizontal, vertical, from, to, style) {
    return curve(`${center[0]}+${horizontal}*cos(t)`, `${center[1]}+${vertical}*sin(t)`, from, to, style);
  }

  function angleSquare(vertex, a, b, size) {
    const step = point => {
      const distance = Math.hypot(point[0] - vertex[0], point[1] - vertex[1]);
      return [(point[0] - vertex[0]) * size / distance, (point[1] - vertex[1]) * size / distance];
    };
    const u = step(a);
    const v = step(b);
    const [x, y] = vertex;
    lines([[x + u[0], y + u[1]], [x + u[0] + v[0], y + u[1] + v[1]], [x + v[0], y + v[1]]], { thickness: 3 });
  }

  function dimension(a, b, title, labelPoint) {
    segment(a, b, { thickness: 2 });
    const radius = 7 * (right - left) / width;
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (const [point, direction] of [[a, angle], [b, angle + Math.PI]]) {
      const wing = offset => [
        point[0] + radius * Math.cos(direction + offset),
        point[1] + radius * Math.sin(direction + offset),
      ];
      lines([wing(0.45), point, wing(-0.45)], { thickness: 2 });
    }
    label(title, labelPoint);
  }

  function axes(xMin, xMax, yMin, yMax, units = true) {
    const small = { color: gray, thickness: 1, layer: 0 };
    if (units) {
      for (let x = Math.ceil(xMin); x <= xMax; x++) if (x) segment([x, yMin], [x, yMax], small);
      for (let y = Math.ceil(yMin); y <= yMax; y++) if (y) segment([xMin, y], [xMax, y], small);
      for (let x = Math.ceil(xMin + 0.3); x < xMax; x++) if (x) label(String(x), [x, -0.43]);
      for (let y = Math.ceil(yMin + 0.3); y < yMax; y++) if (y) label(String(y), [-0.41, y]);
    }
    vector([xMin, 0], [xMax, 0], { thickness: 3 });
    vector([0, yMin], [0, yMax], { thickness: 3 });
    const offset = 15 * (right - left) / width;
    label('x', [xMax, offset]);
    label('y', [offset, yMax]);
    label('0', [-offset, -offset]);
  }

  draw({
    create, segment, vector, circle, polygon, curve, label, dot, lines,
    arc, ellipse, angleSquare, dimension, axes, ink, accent, pale, gray, dashed,
  });
  api.setRepaintingActive(true);
  api.refreshViews();
};
