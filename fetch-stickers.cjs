// fetch-stickers.cjs
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs         = require('fs');
const path       = require('path');
const axios      = require('axios');
const zlib       = require('zlib');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PACK_NAME = process.env.PACK_NAME;

if (!BOT_TOKEN || !PACK_NAME) {
  console.error('⚠️ Пожалуйста, заполните .env: BOT_TOKEN и PACK_NAME');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function dumpStickerPack() {
  const { stickers } = await bot.getStickerSet(PACK_NAME);

  // Папки для хранения
  const animDir = path.join(__dirname, 'animations');
  if (!fs.existsSync(animDir)) fs.mkdirSync(animDir);

  const prizes = [];
  for (const s of stickers) {
    // 1) качаем .tgs
    const tgsUrl   = await bot.getFileLink(s.file_id);
    const response = await axios.get(tgsUrl, { responseType: 'arraybuffer' });
    // 2) распаковываем gzip → JSON
    const buffer   = Buffer.from(response.data);
    const jsonBuf  = zlib.gunzipSync(buffer);
    const animData = JSON.parse(jsonBuf.toString('utf-8'));
    // 3) сохраняем Lottie-JSON
    const animPath = `animations/${s.file_unique_id}.json`;
    fs.writeFileSync(path.join(__dirname, animPath),
                     JSON.stringify(animData, null, 2),
                     'utf-8');
    console.log(`✅ Сохранён ${animPath}`);

    // 4) добавляем в prizes.json
    prizes.push({
      name:   s.emoji || 'NFT',
      img:    animPath,   // теперь указываем путь к JSON
      weight: 1
    });
  }

  // Сохраняем финальный JSON
  fs.writeFileSync(
    path.join(__dirname, 'prizes.json'),
    JSON.stringify(prizes, null, 2),
    'utf-8'
  );
  console.log(`🎉 Сохранено ${prizes.length} призов в prizes.json`);
}

dumpStickerPack().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});