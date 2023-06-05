const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const path = require("path");
const flash = require("connect-flash");
const { user } = require("./models");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
// app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
//const { Hash } = require("crypto");
const saltRounds = 10;
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.get("/",function(request,response){
    response.render("index.ejs");
});
app.use(
    session({
      secret: "my-super-secret-key-217567893454",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        user.findOne({ where: { email: username } })
          .then(async function (user) {
            console.log("password", user.password);
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          })
  
          .catch((error) => {
            console.log(error);
            return done(null, false, { message: "Invalid Email-Id" });
          });
      }
    )
  );
  passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    user.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  });
  app.post("/users", async (request, response) => {
    //Hash password using bcrypt
    const firstname = request.body.firstName;
    const mail = request.body.email;
    const pswd = request.body.password;
    // if (!firstname) {
    //   request.flash("error", "please enter firstname!. It is mandatory");
    //   return response.redirect("/signup");
    // }
    // if (!mail) {
    //   request.flash("error", "please enter mail-id!. It is mandatory");
    //   return response.redirect("/signup");
    // }
    // if (!pswd) {
    //   request.flash("error", "please enter valid password!.It is mandatory");
    //   return response.redirect("/signup");
    // }
    // if (pswd.length < 5) {
    //   request.flash("error", "password must be alteast 5 characters");
    //   return response.redirect("/signup");
    // }
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    console.log(hashedPwd);
  
    //console.log("firstname", request.body.firstName);
    try {
      const user1 = await user.create({
        name: request.body.firstName,
        email: request.body.email,
        password: hashedPwd,
        role:"admin"
      });
      request.login(user1, (err) => {
        if (err) {
          console.log(err);
        }
        response.redirect("/admin-dashboard");
      });
    } catch (error) {
      console.log(error);
      return response.redirect("/signup");
    }
  });

app.get("/signup", (request, response) => {
    response.render("signup", {
      title: "Signup"
    });
  });
  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/login",
    }),
    function (request, response) {
      console.log(request.user);
      response.redirect("/admin-dashboard");
    }
  );
  app.get("/login", (request, response) => {
    response.render("login", {
      title: "login"
    });
  })










module.exports = app;