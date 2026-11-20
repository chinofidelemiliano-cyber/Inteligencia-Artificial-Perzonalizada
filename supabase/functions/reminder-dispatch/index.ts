import {createClient} from 'npm:@supabase/supabase-js@2.49.8';
import webpush from 'npm:web-push@3.6.7';
import {timingSafeEqual} from 'node:crypto';

const endpointHosts = /^(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
type Delivery = {
  delivery_id: string;
  lease_attempt: number;
  destination: string;
  key_p256dh: string;
  key_auth: string;
  reminder_priority: number;
};

const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Cache-Control':'no-store'
};
const reply = (body:object, status = 200) => Response.json(body, {status,headers:cors});
type Config = {public_key:string;private_key:string;dispatch_secret:string;subject:string};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
  if (request.method !== 'POST') return reply({error:'Método no permitido.'},405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return reply({error:'Falta la configuración de Supabase.'},503);
  const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const dispatchKey = request.headers.get('X-Dispatch-Key');
  const authorization = request.headers.get('Authorization') || '';
  if (!dispatchKey) {
    const body = await request.json().catch(()=>null);
    if (body?.action !== 'bootstrap' || !authorization.startsWith('Bearer ')) return reply({error:'Sesión requerida.'},401);
    const {data:{user},error:authError} = await db.auth.getUser(authorization.slice(7));
    if (authError || !user) return reply({error:'Sesión inválida.'},401);
    const current = await db.rpc('lifts_push_configuration');
    if (current.error) return reply({error:'Ejecuta la actualización SQL de avisos automáticos en Supabase.'},503);
    if (current.data) return reply({publicKey:current.data.public_key});
    const dispatchUrl = new URL('/functions/v1/reminder-dispatch',url).href;
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1\/reminder-dispatch$/.test(dispatchUrl)) {
      return reply({error:'No se pudo identificar la dirección de la función en Supabase.'},503);
    }
    const existingPublic = Deno.env.get('WEB_PUSH_PUBLIC_KEY');
    const existingPrivate = Deno.env.get('WEB_PUSH_PRIVATE_KEY');
    const keys = existingPublic && existingPrivate
      ? {publicKey:existingPublic,privateKey:existingPrivate} : webpush.generateVAPIDKeys();
    const dispatchSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
    const saved = await db.rpc('lifts_push_configuration',{candidate:{
      public_key:keys.publicKey, private_key:keys.privateKey,
      dispatch_secret:dispatchSecret, dispatch_url:dispatchUrl,
      subject:Deno.env.get('WEB_PUSH_SUBJECT') || 'https://lifts-asistente-virtual.pages.dev'
    }});
    if (saved.error || !saved.data) return reply({error:'No se pudo guardar la configuración de avisos.'},503);
    return reply({publicKey:saved.data.public_key});
  }

  if (!/^[a-f0-9]{64}$/.test(dispatchKey)) return reply({error:'Envío no autorizado.'},401);
  const {data:config,error:configError} = await db.rpc('lifts_push_configuration') as {data:Config|null;error:unknown};
  if (configError) return reply({error:'Configuración de avisos inaccesible.'},503);
  const bytes = new TextEncoder();
  if (!config || !timingSafeEqual(bytes.encode(config.dispatch_secret),bytes.encode(dispatchKey))) {
    return reply({error:'Envío no autorizado.'},401);
  }
  const {subject,public_key:publicKey,private_key:privateKey} = config;
  const {data, error} = await db.rpc('claim_due_reminder_push');
  if (error) return reply({error:'No se pudieron reclamar los avisos.'},503);

  const batch = data as Delivery[];
  const titles = new Map<string,string>();
  if (batch.length) {
    const deliveryRows = await db.from('reminder_deliveries').select('id,user_id,task_id')
      .in('id',batch.map(delivery=>delivery.delivery_id));
    if (!deliveryRows.error && deliveryRows.data.length) {
      const users = [...new Set(deliveryRows.data.map(row=>row.user_id))];
      const spaces = await db.from('user_spaces').select('user_id,tasks:data->tasks')
        .in('user_id',users).filter('data->notificationDetails','eq','true');
      const optedIn = new Map(spaces.data?.map(space=>[space.user_id,space.tasks]));
      for (const row of deliveryRows.data) {
        const tasks = optedIn.get(row.user_id);
        const task = Array.isArray(tasks) ? tasks.find((task): task is {id:string;title:string}=>
          Boolean(task && typeof task==='object' && !Array.isArray(task) && task.id===row.task_id &&
            typeof task.title==='string')) : null;
        if (typeof task?.title === 'string') {
          const title=task.title.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,120);
          if (title) titles.set(row.id,title);
        }
      }
    }
  }
  let storageErrors = 0;
  for (let i = 0; i < batch.length; i += 8) {
    await Promise.all(batch.slice(i, i+8).map(async delivery => {
      let status = 'accepted';
      let detail: string | null = null;
      try {
        const endpoint = new URL(delivery.destination);
        if (endpoint.protocol !== 'https:' || endpoint.port || endpoint.username || endpoint.password || !endpointHosts.test(endpoint.hostname)) {
          status = 'failed';
          detail = 'Proveedor de avisos no compatible';
        } else {
          await webpush.sendNotification({
            endpoint:endpoint.href, keys:{p256dh:delivery.key_p256dh,auth:delivery.key_auth}
          }, JSON.stringify({id:delivery.delivery_id,intensity:delivery.reminder_priority,title:titles.get(delivery.delivery_id)}), {
            TTL:3600, timeout:7000, urgency:delivery.reminder_priority === 1 ? 'high' : delivery.reminder_priority === 3 ? 'low' : 'normal',
            vapidDetails:{subject,publicKey,privateKey}
          });
        }
      } catch (failure) {
        const code = Number((failure as {statusCode?:number}).statusCode) || 0;
        status = code === 404 || code === 410 ? 'expired' :
          (code === 0 || code === 429 || code >= 500) && delivery.lease_attempt < 5 ? 'retry' : 'failed';
        detail = code ? 'Servicio de avisos HTTP ' + code : 'Error de conexión o configuración de avisos';
      }
      const {error:saveError} = await db.from('reminder_deliveries').update({
        status,detail,updated_at:new Date().toISOString()
      }).eq('id',delivery.delivery_id).eq('attempts',delivery.lease_attempt);
      if (saveError) storageErrors++;
    }));
  }

  // Retain a short delivery history. Subscription records stay available for device status.
  const cutoff = new Date(Date.now() - 30*86400000).toISOString();
  const {error:cleanupError} = await db.from('reminder_deliveries').delete().lt('updated_at',cutoff);
  return reply({processed:batch.length,storageErrors:storageErrors + Number(Boolean(cleanupError))},
    storageErrors || cleanupError ? 503 : 200);
});
