import type { ProjectFile } from '../types/workspace';

export const DEBUGLABS_SCENARIO_FILES: ProjectFile[] = [
  {
    id: 'server-index',
    name: 'index.js',
    folder: 'server',
    language: 'javascript',
    content: `const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'debuglabs-server' });
});

app.listen(PORT, () => {
  console.log(\`Server listening on port \${PORT}\`);
});`,
  },
  {
    id: 'server-auth',
    name: 'auth.middleware.js',
    folder: 'server',
    language: 'javascript',
    content: `function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

module.exports = { verifyToken };`,
  },
  {
    id: 'web-app',
    name: 'App.tsx',
    folder: 'web',
    language: 'typescript',
    content: `import { useEffect, useState } from 'react';

export default function SimulatorDashboard() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status));
  }, []);

  return <div className="p-4">API Status: {status}</div>;
}`,
  },
  {
    id: 'engine-runner',
    name: 'runner.py',
    folder: 'execution-engine',
    language: 'python',
    content: `import subprocess

def execute_code(file_path: str):
    result = subprocess.run(["python3", file_path], capture_output=True, text=True, timeout=10)
    return {"stdout": result.stdout, "stderr": result.stderr}
`,
  },
  {
    id: 'shared-constants',
    name: 'constants.ts',
    folder: 'shared',
    language: 'typescript',
    content: `export const API_ROUTES = {
  HEALTH: '/api/health',
  RUN_TESTS: '/api/execute',
} as const;
`,
  },
  {
    id: 'problem-md',
    name: 'PROBLEM.md',
    folder: 'root',
    language: 'markdown',
    content: `# DebugLabs Challenge #01: Full-Stack Crash Investigation

1. Fix the undefined \`PORT\` crash in \`server/index.js\`.
2. Prevent \`TypeError\` when \`Authorization\` header is absent in \`server/auth.middleware.js\`.
3. Fix the infinite re-render loop in \`web/App.tsx\`.
`,
  },
];
