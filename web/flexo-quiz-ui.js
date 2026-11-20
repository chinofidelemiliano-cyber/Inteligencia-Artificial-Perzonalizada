'use strict';
(() => {
  const api = window.liftsWorkspace;
  const {bank, validate} = window.liftsFlexoQuiz;
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <h2>Cuestionario de flexografía</h2>
    <label for="flexoLevel">Dificultad</label>
    <select id="flexoLevel"><option value="">Todos los niveles · 10 casos</option><option>Intermedio</option><option>Avanzado</option></select>
    <div class="companion-actions"><button type="button" id="flexoStart">Empezar práctica</button><button type="button" class="secondary" id="flexoGenerate">Generar práctica con IA</button></div>
    <button id="flexoRemind" type="button" class="secondary">Recordarme practicar</button><p id="flexoHistory"></p><p id="flexoStatus" role="status"></p>
    <form id="flexoForm" hidden></form>
    <div id="flexoFeedback" aria-live="polite"></div>`;
  document.querySelector('#work .learning-portal').after(card);
  const $ = id => document.getElementById(id);
  const form = $('flexoForm');
  const status = $('flexoStatus');
  const feedback = $('flexoFeedback');
  let session, request, generation = 0;

  function add(target, tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    target.append(el);
    return el;
  }
  function history() {
    const attempts = api.getState().flexoAttempts || [];
    $('flexoHistory').replaceChildren();
    if (attempts.length) $('flexoHistory').textContent = attempts.slice(0, 5).map(a =>
      new Date(a.at).toLocaleDateString() + ' · ' + a.level + ' · ' + a.score + '/' + a.total + (a.generated ? ' (IA)' : '')
    ).join(' | ');
  }
  function question() {
    const [topic, level, prompt, , options] = session.questions[session.index];
    form.hidden = false;
    form.replaceChildren();
    feedback.replaceChildren();
    status.textContent = 'Caso ' + (session.index + 1) + ' de ' + session.questions.length + ' · ' + topic + ' · ' + level + (session.generated ? ' · Generado por IA' : '');
    const group = add(form, 'fieldset', '');
    add(group, 'legend', prompt);
    options.forEach(([label], i) => {
      const row = add(group, 'label', '');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'flexoAnswer';
      radio.value = i;
      radio.required = true;
      row.append(radio, document.createTextNode(' ' + label));
    });
    add(form, 'button', 'Revisar respuesta');
  }
  function start(questions, generated = false) {
    session = {questions, generated, index: 0, score: 0, level: $('flexoLevel').value || 'Mixto', missed: []};
    question();
  }
  form.onsubmit = event => {
    event.preventDefault();
    const selected = new FormData(form).get('flexoAnswer');
    if (selected === null) return;
    const [topic, , , correct, options] = session.questions[session.index];
    if (Number(selected) === correct) session.score++;
    else session.missed.push(topic);
    form.querySelectorAll('input, button').forEach(el => { el.disabled = true; });
    add(feedback, 'h3', Number(selected) === correct ? 'Respuesta correcta' : 'Revisemos este caso');
    options.forEach(([label, explanation], i) =>
      add(feedback, 'p', (i === correct ? 'Correcta · ' : '') + label + ' — ' + explanation));
    const last = session.index === session.questions.length - 1;
    const next = add(feedback, 'button', last ? 'Ver resultado y guardar' : 'Siguiente caso');
    next.type = 'button';
    next.onclick = async () => {
      if (!last) { session.index++; question(); form.querySelector('input').focus(); return; }
      const version = generation;
      const state = api.getState();
      const attempt = session.attempt ||= {
        at: new Date().toISOString(), level: session.level, score: session.score,
        total: session.questions.length, generated: session.generated, missed: session.missed
      };
      status.textContent = 'Puntuación ' + attempt.score + '/' + attempt.total +
        (attempt.missed.length ? '. Repasa ' + [...new Set(attempt.missed)].join(', ') + '.' : '. Completaste todos los casos correctamente.');
      next.disabled = true;
      state.flexoAttempts = [attempt, ...(state.flexoAttempts || []).filter(a => a.at !== attempt.at)].slice(0, 30);
      try {
        if (await api.save() === false) throw new Error();
        if (version === generation) { next.remove(); history(); }
      } catch {
        if (version === generation) {
          status.textContent += ' No se confirmó el guardado.';
          next.textContent = 'Reintentar guardado';
          next.disabled = false;
        }
      }
    };
  };
  function cancelRequest() {
    request?.abort();
    request = null;
    $('flexoGenerate').disabled = false;
  }
  $('flexoRemind').onclick = () => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    window.liftsWorkUI.prepareReminder('Practicar el cuestionario de flexografía', next);
  };
  $('flexoStart').onclick = () => {
    cancelRequest();
    start(bank.filter(q => !$('flexoLevel').value || q[1] === $('flexoLevel').value));
  };
  $('flexoGenerate').onclick = async () => {
    const controller = new AbortController();
    request = controller;
    const timer = setTimeout(() => controller.abort(), 60000);
    $('flexoGenerate').disabled = true;
    status.textContent = 'Preparando cuatro casos con IA…';
    try {
      const token = await window.nexoAccount.accessToken();
      const level = $('flexoLevel').value || 'Intermedio';
      const prompt = 'Genera cuatro problemas didácticos distintos de flexografía de nivel ' + level +
        '. Usa datos medibles, una sola respuesta comprobable y distractores plausibles. Responde exclusivamente como JSON compacto: una lista de 4 elementos con formato ["tema","' + level + '","pregunta",indiceCorrecto0a3,[["opción","explicación"],["opción","explicación"],["opción","explicación"],["opción","explicación"]]]. Explica por qué cada alternativa aplica o no con los datos del caso. No inventes fuentes ni parámetros universales.';
      const response = await fetch('/api/chat', {method:'POST', signal:controller.signal,
        headers:{'Content-Type':'application/json', Authorization:'Bearer ' + token},
        body:JSON.stringify({messages:[{role:'user',content:prompt}], detail:'deep'})});
      const result = await response.json();
      if (request !== controller) return;
      if (!response.ok) throw new Error(result.error || 'La IA no respondió.');
      let questions;
      try { questions = JSON.parse(String(result.reply).trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')); } catch {}
      if (!validate(questions, 4) || questions.some(q => q[1] !== level)) throw new Error('La IA no devolvió cuatro casos válidos. Puedes usar la práctica incluida.');
      start(questions, true);
      session.level = level;
      status.textContent += '. Contrasta las explicaciones con documentación técnica antes de aplicarlas en planta.';
    } catch (error) {
      if (request === controller) status.textContent = controller.signal.aborted ? 'La generación tardó demasiado.' : error.message;
    } finally {
      clearTimeout(timer);
      if (request === controller) cancelRequest();
    }
  };
  function reset() {
    generation++;
    cancelRequest();
    session = null;
    form.hidden = true;
    form.replaceChildren();
    feedback.replaceChildren();
    status.textContent = '';
    history();
  }
  window.addEventListener('nexo-state', reset);
  window.liftsFlexoQuizUI = {reset, open(advanced) {
    api.open('work');
    $('flexoLevel').value = advanced ? 'Avanzado' : '';
    $('flexoStart').click();
    card.scrollIntoView({block:'start'});
  }};
})();
