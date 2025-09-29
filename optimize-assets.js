/**
 * Production-ready asset optimization script using Node.js
 * - Converts images to WebP and resizes
 * - Minifies CSS and JS
 * - Compresses video
 * - Updates HTML files for responsive images and WebP usage
 * - Generates Lighthouse and Pa11y reports
 * 
 * Usage:
 * 1. npm install sharp cssnano terser fluent-ffmpeg glob fs-extra lighthouse pa11y workbox-build
 * 2. node optimize-assets.js
 */

let missingDeps = [];
function safeRequire(name) {
  try {
    return require(name);
  } catch (e) {
    missingDeps.push(name);
    return null;
  }
}
const fs = safeRequire('fs-extra');
const path = safeRequire('path');
const sharp = safeRequire('sharp');
const cssnano = safeRequire('cssnano');
const postcss = safeRequire('postcss');
const terser = safeRequire('terser');
const ffmpeg = safeRequire('fluent-ffmpeg');
const glob = safeRequire('glob');
const lighthouse = safeRequire('lighthouse');
const chromeLauncher = safeRequire('chrome-launcher');

if (missingDeps.length > 0) {
  console.error('Missing dependencies:', missingDeps.join(', '));
  process.exit(1);
}
const pa11y = require('pa11y');
const workboxBuild = require('workbox-build');

const ASSETS_DIR = path.resolve(__dirname, 'assets');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');
const WEBP_DIR = path.join(IMAGES_DIR, 'webp');
const CSS_DIR = path.join(ASSETS_DIR, 'css');
const JS_DIR = path.join(ASSETS_DIR, 'js');
const HTML_GLOB = path.resolve(__dirname, '*.html');
const VIDEO_INPUT = path.join(IMAGES_DIR, 'BK.mp4');
const VIDEO_OUTPUT = path.join(IMAGES_DIR, 'BK_compressed.mp4');

async function ensureDirs() {
  await fs.ensureDir(WEBP_DIR);
}

async function convertImagesToWebP() {
  console.log('Converting images to WebP...');
  const imageFiles = glob.sync(path.join(IMAGES_DIR, '*.{jpg,jpeg,png}'));
  for (const file of imageFiles) {
    const fileName = path.basename(file, path.extname(file));
    const outputFile = path.join(WEBP_DIR, fileName + '.webp');
    try {
      await sharp(file)
        .resize({ width: 800 }) // Resize to max width 800px, adjust as needed
        .webp({ quality: 85 })
        .toFile(outputFile);
      console.log(`Converted ${fileName} to WebP.`);
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
  }
}

async function minifyCSS() {
  console.log('Minifying CSS...');
  const cssFiles = glob.sync(path.join(CSS_DIR, '*.css'));
  for (const file of cssFiles) {
    if (file.endsWith('.min.css')) continue;
    const css = await fs.readFile(file, 'utf8');
    try {
      const result = await postcss([cssnano]).process(css, { from: file, to: file.replace('.css', '.min.css') });
      await fs.writeFile(file.replace('.css', '.min.css'), result.css);
      console.log(`Minified ${path.basename(file)}.`);
    } catch (err) {
      console.error(`Error minifying ${file}:`, err);
    }
  }
}

async function minifyJS() {
  console.log('Minifying JS...');
  const jsFiles = glob.sync(path.join(JS_DIR, '*.js'));
  for (const file of jsFiles) {
    if (file.endsWith('.min.js')) continue;
    const js = await fs.readFile(file, 'utf8');
    try {
      const result = await terser.minify(js);
      if (result.error) throw result.error;
      await fs.writeFile(file.replace('.js', '.min.js'), result.code);
      console.log(`Minified ${path.basename(file)}.`);
    } catch (err) {
      console.error(`Error minifying ${file}:`, err);
    }
  }
}

function compressVideo() {
  return new Promise((resolve, reject) => {
    console.log('Compressing video...');
    ffmpeg(VIDEO_INPUT)
      .outputOptions(['-vcodec libx264', '-crf 28', '-preset slow'])
      .on('end', () => {
        console.log('Video compression complete.');
        resolve();
      })
      .on('error', (err) => {
        console.error('Video compression error:', err);
        reject(err);
      })
      .save(VIDEO_OUTPUT);
  });
}

async function updateHTML() {
  console.log('Updating HTML files for WebP and responsive images...');
  const htmlFiles = glob.sync(HTML_GLOB);
  for (const file of htmlFiles) {
    let content = await fs.readFile(file, 'utf8');
    // Replace img tags for icons with picture element for WebP fallback
    content = content.replace(/<img src="assets\/images\/icons\/(.*?)\.(png|jpg|jpeg)" alt="(.*?)" width="(\d+)" height="(\d+)" loading="lazy" \/>/g,
      (match, p1, p2, alt, width, height) => {
        return `<picture>
  <source srcset="assets/images/webp/icons/${p1}.webp" type="image/webp" />
  <img src="assets/images/icons/${p1}.${p2}" alt="${alt}" width="${width}" height="${height}" loading="lazy" />
</picture>`;
      });
    // Add lazy loading to other images if missing
    content = content.replace(/<img ((?!loading=)[^>]+)>/g, '<img loading="lazy" $1>');
    await fs.writeFile(file, content);
    console.log(`Updated ${path.basename(file)}.`);
  }
}

async function generateServiceWorker() {
  console.log('Generating service worker for caching...');
  await workboxBuild.generateSW({
    swDest: path.join(__dirname, 'sw.js'),
    globDirectory: __dirname,
    globPatterns: [
      'assets/css/*.min.css',
      'assets/js/*.min.js',
      'assets/images/webp/**/*.{webp,png,jpg,jpeg}',
      '*.html',
    ],
    skipWaiting: true,
    clientsClaim: true,
  });
  console.log('Service worker generated.');
}

async function runLighthouse() {
  console.log('Running Lighthouse audit...');
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { logLevel: 'info', output: 'html', port: chrome.port };
  const runnerResult = await lighthouse('http://localhost:3000', options);
  const reportHtml = runnerResult.report;
  await fs.writeFile('lighthouse-report.html', reportHtml);
  console.log('Lighthouse report generated: lighthouse-report.html');
  await chrome.kill();
}

async function runPa11y() {
  console.log('Running Pa11y accessibility audit...');
  const results = await pa11y('http://localhost:3000');
  await fs.writeFile('pa11y-report.json', JSON.stringify(results, null, 2));
  console.log('Pa11y report generated: pa11y-report.json');
}

async function main() {
  try {
    await ensureDirs();
    await convertImagesToWebP();
    await minifyCSS();
    await minifyJS();
    await compressVideo();
    await updateHTML();
    await generateServiceWorker();
    // Note: runLighthouse and runPa11y require a running local server at port 3000
    // Uncomment below lines if server is running
    // await runLighthouse();
    // await runPa11y();
    console.log('All tasks completed successfully.');
  } catch (err) {
    console.error('Error during optimization:', err);
  }
}

main();
