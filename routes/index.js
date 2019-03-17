var express = require('express');
var router = express.Router();
const axios = require('axios')
const querystring = require('querystring')
const nodemailer = require('nodemailer')

const containerAuth = 'autenticacao'//"localhost"
const containerMailDev = 'maildev'

const transporter = nodemailer.createTransport({
    // In Node, environment variables are available on process.env
    host: containerMailDev,//process.env.MAILDEV_PORT_25_TCP_ADDR, // ex. 172.17.0.10
    port: 25,//process.env.MAILDEV_PORT_25_TCP_PORT, // ex. 25
    // We add this setting to tell nodemailer the host isn't secure during dev:
    ignoreTLS: true
    // service: 'gmail',
    // auth: {
    //        user: 'jorge10oliveira@gmail.com',
    //        pass: 'password'
    //    }
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('http://localhost:3000/users')
});

router.get('/enviaEmail', function(req, res, next) {
  console.dir(req.query.token)
  //res.jsonp(req.query.token)
  console.log('VOU ENVIAR O EMAILLLLLL!!')
  axios.get('http://' + containerAuth + ':3000/api/users/info?token=' + req.query.token)
    .then(mail =>{
      console.log('VOU ANALISAR O MEU EMAIL::::::::::::')
      console.dir(mail.data)
      var mailOriginal = mail.data.email
      var mailLocal = mailOriginal.split("@")[0] + "@vr-2.gcom.di.uminho.pt"
      console.log(mailLocal)
      res.render('compositor',{info: mailLocal})
    })//recebe o mail com que o login foi feito
    .catch(erroVerificacao =>{
      console.log("ERRO NA CONFIRMAÇÃO DO TOKEN:" + erroVerificacao)
      res.render('error', {message: 'A autenticação não é válida ...'})
    })
});

router.post('/enviaEmail', (req, res) => {
  console.log('VOU ENVIAR UM EMAIL!!!')
  console.dir(req.body)

  let mailOptions = {
    from: req.body.from, // sender address
    to: req.body.email, // list of receivers
    subject: req.body.assunto, // Subject line
    html: '<p>' + req.body.texto + '</p>'// plain text body
  }

  // Now when your send an email, it will show up in the MailDev interface
  transporter.sendMail(mailOptions, (error, info) => {
    if(error){
      console.log(error)
      res.render('error', {message: 'Erro ao enviar o email! Tente novamente mais tarde ...'})
    }
    else{
      console.log(info)
      res.render('sucesso')
    }
  })

})

// router.get('/teste', (req, res) => {

//   let mailOptions = {
//     from: 'jorge10oliveira@gmail.com', // sender address
//     to: 'jorge10oliveira@gmail.com', // list of receivers
//     subject: 'Subject of your email', // Subject line
//     html: '<p>Your html here</p>'// plain text body
//   }

//   // Now when your send an email, it will show up in the MailDev interface
//   transporter.sendMail(mailOptions, (error, info) => {
//     if(error)
//       console.log(error)
//     else
//       console.log(info)
//   })
// })

// axios.get('http://localhost:3000/users/info?token=' + req.query.token)
// .then(mail =>{

// })//recebe o mail com que o login foi feito
// .catch(erroVerificacao =>{
//   console.log("ERRO NA CONFIRMAÇÃO DO TOKEN"))
// })
// console.log('EU ESTOU AQUI AAQUI PARA TE DIZER')
// axios.get('http://localhost:3000/users/login')
//   .then(dados => res.jsonp('Olha um token a sair: ' + dados))
//   .catch(erro => res.jsonp(erro))
// //res.render('index', { title: 'Express' });

module.exports = router;
