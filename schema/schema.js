import mongoose from 'mongoose'

const BasicDetails=mongoose.Schema({
	UserName:String,
	Name:String,
	Password:String,
	token:String,
	Todos:[{
		Task:String,
		id:Number}]
})

export default mongoose.model('basicDetails',BasicDetails)
