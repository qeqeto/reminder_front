// გაშვებისას ქმნის dist/config.js-ს Railway-ის API_URL ცვლადიდან (rebuild არ სჭირდება)
const fs = require('fs');
let u = (process.env.API_URL || '').trim().replace(/\/+$/, '');
if (u && !/^https?:\/\//.test(u)) u = 'https://' + u;
fs.mkdirSync(__dirname + '/dist', { recursive: true });
fs.writeFileSync(__dirname + '/dist/config.js', `window.API_URL=${JSON.stringify(u)};`);
console.log(u ? 'API_URL = ' + u : 'გაფრთხილება: API_URL არ არის დაყენებული!');
