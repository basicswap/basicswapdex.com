// When a source file last changed: the date of its last commit, or today
// when it has uncommitted edits, so a page never claims a change that did
// not happen. The deploy checks out the full history for this
// (fetch-depth: 0 in deploy.yml). Undefined when git can't answer.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const cache = new Map<string, Date | undefined>();

export function gitDate(file: string): Date | undefined {
  if (cache.has(file)) return cache.get(file);
  let date: Date | undefined;
  if (existsSync(file)) {
    try {
      const dirty = execFileSync('git', ['status', '--porcelain', '--', file], { encoding: 'utf8' }).trim();
      const committed = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' }).trim();
      date = dirty || !committed ? new Date() : new Date(committed);
    } catch {
      date = undefined;
    }
  }
  cache.set(file, date);
  return date;
}
