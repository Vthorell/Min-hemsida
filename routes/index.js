const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
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
