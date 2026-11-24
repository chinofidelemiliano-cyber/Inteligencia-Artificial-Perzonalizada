const f=(formula,percent=false)=>({formula,percent});
const notes=rows=>({name:'Instrucciones',width:105,rows:[['Guía de uso'],...rows.map(text=>[text])]});
export const excelLessons={
 basics:{
  title:'Referencias, rangos y operaciones',level:'Básico',
  theory:'Una celda es un dato con dirección, por ejemplo B2. Un rango B2:B4 contiene las tres celdas de esa columna. Cuando copias B2 a la fila siguiente se vuelve B3; si escribes $B$2 queda fijo. Una referencia mixta como B$2 fija la fila y deja cambiar la columna.',
  method:'Usa referencias que puedas seguir al auditar el archivo. Para sumar metros usa SUMA sobre el rango de metros; para medir rendimiento divide metros buenos entre metros consumidos y aplica formato de porcentaje. La celda puede mostrar 75 % mientras guarda 0.75. Evita guardar números con unidades escritas como texto.',
  example:'Con B2 = 100, B3 = 80 y B4 = 120, SUMA(B2:B4) devuelve 300. Si el factor que comparte toda la tabla está en D2, copia =B2*$D$2 hacia abajo para conservar el factor.',
  formula:['SUMA','SUM','B2:B4'],cell:'D3',version:'SUMA y referencias absolutas están disponibles en Excel de escritorio y Microsoft 365.',
  lab:{data:[[1,100],[2,80],[3,120]],target:'=SUM(B2:B4)',answer:300}
 },
 inventory:{
  title:'Inventario de tintas por movimientos',level:'Básico e intermedio',
  theory:'Mantén una fila por código en Inventario y una fila por transacción en Movimientos. Una entrada aumenta disponibilidad y una salida la reduce. SUMAR.SI reúne cantidades por código, a partir de un rango de criterios y un rango de cantidades alineados. Un código puede comenzar con cero; guárdalo como texto y evita diferencias de espacios.',
  method:'Escribe el código en Inventario!A2. En Movimientos!B usa exactamente ese mismo código. Captura kilos en C para entradas o D para salidas. En la primera fila de Inventario, agrega entradas en D2, salidas en E2 y calcula el saldo en F2. Filtra o revisa saldos negativos y rastrea movimientos omitidos antes de corregir el número.',
  example:'Con saldo inicial de 4 kg, una entrada de 3 kg y una salida de 1 kg del mismo código, el saldo esperado es 6 kg. Si ves 4 kg revisa que ambos movimientos usen el mismo código y que las cantidades sean numéricas.',
  formula:['SUMAR.SI','SUMIF',"'Movimientos'!$B$2:$B$1000|A2|'Movimientos'!$C$2:$C$1000"],cell:'Inventario!D2',version:'SUMAR.SI funciona en Excel de escritorio y Microsoft 365. Para filtrar por código y fecha utiliza SUMAR.SI.CONJUNTO en versiones compatibles.',
  lab:{data:[['AZ-01',3],['RO-02',6],['AZ-01',1]],target:'=SUMIF(A2:A4,"AZ-01",B2:B4)',answer:4},
  sheets:()=>[
    {name:'Inventario',filter:true,rows:[['Código','Tinta','Inicial (kg)','Entradas (kg)','Salidas (kg)','Disponible (kg)'],
      ...Array.from({length:19},(_,i)=>{const r=i+2;return [i===0?'EJEMPLO-AZ':null,i===0?'Azul de práctica':null,i===0?4:null,
        f('IF(A'+r+'="","",SUMIF(Movimientos!$B$2:$B$1000,A'+r+',Movimientos!$C$2:$C$1000))'),
        f('IF(A'+r+'="","",SUMIF(Movimientos!$B$2:$B$1000,A'+r+',Movimientos!$D$2:$D$1000))'),
        f('IF(A'+r+'="","",C'+r+'+D'+r+'-E'+r+')')];})]},
    {name:'Movimientos',filter:true,filterTo:1000,list:{range:'E2:E1000',values:['Compra','Consumo','Devolución','Ajuste']},rows:[
      ['Fecha (AAAA-MM-DD)','Código','Entrada (kg)','Salida (kg)','Motivo','Referencia'],
      ['','EJEMPLO-AZ',3,0,'Compra','Dato didáctico'],['','EJEMPLO-AZ',0,1,'Consumo','Dato didáctico']]},
    notes(['Elimina los datos didácticos antes de usar el libro en producción.','Captura un código por fila de Inventario. Su saldo se calcula desde Movimientos.',
      'Introduce solo cantidades positivas. Registra una entrada o una salida por fila.','Las fórmulas consultan Movimientos hasta la fila 1000. Amplía rangos si usas más filas.',
      'Hay fórmulas hasta la fila 20 en Inventario. Cópialas hacia abajo si agregas más códigos.'])
  ]
 },
 waste:{
  title:'Desperdicio mensual ponderado',level:'Intermedio',
  theory:'Mide metros consumidos y metros buenos con la misma unidad y el mismo alcance. El desperdicio de una orden es la diferencia. El porcentaje mensual correcto sale de dividir la pérdida acumulada entre el consumo acumulado. Un promedio simple de porcentajes de órdenes da el mismo peso a tiradas de longitudes muy diferentes.',
  method:'Usa un libro o una copia por mes. Captura una fila por orden. Si los metros buenos superan el consumo, valida la unidad, el lote y la medición antes de entregar el informe. Clasifica causas con la lista y usa filtros para separar arranque, ajuste o retrabajo.',
  example:'Orden A consumió 100 m y entregó 90 m, pérdida 10 %. Orden B consumió 900 m y entregó 855 m, pérdida 5 %. El mes perdió 55 de 1 000 m o 5.5 %, aunque la media simple de 10 % y 5 % sea 7.5 %.',
  formula:['SI','IF','B2=0|0|B3/B2'],cell:'Resumen!B4',version:'Funciona con SUMA y SI en Excel de escritorio y Microsoft 365.',
  lab:{data:[['A',100,90],['B',900,855]],target:'=(SUM(B2:B3)-SUM(C2:C3))/SUM(B2:B3)',answer:.055},
  sheets:()=>[
    {name:'Producción',filter:true,list:{range:'E2:E21',values:['Arranque','Ajuste','Defecto','Retrabajo','Otro']},rows:[
      ['Orden','Consumidos (m)','Buenos (m)','Merma (m)','Causa','Control de captura'],
      ...Array.from({length:20},(_,i)=>{const r=i+2;return[
        ['EJEMPLO-A','EJEMPLO-B'][i]||null,[100,900][i]??null,[90,855][i]??null,
        f('IF(OR(B'+r+'="",C'+r+'="",B'+r+'<0,C'+r+'<0,C'+r+'>B'+r+'),"",B'+r+'-C'+r+')'),
        i<2?'Arranque':null,f('IF(COUNTA(A'+r+':C'+r+')=0,"",IF(OR(B'+r+'="",C'+r+'="",B'+r+'<0,C'+r+'<0,C'+r+'>B'+r+'),"Revisar","OK"))')
      ];})]},
    {name:'Resumen',rows:[['Indicador','Resultado'],['Consumo válido (m)',f('SUMIF(Producción!F2:F21,"OK",Producción!B2:B21)')],
      ['Merma válida (m)',f('SUM(Producción!D2:D21)')],['Merma ponderada',f('IF(B2=0,0,B3/B2)',true)],
      ['Filas para revisar',f('COUNTIF(Producción!F2:F21,"Revisar")')]]},
    notes(['Guarda una copia por mes e identifica el periodo en el nombre del archivo.','Los datos marcados EJEMPLO son didácticos.',
      'Verifica las filas marcadas Revisar. El resumen excluye esas filas.','Si amplías las órdenes, copia las fórmulas y amplía todos los rangos del resumen.'])
  ]
 },
 pareto:{
  title:'Pareto de pérdidas por causa',level:'Intermedio',
  theory:'Un Pareto ordena causas de mayor a menor según un criterio común, como metros perdidos, costo o frecuencia. El acumulado responde cuánto se explicaría atendiendo las primeras causas; por sí solo no confirma causalidad ni obliga a aplicar un umbral de 80 %.',
  method:'Agrupa causas equivalentes, verifica que cada caso se cuente una vez y elige una unidad. Ordena la columna B en forma descendente antes de leer el acumulado. Si modificas las cantidades, vuelve a ordenar filas completas. Repite el análisis tras el cambio para validar la reducción.',
  example:'Tres causas representan 60, 30 y 10 metros. Sobre 100 m totales, sus participaciones son 60 %, 30 % y 10 %. Las dos primeras comprenden 90 % de la pérdida registrada.',
  formula:['SUMA','SUM','$B$2:B2'],cell:'Pareto!D2, dividido entre SUMA($B$2:$B$21)',version:'La fórmula usa SUMA y SI, disponibles en Excel de escritorio y Microsoft 365.',
  lab:{data:[['Registro',60],['Montaje',30],['Otros',10]],target:'=SUM(B2:B3)/SUM(B2:B4)',answer:.9},
  sheets:()=>[
    {name:'Pareto',filter:true,rows:[['Causa','Pérdida (m)','Participación','Acumulado'],
      ...Array.from({length:20},(_,i)=>{const r=i+2;return[
        ['Registro (ejemplo)','Montaje (ejemplo)','Otros (ejemplo)'][i]||null,[60,30,10][i]??null,
        f('IF(OR(B'+r+'="",SUM(B$2:B$21)=0),"",B'+r+'/SUM(B$2:B$21))',true),
        f('IF(OR(B'+r+'="",SUM(B$2:B$21)=0),"",SUM(B$2:B'+r+')/SUM(B$2:B$21))',true)
      ];})]},
    notes(['Los datos son didácticos. Usa una sola unidad para toda la tabla.','Ordena filas completas por Pérdida de mayor a menor.',
      'Después de ordenar, verifica que las fórmulas acumuladas correspondan a la nueva fila.','El libro contiene columnas de participación y acumulado. El gráfico interactivo se consulta en Lifts Excel.'])
  ]
 }
};
