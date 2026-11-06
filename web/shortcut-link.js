'use strict';
((root)=>{
  function parse(href){const url=new URL(href);const params=new URLSearchParams(url.hash.slice(1));if(!params.has('voice'))return null;const text=(params.get('voice') || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim();params.delete('voice');params.delete('target');url.hash=params.toString();return{text:text.length<=5000?text:'',error:!text?'El atajo llegó sin texto. Repite el dictado.':text.length>5000?'El dictado supera 5000 caracteres. Intenta una petición más corta.':'',cleanUrl:url.href};}
  const api={parse};root.liftsShortcut=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
