// Claude Code PreToolUse hook：不在 feature/、fix/ branch 上就不能改專案檔案或 commit，任何 branch 都不能直接 push 到 main。
// 其餘的 commit、push 一律跳出確認視窗，由使用者決定是否允許。
// 開發流程見 CLAUDE.md。
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ALLOWED_BRANCH = /^(feature|fix)\/.+/;
const FILE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);
// git 後面可能帶 -C <dir>、-c <key=value>、--no-pager 之類的選項，再接子指令
const GIT_SUBCOMMAND = /\bgit(?:\s+-[cC]\s+\S+|\s+--[\w-]+(?:=\S+)?)*\s+(commit|push)\b/g;

const input = await readInput();
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const branch = currentBranch(projectDir);

// 不是 git repo（或讀不到 branch）就不檢查
if (branch === null) process.exit(0);

if (FILE_TOOLS.has(input.tool_name)) {
  const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (target && isInside(projectDir, target) && !ALLOWED_BRANCH.test(branch)) {
    deny(wrongBranchMessage(branch, '修改檔案'));
  }
} else if (SHELL_TOOLS.has(input.tool_name)) {
  const command = input.tool_input?.command ?? '';
  const subcommands = new Set();
  for (const match of command.matchAll(GIT_SUBCOMMAND)) {
    const subcommand = match[1];
    subcommands.add(subcommand);
    if (!ALLOWED_BRANCH.test(branch)) {
      deny(wrongBranchMessage(branch, `git ${subcommand}`));
    }
    if (subcommand === 'push' && pushesToMain(segmentAfter(command, match.index + match[0].length))) {
      deny('不能直接 push 到 main。請 push 自己的 feature/ 或 fix/ branch，再到 GitHub 開 Pull Request 合併進 main。');
    }
  }
  if (subcommands.size > 0) {
    const actions = [...subcommands].map((s) => `git ${s}`).join('、');
    ask(`Claude 要執行 ${actions}。請確認指令內容再允許；拒絕的話，Claude 會改成把指令交給你自己執行。`);
  }
}

process.exit(0);

async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function currentBranch(dir) {
  if (!dir) return null;
  try {
    return execFileSync('git', ['-C', dir, 'branch', '--show-current'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function isInside(root, file) {
  const relative = path.relative(path.resolve(root), path.resolve(root, file));
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

// 取出 push 這個子指令的參數，到下一個 &&、||、;、| 或換行為止
function segmentAfter(command, start) {
  return command.slice(start).split(/&&|\|\||[;|\n]/)[0];
}

function pushesToMain(args) {
  if (/(^|\s)--(all|mirror)(\s|$)/.test(args)) return true;
  // 例如 origin main、HEAD:main、feature/x:refs/heads/main
  return /(^|[\s:])(refs\/heads\/)?main(\s|$)/.test(args);
}

function wrongBranchMessage(branch, action) {
  const where = branch ? `「${branch}」branch` : '沒有 branch 的狀態（detached HEAD）';
  return `目前在${where}，這個專案只能在 feature/ 或 fix/ 開頭的 branch 上${action}。` +
    '請先單獨執行：git switch main && git pull && git switch -c feature/<簡短描述>（修 bug 用 fix/<描述>），再繼續。';
}

function deny(reason) {
  decide('deny', reason);
}

function ask(reason) {
  decide('ask', reason);
}

function decide(permissionDecision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}
