import { distortion } from './engineering.js';

const field = (label, integer = false, zero = false) => ({label, integer, zero});
const result = (label, value, unit) => ({label, value, unit});
const one = (label, unit, calculate) => (...values) => [result(label, calculate(...values), unit)];
const pi = Math.PI;

export const formulas = {
  metres: ['Milímetros a metros', 'm = mm ÷ 1 000', 'Convierte una longitud medida en milímetros.',
    [field('Longitud (mm)', false, true)], one('Longitud', 'm', mm => mm / 1000)],
  cylinder: ['Perímetro de un cilindro', 'C = π × D', 'Usa el diámetro de la superficie cuyo perímetro quieres conocer. El diámetro exterior del cilindro desnudo y el diámetro primitivo del engrane son medidas distintas.',
    [field('Diámetro de la superficie (mm)')], one('Perímetro', 'mm', d => pi * d)],
  diameter: ['Diámetro a partir del perímetro', 'D = C ÷ π', 'Calcula el diámetro de la superficie circular en la que mediste el perímetro.',
    [field('Perímetro medido (mm)')], one('Diámetro', 'mm', c => c / pi)],
  length: ['Metros lineales a partir de vueltas', 'm = vueltas × desarrollo efectivo ÷ 1 000', 'Usa la repetición impresa medida por vuelta. El resultado supone que se mantiene constante.',
    [field('Vueltas', false, true), field('Desarrollo efectivo por vuelta (mm)')], one('Longitud', 'm', (n, r) => n * r / 1000)],
  run: ['Metros a partir de velocidad y tiempo', 'm = velocidad × minutos efectivos', 'Usa la velocidad media mientras la banda está en movimiento y excluye los paros del tiempo.',
    [field('Velocidad media (m/min)', false, true), field('Tiempo efectivo (min)', false, true)], one('Longitud', 'm', (v, t) => v * t)],
  labels: ['Metros para fabricar etiquetas', 'm = ⌈cantidad ÷ pistas⌉ × paso ÷ 1 000 + reserva', 'El paso es la distancia entre comienzos de dos filas consecutivas. Se cuenta un paso completo por fila. Captura 0 en reserva si deseas calcular únicamente el material teórico.',
    [field('Etiquetas requeridas', true), field('Pistas aprovechables', true), field('Paso entre filas (mm)'), field('Reserva de material (m)', false, true)],
    (count, lanes, step, reserve) => {
      const rows = Math.ceil(count / lanes);
      return [result('Filas completas de avance', rows, ''), result('Longitud con reserva', rows * step / 1000 + reserve, 'm')];
    }],
  speed: ['Velocidad de banda a partir de RPM', 'm/min = RPM × desarrollo efectivo ÷ 1 000', 'Usa el desarrollo efectivo por vuelta del eje al que corresponden las RPM.',
    [field('Velocidad de rotación (RPM)', false, true), field('Desarrollo efectivo por vuelta (mm)')], one('Velocidad de banda', 'm/min', (rpm, r) => rpm * r / 1000)],
  teeth: ['Número de dientes por paso circular', 'Z = Cₚ ÷ p', 'Usa la circunferencia primitiva del engrane y su paso circular documentado. El redondeo sirve para comparar la medición con el entero más cercano.',
    [field('Circunferencia primitiva (mm)'), field('Paso circular documentado (mm/diente)')], (c, p) => countTeeth(c / p)],
  module: ['Número de dientes por módulo métrico', 'Z = Dₚ ÷ m', 'Usa el diámetro primitivo. El módulo debe estar expresado en milímetros por diente.',
    [field('Diámetro primitivo (mm)'), field('Módulo métrico (mm/diente)')], (d, m) => countTeeth(d / m)],
  dp: ['Número de dientes por paso diametral', 'Z = (Dₚ ÷ 25,4) × DP', 'Usa el diámetro primitivo en milímetros y el paso diametral en dientes por pulgada de diámetro primitivo.',
    [field('Diámetro primitivo (mm)'), field('Paso diametral (DP)')], (d, dp) => countTeeth(d / 25.4 * dp)],
  gear: ['Desarrollo primitivo del engrane', 'Cₚ = Z × p · Dₚ = Cₚ ÷ π', 'El cálculo usa el paso circular del engrane. Para planear una tirada, mide por separado la repetición efectiva de impresión.',
    [field('Número de dientes', true), field('Paso circular documentado (mm/diente)')],
    (z, p) => [result('Circunferencia primitiva', z * p, 'mm'), result('Diámetro primitivo', z * p / pi, 'mm')]],
  distortion: ['Distorsión de placa por prueba impresa', 'Factor = archivo de prueba ÷ medida impresa · Preparación = objetivo × factor · Reducción = (1 − factor) × 100',
    'Mide entre las mismas marcas a lo largo del avance de banda. Usa una prueba representativa de tu montaje, placa y material. Un porcentaje negativo significa ampliación. Repite la impresión para validar la corrección.',
    [field('Longitud en el archivo de prueba (mm)'), field('Longitud medida en la impresión (mm)'), field('Longitud impresa objetivo (mm)')],
    (file, printed, target) => {
      const calculated = distortion({unit:'mm', file, printed, target});
      return [result('Longitud para preparar el archivo', calculated.prepared, 'mm'), result('Factor de compensación', calculated.factor, ''),
        result('Reducción del archivo', calculated.reduction, '%')];
    }],
  drift: ['Desfase acumulado de impresión y corte', 'Desfase = (repetición impresa − repetición de corte) × intervalos', 'Supone alineación inicial y repeticiones constantes. De la primera a la décima marca hay nueve intervalos. El signo positivo indica que la posición impresa avanza más por intervalo.',
    [field('Repetición impresa (mm)'), field('Repetición de corte (mm)'), field('Intervalos desde la primera marca', true, true)],
    one('Desfase acumulado', 'mm', (print, die, intervals) => (print - die) * intervals)],
  area: ['Área de banda y cobertura', 'Área de banda = longitud × ancho ÷ 1 000 · Área cubierta = área de banda × cobertura ÷ 100',
    'Usa la cobertura media de una separación. El área cubierta es una estimación geométrica.',
    [field('Longitud de banda (m)', false, true), field('Ancho de banda (mm)'), field('Cobertura media (%)', false, true)],
    (length, width, coverage) => {
      if (coverage > 100) throw new Error('La cobertura debe estar entre 0 y 100 %.');
      const area = length * width / 1000;
      return [result('Área de banda', area, 'm²'), result('Área cubierta estimada', area * coverage / 100, 'm²')];
    }]
};

function countTeeth(value) {
  const nearest = Math.round(value);
  if (!Number.isSafeInteger(nearest) || nearest < 1) throw new Error('Verifica que el cociente corresponda a un engrane de al menos un diente y esté dentro del rango calculable.');
  const exact = Math.abs(value - nearest) <= 8 * Number.EPSILON * Math.max(1, value);
  const values = [result(exact ? 'Número de dientes calculado' : 'Cociente teórico (no entero)', exact ? nearest : value, 'dientes')];
  if (!exact) values.push(result('Entero más cercano para comprobar con el engrane', nearest, 'dientes'));
  return values;
}

export function calculateFlexo(key, raw) {
  if (!Object.hasOwn(formulas, key)) throw new Error('Selecciona un cálculo de flexografía.');
  const [, , , fields, solve] = formulas[key];
  if (raw.length !== fields.length) throw new Error('Captura todos los datos solicitados.');
  const values = fields.map(({label, integer, zero}, index) => {
    const text = String(raw[index]).trim();
    const value = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text) ? Number(text.replace(',', '.')) : NaN;
    if (!Number.isFinite(value) || value < 0 || (!zero && value === 0) || (integer && !Number.isSafeInteger(value))) {
      throw new Error('Revisa «' + label + '». Introduce un número ' + (integer ? 'entero ' : '') + (zero ? 'mayor o igual a cero.' : 'mayor a cero.'));
    }
    return value;
  });
  const results = solve(...values);
  if (results.some(({value}) => !Number.isFinite(value))) throw new Error('El resultado excede el rango calculable.');
  return results;
}

const section = globalThis.document?.getElementById('flexoQuick');
if (section) {
  const pick = section.querySelector('select');
  const fields = section.querySelector('#flexoQuickFields');
  const expression = section.querySelector('#flexoQuickExpression');
  const description = section.querySelector('#flexoQuickDescription');
  const output = section.querySelector('#flexoQuickResult');
  const format = new Intl.NumberFormat('es-MX', {maximumSignificantDigits: 10});
  let controls = [];
  function update() {
    const raw = controls.map(input => input.value);
    if (!raw.length || raw.some(value => !value.trim())) {
      output.textContent = controls.length ? 'Completa las medidas para ver el resultado.' : '';
      return;
    }
    try {
      const results = calculateFlexo(pick.value, raw);
      output.textContent = results.map(({label, value, unit}) => label + ' · ' + format.format(value) + (unit ? ' ' + unit : '')).join(' | ');
    } catch (error) {
      output.textContent = error.message;
    }
  }
  for (const [id, [title]] of Object.entries(formulas)) pick.add(new Option(title, id));
  pick.addEventListener('change', () => {
    fields.replaceChildren();
    const [, formula, use, inputs] = formulas[pick.value] ?? ['', '', '', []];
    expression.textContent = formula;
    description.textContent = use;
    controls = inputs.map(({label, integer}, index) => {
      const wrapper = document.createElement('div');
      const caption = document.createElement('label');
      const input = document.createElement('input');
      input.id = 'flexoQuickField' + index;
      input.inputMode = integer ? 'numeric' : 'decimal';
      input.maxLength = 30;
      caption.htmlFor = input.id;
      caption.textContent = label;
      wrapper.append(caption, input);
      fields.append(wrapper);
      return input;
    });
    update();
  });
  fields.addEventListener('input', update);
}
