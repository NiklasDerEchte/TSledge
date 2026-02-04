import * as tsledge from '../src/index';

(global as any).tsledge = tsledge;

console.log("💡 TSledge scope is available with 'global.tsledge'");
console.log('   (To exit, press Ctrl+C again or Ctrl+D or type .exit)'.padStart(2, '0'));

require('repl').start();