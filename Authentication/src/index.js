const dotenv = require("dotenv");
const express = require("express");
const pool = require("./config/dbConfig.js");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const initializePassport = require("./config/passportConfig.js");
const path = require("path");
const userId = require("./controllers/userId.js");
dotenv.config();

const app = express();

const PORT = process.env.PORT;

app.use(express.static("src/public"));
initializePassport(passport);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/login", checkAuthenticated, (req, res) => {
  console.log(req.session.flash.error);
  res.render("login.ejs");
});

app.get("/dashboard", checkNotAuthenticated, async (req, res) => {
  console.log(req.isAuthenticated());
  console.log(`Inside get request for dashboard we have id ${req.user.id}`);
  userId(req.user.id);
  const db = await pool.connect();
  try {
    const stats = await db.query(
      "SELECT au.user_id, COUNT(*) AS total_entries, SUM(episode) AS total_episodes FROM anime_user_list au WHERE au.user_id = $1 GROUP BY au.user_id",
      [req.user.id]
    );
    if (stats && stats.rows && stats.rows.length > 0) {
      res.render("dashboard", { user: req.user.name, stats: stats.rows[0] });
    } else {
      res.render("dashboard", { user: req.user.name, stats: null });
    }
  } catch (error) {
    console.log("Error", error);
    res.render("dashboard", { user: req.user.name, stats: null });
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("index", { message: "You have logged out successfully" });
    res.redirect("/user/login");
  });
});

app.post("/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2,
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered",
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/user/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/user/dashboard",
    failureRedirect: "/user/login",
    failureFlash: true,
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/user/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/login");
}

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
