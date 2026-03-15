import { readFileSync } from 'fs';

export type NmcPrimitive = string | number | boolean;
export type NmcObject = { [key: string]: NmcPrimitive | NmcObject };
export type NmcResult = { global: Record<string, NmcPrimitive> } & Record<string, NmcObject>;

function castValue(raw: string): NmcPrimitive {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && !isNaN(Number(raw))) return Number(raw);
  if (raw.length >= 2) {
    const first = raw[0];
    const last = raw[raw.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

function navigate(root: Record<string, unknown>, stack: StackEntry[]): Record<string, unknown> {
  let node = root;
  for (const { key } of stack) {
    node = node[key] as Record<string, unknown>;
  }
  return node;
}

interface StackEntry {
  indent: number;
  key: string;
}

/**
 * Parse a `.nmc` config string into a typed object.
 */
export function parseNmc(content: string): NmcResult {
  const result: Record<string, unknown> = { global: {} };
  const stack: StackEntry[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const eqIndex = trimmed.indexOf('=');
    const isSectionHeader = trimmed.endsWith(':') && eqIndex === -1;

    if (isSectionHeader) {
      const key = trimmed.slice(0, -1).trim();
      const parent = navigate(result, stack);
      parent[key] = {};
      stack.push({ indent, key });
    } else if (eqIndex !== -1) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = castValue(trimmed.slice(eqIndex + 1).trim());

      if (stack.length === 0) {
        (result['global'] as Record<string, NmcPrimitive>)[key] = value;
      } else {
        (navigate(result, stack) as Record<string, NmcPrimitive>)[key] = value;
      }
    }
  }

  return result as NmcResult;
}

/**
 * Read a `.nmc` file from disk and parse it.
 * @param filePath Absolute or relative path to the `.nmc` file.
 */
export function parseNmcFile(filePath: string): NmcResult {
  const content = readFileSync(filePath, 'utf-8');
  return parseNmc(content);
}
