import * as esbuild from 'esbuild';

const isDev = process.argv.includes('--watch');

const config = {
  entryPoints: {
    index: './src/index.ts',
    'bin/repl': './bin/repl.ts',
  },
  bundle: true, // IMPORTANT: Allows imports without extensions, bundles everything into one file
  platform: 'node', // Optimized for Node.js or Deno
  format: 'esm', // Output as ES modules
  target: 'node20', // Your Node version
  outdir: 'dist', // Output directory
  packages: 'external', // node_modules are NOT bundled (standard for backend)
  sourcemap: true, // Generate source maps for easier debugging
};

if (isDev) {
  Object.assign(config.entryPoints, { 'tests/main': './tests/main.ts' });

  let ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('⚡ Watching for changes...');
} else {
  await esbuild.build(config);
  console.log('✅ Build complete');
}
