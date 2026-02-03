const createError = require('http-errors');
const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const indexRouter = require('./routes/index');

const app = express();
const isProduction = app.get('env') === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  blockAllMixedContent: [],
  imgSrc: ["'self'", 'data:'],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  objectSrc: ["'none'"],
  connectSrc: ["'self'"],
  frameAncestors: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: [],
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(logger(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '25kb' }));
app.use(express.urlencoded({ extended: false, limit: '25kb' }));

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '7d' : 0,
    setHeaders(res) {
      res.setHeader(
        'Cache-Control',
        isProduction ? 'public, max-age=604800, immutable' : 'public, max-age=0, must-revalidate'
      );
    },
  })
);

const stripHtml = (value = '') => value.replace(/<[^>]*>?/gm, '');
const sanitizeLineBreaks = (value = '') => value.replace(/(\r\n|\n|\r)/g, ' ').trim();
const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildOldInput = (formData = {}) => ({
  name: formData.name || '',
  email: formData.email || '',
  message: formData.message || '',
});

const renderContactResponse = (res, { statusCode = 200, type = null, message = null, oldInput = {} } = {}) =>
  res.status(statusCode).render('kontakt', {
    formStatus: type && message ? { type, message } : null,
    oldInput: buildOldInput(oldInput),
  });

const contactValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Namnet måste vara mellan 2 och 80 tecken.')
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage('Namnet får bara innehålla bokstäver.')
    .customSanitizer((value) => sanitizeLineBreaks(stripHtml(value))),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Ange en giltig e-postadress.')
    .custom((value) => {
      if (/\r|\n/.test(value)) {
        throw new Error('Ogiltig e-postadress.');
      }
      return true;
    })
    .normalizeEmail({ gmail_remove_dots: false }),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Meddelandet måste vara mellan 10 och 2000 tecken.')
    .customSanitizer((value) => stripHtml(value).replace(/\r\n/g, '\n')),
];

const contactRateWindowMs = 15 * 60 * 1000;
const contactRateLimit = 5;

const contactLimiter = rateLimit({
  windowMs: contactRateWindowMs,
  max: contactRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.setHeader('Retry-After', String(Math.ceil(contactRateWindowMs / 1000)));
    return renderContactResponse(res, {
      statusCode: 429,
      type: 'error',
      message: 'Du har skickat för många meddelanden. Försök igen om en stund.',
      oldInput: req.body,
    });
  },
  keyGenerator: (req) => req.ip,
});

const smtpConfig = {
  user: 'viggotho@gmail.com',
  pass: 'vgca yeib xyjm kfdl',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
};

const contactRecipient = 'viggotho@gmail.com';

const mailTransporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

mailTransporter
  .verify()
  .then(() => {
    if (!isProduction) {
      console.log('Mailtransporter är konfigurerad och redo.');
    }
  })
  .catch((err) => {
    console.warn('Kunde inte verifiera mailtransporter:', err.message);
  });

app.use('/', indexRouter);

app.post('/send-email', contactLimiter, contactValidationRules, async (req, res) => {
  const { name = '', email = '', message = '' } = req.body || {};
  const validationErrors = validationResult(req);
  const errors = validationErrors.isEmpty()
    ? []
    : validationErrors.array().map((error) => error.msg);

  if (errors.length) {
    return renderContactResponse(res, {
      statusCode: 400,
      type: 'error',
      message: errors.join(' '),
      oldInput: { name, email, message },
    });
  }

  if (!mailTransporter || !contactRecipient) {
    return renderContactResponse(res, {
      statusCode: 503,
      type: 'error',
      message: 'Kontaktformuläret är tillfälligt nere. Försök igen senare eller maila mig direkt.',
      oldInput: { name, email, message },
    });
  }

  const safeName = sanitizeLineBreaks(name);
  const safeEmail = email;
  const safeMessage = stripHtml(message).trim();

  try {
    await mailTransporter.sendMail({
      from: `"Viggo Thorell Portfolio" <${smtpUser}>`,
      replyTo: safeEmail,
      to: contactRecipient,
      subject: `Nytt meddelande från ${safeName}`,
      text: `Namn: ${safeName}\nE-post: ${safeEmail}\n\n${safeMessage}`,
      html: `<p><strong>Namn:</strong> ${escapeHtml(safeName)}</p>
             <p><strong>E-post:</strong> ${escapeHtml(safeEmail)}</p>
             <p><strong>Meddelande:</strong><br>${escapeHtml(safeMessage).replace(/\n/g, '<br>')}</p>`,
    });

    return renderContactResponse(res, {
      type: 'success',
      message: 'Tack! Ditt meddelande har skickats.',
      oldInput: { name: '', email: '', message: '' },
    });
  } catch (error) {
    console.error('Kunde inte skicka e-post:', error);
    return renderContactResponse(res, {
      statusCode: 500,
      type: 'error',
      message: 'Hoppsan! Något gick fel. Försök igen senare.',
      oldInput: { name, email, message },
    });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
