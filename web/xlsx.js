const encoder=new TextEncoder();
const xmlHeader='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relNs='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const packageRel='http://schemas.openxmlformats.org/package/2006/relationships';
const xml=value=>String(value).replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/gu,c=>c.length===2?c:'')
  .replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const bytes=(length)=>new Uint8Array(length);
const crcTable=Uint32Array.from({length:256},(_,index)=>{
  let value=index;
  for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);
  return value>>>0;
});
function crc(data) {
  let value=0xffffffff;
  for(const byte of data)value=(value>>>8)^crcTable[(value^byte)&255];
  return (value^0xffffffff)>>>0;
}
function zip(files) {
  const local=[],directory=[];
  let offset=0,dirLength=0;
  for(const [path,text] of files){
    const name=encoder.encode(path),data=encoder.encode(xmlHeader+text),checksum=crc(data);
    const header=bytes(30),h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);
    h.setUint16(12,33,true);h.setUint32(14,checksum,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);
    h.setUint16(26,name.length,true);
    local.push(header,name,data);
    const central=bytes(46),c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);
    c.setUint16(14,33,true);c.setUint32(16,checksum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);
    c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
    directory.push(central,name);
    dirLength+=central.length+name.length;
    offset+=header.length+name.length+data.length;
  }
  const end=bytes(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
  e.setUint32(12,dirLength,true);e.setUint32(16,offset,true);
  const output=bytes(offset+dirLength+end.length);
  let position=0;
  for(const block of [...local,...directory,end]){
    output.set(block,position);position+=block.length;
  }
  return output;
}
function column(index){
  let letters='';
  for(let n=index+1;n>0;n=Math.floor((n-1)/26))letters=String.fromCharCode(65+(n-1)%26)+letters;
  return letters;
}
function cell(value,index,row) {
  if(value==null)return '';
  const ref=column(index)+row;
  if(typeof value==='object')return '<c r="'+ref+'"'+(value.percent?' s="2"':'')+'><f>'+xml(value.formula)+'</f></c>';
  const style=row===1?' s="1"':'';
  return typeof value==='number'?'<c r="'+ref+'"'+style+'><v>'+value+'</v></c>':
    '<c r="'+ref+'" t="inlineStr"'+style+'><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
}
export function workbook(sheets) {
  const type='application/vnd.openxmlformats-officedocument.spreadsheetml.';
  const override=(path,kind)=>'<Override PartName="/'+path+'" ContentType="'+type+kind+'+xml"/>';
  const relation=(id,kind,target)=>'<Relationship Id="'+id+'" Type="'+relNs+'/'+kind+'" Target="'+target+'"/>';
  const relationships=spec=>'<Relationships xmlns="'+packageRel+'">'+spec.join('')+'</Relationships>';
  const root=[
    ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
      '<Default Extension="xml" ContentType="application/xml"/>'+override('xl/workbook.xml','sheet.main')+override('xl/styles.xml','styles')+
      sheets.map((_,i)=>override('xl/worksheets/sheet'+(i+1)+'.xml','worksheet')).join('')+'</Types>'],
    ['_rels/.rels',relationships([relation('rId1','officeDocument','xl/workbook.xml')])],
    ['xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="'+relNs+'"><sheets>'+
      sheets.map(({name},i)=>'<sheet name="'+xml(name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+
      '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'],
    ['xl/_rels/workbook.xml.rels',relationships([...sheets.map((_,i)=>relation('rId'+(i+1),'worksheet','worksheets/sheet'+(i+1)+'.xml')),
      relation('rId'+(sheets.length+1),'styles','styles.xml')])],
    ['xl/styles.xml','<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF095499"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
  ];
  return zip([...root,...sheets.map(({rows,filter,filterTo,list,width=24},i)=>{
    const endCol=column(Math.max(...rows.map(row=>row.length))-1);
    const table=rows.map((row,index)=>'<row r="'+(index+1)+'">'+row.map((value,col)=>cell(value,col,index+1)).join('')+'</row>').join('');
    const dataValidation=list?'<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="'+xml(list.range)+'"><formula1>'+xml('"'+list.values.join(',')+'"')+'</formula1></dataValidation></dataValidations>':'';
    return ['xl/worksheets/sheet'+(i+1)+'.xml','<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="'+(Math.max(...rows.map(row=>row.length)))+'" width="'+width+'" customWidth="1"/></cols><sheetData>'+table+'</sheetData>'+
      (filter?'<autoFilter ref="A1:'+endCol+(filterTo||rows.length)+'"/>':'')+dataValidation+'</worksheet>'];
  })]);
}

export {zip as zipXml,xml as escapeXml};
