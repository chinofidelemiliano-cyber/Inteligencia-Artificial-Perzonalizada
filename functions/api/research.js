const SUPABASE_URL='https://ubasjdaluswyxpzsnyug.supabase.co';
const PUBLIC_KEY='sb_publishable_GH2AGtpyka8sgEfEJxZeDw_oJrXtgpD';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequestPost({request,env}){
  if((env.FREE_AI_CONFIRMED ?? 'true')!=='true')return json({error:'La consulta remota está pausada hasta revisar el plan gratuito.'},503);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origen no permitido.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Se requiere JSON.'},415);
  const authorization=request.headers.get('Authorization') || '';if(!/^Bearer \S+$/.test(authorization)||authorization.length>8192)return json({error:'Inicia sesión para consultar referencias.'},401);
  let query;
  try{const reader=request.body?.getReader();if(!reader)return json({error:'Solicitud inválida.'},400);let total=0;const chunks=[];while(true){const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>4096){await reader.cancel();return json({error:'Solicitud demasiado grande.'},413);}chunks.push(part.value);}const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}const body=JSON.parse(new TextDecoder().decode(bytes));query=body?.query;if(typeof query!=='string'||!query.trim()||query.length>300)return json({error:'Escribe un tema de hasta 300 caracteres.'},400);query=query.trim();}catch{return json({error:'Solicitud inválida.'},400);}
  try{
    const headers={apikey:PUBLIC_KEY,Authorization:authorization};const auth=await fetch(SUPABASE_URL+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});if(!auth.ok)return json({error:'No se pudo verificar tu sesión.'},auth.status===401||auth.status===403?401:503);if(!(await auth.json()).id)return json({error:'Sesión inválida.'},401);
    const quota=await fetch(SUPABASE_URL+'/rest/v1/rpc/claim_ai_request',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});if(!quota.ok)return json({error:'No se pudo comprobar tu cuota.'},503);if(await quota.json()!==true)return json({error:'Alcanzaste el límite de consultas. Inténtalo más tarde.'},429);
    const target=new URL('https://es.wikipedia.org/w/api.php');target.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:query,gsrlimit:'3',prop:'extracts|info',exintro:'1',explaintext:'1',exchars:'1200',inprop:'url',format:'json'}).toString();
    const response=await fetch(target,{headers:{'User-Agent':'Lifts/1.0 (https://lifts-asistente-virtual.pages.dev; user-initiated reference search)'},signal:AbortSignal.timeout(12000)});if(!response.ok)return json({error:'La referencia gratuita no está disponible ahora. Puedes buscar en el sitio del fabricante.'},503);
    const data=await response.json();if(data.error)return json({error:'La referencia no pudo procesar la búsqueda. Prueba un tema más concreto.'},502);
    const results=[];for(const page of Object.values(data.query?.pages || {}).sort((a,b)=>(a.index||0)-(b.index||0))){if(typeof page.title!=='string'||typeof page.extract!=='string'||!page.extract.trim())continue;try{const url=new URL(page.fullurl);if(url.protocol!=='https:'||url.hostname!=='es.wikipedia.org'||url.username||url.password)continue;results.push({title:page.title.slice(0,240),url:url.href,excerpt:page.extract.slice(0,1400)});}catch{}}
    return json({results:results.slice(0,3),source:'Wikipedia en español',retrievedAt:new Date().toISOString(),note:'Referencia general secundaria. No sustituye manuales ni especificaciones del fabricante.'});
  }catch{return json({error:'No se pudo completar la consulta gratuita. Prueba más tarde o busca el manual del fabricante.'},503);}
}
export const onRequestGet=()=>json({error:'Usa el formulario de referencias con sesión iniciada.'},405);
