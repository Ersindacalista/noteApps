const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/login',(req,res) => {
    res.sendFile(path.join(__dirname, '../../view/login.html'))
})
router.post('/login', (req,res) => {
    db.login(req,res)
})