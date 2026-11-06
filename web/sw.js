'use strict';
// No caches, user-data storage, background polling, or remote push subscription.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});const page=pages.find(p=>new URL(p.url).origin===self.location.origin);if(page){page.postMessage({type:'OPEN_AGENDA'});return page.focus();}return self.clients.openWindow('/?view=tasks');})());});
