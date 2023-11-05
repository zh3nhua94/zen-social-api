//User Route handles GET user, UPDATE user, DELETE user, FOLLOW and UNFOLLOW
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

//UPDATE user
router.put("/:id", async (req, res) => {
	//find user id first
	if (req.body.userId === req.params.id || req.body.isAdmin) {
		//if user wants update password
		if (req.body.password) {
			try {
				const salt = await bcrypt.genSalt(10);
				req.body.password = await bcrypt.hash(req.body.password, salt);
			} catch (err) {
				return res.status(500).json(err);
			}
		}
		//update other body data
		try {
			const user = await User.findByIdAndUpdate(req.params.id, {
				$set: req.body,
			});
			res.status(200).json("Account has been updated");
		} catch (err) {
			return res.status(500).json(err);
		}
	} else {
		return res.status(403).json("You can update only your account!");
	}
});

//DELETE user
router.delete("/:id", async (req, res) => {
	//find user id first
	if (req.body.userId === req.params.id || req.body.isAdmin) {
		//Delete only one account
		try {
			const user = await User.findByIdAndDelete(req.params.id);
			res.status(200).json("Account has been deleted");
		} catch (err) {
			return res.status(500).json(err);
		}
	} else {
		return res.status(403).json("You can delete only your account!");
	}
});

//GET a user
router.get("/", async (req, res) => {
	//using query, localhost:8800/api/users?userId=12345678
	//using query, localhost:8800/api/users?username=12345678
	const userId = req.query.userId;
	const username = req.query.username;
	try {
		const user = userId ? await User.findById(userId) : await User.findOne({ username: username });
		//separate sensitive data like password and updatedAt, from the other data
		const { password, updatedAt, ...other } = user._doc;
		//then we only retrieve 'other' data
		res.status(200).json(other);
	} catch (err) {
		return res.status(500).json(err);
	}
});

//GET FRIENDS
router.get("/friends/:userId", async (req, res) => {
	try {
		const user = await User.findById(req.params.userId);
		//use Promise.all when using map(), since have multiple promises
		const friends = await Promise.all(
			user.followings.map((friendId) => {
				//using friendId to get each their Id from mongoDB
				return User.findById(friendId);
			})
		);
		let friendList = [];
		friends.map((friend) => {
			const { _id, displayName, profilePicture } = friend;
			friendList.push({ _id, displayName, profilePicture });
		});
		res.status(200).json(friends);
	} catch (err) {
		res.status(500).json("get friends error: " + err);
	}
});

//FOLLOW a user
router.put("/:id/follow", async (req, res) => {
	if (req.body.userId !== req.params.id) {
		try {
			const user = await User.findById(req.params.id); //the person that we want to follow
			const currentUser = await User.findById(req.body.userId); //the current user himself
			//check if person IS NOT in following list?
			if (!user.followers.includes(req.body.userId)) {
				//update followers of other user
				await user.updateOne({ $push: { followers: req.body.userId } });
				//update following of current user
				await currentUser.updateOne({ $push: { followings: req.params.id } });
				res.status(200).json("user has been followed");
			} else {
				//person is already in following list
				res.status(403).json("you already followed this user");
			}
		} catch (err) {
			res.status(500).json(err);
		}
	} else {
		return res.status(403).json("You cant follow yourself!");
	}
});

//UNFOLLOW a user
router.put("/:id/unfollow", async (req, res) => {
	if (req.body.userId !== req.params.id) {
		try {
			const user = await User.findById(req.params.id); //the person that we want to unfollow
			const currentUser = await User.findById(req.body.userId); //the current user himself
			//check if person IS in following list?
			if (user.followers.includes(req.body.userId)) {
				//remove from followers of other user
				await user.updateOne({ $pull: { followers: req.body.userId } });
				//remove from following of current user
				await currentUser.updateOne({ $pull: { followings: req.params.id } });
				res.status(200).json("user has been unfollowed");
			} else {
				//person is already in following list
				res.status(403).json("you didn't follow this user");
			}
		} catch (err) {
			res.status(500).json(err);
		}
	} else {
		return res.status(403).json("You cant unfollow yourself!");
	}
});

module.exports = router;
