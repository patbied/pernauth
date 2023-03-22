const express = require('express')
const router = express.Router()
const {pool} = require('../dbconfig')
const bcrypt = require('bcrypt')
const session = require('express-session')
router.post('/login', async(req, res) => {
   
    let {email,password} = req.body
    email = email.toLowerCase()
    let errors = []
     //User is already logged in
     if (req.session.user) {
        errors.push({message: "Cant do this."})
     }
     if (errors.length > 0) {
        return res.json(errors)
    } 
    if (!email || !password){
        errors.push({message: "Please enter all fields."})
    }
    if (errors.length > 0) {
        return res.json(errors)
    } else {
        const user = await pool.query("SELECT * FROM users WHERE email = $1",[email])
        if (user.rows.length > 0){
            let hashedPassword = user.rows[0].password
            const validPass = await bcrypt.compare(password,hashedPassword)
            //if true password is valid else incorrect
            if (validPass){
                const userRows = user.rows[0]
                console.log(userRows)
                req.session.user = {
                    id: userRows.id,
                    name: userRows.name,
                    email: userRows.email
                }
                // res.status = 200
               return res.status(200).json({user:req.session.user})
            } else {
                errors.push({message: "Password is invalid."}) 
                return res.json(errors)
            }
            

        }  else {
            errors.push({message: "Email is invalid."}) 
            return res.json(errors)
        }
    }
  
        
    
    
})
router.post('/logout', async(req, res) => {
    try {
        await req.session.destroy()
        return res.sendStatus(200)
    }catch(err){
        console.log(err)
        return res.sendStatus(403)
    }
})
router.post('/register', async(req, res)=> {
    let {name, email, password, password2} = req.body
    email = email.toLowerCase()
    let errors = []
    if (!name || !email || !password || !password2){
        errors.push({message: "Please enter all fields"})
    }
    if (password.length < 6){
        errors.push({message: "Password must be atleast 6 characters"})
    }
    if (password != password2){
        errors.push({message: "Passwords do not match"})
    }
    if (errors.length > 0){
        errors.push({error: true})
        res.json(errors)
    }//Form validation has passed
    else {
        let hashedPassword = await bcrypt.hash(password,10)

        //FIX ISSUE  WITH CAPS
        const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1',[email])
        // res.json(existingEmail.rows)
        if (existingEmail.rows.length >0){
            errors.push({message: 'Email already in use.'})
            errors.push({error: true})
            res.json(errors)
        }
        else {
            const createdAccount = await pool.query(
                `INSERT INTO users (name,email,password) 
                VALUES ($1,$2,$3) 
                RETURNING *`,[name,email,hashedPassword]
            )
            const user = createdAccount.rows[0]
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            }
            return res.json({user: req.session.user})
        }
    }
    
})
//GET ONE USER
router.get('/:userID', async(req,res) => {
    const id = req.params.userID
    console.log(id)
    const userInDB = await pool.query(`
    SELECT * FROM users WHERE id = $1
    `,[id])
    if (userInDB.rows.length > 0){
        res.json(userInDB)
    } else {
        res.status(404).json({error: 'User not found.'})
    }
})

router.get('/all', async(req, res) => {
    const users = await pool.query(`SELECT * FROM users LIMIT 10`)
    res.json(users)
})

router.post('/fetch-user',  async(req,res) => {
if (req.sessionID && req.session.user){
    res.status(200)
    return res.json({user: req.session.user})
}
return res.sendStatus
})
module.exports = router