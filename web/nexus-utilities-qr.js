import {qrcode} from './nexus-utilities-qr-lib.js';

const encoder=new TextEncoder();
qrcode.stringToBytes=value=>encoder.encode(value);

export function qrMatrix(text){
  if(typeof text!=='string'||!text.trim())throw new Error('Introduce el texto o enlace que llevará el código QR.');
  if(encoder.encode(text).length>500)throw new Error('El código QR admite hasta 500 bytes de texto UTF-8.');
  const code=qrcode(0,'M');
  code.addData(text,'Byte');
  code.make();
  const size=code.getModuleCount();
  return Array.from({length:size},(_,row)=>Array.from({length:size},(_,column)=>code.isDark(row,column)));
}
