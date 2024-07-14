const note = require('./routes/note')

const express = require('express')
const path = require('path')
const app = express()
const port = 3000

app.use(express.json());

app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, '../public')))

app.use('/note', note)


app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, '../public/view/'))
})


app.listen(port,()=>{
    console.log('server running on port : ' ,port)
})
