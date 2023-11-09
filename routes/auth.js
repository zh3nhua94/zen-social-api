//Auth route handles REGISTER and LOGIN
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

//REGISTER
router.post("/register", async (req, res) => {
	try {
		//generate new password and encrypt
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(req.body.password, salt);
		//create new user
		const newUser = new User({
			//where User is the schema format from User Model
			username: req.body.username,
			displayName: req.body.displayName,
			email: req.body.email,
			password: hashedPassword,
		});
		//save user and response return
		const saveUser = await newUser.save();
		res.status(200).json(saveUser);
	} catch (err) {
		console.log(err);
	}
});

//LOGIN
router.post("/login", async (req, res) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		//if no user found
		if (!user) {
			res.status(404).json("user not found");
			return;
		}
		//compare password to login
		const validPassword = await bcrypt.compare(req.body.password, user.password);
		if (!validPassword) {
			res.status(404).json("wrong password");
			return;
		}
		//if all correct
		res.status(200).json(user);
	} catch (err) {
		res.status(500).json(err);
	}
});

module.exports = router;
