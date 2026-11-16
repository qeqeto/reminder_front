require('fs').writeFileSync(__dirname + '/config.js', `window.API_URL=${JSON.stringify(process.env.API_URL || 'http://localhost:3000')};`);
