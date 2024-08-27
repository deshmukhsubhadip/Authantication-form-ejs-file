import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Authorization middleware
const authorization = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        try {
            const decodeddata = jwt.verify(token, "gygfdiguytdguhg");
            req.user = await UserModel.findById(decodeddata._id);
            next();
        } catch (error) {
            console.error("Invalid token:", error);
            res.render("login");
        }
    } else {
        res.redirect("/login");
    }
};

app.get("/", authorization, (req, res) => {
    console.log(req.user);
    res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await UserModel.findOne({ email });
    if (user) {
        return res.redirect("/login");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await UserModel.create({ name, email, password: hashedPassword });
        const token = jwt.sign({ _id: user._id }, "gygfdiguytdguhg");

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000),
        });

        res.redirect("/");
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", { email, password });

    let user = await UserModel.findOne({ email });
    if (!user) {
        console.log("User not found");
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Stored password:", user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
        return res.render("login", { message: "Incorrect password" });
    }

    try {
        const token = jwt.sign({ _id: user._id }, "gygfdiguytdguhg");

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000),
        });

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



app.get("/logout", (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0)
    });

    res.redirect("/");
});

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/School", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("Database connected");
    })
    .catch((error) => {
        console.log("Database connection error:", error);
    });

// User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const UserModel = mongoose.model("Studentdata", userSchema);

app.listen(4000, "localhost", () => {
    console.log("Server is working on http://localhost:4000");
});
