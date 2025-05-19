// generate-previews.cjs
const fs        = require('fs').promises;
const path      = require('path');
const puppeteer = require('puppeteer');

const ANIM_DIR    = path.resolve(__dirname, 'animations');
const TMP_PROFILE = path.resolve(__dirname, 'puppeteer_tmp_profile');
const LOTTIE_PATH = require.resolve('lottie-web/build/player/lottie.min.js');

async function makePreview(jsonFile) {
  const jsonPath = path.join(ANIM_DIR, jsonFile);
  const outFile  = path.join(ANIM_DIR, jsonFile.replace(/\.json$/, '.png'));

  console.log(`→ Rendering ${jsonFile} → ${path.basename(outFile)}`);
  await fs.mkdir(TMP_PROFILE, { recursive: true });

  // Читаем JSON анимации
  const animationData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  // Читаем текст Lottie
  const lottieCode = await fs.readFile(LOTTIE_PATH, 'utf8');

  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: TMP_PROFILE,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // готовим контейнер 200×200
  await page.setContent(`
    <!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden">
      <div id="c" style="width:200px;height:200px;"></div>
    </body></html>`, { waitUntil: 'domcontentloaded' });

  // вставляем lottie
  await page.addScriptTag({ content: lottieCode });

  // инициализируем анимацию с animationData
  await page.evaluate(data => {
    window._ready = new Promise(resolve => {
      const anim = lottie.loadAnimation({
        container: document.getElementById('c'),
        renderer:  'canvas',
        loop:      false,
        autoplay:  true,
        animationData: data
      });
      // ждём окончания проигрывания
      anim.addEventListener('complete', () => setTimeout(resolve, 50));
    });
  }, animationData);

  // ждём завершения
  await page.evaluate(() => window._ready);

  // снимаем скриншот
  await page.screenshot({
    path: outFile,
    omitBackground: true,
    clip: { x: 0, y: 0, width: 200, height: 200 }
  });

  await browser.close();
}

(async () => {
  try {
    const files = await fs.readdir(ANIM_DIR);
    const jsons = files.filter(f => f.toLowerCase().endsWith('.json'));
    if (!jsons.length) {
      console.error('⛔ Папка "animations" пуста или нет JSON-файлов');
      process.exit(1);
    }
    for (const jf of jsons) {
      try {
        await makePreview(jf);
      } catch (err) {
        console.error(`❌ Не удалось сгенерировать ${jf}:`, err.message);
      }
    }
    console.log('✅ Все превью попытались сгенерироваться');
    process.exit(0);
  } catch (err) {
    console.error('❌ Фатальная ошибка:', err);
    process.exit(1);
  }
})();