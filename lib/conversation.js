'use strict';
((root)=>{
  const normalize=text=>String(text).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').trim().replace(/\s+/g,' ');
  function classify(text){
    const value=normalize(text);
    if(/^(?:y )?(?:como te caigo(?: yo)?|que (?:opinas|piensas) de mi|te caigo (?:bien|mal)|que impresion (?:tienes de mi|te doy))$/.test(value))return'impression';
    if(/^(?:yo )?te (?:amo|quiero)(?: mucho| tanto)?(?:\s*[\p{Extended_Pictographic}\uFE0F]+)?$/u.test(value))return'affection';
    if(/^(?:(?:hola|hey|buenas|buenos dias|buenas tardes|buenas noches)(?: como estas)?|como estas(?: hoy)?|que tal(?: estas)?)$/.test(value))return'greeting';
    if(/^(?:eres (?:un |una )?(?:hombre(?: o mujer)?|mujer(?: u hombre)?)|(?:cual es|que es) tu genero|tienes genero|como te llamas|quien eres|eres una? (?:ia|persona))$/.test(value))return'identity';
    if(/^(?:no me refiero a eso|no pregunte eso|no te pregunte eso|eso no responde|me entendiste mal|no entendiste|me refiero a)\b/.test(value))return'clarification';
    if(/\b(?:me siento|estoy frustrad[oa]|estoy triste|me preocupa|me da miedo|estoy cansad[oa])\b/.test(value))return'emotion';
    if(/\b(?:como|how|paso a paso|calcular|calculo|resolver|resuelve|procedimiento)\b/.test(value))return'procedure';
    if(/[?¿]/.test(text) || /^(?:que|cual|cuando|donde|por que|puedes|me puedes|explica|explicame|dime|quiero|necesito|ayudame|haz)\b/.test(value))return'question';
    return'comment';
  }
  const guidance={
    impression:'La persona pregunta qué impresión da en esta conversación. Responde sobre su forma de participar basándote solo en mensajes realmente presentes. Distingue observación de una impresión provisional. No inventes rasgos, recuerdos o sentimientos propios. No respondas a una pregunta anterior sobre otra cosa; no conviertas esta pregunta en configuración del asistente.',
    affection:'La persona expresa afecto, no pide una tarea. Acoge el comentario con calidez y brevedad, sin afirmar amor humano, reciprocidad romántica ni exclusividad. No cambies inmediatamente a ofrecer un servicio ni termines con una pregunta automática.',
    greeting:'Es un saludo social. Saluda de forma cercana y breve. No recites tus funciones ni conviertas el saludo en una explicación técnica.',
    identity:'La pregunta actual es sobre tu identidad. Responde únicamente al atributo que preguntó, con naturalidad y honestidad sobre ser un asistente virtual; no recites otros atributos ni hagas un discurso.',
    clarification:'El usuario corrige una interpretación anterior. Reconoce brevemente la confusión y responde a la intención corregida. No defiendas ni repitas la respuesta equivocada. Si aún no está claro el referente, pregunta una sola aclaración concreta.',
    emotion:'La persona expresa un sentimiento. Reconoce solo lo que dijo, sin diagnosticar ni atribuirle emociones adicionales. Si además plantea una pregunta o tarea, atiéndela. No contestes con una frase vacía de atención al cliente.',
    procedure:'La persona pide un procedimiento o explicación de cómo hacer algo. Desarrolla un método completo, con pasos, datos y comprobación, sin sustituirlo por una lista de alternativas.',
    question:'La persona hace una pregunta o petición. Identifica su objeto exacto y contéstalo primero. Si contiene varias peticiones atiende cada una; si faltan datos indispensables, solicita una aclaración concreta.',
    comment:'La intervención puede ser un comentario o una continuación. Interprétala con el contexto inmediato y responde a su contenido; no inventes una tarea. Si no hay una intención suficientemente clara, pide una aclaración breve.'
  };
  const social=kind=>['impression','affection','greeting','identity'].includes(kind);
  const api={classify,guide:kind=>guidance[kind] || guidance.comment,social};
  root.liftsConversation=api;if(typeof module!=='undefined' && module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
