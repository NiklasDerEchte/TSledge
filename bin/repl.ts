// repl.ts
import * as tsledge from '../src/index';
import { start } from 'node:repl';

// Macht tsledge im globalen Kontext der REPL verfügbar
(global as any).tsledge = tsledge;

console.log("------------------------------------------");
console.log("💡 TSledge scope is available with 'global.tsledge'");
console.log(' (To exit, press Ctrl+C again or Ctrl+D or type .exit)');
console.log("------------------------------------------");

// Startet die REPL mit einem custom Prompt
const session = start({
  prompt: 'tsledge > ',
  useGlobal: true // Wichtig, damit das globale 'tsledge' direkt erkannt wird
});