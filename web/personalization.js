'use strict';
// Local rules only: no external AI service receives these preferences.
((root) => {
  const fields = ['name','interests','role','specialty','equipment','goals','tone'];
  const emptyProfile = () => Object.fromEntries(fields.map(key => [key,'']));
  function suggestions(profile = {}) {
    const result = [
      {label:'Organizar mi día',prompt:'Quiero organizar mi día y elegir mis tres prioridades.'},
      {label:'Explorar algo nuevo',prompt:'Quiero explorar un tema nuevo y preparar un plan para aprenderlo.'}
    ];
    const interests = String(profile.interests || '').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).slice(0,3);
    for (const interest of interests) result.push({label:interest,prompt:`Me interesa ${interest}. Quiero preparar ideas para explorar este tema.`});
    if (profile.goals) result.push({label:'Mis objetivos',prompt:`Quiero dividir este objetivo en pasos: ${profile.goals}`});
    if (profile.role) result.push({label:'Mi actividad',prompt:`Quiero organizar mis pendientes relacionados con mi actividad: ${profile.role}`});
    if (profile.specialty) result.push({label:'Mi especialidad',prompt:`Quiero preparar una consulta sobre ${profile.specialty}${profile.equipment ? ` y ${profile.equipment}` : ''}.`});
    return result;
  }
  function snapshot(state) {
    const copy = JSON.parse(JSON.stringify(state));
    // Legacy profiles remain untouched until the user makes an explicit choice.
    if (copy.profileConsent !== true && copy.profileConsent !== undefined) copy.profile = emptyProfile();
    // Working chat is session-only, including when tasks or profile are saved.
    copy.messages=[];
    if(copy.workConsent!==true)copy.workProfile=null;
    return copy;
  }
  const api = {fields,emptyProfile,suggestions,snapshot};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.liftsPersonalization = api;
})(typeof window !== 'undefined' ? window : globalThis);
