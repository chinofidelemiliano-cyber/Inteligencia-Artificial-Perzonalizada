'use strict';
((root)=>{
  // Standard PDF fonts, WinAnsi text and byte-accurate offsets. No remote library.
  const replacements={'—':'-','–':'-','→':'->','“':'"','”':'"','‘':"'",'’':"'",'…':'...','×':'x','Δ':'Delta ','²':'2','≤':'<=','≥':'>='};
  function latin(value){return String(value??'').replace(/[—–→“”‘’…×Δ²≤≥]/g,c=>replacements[c]).replace(/[^\x20-\x7e\xa0-\xff\n\r\t]/g,'?');}
  const escape=value=>latin(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  function wrap(value,width=92){const lines=[];for(const paragraph of latin(value).replace(/\r/g,'').split('\n')){if(!paragraph.trim()){lines.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){while(word.length>width){if(line){lines.push(line);line='';}lines.push(word.slice(0,width));word=word.slice(width);}if(line.length+word.length+1>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);}return lines;}
  const widths=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,...Array(10).fill(556),278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  function measured(value,size,bold){let total=0;for(const character of value){const code=character.normalize('NFD')[0].charCodeAt(0);total+=(widths[code-32]||556)*size/1000*(bold?1.22:1);}return total;}
  function fitted(value,size,bold){const lines=[];for(const paragraph of latin(value).replace(/\r/g,'').split('\n')){let line='';for(const character of paragraph){if(measured(line+character,size,bold)>503){const cut=line.lastIndexOf(' ');if(cut>0){lines.push(line.slice(0,cut));line=line.slice(cut+1);}else{lines.push(line);line='';}}line+=character;}lines.push(line);}return lines;}
  function make({title,subtitle='',sections=[],footer='Lifts · Registro privado del usuario'}){
    const pages=[];let commands=[],y=792;
    const text=(value,size=10,bold=false)=>{for(const line of fitted(value,size,bold)){if(y<58){pages.push(commands.join('\n'));commands=[];y=792;}commands.push(`BT /${bold?'F2':'F1'} ${size} Tf 0.08 0.14 0.24 rg 46 ${y} Td (${escape(line)}) Tj ET`);y-=size+5;}};
    text(title,18,true);text(subtitle,10);y-=10;for(const section of sections){text(section.heading,12,true);text(section.body,10);y-=10;}pages.push(commands.join('\n'));
    const objects=['','<< /Type /Catalog /Pages 2 0 R >>','','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
    const kids=[];for(const [index,content]of pages.entries()){const pageId=objects.length,streamId=pageId+1;kids.push(pageId+' 0 R');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);const stream=content+`\nBT /F1 8 Tf 0.3 0.35 0.4 rg 46 30 Td (${escape(footer)} - ${index+1}/${pages.length}) Tj ET`;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);}
    objects[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
    let result='%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';const offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=result.length;result+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=result.length;result+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)result+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';result+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Uint8Array.from(result,c=>c.charCodeAt(0));
  }
  const api={make,wrap};root.liftsPdf=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
