const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const path = require("path");
const flash = require("connect-flash");
const { user,sport } = require("./models");
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
const { syncBuiltinESMExports } = require("module");
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
                if(user.role=="admin"){
                    session.role = 'admin'
                }
                else{
                    session.role = 'player'
                }
                
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
    const role1= request.body.role;
    //console.log("role",role1);
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
        role:role1,
      });
      request.login(user1, (err) => {
        if (err) {
          console.log(err);
        }
        if(user1.role=="admin"){
            response.redirect("/admin-dashboard");
        }
        else{
            response.redirect("/player-dashboard");
        }
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
      if(session.role=="admin"){
        response.redirect("/admin-dashboard");
      }
      else{
        response.redirect("/player-dashboard");
      }
    }
  );
  app.get("/login", (request, response) => {
    response.render("login", {
      title: "login"
    });
  })
  app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });
  
  app.get("/admin-dashboard", async(request, response) => {
    console.log("user",request.user.id);
    const allsports=await sport.getall(request.user.id);
    console.log("sports",allsports)
    response.render("admin-dashboard",{username:request.user.name,userid:request.user.id,allsports:allsports});
  })

  app.get("/player-dashboard", async(request, response) => {
    console.log("user",request.user.id);
    const allsports=await sport.getallsports();
    console.log("sports",allsports)
    response.render("player-dashboard",{username:request.user.name,userid:request.user.id,allsports:allsports});
  })

  app.get("/newSport", (request, response) => {
    //console.log("user",request.user.id);
    response.render("newSport",{userid:request.user.id});
  })
  app.post("/newSport/:uid", async(request, response) => {
    //console.log("user",request.user.id);
    const sport1= await sport.create({
        name:request.body.sport,
        userId:request.params.uid,
    })
    response.redirect("/admin-dashboard");
  })
  
  app.get("/sport/:sid", async(request, response) => {
    console.log("session",session.role);
    console.log("sport",request.params.sid);
    const sports1=await sport.getdetails(request.params.sid);
    console.log("sports",sports1)
    if(session.role=="admin"){
        response.render("sport",{userid:request.user.id,sport:sports1});
    }
    else{
        response.render("sportsessions",{userid:request.user.id,sport:sports1});

    }
  })










module.exports = app;