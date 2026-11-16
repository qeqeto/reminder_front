let u = (process.env.API_URL || '').trim().replace(/\/+$/, '');
if (u && !/^https?:\/\//.test(u)) u = 'https://' + u;
require('fs').writeFileSync(__dirname + '/config.js', `window.API_URL=${JSON.stringify(u)};`);
console.log(u ? 'API_URL = ' + u : 'გაფრთხილება: API_URL არ არის დაყენებული!');
