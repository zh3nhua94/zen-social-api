const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

//CREATE a post
router.post("/", async (req, res) => {
	const newPost = new Post(req.body);
	try {
		const savedPost = await newPost.save();
		res.status(200).json(savedPost);
	} catch (err) {
		res.status(500).json(err);
	}
});

//UPDATE a post
router.put("/:id", async (req, res) => {
	const post = await Post.findById(req.params.id);
	try {
		//check if is post owner
		if (post.userId === req.body.userId) {
			//update post
			await post.updateOne({ $set: req.body });
			res.status(200).json("the post has been updated");
		} else {
			//not post owner
			res.status(403).json("You can update only your post!");
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

//DELETE a post
router.delete("/:id", async (req, res) => {
	const post = await Post.findById(req.params.id);
	try {
		//check if is post owner
		if (post.userId === req.body.userId) {
			//update post
			await post.deleteOne();
			res.status(200).json("the post has been deleted");
		} else {
			//not post owner
			res.status(403).json("You can delete only your post!");
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

//LIKE a post
router.put("/:id/like", async (req, res) => {
	const post = await Post.findById(req.params.id);
	try {
		//checked if user liked
		if (!post.likes.includes(req.body.userId)) {
			await post.updateOne({ $push: { likes: req.body.userId } });
			res.status(200).json("The post has been liked");
		} else {
			//if already liked, now do dislike
			await post.updateOne({ $pull: { likes: req.body.userId } });
			res.status(200).json("The post has been disliked");
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

//GET a post
router.get("/:id", async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		res.status(200).json(post);
	} catch (err) {
		res.status(500).json(err);
	}
});

//GET TIMELINE posts, call all followings' post and posts of this user
router.get("/timeline/:userId", async (req, res) => {
	try {
		//use Promise.all when using map(), since have multiple promises
		//current user Id, get all post of his post, and get all of followings' posts
		const currentUser = await User.findById(req.params.userId);
		const userPosts = await Post.find({ userId: currentUser._id });
		const friendPosts = await Promise.all(
			currentUser.followings.map((friendId) => {
				return Post.find({ userId: friendId });
			})
		);
		res.status(200).json(userPosts.concat(...friendPosts));
	} catch (err) {
		res.status(500).json(err);
	}
});

//GET USER's PROFILE posts
router.get("/profile/:username", async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username });
		const posts = await Post.find({ userId: user._id });
		res.status(200).json(posts);
	} catch (err) {
		res.status(500).json(err);
	}
});

module.exports = router;
