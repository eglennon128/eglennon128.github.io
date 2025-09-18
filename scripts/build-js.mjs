import { build } from 'esbuild';

const tasks = [
  {
    entryPoints: ['src/js/site.js'],
    outfile: 'assets/js/site.js'
  },
  {
    entryPoints: ['src/js/gis.js'],
    outfile: 'assets/js/gis.js'
  }
];

try {
  await Promise.all(tasks.map((options) => build({
    ...options,
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2019'],
    sourcemap: false,
    platform: 'browser'
  })));
  console.log('JS build complete');
} catch (error) {
  console.error(error);
  process.exit(1);
}
