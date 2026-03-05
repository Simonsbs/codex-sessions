const sessionsEl = document.querySelector('#sessions');
const statusEl = document.querySelector('#status');
const refreshButton = document.querySelector('#refreshButton');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#9e2a2b' : '#1f2522';
}

async function callApi(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'API error');
  }
  return json;
}

function formatDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function cardTemplate(session) {
  const wrapper = document.createElement('article');
  wrapper.className = 'card';

  const escapedName = escapeHtml(session.name || 'Untitled');
  const escapedPrompt = escapeHtml(session.prompt || 'No prompt preview');
  const escapedPath = escapeHtml(session.relativePath || '');

  wrapper.innerHTML = `
    <div class="card-head">
      <div class="name">${escapedName}</div>
      <div>${(session.sizeBytes / 1024).toFixed(1)} KB</div>
    </div>
    <div class="meta">${escapedPrompt}</div>
    <div class="meta">Started: ${formatDate(session.startedAt)} | Modified: ${formatDate(session.modifiedAt)}</div>
    <div class="meta">${escapedPath}</div>
    <input class="name-edit" type="text" value="${escapedName}" placeholder="Rename session" />
    <div class="actions">
      <button data-action="rename">Rename</button>
      <button class="secondary" data-action="copy">Copy</button>
      <button class="secondary" data-action="duplicate">Duplicate</button>
      <button class="danger" data-action="delete">Delete</button>
    </div>
  `;

  const nameInput = wrapper.querySelector('.name-edit');
  wrapper.querySelector('[data-action="rename"]').addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return;
    await callApi('/api/sessions/rename', { sessionId: session.id, name });
    setStatus(`Renamed ${session.id}`);
    await loadSessions();
  });

  wrapper.querySelector('[data-action="copy"]').addEventListener('click', async () => {
    const result = await callApi('/api/sessions/copy', { sessionId: session.id });
    setStatus(`Copied to ${result.copyPath}`);
  });

  wrapper.querySelector('[data-action="duplicate"]').addEventListener('click', async () => {
    const result = await callApi('/api/sessions/duplicate', { sessionId: session.id });
    setStatus(`Duplicated as ${result.duplicateId}`);
    await loadSessions();
  });

  wrapper.querySelector('[data-action="delete"]').addEventListener('click', async () => {
    const ok = window.confirm(`Delete session ${session.id}?`);
    if (!ok) return;
    await callApi('/api/sessions/delete', { sessionId: session.id });
    setStatus(`Deleted ${session.id}`);
    await loadSessions();
  });

  return wrapper;
}

async function loadSessions() {
  setStatus('Loading sessions...');
  try {
    const response = await fetch('/api/sessions');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load sessions');
    }

    sessionsEl.innerHTML = '';
    if (!data.sessions.length) {
      setStatus('No sessions found.');
      return;
    }

    for (const session of data.sessions) {
      sessionsEl.appendChild(cardTemplate(session));
    }

    setStatus(`Loaded ${data.sessions.length} sessions`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

refreshButton.addEventListener('click', loadSessions);
loadSessions();
