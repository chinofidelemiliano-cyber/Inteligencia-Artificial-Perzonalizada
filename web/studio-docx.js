import {zipXml,escapeXml} from './xlsx.js';

export function documentFile(title,subtitle,sections) {
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const root='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const pkg='http://schemas.openxmlformats.org/package/2006/relationships';
  const paragraph=(text,style='')=>'<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+
    '<w:r><w:t xml:space="preserve">'+escapeXml(text)+'</w:t></w:r></w:p>';
  const styles=[
    ['Title','Título',38,'095499'],['Subtitle','Subtítulo',22,'39546C'],['Heading1','Encabezado 1',28,'095499']
  ].map(([id,name,size,color])=>'<w:style w:type="paragraph" w:styleId="'+id+'"><w:name w:val="'+name+
    '"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="'+color+
    '"/><w:sz w:val="'+size+'"/></w:rPr></w:style>').join('');
  const body=[paragraph(title,'Title'),paragraph(subtitle,'Subtitle'),
    ...sections.flatMap(section=>[paragraph(section.heading,'Heading1'),...section.body.split('\n').map(line=>paragraph(line))])].join('');
  return zipXml([
    ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
    ['_rels/.rels','<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+root+'officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/_rels/document.xml.rels','<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+root+'styles" Target="styles.xml"/></Relationships>'],
    ['word/styles.xml','<w:styles xmlns:w="'+ns+'">'+styles+'</w:styles>'],
    ['word/document.xml','<w:document xmlns:w="'+ns+'"><w:body>'+body+
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>']
  ]);
}
