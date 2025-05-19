const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('spins.db');

// создаём таблицы, если нет
db.prepare(`
  CREATE TABLE IF NOT EXISTS spend (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    spent INTEGER
  )
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS win (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    prize TEXT,
    weight REAL
  )
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS prizes (
    idx INTEGER PRIMARY KEY,
    name TEXT,
    img TEXT,
    weight REAL
  )
`).run();

// заполняем prizes из JSON (один раз при старте)
const prizesJson = require('./prizes.json');
const insertPrize = db.prepare(`INSERT OR REPLACE INTO prizes (idx,name,img,weight)
                                 VALUES (@idx,@name,@img,@weight)`);
prizesJson.forEach((p,i)=> insertPrize.run({ idx:i, ...p }) );

app.use(express.json());
app.use(express.static('.')); // отдаём index.html, animations/ и т.д.

// API: отдать список призов
app.get('/api/prizes', (req,res)=>{
  const rows = db.prepare(`SELECT name,img,weight FROM prizes ORDER BY idx`).all();
  res.json(rows);
});

// API: логировать трату
app.post('/api/spend', (req,res)=>{
  const { spent } = req.body;
  db.prepare(`INSERT INTO spend (spent) VALUES (?)`).run(spent);
  res.sendStatus(204);
});

// API: логировать выигрыш
app.post('/api/win', (req,res)=>{
  const { prize, weight } = req.body;
  db.prepare(`INSERT INTO win (prize,weight) VALUES (?,?)`).run(prize,weight);
  res.sendStatus(204);
});

app.listen(3000, ()=> console.log('🎲 Сервер запущен на http://localhost:3000'));