import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import basicDetailsModel from './schema/schema.js'


//Const and vars

const app=express()

//Middleware

app.use(cors())
dotenv.config()
app.use(express.json())
app.use(express.urlencoded({extended:true}))


const verifyToken=(req,res,next)=>{

	const token=req.headers['authorization']
	if(!token)
		res.status(403).send("Token is required")
	try{
		const decoded=jwt.verify(token,`${process.env.SALT}`)
		console.log(decoded)
		}
	catch(err){
		req.status(403).send(err)
		console.log(err)}
	next()
}

//DB CONFIG

mongoose.connect(`${process.env.dbURL}`,{
		useNewUrlParser:true,
		useUnifiedTopology:true})

//routes

app.get('/',(req,res)=>{
	console.log(`Listening at ${process.env.PORT}`)
	res.status(200).send("OK")
})

//Registation
app.post('/register',async(req,res)=>{
	
	const { UserName,Password,Name }=req.body
	const user=await basicDetailsModel.findOne({UserName})
	if(user)
		res.status(401).send("User exists!")
	else{
		await bcrypt.hash(Password,10,async(err,hashed)=>{
				if(err)
				   throw err
				await basicDetailsModel.create({
					UserName,
					Name,
					Password:hashed})
		})
		res.status(201).send("Created User")
	}
})

//SignIn of User
app.post('/signin',async(req,res)=>{
	
	const { UserName,Password }=req.body
	let user=await basicDetailsModel.findOne({UserName}) 
	if(user){
		await bcrypt.compare(Password,user.Password,async(err,result)=>{
				if(err)
					throw err
				if(result){
					const token=await jwt.sign({id:user.UserName},`${process.env.SALT}`,
						{ expiresIn:'1h' })
					user['token']=token
					res.status(201).send(user)}
				else
					res.status(401).send("Wrong Credentials")
		})
	}
	else{
		console.log("Invalid")
		res.status(401).send("Invalid Credentials")}
})

//AddTask
app.post('/add',verifyToken,async(req,res)=>{

	const { UserName,Task,id }=req.body
	await basicDetailsModel.findOneAndUpdate({ UserName },
		{ $push:{ Todos:{ Task,id } } })
	res.status(201).send("OK")
})

//EditTask
app.post('/edit',verifyToken,async(req,res)=>{
	
	const { UserName,Task,id }=req.body
	await basicDetailsModel.updateOne({ UserName,'Todos.id':id },
		{ $set:{ 'Todos.$.Task': Task  } })
	res.status(201).send("OK")
})

//DeleteTask
app.post('/delete',verifyToken,async(req,res)=>{

	const { UserName,Task,id }=req.body
	await basicDetailsModel.findOneAndUpdate({ UserName,'Todos.id':id },
		{ $pull:{ Todos:{ id } } })
	res.status(201).send("OK")
})


app.listen(`${process.env.PORT}`,()=>console.log(`@ ${process.env.PORT}`))
