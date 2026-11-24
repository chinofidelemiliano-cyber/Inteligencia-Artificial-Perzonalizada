'use strict';

(function(root){
  const dayMs=86400000;
  const textLimit=16000;
  const lineLimit=300;
  const digits='0123456789ABCDEF';
  const bases=[2,8,10,16];

  function requireText(value){
    if(typeof value!=='string'||value.length>textLimit)throw new Error('Admite hasta '+textLimit+' caracteres por texto.');
    return value;
  }

  function compareText(original,revised){
    const split=value=>value===''?[]:value.replace(/\r\n?/g,'\n').split('\n');
    const before=split(requireText(original)),after=split(requireText(revised));
    if(before.length>lineLimit||after.length>lineLimit)throw new Error('Admite hasta '+lineLimit+' líneas por texto.');
    const common=Array.from({length:before.length+1},()=>new Uint16Array(after.length+1));
    for(let left=before.length-1;left>=0;left--){
      for(let right=after.length-1;right>=0;right--){
        common[left][right]=before[left]===after[right]?1+common[left+1][right+1]:Math.max(common[left+1][right],common[left][right+1]);
      }
    }
    const changes=[];
    let left=0,right=0,removed=0,added=0;
    while(left<before.length||right<after.length){
      if(left<before.length&&right<after.length&&before[left]===after[right]){
        left++;right++;
      }else if(right===after.length||left<before.length&&common[left+1][right]>=common[left][right+1]){
        changes.push({kind:'removed',line:left+1,text:before[left++]});
        removed++;
      }else{
        changes.push({kind:'added',line:right+1,text:after[right++]});
        added++;
      }
    }
    return {changes,removed,added,unchanged:common[0][0]};
  }

  function calendarDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Introduce una fecha válida.');
    const [year,month,day]=value.split('-').map(Number);
    const date=new Date(0);
    date.setUTCFullYear(year,month-1,day);
    if(year===0||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day){
      throw new Error('Introduce una fecha válida.');
    }
    return date;
  }

  function daysBetween(start,end){
    return (+calendarDate(end)-calendarDate(start))/dayMs;
  }

  function addDays(start,days){
    const from=calendarDate(start);
    if(!Number.isSafeInteger(days))throw new Error('Introduce un número entero de días.');
    const date=new Date(+from+days*dayMs);
    const year=date.getUTCFullYear();
    if(!Number.isFinite(year)||year<1||year>9999)throw new Error('El resultado queda fuera del intervalo 0001–9999.');
    return date.toISOString().slice(0,10);
  }

  function convertBase(value,from,to){
    if(!bases.includes(from)||!bases.includes(to))throw new Error('Selecciona bases compatibles.');
    const input=String(value).trim().toUpperCase();
    if(!/^[+-]?[0-9A-F]{1,256}$/.test(input))throw new Error('Introduce hasta 256 dígitos y un signo opcional.');
    const sign=input.startsWith('-')?-1n:1n;
    const number=/^[+-]/.test(input)?input.slice(1):input;
    const base=BigInt(from);
    let total=0n;
    for(const character of number){
      const digit=digits.indexOf(character);
      if(digit>=from)throw new Error('El dígito '+character+' no pertenece a la base '+from+'.');
      total=total*base+BigInt(digit);
    }
    return (sign*total).toString(to).toUpperCase();
  }

  function encodeText(value){
    const bytes=new TextEncoder().encode(requireText(value));
    const chunks=[];
    for(let index=0;index<bytes.length;index+=4096){
      chunks.push(String.fromCharCode(...bytes.subarray(index,index+4096)));
    }
    return btoa(chunks.join(''));
  }

  function decodeText(value){
    if(typeof value!=='string'||value.length>64000)throw new Error('Admite hasta 64000 caracteres en Base64.');
    const encoded=value.replace(/[\t\n\f\r ]/g,'');
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)){
      throw new Error('Introduce Base64 estándar con relleno correcto.');
    }
    const byteString=atob(encoded);
    if(btoa(byteString)!==encoded)throw new Error('La representación Base64 tiene bits de relleno inválidos.');
    const bytes=Uint8Array.from(byteString,character=>character.charCodeAt(0));
    try{
      return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
    }catch{
      throw new Error('Los datos Base64 no corresponden a texto UTF-8 válido.');
    }
  }

  const api={compareText,daysBetween,addDays,convertBase,encodeText,decodeText};
  if(typeof module==='object')module.exports=api;else root.liftsUtilitiesCore=api;
})(globalThis);
