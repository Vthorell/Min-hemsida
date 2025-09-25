var createError = require('http-errors');
const nodemailer = require('nodemailer');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => res.render('index'));
app.get('/om-mig', (req, res) => res.render('om-mig'));
app.get('/erfarenheter', (req, res) => res.render('erfarenheter'));
app.get('/projekt', (req, res) => res.render('projekt'));
app.get('/lia', (req, res) => res.render('lia'));
app.get('/kontakt', (req, res) => res.render('kontakt'));

app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // transporter för Gmail (du kan använda annan SMTP också)
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'viggotho@gmail.com', // din gmail
        pass: 'vgca yeib xyjm kfdl' // app-lösenord från Google
      }
    });

    // själva mejlet
    await transporter.sendMail({
      from: email,
      to: 'viggotho@gmail.com', // vart det skickas
      subject: `Nytt meddelande från ${name}`,
      text: message,
      html: `<p><b>Namn:</b> ${name}</p>
             <p><b>E-post:</b> ${email}</p>
             <p><b>Meddelande:</b><br>${message}</p>`
    });

    res.send('Tack! Ditt meddelande har skickats ✅');
  } catch (err) {
    console.error(err);
    res.send('Hoppsan! Något gick fel 😢');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Lyssnar på port ${port}`));


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
