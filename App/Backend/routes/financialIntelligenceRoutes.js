import { Router } from 'express';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
const pythonScript = fileURLToPath(
  new URL('../engines/api_runner.py', import.meta.url)
);

router.post('/', authenticateToken, (req, res) => {
  let input;

  try {
    input = JSON.stringify(req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON request body.' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      error: 'Request body must be a JSON object.',
    });
  }

  const pythonCommand = process.env.PYTHON_EXECUTABLE || 'python3';

  const child = spawn(pythonCommand, [pythonScript], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: ['pipe', 'pipe', 'ignore'],
    env: process.env,
  });

  let stdout = '';
  let timedOut = false;
  let outputTooLarge = false;
  let finished = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, 15_000);

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', (chunk) => {
    stdout += chunk;

    if (stdout.length > 5_000_000) {
      outputTooLarge = true;
      child.kill('SIGKILL');
    }
  });

  child.on('error', () => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);

    return res.status(503).json({
      error: 'The Python assessment service could not be started.',
    });
  });

  child.on('close', (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);

    if (timedOut) {
      return res.status(504).json({
        error: 'The financial assessment timed out.',
      });
    }

    if (outputTooLarge) {
      return res.status(502).json({
        error: 'The financial assessment output exceeded its limit.',
      });
    }

    let result;

    try {
      result = JSON.parse(stdout);
    } catch {
      return res.status(502).json({
        error: 'The financial assessment returned an invalid response.',
      });
    }

    if (code !== 0) {
      const clientErrors = new Set([
        'ValueError',
        'TypeError',
        'KeyError',
      ]);

      const status = clientErrors.has(result.error_type) ? 400 : 500;

      return res.status(status).json({
        error: result.error || 'The financial assessment failed.',
      });
    }

    return res.json(result);
  });

  child.stdin.on('error', () => {
    // The child may close stdin while exiting; its close event handles the response.
  });

  child.stdin.end(input);
});

export default router;
