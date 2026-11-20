'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const status = $('pushStatus');
  const enable = $('enablePush');
  const disable = $('disablePush');
  const check = $('checkPush');
  let generation = 0;
  let busy = false;
  let pendingReceipt;
  const installButtons = [$('installLifts'), $('installLiftsLogin')];
  let installPrompt;
  function updateInstall() {
    const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    installButtons.forEach(button=>{button.hidden=installed;});
  }
  updateInstall();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  async function install() {
    if (!installPrompt) { $('installLiftsHelp').showModal(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    try { await prompt.prompt(); }
    catch { $('installLiftsHelp').showModal(); }
  }
  installButtons.forEach(button=>{button.onclick=install;});
  window.addEventListener('appinstalled', () => {
    installButtons.forEach(button=>{button.hidden=true;});
  });
  if (navigator.serviceWorker && window.isSecureContext) {
    void navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }

  function publicKey(value) {
    return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/') + '='), c=>c.charCodeAt(0));
  }
  async function registration() {
    if (!('Notification' in window) || !navigator.serviceWorker || !window.PushManager) {
      throw new Error('Este navegador no permite avisos en segundo plano. En iPhone, abre Lifts desde la pantalla de inicio.');
    }
    return navigator.serviceWorker.register('/sw.js');
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    const version = generation;
    [enable,disable,check].forEach(b=>{b.disabled=true;});
    try {
      const message = await action();
      if (version === generation) status.textContent = message;
    } catch(error) {
      if (version === generation) status.textContent = error.message || 'No se pudo comprobar el estado de los avisos.';
    } finally {
      if (version === generation) {
        busy = false;
        [enable,disable,check].forEach(b=>{b.disabled=false;});
      }
    }
  }

  enable.onclick = () => run(async () => {
    const version = generation;
    if (!('Notification' in window)) throw new Error('Este navegador no permite avisos. En iPhone, abre Lifts desde la pantalla de inicio.');
    if (await Notification.requestPermission() !== 'granted') throw new Error('Concede permiso de notificaciones en los ajustes del dispositivo.');
    const key = publicKey(await window.nexoAccount.reminderPublicKey());
    await registration();
    const reg = await navigator.serviceWorker.ready;
    if (version !== generation) return '';
    let existing = await reg.pushManager.getSubscription();
    const previousKey = existing?.options?.applicationServerKey;
    if (previousKey && (previousKey.byteLength !== key.length || new Uint8Array(previousKey).some((byte,i)=>byte!==key[i]))) {
      await window.nexoAccount.removeReminderDevice(existing.endpoint);
      await existing.unsubscribe();
      existing = null;
    }
    const subscription = existing || await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
    try {
      if (version !== generation) throw new Error('La sesión cambió. Vuelve a activar los avisos.');
      await window.nexoAccount.saveReminderDevice(subscription.toJSON());
    } catch (error) {
      if (!existing) await subscription.unsubscribe().catch(()=>{});
      throw error;
    }
    window.dispatchEvent(new CustomEvent('lifts-push-enabled',{detail:reg}));
    return 'Dispositivo registrado. Crea un recordatorio futuro y comprueba su estado cuando llegue la hora.';
  });

  async function detachDevice() {
    const reg = await navigator.serviceWorker?.getRegistration('/');
    const subscription = await reg?.pushManager?.getSubscription();
    if (!subscription) return;
    await window.nexoAccount.removeReminderDevice(subscription.endpoint);
    await subscription.unsubscribe().catch(()=>{});
    window.dispatchEvent(new CustomEvent('lifts-push-disabled'));
  }
  disable.onclick = () => run(async ()=>{
    await detachDevice();
    return 'Avisos en segundo plano desactivados en este dispositivo.';
  });

  check.onclick = () => run(async ()=>{
    const reg = await registration();
    const subscription = await reg.pushManager.getSubscription();
    if (Notification.permission !== 'granted' || !subscription) return 'Activa los avisos en segundo plano en este dispositivo.';
    const {registered, deliveries} = await window.nexoAccount.reminderDeviceStatus(subscription.endpoint);
    if (!registered) return 'Este dispositivo aún no está registrado en tu cuenta de Lifts.';
    const last = deliveries[0];
    if (!last) return 'Dispositivo registrado. Aún no hay intentos de entrega; revisa que el recordatorio se haya guardado y que el programador esté activo.';
    if (last.opened_at) return 'Último aviso abierto en el dispositivo.';
    const labels = {sending:'En proceso',accepted:'Aceptado por el proveedor',retry:'Error temporal, pendiente de reintento',failed:'Falló el envío',expired:'Suscripción caducada; desactiva y vuelve a activar'};
    return new Date(last.occurrence).toLocaleString() + ' · ' + labels[last.status] + (last.detail ? ' · ' + last.detail : '');
  });

  async function recordClick(id) {
    if (!id || !window.nexoAccount?.isReady?.()) return;
    const version = generation;
    try {
      const taskId = await window.nexoAccount.openReminderDelivery(id);
      if (taskId && version === generation) {
        status.textContent = 'Apertura del aviso confirmada.';
        window.liftsWorkUI.openReminder(taskId);
      }
    } catch {
      if (version === generation) status.textContent = 'Abriste el aviso. Lifts no pudo guardar la confirmación.';
    }
  }
  navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data?.type !== 'OPEN_AGENDA' || !event.data.deliveryId) return;
    if (window.nexoAccount?.isReady?.()) void recordClick(event.data.deliveryId);
    else pendingReceipt = event.data.deliveryId;
  });
  window.addEventListener('nexo-state', () => {
    generation++;
    busy = false;
    status.textContent = '';
    [enable,disable,check].forEach(b=>{b.disabled=false;});
    const url = new URL(location.href);
    const id = pendingReceipt || url.searchParams.get('aviso');
    if (id && window.nexoAccount?.isReady?.()) {
      pendingReceipt = null;
      url.searchParams.delete('aviso');
      history.replaceState(null, '', url);
      void recordClick(id);
    }
  });
  window.liftsPush = {detachDevice, async active(){
    const reg = await navigator.serviceWorker?.getRegistration('/');
    const subscription=await reg?.pushManager?.getSubscription();
    if(!subscription)return false;
    const {registered,deliveries}=await window.nexoAccount.reminderDeviceStatus(subscription.endpoint);
    return registered && !['expired','failed'].includes(deliveries[0]?.status);
  }};
})();
