const express = require('express')
const router = express.Router()
const db = require('..models/db')
const admin = require('../../private/admin')

router.get('/', (req,res) => {
    admin.acces(req,res)
})

router.get('/userNote', (req,res) => {
    
})