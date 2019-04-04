var express = require('express');
var router = express.Router();
const axios = require('axios')
const querystring = require('querystring')
const nodemailer = require('nodemailer')
const HistoricoModel = require('../models/historico')

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
  //res.redirect('http://localhost:3000/users')
  console.log('VAMOS VER: ' + req.hostname)
  res.redirect('http://' + req.hostname + ':80/servicoautenticacao/users')
});

router.get('/enviaEmail', function(req, res, next) {
  console.dir(req.query.token)
  //res.jsonp(req.query.token)
  console.log('VOU ENVIAR O EMAILLLLLL!!')
  axios.get('http://' + containerAuth + ':3000/servicoautenticacao/api/users/info?token=' + req.query.token)
    .then(mail =>{
      console.log('VOU ANALISAR O MEU EMAIL::::::::::::')
      console.dir(mail.data)
      var mailOriginal = mail.data.email
      var mailLocal = mailOriginal.split("@")[0] + "@vr-2.gcom.di.uminho.pt"
      console.log(mailLocal)
      HistoricoModel.aggregate([
        {$match: {"email": mailLocal}},
        {$group: {_id: null, "to": {"$addToSet": "$mails.to"}}}//, : {"$push": "$mails.subject"}, body: {"$push": "$mails.body"}}}
      ])
        .then(dados => {
          console.log("VAMOS VER O QUE DEU NO AGGREGATE")
          console.dir(dados[0])
          const uniq = [...new Set(dados[0].to[0])]
          console.log("Olha unicamente para mim: " + uniq)
          console.log("VOu ver o primeiro elemeto: " + uniq[0])
          res.render('compositor',{info: mailLocal, mail: mailOriginal, token: req.query.token, recetor: uniq})
        })
        .catch(error => {
          console.log("Deu erro no aggregate: " + error)
          res.render('compositor',{info: mailLocal, mail: mailOriginal, token: req.query.token})
        })
      
    })//recebe o mail com que o login foi feito
    .catch(erroVerificacao =>{
      console.log("ERRO NA CONFIRMAÇÃO DO TOKEN:" + erroVerificacao)
      res.redirect('http://' + req.hostname + ':80/servicoautenticacao/users')
      // res.render('error', {message: 'A autenticação não é válida ...'})
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
      emailS = {}
      emailS.to = mailOptions.to
      emailS.subject = mailOptions.subject
      emailS.body = req.body.texto
      let today = new Date()
      let dd = today.getDate()
      let mm = today.getMonth() + 1 //January is 0!
      let yyyy = today.getFullYear();
      let hour = today.getHours()
      let minute = today.getMinutes()

      emailS.data = dd + '/' + mm + '/' + yyyy + ' ' + hour + ':' + minute;
      
      console.log("Vou analisar o objeto:")
      console.dir(emailS)
      HistoricoModel.findOneAndUpdate({email: mailOptions.from}, {$push: {mails: emailS}}, {upsert: true, new: true})
        .then(resultado => {
          console.log("ELE INSERIU NA BASE DE DADOS!: " + resultado)
          res.render('sucesso')
        })
        .catch(error => {
          console.log("Nao inseriu na base de dados: " + error)
          res.render('sucesso')
        })
      
    }
  })

})

router.post('/logout', function(req, res, next) {
  console.log("NO LOGOUT")
  console.log("MAIL => " + req.body.mail)
  console.log("TOKEN => " + req.body.token)

  axios.post('http://' + containerAuth + ':3000/servicoautenticacao/api/users/logout', {email: req.body.mail, token: req.body.token})
      .then(msg =>{
        console.log(msg.data)
        res.redirect('http://' + req.hostname + ':80/servicoemail')
      })
      .catch(erro =>{
        console.log(erro.data)
        res.redirect('http://' + req.hostname + ':80/servicoemail')
      })
  })

router.get('/:nomeAutor', (req, res) => {
  console.log('O nome do autor é: ' + req.params.nomeAutor)
  console.log('O autor logado é: ' + req.query.uti)
  HistoricoModel.aggregate([
      {$match: {"email": req.query.uti}},
      {$unwind: {path: "$mails"}},
      {$match: {"mails.to": req.params.nomeAutor}}
    ])
    .then(dados => {
      console.log('O que saquei foi: ' + dados)
      console.dir(dados)
      res.render('emails', {emails: dados})
    })
    .catch(error => {
      console.log('Deu um erro: ' + error)
      res.render("error", {message: "Não conseguimos processar a tabela dos emails enviados ..."})
    })
})

module.exports = router;
