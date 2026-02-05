const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/sitemap.xml', (req, res) => {
  const base = 'https://viggo-thorell.se';
  const pages = ['', '/om-mig', '/erfarenheter', '/projekt', '/lia', '/kontakt'];
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((path) => `  <url><loc>${base}${path || '/'}</loc><changefreq>weekly</changefreq><priority>${path ? '0.8' : '1.0'}</priority></url>`).join('\n')}
</urlset>`);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nSitemap: https://viggo-thorell.se/sitemap.xml');
});

router.get('/om-mig', (req, res) => {
  res.render('om-mig');
});

router.get('/erfarenheter', (req, res) => {
  res.render('erfarenheter');
});

router.get('/projekt', (req, res) => {
  res.render('projekt');
});

router.get('/lia', (req, res) => {
  res.render('lia');
});

router.get('/kontakt', (req, res) => {
  res.render('kontakt', {
    formStatus: null,
    oldInput: { name: '', email: '', message: '' },
  });
});

module.exports = router;
