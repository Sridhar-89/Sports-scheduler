/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const path = require("path");
const flash = require("connect-flash");
const { user, sport, slot } = require("./models");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { log, count } = require("console");
//const { syncBuiltinESMExports } = require("module");
//const { Hash } = require("crypto");
const saltRounds = 10;
app.set("view engine", "ejs");
app.use(flash());
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "my-super-secret-key-217567893454",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      user
        .findOne({ where: { email: username } })
        .then(async function (user) {
          console.log("password", user.password);
          const result = await bcrypt.compare(password, user.password);
          console.log("body", req.body.role);
          let role1 = req.body.role;
          if (result) {
            if (user.role === role1) {
              session.role = role1;
            } else {
              console.log("role error");
              return done(null, false, { message: "invalid role" });
            }
            console.log("session", session.role);
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
  user
    .findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", function (request, response) {
  response.render("index.ejs", { csrfToken: request.csrfToken() });
});
app.post("/users", async (request, response) => {
  //Hash password using bcrypt
  const firstname = request.body.firstName;
  const mail = request.body.email;
  const pswd = request.body.password;
  const role1 = request.body.role;
  console.log("role", role1);
  if (!firstname) {
    request.flash("error", "please enter firstname!. It is mandatory");
    return response.redirect("/signup");
  }
  if (!mail) {
    request.flash("error", "please enter mail-id!. It is mandatory");
    return response.redirect("/signup");
  }
  if (!pswd) {
    request.flash("error", "please enter valid password!.It is mandatory");
    return response.redirect("/signup");
  }
  if (pswd.length < 5) {
    request.flash("error", "password must be alteast 5 characters");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);

  //console.log("firstname", request.body.firstName);
  try {
    const user1 = await user.create({
      name: request.body.firstName,
      email: request.body.email,
      password: hashedPwd,
      role: role1,
    });
    request.login(user1, (err) => {
      if (err) {
        console.log(err);
      }
      if (user1.role == "admin") {
        session.role = "admin";
        response.redirect("/admin-dashboard");
      } else {
        session.role = "player";
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
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    if (session.role == "admin") {
      response.redirect("/admin-dashboard");
    } else {
      response.redirect("/player-dashboard");
    }
  }
);
app.get("/login", (request, response) => {
  response.render("login", {
    title: "login",
    csrfToken: request.csrfToken(),
  });
});
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});
// app.get("/homepage", (request, response, next) => {
//   request.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     response.redirect("/");
//   });
// });

app.get("/allsports", async function (request, response) {
  try {
    const allsports = await sport.getallsports();
    return response.json(allsports);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get(
  "/admin-dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (session.role == "admin") {
      console.log("sess", session.role);
      //console.log("userrole",user.role)
      console.log("user", request.user.id);
      const allsports = await sport.getall(request.user.id);
      console.log("sports", allsports);
      response.render("admin-dashboard", {
        username: request.user.name,
        userid: request.user.id,
        allsports: allsports,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.send("invalid access");
    }
  }
);

app.get(
  "/player-dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (session.role == "player") {
      console.log("sess", session.role);
      console.log("user", request.user.id);
      const allsports = await sport.getallsports();
      console.log("sports", allsports);
      response.render("player-dashboard", {
        username: request.user.name,
        userid: request.user.id,
        allsports: allsports,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.send("invalid access");
    }
  }
);

app.get(
  "/newSport",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    //console.log("user",request.user.id);
    response.render("newSport", {
      userid: request.user.id,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/newSport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("user1", request.user.id);
    const sport1 = await sport.create({
      name: request.body.sport,
      userId: request.user.id,
    });
    console.log(sport1);
    response.redirect("/admin-dashboard");
  }
);

app.get(
  "/sport/:sid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("session", session.role);
    console.log("sport", request.params.sid);
    const sports1 = await sport.getdetails(request.params.sid);
    console.log("sports", sports1[0]);

    const allsessions = await slot.getAll();
    console.log("all", allsessions);
    const previous1 = await slot.previous(request.params.sid);
    const upcoming1 = await slot.upcoming(request.params.sid);
    console.log("upcoming is", upcoming1);
    console.log("previous is", previous1);

    if (session.role == "admin") {
      if (request.accepts("html")) {
        response.render("sport", {
          userid: request.user.id,
          userrole: session.role,

          sport: sports1[0],
          sessions: allsessions,
          upcoming: upcoming1,
          previous: previous1,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          userid: request.user.id,
          sport: sports1[0],
          sessions: allsessions,
          upcoming: upcoming1,
          previous: previous1,
        });
      }
    } else {
      if (request.accepts("html")) {
        response.render("sportsessions", {
          userid: request.user.id,
          userrole: session.role,
          sport: sports1[0],
          sessions: allsessions,
          upcoming: upcoming1,
          previous: previous1,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          userid: request.user.id,
          sport: sports1[0],
          sessions: allsessions,
          upcoming: upcoming1,
          previous: previous1,
        });
      }
    }
  }
);

app.get(
  "/sport/:sid/newSession",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("session", session.role);
    console.log("user", request.user.id);
    console.log("sport", request.params.sid);
    const sports1 = await sport.getdetails(request.params.sid);
    console.log("sports", sports1);
    response.render("session", {
      userid: request.user.id,
      sport: sports1[0],
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sport/:sid/session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sports1 = await sport.getdetails(request.params.sid);
    console.log("sports", sports1);
    //response.render("sport",{userid:request.user.id,sport:sports1[0]});
    const play = request.body.players;
    const array = play.split(",");
    console.log(array);
    const session2 = await slot.create({
      time: request.body.dateandtime,
      venue: request.body.location,
      players: array,
      noofplayers: request.body.noofplayers,
      userId: request.user.id,
      sportId: request.params.sid,
      cancel: false,
    });
    console.log(session2);
    response.redirect(`/sport/${request.params.sid}`);
  }
);

app.get(
  "/sport/:sid/session/:sessionid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("sesion", session.role);
    const sports1 = await sport.getdetails(req.params.sid);
    // console.log("sports", sports1);
    // console.log("sports1", sports1[0].name);
    const sess = await slot.getdetails(req.params.sessionid);
    // console.log("session",sess);
    // console.log("session",sess.id);
    let joined = false;
    for (let i = 0; i < sess.players.length; i++) {
      if (sess.players[i] == req.user.name) {
        joined = true;
      }
    }
    console.log("userid", req.user);
    console.log("username", req.user.name);
    res.render("viewsession", {
      data: sess,
      sport: sports1[0],
      user: req.user,
      join: joined,
      role: session.role,
      csrfToken: req.csrfToken(),
    });
  }
);

app.put(
  "/sport/:sid/session/:sessionid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const sess = await slot.getdetails(req.params.sessionid);
    const sports1 = await sport.getdetails(req.params.sid);
    let count = sess.noofplayers;
    count = count - 1;

    try {
      let arr = [];
      for (let i = 0; i < sess.players.length; i++) {
        arr.push(sess.players[i]);
      }
      arr.push(req.user.name);
      console.log("arr", arr);
      console.log("count", count);
      const updateduser = await slot.addplayers(
        req.params.sessionid,
        arr,
        count
      );
      return res.json(updateduser);
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  }
);

app.put(
  "/sport/:sid/session/:sessionid/remove",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const sess = await slot.getdetails(req.params.sessionid);
    let count = sess.noofplayers;
    count = count + 1;
    try {
      let arr = [];
      for (let i = 0; i < sess.players.length; i++) {
        arr.push(sess.players[i]);
      }
      //remove players
      let index = arr.indexOf(req.user.name);
      if (index !== -1) {
        arr.splice(index, 1);
      }

      console.log("arr", arr);
      console.log("count", count);
      const updateduser = await slot.addplayers(
        req.params.sessionid,
        arr,
        count
      );
      return res.json(updateduser);
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  }
);
app.get(
  "/sport/:sid/session/edits",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (request, response) => {
    //const sportid=request.params.sid;
    const sess = await slot.getdetails(req.params.sessionid);
    try {
      const sport1 = await sport.findByPk(sess);
      if (!sport1) {
        request.flash("error", "Session not found");
        return response.redirect("/admin-dashboard");
      }

      response.render("edit-session", {
        time: request.body.dateandtime,
        venue: request.body.location,
        players: array,
        noofplayers: request.body.noofplayers,
        userId: request.user.id,
        sportId: request.params.sid,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      request.flash("error", "Please try again");
      response.redirect("/admin-dashboard");
    }
  }
);
app.post(
  "/sport/:sid/session/edits",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    if (req.user.role == "admin") {
      const sess = req.params.session.id;
      const { name } = req.body;
      try {
        const sport1 = await sport.findByPk(sess);
        if (!sport1) {
          req.flash("error", "Sport not found.");
          return res.redirect("/admin-dashboard");
        }
        sport1.name = name;
        await sport1.save();
        req.flash("success", "Sport updated successfully!");
        res.redirect(`/session/${sess}`);
      } catch (error) {
        console.log(error);
        req.flash("error", "An error occurred. Please try again.");
        res.redirect(`/session/${sess}`);
      }
    } else {
      res.json({ error: "Unauthorise action" });
    }
  }
);

app.get(
  "/newSport/:sid/edit",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (request, response) => {
    const sportid = request.params.sid;
    try {
      const sport1 = await sport.findByPk(sportid);
      if (!sport1) {
        request.flash("error", "Sport not found");
        return response.redirect("/admin-dashboard");
      }

      response.render("edit-sport", {
        title: "Edit text",
        sid: sport1.id,
        sport: sport1,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      request.flash("error", "Please try again");
      response.redirect("/admin-dashboard");
    }
  }
);
app.post(
  "/newSport/:sid/edit",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    if (req.user.role == "admin") {
      const sportId = req.params.sid;
      const { name } = req.body;
      try {
        const sport1 = await sport.findByPk(sportId);
        if (!sport1) {
          req.flash("error", "Sport not found.");
          return res.redirect("/sport");
        }
        sport1.name = name;
        await sport1.save();
        req.flash("success", "Sport updated successfully!");
        res.redirect(`/sport/${sportId}`);
      } catch (error) {
        console.log(error);
        req.flash("error", "An error occurred. Please try again.");
        res.redirect(`/sport/${sportId}`);
      }
    } else {
      res.json({ error: "Unauthorise action" });
    }
  }
);
app.get(
  "/newSport/:id/delete",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    if (req.user.role == "admin") {
      try {
        await slot.DeleteSport1(req.params.id);
        await sport.DeleteSport(req.params.id);
        res.redirect("/admin-dashboard");
      } catch (error) {
        console.log(error);
      }
    } else {
      res.json({ error: "Unauthorise action" });
    }
  }
);
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

module.exports = app;
