'use strict';
(() => {
  const base=new URL('/',location.href).href+'#voice=';
  document.getElementById('shortcutBase').value=base;document.getElementById('shortcutExample').textContent=base;
  document.getElementById('copyShortcutBase').onclick=async()=>{try{await navigator.clipboard.writeText(base);document.getElementById('copyShortcutStatus').textContent='Dirección copiada. Pégala en la acción Texto de Atajos.';}catch{document.getElementById('shortcutBase').select();document.getElementById('copyShortcutStatus').textContent='Mantén pulsada la dirección seleccionada y elige Copiar.';}};
})();
