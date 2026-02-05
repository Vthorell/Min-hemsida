const createError = require('http-errors');
const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');

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

const oneYear = 31536000;

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? oneYear : 0,
    setHeaders(res, filePath) {
      if (!isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const longCache = 'public, max-age=31536000, immutable';
      const mediumCache = 'public, max-age=2592000, immutable';
      if (['.webp', '.avif', '.jpg', '.jpeg', '.png', '.gif', '.ico'].includes(ext)) {
        res.setHeader('Cache-Control', longCache);
      } else if (['.css', '.js'].includes(ext)) {
        res.setHeader('Cache-Control', mediumCache);
      } else {
        res.setHeader('Cache-Control', longCache);
      }
    },
  })
);

const stripHtml = (value = '') => value.replace(/<[^>]*>?/gm, '');
const sanitizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();
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

const renderContactResponse = (
  res,
  { statusCode = 200, type = null, message = null, oldInput = {} } = {}
) =>
  res.status(statusCode).render('kontakt', {
    formStatus: type && message ? { type, message } : null,
    oldInput: buildOldInput(oldInput),
  });

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidName = (value = '') => /^[\p{L}\p{M}\s.'-]+$/u.test(value);

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure =
  typeof process.env.SMTP_SECURE !== 'undefined'
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465;
const contactRecipient = process.env.CONTACT_RECIPIENT || smtpUser || '';

let mailTransporter = null;
if (smtpUser && smtpPass) {
  mailTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
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
} else {
  console.warn('SMTP_USER och/eller SMTP_PASS saknas. Kontaktformuläret kan inte skicka e-post.');
}

app.use('/', indexRouter);

app.post('/send-email', async (req, res) => {
  const rawName = req.body?.name ?? '';
  const rawEmail = req.body?.email ?? '';
  const rawMessage = req.body?.message ?? '';

  const cleanedName = sanitizeWhitespace(stripHtml(rawName)).slice(0, 80);
  const cleanedEmail = rawEmail.trim();
  const cleanedMessage = stripHtml(rawMessage).trim().slice(0, 2000);

  const errors = [];

  if (cleanedName.length < 2 || cleanedName.length > 80 || !isValidName(cleanedName)) {
    errors.push('Ange ett giltigt namn (2–80 tecken, endast bokstäver).');
  }

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Ange en giltig e-postadress.');
  }

  if (cleanedMessage.length < 5) {
    errors.push('Skriv ett meddelande på minst 5 tecken.');
  }

  if (errors.length) {
    return renderContactResponse(res, {
      statusCode: 400,
      type: 'error',
      message: errors.join(' '),
      oldInput: { name: cleanedName, email: cleanedEmail, message: cleanedMessage },
    });
  }

  if (!mailTransporter || !contactRecipient) {
    return renderContactResponse(res, {
      statusCode: 503,
      type: 'error',
      message: 'Kontaktformuläret är tillfälligt nere. Försök igen senare eller maila mig direkt.',
      oldInput: { name: cleanedName, email: cleanedEmail, message: cleanedMessage },
    });
  }

  const normalizedMessage = cleanedMessage.replace(/\r\n|\r/g, '\n');
  const fromAddress = smtpUser || contactRecipient;

  try {
    await mailTransporter.sendMail({
      from: fromAddress ? `"Viggo Thorell Portfolio" <${fromAddress}>` : undefined,
      replyTo: cleanedEmail,
      to: contactRecipient,
      subject: `Nytt meddelande från ${cleanedName}`,
      text: `Namn: ${cleanedName}\nE-post: ${cleanedEmail}\n\n${normalizedMessage}`,
      html: `<p><strong>Namn:</strong> ${escapeHtml(cleanedName)}</p>
             <p><strong>E-post:</strong> ${escapeHtml(cleanedEmail)}</p>
             <p><strong>Meddelande:</strong><br>${escapeHtml(normalizedMessage).replace(/\n/g, '<br>')}</p>`,
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
      oldInput: { name: cleanedName, email: cleanedEmail, message: cleanedMessage },
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
