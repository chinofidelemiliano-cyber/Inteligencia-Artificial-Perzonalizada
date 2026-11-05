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
    const version = ++generation;
    ready = false;
    user = session.user;
    el('workspace').hidden = true;
    el('authPanel').hidden = false;
    message('Cargando tu espacio…');
    const {data,error} = await client.from('user_spaces').select('data').eq('user_id',user.id).maybeSingle();
    if (version !== generation) return;
    if (error) { message(dataError(error)); return; }
    const saved = data?.data;
    if (saved && (!saved.profile || !Array.isArray(saved.tasks) || !Array.isArray(saved.messages))) {
      message('Los datos de tu espacio no tienen el formato esperado. No se sobrescribieron.'); return;
    }
    ready = true;
    window.dispatchEvent(new CustomEvent('nexo-state',{detail:saved || null}));
    el('accountEmail').textContent = user.email || '';
    el('syncStatus').textContent = 'Datos de tu cuenta cargados.';
    el('authPanel').hidden = true;
    el('workspace').hidden = false;
    el('password').value = '';
  }
  window.nexoAccount = {
    async accessToken() {
      if (!ready || !user) throw new Error('Inicia sesión para conversar.');
      const uid = user.id;
      const {data,error} = await client.auth.getSession();
      if (error || !ready || user?.id !== uid || data.session?.user?.id !== uid || !data.session.access_token) throw new Error('Tu sesión caducó. Vuelve a iniciar sesión.');
      return data.session.access_token;
    },
    save(value) {
      if (!ready || !user) return;
      const uid = user.id;
      const version = generation;
      const snapshot = JSON.parse(JSON.stringify(value));
      el('syncStatus').textContent = 'Guardando…';
      queue = queue.then(async () => {
        if (version !== generation) return;
        try {
          const {error} = await client.from('user_spaces').upsert({user_id:uid,data:snapshot,updated_at:new Date().toISOString()},{onConflict:'user_id'});
          if (version !== generation) return;
          el('syncStatus').textContent = error ? 'No se guardaron los cambios. Mantén esta página abierta y vuelve a intentar la acción.' : 'Cambios guardados en tu cuenta.';
        } catch {
          if (version === generation) el('syncStatus').textContent = 'Sin conexión: los últimos cambios no se guardaron. Vuelve a intentar la acción.';
        }
      });
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
      const {error} = await client.auth.signOut();
      if (error) {el('syncStatus').textContent='No se pudo cerrar la sesión. Inténtalo otra vez.';return;}
      resetView(); message('Sesión cerrada.');
    } catch {el('syncStatus').textContent='No se pudo cerrar la sesión. Revisa tu conexión.';}
    finally {el('logout').disabled=false;}
  };
  let recovery = false;
  client.auth.onAuthStateChange((event,session) => {
    if (event === 'PASSWORD_RECOVERY') {
      recovery = true; ready = false; generation++;
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
