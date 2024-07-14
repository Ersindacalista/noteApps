const express = require('express');
const router = express.Router();
const db = require('../models/db');



router.get('/', (req,res) => {
    db.getNotes(req,res)
})
router.get('/notes', (req,res) => {
    db.getNote(req,res)
})

router.post('/create', (req,res) => {
    db.createNote(req,res)
})

router.post('/edit', (req,res) => {
    db.editNote(req,res)

})
router.post('/delete', (req,res) => {
    db.deleteNote(req,res)
})

module.exports =  router;