const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
// El propietario confirmó Workers Free; la variable false permite pausar antes de cambiar de plan.
const OWNER_CONFIRMED_FREE_PLAN = true;
const freeAiEnabled = env => (env.FREE_AI_CONFIRMED ?? String(OWNER_CONFIRMED_FREE_PLAN)) === 'true';
const SUPABASE_URL = 'https://ubasjdaluswyxpzsnyug.supabase.co';
const PUBLIC_KEY = 'sb_publishable_GH2AGtpyka8sgEfEJxZeDw_oJrXtgpD';
const json = (error,status) => Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readPrompt(request) {
  const reader=request.body?.getReader();if(!reader)throw new Error('invalid');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw new Error('large');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if(typeof body?.prompt!=='string' || !body.prompt.trim() || body.prompt.length>2048)throw new Error('invalid');
  return body.prompt.trim();
}
export async function onRequestPost({request,env}) {
  if(!freeAiEnabled(env))return json('La generación de imágenes está pausada para evitar gastos. Solo se habilita con un plan gratuito confirmado que bloquee el uso al agotar su cuota.',503);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json('Solicitud de origen no permitido.',403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json('Se requiere JSON.',415);
  const authorization=request.headers.get('Authorization') || '';
  if(!/^Bearer \S+$/.test(authorization) || authorization.length>8192)return json('Inicia sesión para crear imágenes.',401);
  let prompt;
  try{prompt=await readPrompt(request);}catch(error){return json(error.message==='large'?'La solicitud es demasiado grande.':'Escribe una descripción de entre 1 y 2048 caracteres.',error.message==='large'?413:400);}
  let stage='AUTH';
  try{
    const headers={apikey:PUBLIC_KEY,Authorization:authorization};
    const auth=await fetch(SUPABASE_URL+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
    if(!auth.ok)return json(auth.status===401 || auth.status===403?'Tu sesión caducó. Vuelve a iniciar sesión.':'No se pudo verificar tu sesión.',auth.status===401 || auth.status===403?401:503);
    if(!(await auth.json()).id)return json('Sesión inválida.',401);
    if(!env.AI?.run)return json('El servicio de imágenes no está configurado. El administrador debe revisar el vínculo AI del proyecto.',503);
    stage='QUOTA';
    const quota=await fetch(SUPABASE_URL+'/rest/v1/rpc/claim_ai_request',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
    if(!quota.ok)return json('No se pudo comprobar tu cuota. El administrador debe revisar la configuración de uso.',503);
    if(await quota.json()!==true)return json('Alcanzaste el límite de uso de tu cuenta. El chat y las imágenes comparten cuota.',429);
    stage='IMAGE';
    const result=await env.AI.run(IMAGE_MODEL,{prompt,steps:4});
    if(typeof result?.image!=='string' || !result.image.length || result.image.length>24000000)return json('El modelo no devolvió una imagen válida.',502);
    const bytes=Uint8Array.from(atob(result.image),char=>char.charCodeAt(0));
    const isPNG=bytes.length>=8 && [137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
    const isJPEG=bytes.length>=3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
    const isWebP=bytes.length>=12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    const mime=isPNG?'image/png':isJPEG?'image/jpeg':isWebP?'image/webp':null;
    if(!mime)return json('El servicio devolvió un formato de imagen no reconocido.',502);
    return new Response(bytes,{headers:{'Content-Type':mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){
    if(stage!=='IMAGE')return json('No se pudo contactar con el servicio de acceso o cuota. Inténtalo más tarde.',503);
    const description=String(error?.message || '');
    const code=String(error?.code || '').match(/^\d{3,5}$/)?.[0] || description.match(/\b\d{4,5}\b/)?.[0];
    let explanation='No se pudo generar la imagen. Inténtalo más tarde.';
    if(/quota|neurons|rate limit|limit exceeded/i.test(description))explanation='El proveedor de IA alcanzó un límite de uso. Revisa la cuota del servicio.';
    else if(/paid plan|payment|billing/i.test(description))explanation='El modelo de imágenes requiere revisar el plan o la facturación del servicio.';
    else if(/terms|agreement|license.*accept/i.test(description))explanation='El servicio requiere aceptar las condiciones del modelo de imágenes en su panel.';
    else if(/not found|deprecated|unavailable|not authorized|permission|forbidden/i.test(description))explanation='El modelo de imágenes no está disponible para esta cuenta. El administrador debe revisar su disponibilidad y permisos.';
    return json(explanation+' Diagnóstico: IMAGE_GENERATION'+(code?' / código '+code:'')+'.',503);
  }
}
export const onRequestGet=()=>json('Usa el formulario de imágenes con tu sesión iniciada.',405);
