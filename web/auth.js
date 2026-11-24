'use strict';
(() => {
  const el = id => document.getElementById(id);
  if (!window.supabase) {
    el('authStatus').textContent = 'No se pudo cargar el servicio de cuentas. Revisa tu conexión y recarga la página.';
    el('authForm').querySelectorAll('button').forEach(b => b.disabled = true);
    return;
  }
  const client = window.supabase.createClient(
    'https://ubasjdaluswyxpzsnyug.supabase.co',
    'sb_publishable_GH2AGtpyka8sgEfEJxZeDw_oJrXtgpD',
    {auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}
  );
  let user = null;
  let generation = 0;
  let queue = Promise.resolve();
  let busy = false;
  let ready = false;
  let revision = null;
  let conflicted = false;
  const redirectTo = new URL('/', location.href).href;
  function message(text) { el('authStatus').textContent = text; }
  function registrationError(error) {
    const explanations = {
      over_email_send_rate_limit: 'Supabase alcanzó el límite de envío de correos. Espera antes de reintentar; para uso público configura un proveedor SMTP en Supabase.',
      over_request_rate_limit: 'Hay demasiados intentos. Espera antes de volver a registrarte.',
      email_address_not_authorized: 'El servicio de correo de Supabase no está autorizado para enviar a esta dirección. Configura un proveedor SMTP en Supabase.',
      signup_disabled: 'El registro de usuarios está desactivado. Actívalo en Authentication de Supabase.',
      email_provider_disabled: 'El acceso por correo está desactivado en Supabase.',
      weak_password: 'La contraseña no cumple los requisitos de seguridad configurados en Supabase. Elige otra contraseña.',
      email_address_invalid: 'Supabase no acepta esta dirección de correo. Revisa que esté bien escrita.',
      user_already_exists: 'No se pudo crear la cuenta. Intenta iniciar sesión o recuperar tu contraseña.',
      unexpected_failure: 'Supabase tuvo un error interno. Revisa los registros de Authentication para identificar la causa.'
    };
    const code = typeof error.code === 'string' ? error.code : '';
    const detail = explanations[code] || (error.status === 429
      ? 'Se alcanzó un límite de solicitudes o correos. Espera antes de reintentar y revisa los límites en Supabase.'
      : 'Supabase rechazó el registro. Detalle: ' + String(error.message || 'Sin descripción disponible.').slice(0,400));
    return 'No se pudo completar el registro. ' + detail + (code ? ' Código: ' + code + '.' : '') + (error.status ? ' HTTP: ' + error.status + '.' : '');
  }
  function resetView() {
    ready = false;
    user = null;
    revision = null;
    conflicted = false;
    generation++;
    el('workspace').hidden = true;
    el('authPanel').hidden = false;
    el('resetForm').hidden = true;
    el('authForm').hidden = false;
    window.dispatchEvent(new CustomEvent('nexo-state',{detail:null}));
  }
  function dataError(error) {
    if (error?.code === '42P01' || error?.code === 'PGRST205') return 'Falta preparar la base de datos: ejecuta supabase/schema.sql en el SQL Editor de Supabase y recarga.';
    return 'No se pudo acceder a tus datos. Comprueba la conexión y los permisos de Supabase y vuelve a iniciar sesión.';
  }
  async function openSession(session) {
    if (!session?.user) { resetView(); message('Inicia sesión o crea tu cuenta.'); return; }
    if (ready && user?.id === session.user.id) return;
    if (user && user.id !== session.user.id) resetView();
    const version = ++generation;
    ready = false;
    user = session.user;
    el('workspace').hidden = true;
    el('authPanel').hidden = false;
    message('Cargando tu espacio…');
    const {data,error} = await client.from('user_spaces').select('data,updated_at').eq('user_id',user.id).maybeSingle();
    if (version !== generation) return;
    if (error) { message(dataError(error)); return; }
    const saved = data?.data;
    if (saved && (!saved.profile || !Array.isArray(saved.tasks) || !Array.isArray(saved.messages))) {
      message('Los datos de tu espacio no tienen el formato esperado. No se sobrescribieron.'); return;
    }
    // Publish only after all deferred workspace modules can receive account state.
    if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
    if(version!==generation)return;
    revision = data?.updated_at || null;
    conflicted = false;
    ready = true;
    window.dispatchEvent(new CustomEvent('nexo-state',{detail:saved || null}));
    el('accountEmail').textContent = user.email || '';
    el('syncStatus').textContent = 'Datos de tu cuenta cargados.';
    el('authPanel').hidden = true;
    el('workspace').hidden = false;
    el('password').value = '';
  }
  function activeUser() {
    if (!ready || !user) throw new Error('Inicia sesión para administrar los avisos.');
    return user.id;
  }
  window.nexoAccount = {
    isReady:()=>Boolean(ready && user),
    async reminderPublicKey() {
      const token = await this.accessToken();
      const {data,error} = await client.functions.invoke('reminder-dispatch',{
        body:{action:'bootstrap'},headers:{Authorization:'Bearer ' + token}
      });
      if (error) {
        const details = await error.context?.json?.().catch(()=>null);
        throw new Error(details?.error || 'No se pudo conectar al servicio de avisos en Supabase.');
      }
      if (!/^[A-Za-z0-9_-]{87}$/.test(data?.publicKey || '')) throw new Error('El servicio de avisos no devolvió una clave pública válida.');
      return data.publicKey;
    },
    async saveReminderDevice(subscription) {
      const userId = activeUser();
      const {error} = await client.from('reminder_devices').upsert({
        user_id:userId, endpoint:subscription.endpoint, p256dh:subscription.keys?.p256dh, auth:subscription.keys?.auth
      }, {onConflict:'user_id,endpoint'});
      if (error) throw new Error('Supabase rechazó el registro del dispositivo. Comprueba la configuración del servicio de avisos.');
    },
    async removeReminderDevice(endpoint) {
      const {error} = await client.from('reminder_devices').delete().eq('user_id',activeUser()).eq('endpoint',endpoint);
      if (error) throw new Error('No se pudo quitar el dispositivo de la cuenta. Comprueba tu conexión.');
    },
    async reminderDeviceStatus(endpoint) {
      const uid = activeUser();
      const [device, history] = await Promise.all([
        client.from('reminder_devices').select('created_at').eq('user_id',uid).eq('endpoint',endpoint).maybeSingle(),
        client.from('reminder_deliveries').select('occurrence,status,detail,opened_at').eq('user_id',uid).eq('endpoint',endpoint).order('updated_at',{ascending:false}).limit(5)
      ]);
      if (device.error || history.error) throw new Error('No se pudo leer el estado de avisos en Supabase.');
      return {registered:Boolean(device.data),deliveries:history.data};
    },
    async openReminderDelivery(id) {
      if (!ready || !user || !/^[a-f0-9-]{36}$/i.test(id)) return false;
      const {data,error} = await client.from('reminder_deliveries').update({opened_at:new Date().toISOString()})
        .eq('user_id',user.id).eq('id',id).select('task_id').maybeSingle();
      if (error) throw new Error('No se confirmó la apertura del aviso.');
      return data?.task_id || null;
    },
    async accessToken() {
      if (!ready || !user) throw new Error('Inicia sesión para conversar.');
      const uid = user.id;
      const {data,error} = await client.auth.getSession();
      if (error || !ready || user?.id !== uid || data.session?.user?.id !== uid || !data.session.access_token) throw new Error('Tu sesión caducó. Vuelve a iniciar sesión.');
      return data.session.access_token;
    },
    save(value) {
      if (!ready || !user) return Promise.resolve(false);
      const uid = user.id;
      const version = generation;
      const snapshot = JSON.parse(JSON.stringify(value));
      el('syncStatus').textContent = 'Guardando…';
      queue = queue.then(async () => {
        if (version !== generation) return false;
        try {
          if (conflicted) {
            el('syncStatus').textContent = 'Otro dispositivo guardó cambios. Conserva una copia de tus ediciones de esta página antes de recargar.';
            return false;
          }
          const timestamp = new Date(Math.max(Date.now(),(Date.parse(revision)||0)+1)).toISOString();
          const table = client.from('user_spaces');
          const result = revision
            ? await table.update({data:snapshot,updated_at:timestamp}).eq('user_id',uid).eq('updated_at',revision).select('updated_at').maybeSingle()
            : await table.insert({user_id:uid,data:snapshot,updated_at:timestamp}).select('updated_at').maybeSingle();
          if (version !== generation) return false;
          conflicted = result.error?.code === '23505' || (!result.error && !result.data);
          if (!result.error && result.data) revision = result.data.updated_at;
          el('syncStatus').textContent = conflicted ? 'Otro dispositivo guardó cambios. Conserva una copia de tus ediciones de esta página antes de recargar.'
            : result.error ? 'No se guardaron los cambios. Mantén esta página abierta y vuelve a intentar la acción.'
            : 'Cambios guardados en tu cuenta.';
          return !conflicted && !result.error;
        } catch {
          if (version === generation) el('syncStatus').textContent = 'Sin conexión: los últimos cambios no se guardaron. Vuelve a intentar la acción.';
          return false;
        }
      });
      return queue;
    }
  };
  async function perform(action) {
    if (busy) return;
    busy = true;
    el('authPanel').querySelectorAll('button').forEach(b => b.disabled = true);
    try { await action(); }
    catch { message('No se pudo contactar con Supabase. Comprueba tu conexión e inténtalo otra vez.'); }
    finally { busy = false; el('authPanel').querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  el('authForm').onsubmit = e => {
    e.preventDefault();
    perform(async () => {
      message('Iniciando sesión…');
      const {data,error} = await client.auth.signInWithPassword({email:el('email').value.trim(),password:el('password').value});
      if (error) { message('No se pudo iniciar sesión. Revisa tus datos y confirma tu correo si todavía no lo hiciste.'); return; }
      await openSession(data.session);
    });
  };
  el('signup').onclick = () => {
    if (!el('authForm').reportValidity()) return;
    perform(async () => {
      message('Creando cuenta…');
      const {data,error} = await client.auth.signUp({email:el('email').value.trim(),password:el('password').value,options:{emailRedirectTo:redirectTo}});
      el('password').value = '';
      if (error) { message(registrationError(error)); return; }
      if (data.session) await openSession(data.session);
      else message('Revisa tu correo para confirmar el registro. Si ya tienes cuenta, inicia sesión o recupera tu contraseña.');
    });
  };
  el('forgot').onclick = () => {
    if (!el('email').reportValidity() || !el('email').value) return;
    perform(async () => {
      const {error} = await client.auth.resetPasswordForEmail(el('email').value.trim(),{redirectTo});
      message(error ? 'No se pudo enviar el correo de recuperación. Revisa la configuración o inténtalo más tarde.' : 'Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña. Ábrelo en este mismo navegador.');
    });
  };
  el('resetForm').onsubmit = e => {
    e.preventDefault();
    perform(async () => {
      const {error} = await client.auth.updateUser({password:el('newPassword').value});
      el('newPassword').value = '';
      if (error) {message('No se pudo cambiar la contraseña. Solicita un nuevo enlace o revisa los requisitos de contraseña.');return;}
      await client.auth.signOut();
      resetView();
      message('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
    });
  };
  el('logout').onclick = async () => {
    el('logout').disabled = true;
    await queue;
    try {
      await window.liftsPush?.detachDevice();
      const {error} = await client.auth.signOut();
      if (error) {el('syncStatus').textContent='No se pudo cerrar la sesión. Inténtalo otra vez.';return;}
      resetView(); message('Sesión cerrada.');
    } catch {el('syncStatus').textContent='No se pudo cerrar la sesión. Comprueba la conexión y el estado de avisos de este dispositivo.';}
    finally {el('logout').disabled=false;}
  };
  let recovery = false;
  client.auth.onAuthStateChange((event,session) => {
    if (event === 'PASSWORD_RECOVERY') {
      recovery = true; resetView();
      el('workspace').hidden = true; el('authPanel').hidden = false;
      el('authForm').hidden = true; el('resetForm').hidden = false;
      message('Elige una nueva contraseña.'); return;
    }
    if (event === 'SIGNED_OUT') {recovery=false;resetView();message('Sesión cerrada.');return;}
    if (!recovery && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
      // Run database requests after the auth callback releases its lock.
      setTimeout(() => openSession(session).catch(() => message('No se pudo cargar tu cuenta. Recarga e inténtalo otra vez.')),0);
    }
  });
})();
