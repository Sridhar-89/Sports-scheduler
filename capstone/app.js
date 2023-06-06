const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const path = require("path");
const flash = require("connect-flash");
const { user,sport,slot } = require("./models");
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
        passReqToCallback:true
      },
      (req,username, password, done) => {
        user.findOne({ where: { email: username } })
          .then(async function (user) {
            console.log("password", user.password);
            const result = await bcrypt.compare(password, user.password);
            console.log("body",req.body.role)
            let role1=req.body.role;
            if (result) {
                if(user.role===role1){
                    session.role = role1
                }
                else{
                  console.log("role error")
                  return done(null, false, { message: "invalid role" });
                }
                console.log("session",session.role)
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


  
app.get(
  "/allsports",
  async function (request, response) {
    try {
      const allsports=await sport.getallsports();
      return response.json(allsports);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


  app.get("/admin-dashboard", connectEnsureLogin.ensureLoggedIn(),  async(request, response) => {
    console.log("user",request.user.id);
    const allsports=await sport.getall(request.user.id);
    console.log("sports",allsports)
    response.render("admin-dashboard",{username:request.user.name,userid:request.user.id,allsports:allsports});
  })

  app.get("/player-dashboard",connectEnsureLogin.ensureLoggedIn(), async(request, response) => {
    console.log("user",request.user.id);
    const allsports=await sport.getallsports();
    console.log("sports",allsports)
    response.render("player-dashboard",{username:request.user.name,userid:request.user.id,allsports:allsports});
  })

  app.get("/newSport",connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    //console.log("user",request.user.id);
    response.render("newSport",{userid:request.user.id});
  })
  app.post("/newSport",connectEnsureLogin.ensureLoggedIn(), async(request, response) => {
    console.log("user1",request.user.id);
    const sport1= await sport.create({
        name:request.body.sport,
        userId:request.user.id,
    })
    response.redirect("/admin-dashboard");
  })
  
  app.get("/sport/:sid",connectEnsureLogin.ensureLoggedIn(), async(request, response) => {
    console.log("session",session.role);
    console.log("sport",request.params.sid);
    const sports1=await sport.getdetails(request.params.sid);
    console.log("sports",sports1[0])

    const allsessions=await slot.getAll();
    const previous1=await slot.previous(request.params.sid);
    const upcoming1=await slot.upcoming(request.params.sid);
    console.log("upcoming is",upcoming1);
    console.log("previous is",previous1);


    if(session.role=="admin"){
      if (request.accepts("html")) {
        response.render("sport",{userid:request.user.id,sport:sports1[0],sessions:allsessions,upcoming:upcoming1,previous:previous1});

      }
      else{
        response.json({
          userid:request.user.id,sport:sports1[0],sessions:allsessions,upcoming:upcoming1,previous:previous1
        })
      }
    }
    else{
      if (request.accepts("html")) {
        response.render("sportsessions",{userid:request.user.id,sport:sports1[0],sessions:allsessions,upcoming:upcoming1,previous:previous1});

      }
      else{
        response.json({
          userid:request.user.id,sport:sports1[0],sessions:allsessions,upcoming:upcoming1,previous:previous1
        })
      }

    }
  })

  app.get("/sport/:sid/newSession",async(request,response)=>{
console.log("session",session.role);
console.log("user",request.user.id);
    console.log("sport",request.params.sid);
    const sports1=await sport.getdetails(request.params.sid);
    console.log("sports",sports1)
        response.render("session",{userid:request.user.id,sport:sports1[0]});
  })


  app.post("/sport/:sid/session",async(request,response) =>{
    const sports1=await sport.getdetails(request.params.sid);
    console.log("sports",sports1)
    //response.render("sport",{userid:request.user.id,sport:sports1[0]});
    const play=request.body.players;
    const array = play.split(",");
    console.log(array);
    const session2= await slot.create({
      time:request.body.dateandtime,
      venue:request.body.location,
      players:array,
      noofplayers:request.body.noofplayers,
      userId:request.user.id,
      sportId:request.params.sid,
      cancel:false
    })




    response.redirect(`/sport/${request.params.sid}`)
  
    
    
  })










module.exports = app;