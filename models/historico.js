const mongoose = require('mongoose')

const Schema = mongoose.Schema

const emailSchema = new Schema({
    to: {type: String},
    subject: {type: String},
    body: {type: String},
    data: {type: String}
})

var HistoricoSchema = new Schema({
    email: {type: String},
    mails: [emailSchema]
})

//A coleção da base de dados vai ser "users"
var UserModel = mongoose.model('compositor', HistoricoSchema)

module.exports = UserModel