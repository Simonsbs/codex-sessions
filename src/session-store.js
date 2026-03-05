import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEXT_DECODER = new TextDecoder('utf-8', { fatal: false });

function sessionIdFromFilename(filePath) {
  const base = path.basename(filePath);
  const match = base.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i);
  return match ? match[1] : null;
}

async function readFirstNLines(filePath, maxLines = 40) {
  const file = await fs.open(filePath, 'r');
  try {
    const chunkSize = 64 * 1024;
    const chunks = [];
    let bytesReadTotal = 0;

    while (bytesReadTotal < 2 * 1024 * 1024) {
      const buffer = Buffer.alloc(chunkSize);
      const { bytesRead } = await file.read(buffer, 0, chunkSize, bytesReadTotal);
      if (bytesRead === 0) {
        break;
      }
      bytesReadTotal += bytesRead;
      chunks.push(buffer.subarray(0, bytesRead));

      const text = TEXT_DECODER.decode(Buffer.concat(chunks), { stream: true });
      const lines = text.split('\n');
      if (lines.length >= maxLines) {
        return lines.slice(0, maxLines).filter(Boolean);
      }
    }

    const full = TEXT_DECODER.decode(Buffer.concat(chunks));
    return full.split('\n').filter(Boolean).slice(0, maxLines);
  } finally {
    await file.close();
  }
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

async function walkSessions(dir, output = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkSessions(target, output);
      continue;
    }
    if (entry.isFile() && target.endsWith('.jsonl') && !target.includes('.bak_')) {
      output.push(target);
    }
  }
  return output;
}

function extractPrompt(record) {
  if (!record || record.type !== 'response_item') {
    return null;
  }

  const payload = record.payload;
  if (!payload || payload.role !== 'user' || !Array.isArray(payload.content)) {
    return null;
  }

  for (const item of payload.content) {
    if (item?.type === 'input_text' && typeof item.text === 'string' && item.text.trim()) {
      const trimmed = item.text.trim().replace(/\s+/g, ' ');
      return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
    }
  }

  return null;
}

export class SessionStore {
  constructor(codexHome) {
    this.codexHome = codexHome;
    this.sessionsDir = path.join(codexHome, 'sessions');
    this.metaFile = path.join(codexHome, 'session-manager-meta.json');
    this.trashDir = path.join(codexHome, 'session_trash');
    this.exportsDir = path.join(codexHome, 'session_exports');
  }

  async ensureLayout() {
    await fs.mkdir(this.trashDir, { recursive: true });
    await fs.mkdir(this.exportsDir, { recursive: true });

    try {
      await fs.access(this.metaFile);
    } catch {
      await fs.writeFile(this.metaFile, JSON.stringify({ names: {} }, null, 2));
    }
  }

  async readMeta() {
    await this.ensureLayout();
    const raw = await fs.readFile(this.metaFile, 'utf-8');
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.names || typeof parsed.names !== 'object') {
      return { names: {} };
    }
    return parsed;
  }

  async writeMeta(meta) {
    await fs.writeFile(this.metaFile, JSON.stringify(meta, null, 2));
  }

  async listSessions() {
    await this.ensureLayout();
    const files = await walkSessions(this.sessionsDir);
    const meta = await this.readMeta();

    const sessions = await Promise.all(files.map(async (filePath) => {
      const stat = await fs.stat(filePath);
      const id = sessionIdFromFilename(filePath) ?? crypto.randomUUID();
      const lines = await readFirstNLines(filePath);

      let startedAt = null;
      let prompt = null;
      for (const line of lines) {
        const record = safeJsonParse(line);
        if (!startedAt && record?.type === 'session_meta') {
          startedAt = record?.payload?.timestamp ?? null;
        }
        if (!prompt) {
          prompt = extractPrompt(record);
        }
      }

      const defaultName = path.basename(filePath, '.jsonl');
      const customName = typeof meta.names[id] === 'string' && meta.names[id].trim().length > 0;
      return {
        id,
        filePath,
        relativePath: path.relative(this.codexHome, filePath),
        startedAt,
        prompt,
        name: meta.names[id] || defaultName,
        customName,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    }));

    sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    return sessions;
  }

  async renameSession(sessionId, name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      throw new Error('Name must not be empty');
    }

    const meta = await this.readMeta();
    meta.names[sessionId] = trimmed;
    await this.writeMeta(meta);
    return { sessionId, name: trimmed };
  }

  async deleteSession(sessionId) {
    const sessions = await this.listSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const trashPath = path.join(this.trashDir, `${path.basename(target.filePath)}.deleted-${Date.now()}`);
    await fs.rename(target.filePath, trashPath);

    const meta = await this.readMeta();
    delete meta.names[sessionId];
    await this.writeMeta(meta);

    return { sessionId, trashPath };
  }

  async copySession(sessionId) {
    const sessions = await this.listSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const copyName = `${path.basename(target.filePath, '.jsonl')}.copy-${Date.now()}.jsonl`;
    const copyPath = path.join(this.exportsDir, copyName);
    await fs.copyFile(target.filePath, copyPath);

    return { sessionId, copyPath };
  }

  async duplicateSession(sessionId) {
    const sessions = await this.listSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const original = await fs.readFile(target.filePath, 'utf-8');
    const lines = original.split('\n');
    const newSessionId = crypto.randomUUID();

    for (let i = 0; i < Math.min(lines.length, 50); i += 1) {
      const line = lines[i]?.trim();
      if (!line) {
        continue;
      }
      const parsed = safeJsonParse(line);
      if (parsed?.type === 'session_meta' && parsed?.payload?.id) {
        parsed.payload.id = newSessionId;
        lines[i] = JSON.stringify(parsed);
        break;
      }
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const targetDir = path.join(this.sessionsDir, year, month, day);
    await fs.mkdir(targetDir, { recursive: true });

    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const dupName = `rollout-${timestamp}-${newSessionId}.jsonl`;
    const dupPath = path.join(targetDir, dupName);

    await fs.writeFile(dupPath, lines.join('\n'));

    return { sessionId, duplicateId: newSessionId, duplicatePath: dupPath };
  }

}
