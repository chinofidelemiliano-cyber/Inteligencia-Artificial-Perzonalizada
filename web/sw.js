'use strict';
// A title is included only when the account has consented to show it.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  const {id,intensity} = payload || {};
  const title = typeof payload?.title === 'string' && payload.title.trim() ? payload.title.trim().slice(0,120) : 'Lifts · Recordatorio';
  if (!/^[a-f0-9-]{36}$/i.test(id || '')) return;
  event.waitUntil(self.registration.showNotification(title, {
    body:'Tienes un pendiente programado. Abre Lifts para verlo.',
    tag:'lifts-delivery-'+id, icon:'/assets/icon-192.png',badge:'/assets/favicon-32.png',data:{id},
    silent:intensity===3,...(intensity===1?{vibrate:[180,90,180]}:{})
  }));
});
self.addEventListener('notificationclick',event=>{
  const id = event.notification.data?.id;
  event.notification.close();
  event.waitUntil((async()=>{
    const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const page=pages.find(p=>new URL(p.url).origin===self.location.origin);
    if(page){page.postMessage({type:'OPEN_AGENDA',deliveryId:id});return page.focus();}
    const url=new URL('/?view=reminders',self.location.origin);
    if(id)url.searchParams.set('aviso',id);
    return self.clients.openWindow(url.href);
  })());
});
