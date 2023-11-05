const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(console.log("Connected to MongoDB"));

//Middleware
app.use(
	cors({
		origin: process.env.SITE_URL,
	})
);
app.use(express.json());
app.use(
	helmet({
		crossOriginResourcePolicy: false, //solve the static images file serving problem
	})
);
app.use(morgan("common"));
//express.static serves static files, path.join merges two path together, __dirname is the root directory which in this case is localhost:8800/api
//If visit /images dont GET anything instead go to localhost:8800/api/public/images directory
app.use("/images", express.static(path.join(__dirname, "public/images")));

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "public/images");
	},
	filename: (req, file, cb) => {
		cb(null, req.body.name);
		// console.log(req.body);
	},
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
	try {
		return res.status(200).json("File uploaded successfully");
	} catch (err) {
		console.log(err);
	}
});

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postsRoute);

app.listen(8800, () => {
	//where 8800 is our port number
	console.log("Backend server is running!!");
});
