const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  payment: {
    type: String,
    default: 'Non spécifié'
  },
  transactionRef: {
    type: String,
    default: ''
  },
  cart: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['En attente', 'Confirmée', 'Livrée', 'Annulée'],
    default: 'En attente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);