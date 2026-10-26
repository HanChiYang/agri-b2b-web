// Claude Code PreToolUse hook：規格要經過使用者確認，才能開始寫測試和程式；確認之後的修改也要經過使用者同意。
// 原因見 docs/adr/0005（沿用後端的 ADR-0013、ADR-0014）。
// - 在 feature/ branch 上改 src/、e2e/、public/ 時，對應的規格（docs/specs/<branch 名稱去掉 feature/>.md）狀態要是「已確認」或「已完成」
// - 把規格的狀態改成「已確認」或「已完成」時，「待確認」段落要先清空，再跳出確認視窗，由使用者決定是否允許
// - 規格已經是「已確認」或「已完成」時，任何修改都跳出確認視窗
// 開發流程見 CLAUDE.md。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FEATURE_BRANCH = /^feature\/(.+)/;
// src/ 是程式和 Vitest 測試，e2e/ 是 Playwright 測試，public/ 是畫面用到的靜態檔
const GUARDED_DIRS = new Set(['src', 'e2e', 'public']);
const NOT_SPECS = new Set(['_template.md', 'readme.md']);
const CONFIRMED_STATUSES = new Set(['已確認', '已完成']);
// 規格檔開頭的「- 狀態：草稿」
const STATUS_LINE = /^- 狀態：\s*(\S+)/m;
// Edit 對不上檔案內容時用：修改的文字可能只有一部分，所以不要求行首的「- 」
const STATUS_IN_EDIT = /狀態：\s*(\S+)/;
// 「待確認」段落：到下一個「## 」標題或檔案結尾為止
const OPEN_QUESTIONS_SECTION = /^## 待確認[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m;
// 第一層的項目，例如「- …」「1. …」；只有「-」或「- 無」不算
const OPEN_QUESTION = /^(?:[-*]|\d+\.)\s+(?!無\s*$)\S/;

const input = await readInput();
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!projectDir || !target) process.exit(0);

const parts = path.relative(path.resolve(projectDir), path.resolve(projectDir, target))
  .split(path.sep)
  .map((part) => part.toLowerCase());

if (parts.length === 3 && parts[0] === 'docs' && parts[1] === 'specs' && parts[2].endsWith('.md') && !NOT_SPECS.has(parts[2])) {
  checkSpecEdit(path.resolve(projectDir, target));
} else if (GUARDED_DIRS.has(parts[0])) {
  checkSpecConfirmed();
}

process.exit(0);

function checkSpecEdit(specFile) {
  const name = path.basename(specFile);
  const current = readSpec(specFile);
  const currentStatus = statusOf(current);
  if (CONFIRMED_STATUSES.has(currentStatus)) {
    ask(`規格 ${name} 已經是「${currentStatus}」，修改要經過你同意。請看過這次的修改再允許；` +
      '拒絕的話，Claude 會先停下來問你。');
  }

  const result = afterEdit(current);
  const next = nextConfirmedStatus(current, result);
  if (!next) return;

  const open = countOpenQuestions(result);
  if (open > 0) {
    deny(`規格 ${name} 的「待確認」還有 ${open} 項。請把使用者的結論寫進規格對應的段落、從「待確認」移除之後，再改狀態。`);
  }
  ask(`Claude 要把規格 ${name} 的狀態改成「${next}」。` +
    '請確認你已經同意這份規格再允許；允許之後，Claude 就會開始寫測試和程式。');
}

// 這次修改會把狀態改成「已確認」或「已完成」的話，回傳新的狀態
function nextConfirmedStatus(current, result) {
  const status = statusOf(result);
  if (CONFIRMED_STATUSES.has(status)) return status;

  // Edit 要取代的文字和檔案對不上時（例如空白不同），套用後的內容不準，改看修改的文字本身
  const { old_string: oldText, new_string: replacement } = input.tool_input;
  if (current !== undefined && oldText && !current.includes(oldText)) {
    const loose = STATUS_IN_EDIT.exec(replacement ?? '')?.[1];
    if (CONFIRMED_STATUSES.has(loose)) return loose;
  }
  return undefined;
}

// 套用這次的 Edit 或 Write 之後，規格的內容
function afterEdit(current) {
  const toolInput = input.tool_input;
  if (typeof toolInput.content === 'string') return toolInput.content;

  const { old_string: oldText, new_string: replacement = '', replace_all: replaceAll } = toolInput;
  if (current === undefined) return replacement;
  if (!oldText) return current;
  return replaceAll ? current.split(oldText).join(replacement) : current.replace(oldText, () => replacement);
}

function countOpenQuestions(text) {
  const section = OPEN_QUESTIONS_SECTION.exec(text)?.[1] ?? '';
  return section.split('\n').filter((line) => OPEN_QUESTION.test(line)).length;
}

function checkSpecConfirmed() {
  // fix/ branch 不一定有規格，不檢查；其他 branch 由 require-feature-branch.mjs 擋下
  const name = FEATURE_BRANCH.exec(currentBranch(projectDir) ?? '')?.[1];
  if (!name) return;

  const spec = `docs/specs/${name}.md`;
  const status = statusOf(readSpec(path.join(projectDir, spec)));
  if (status === undefined) {
    deny(`還沒有這個 branch 的規格 ${spec}，不能修改 src/、e2e/、public/。請先照 CLAUDE.md 的流程寫規格，請使用者確認。`);
  }
  if (!CONFIRMED_STATUSES.has(status)) {
    deny(`規格 ${spec} 的狀態是「${status ?? '沒有寫'}」，使用者確認之前不能修改 src/、e2e/、public/。` +
      '請停下來請使用者確認規格；使用者同意之前，不要自己修改規格的狀態。');
  }
}

// 檔案不存在回傳 undefined
function readSpec(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

// 規格的狀態。沒有規格回傳 undefined，沒有寫狀態回傳 null
function statusOf(text) {
  if (text === undefined) return undefined;
  return STATUS_LINE.exec(text)?.[1] ?? null;
}

async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function currentBranch(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'branch', '--show-current'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
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
