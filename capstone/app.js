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
app.use(express.static(path.join(__dirname, "public")));

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
    //console.log("upcoming is", upcoming1);
    //console.log("previous is", previous1);

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
    let condition = false;
    if (sess.userId == req.user.id) {
      condition = true;
      console.log("session is of admion", sess.userId);
      console.log("userid is", req.user.id);
    }
    console.log("userid", req.user);
    console.log("username", req.user.name);
    res.render("viewsession", {
      data: sess,
      sport: sports1[0],
      user: req.user,
      join: joined,
      role: session.role,
      st: condition,
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
  "/session/:sid/edits",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (request, response) => {
    console.log("true1");
    //const sportid=request.params.sid;
    const sess = request.params.sid;
    const time = await slot.getdetails(sess);
    console.log("session of session", sess);
    console.log("time is ", time);
    console.log("time is ", time.id);
    console.log("slot details arer", time.venue);
    // console.log("slot details arer",time[slot]);

    //console.log("sport is",)

    // if (!sport1) {
    //   //request.flash("error", "Session not found");
    //   //return response.redirect("/admin-dashboard");
    // }

    response.render("edit-session", {
      time: time.time,
      venue: time.venue,
      players: time.players,
      noofplayers: time.noofplayers,
      userId: request.user.id,
      sid: request.params.sid,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/session/:sid/edits",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    console.log("session is");
    if (req.user.role == "admin") {
      console.log("id3", req.params.sid);
      sportSession = await slot.getdetails(req.params.sid);

      console.log("session id is", sportSession);
      const idd = sportSession.sportId;

      // // const { time} = req.body;
      // const updatedsession = await slot.updatesession({
      //  sid:req.body.sid,
      //  time:req.body.time,
      //  venue:req.body.venue,
      //  players:req.body.players,
      //  noofplayers:req.body.noofplayers
      // }
      // );
      const array = req.body.players.split(",");
      sportSession.time = req.body.time;
      sportSession.venue = req.body.venue;

      // const array = play.split(",");
      sportSession.players = array;
      sportSession.noofplayers = req.body.noofplayers;

      await sportSession.save();

      // console.log("uodate",updatedsession)
      // return res.json(updatedsession);
      //sportSession.players=req.body.players,
      //sportSession.nofplayers=req.body.noofplayers,
      req.flash("success", "Sport updated successfully!");
      res.redirect(`/sport/${idd}`);
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
  "/report",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //console.log("user",request.user.id);
    const reportdetails = await slot.getAll();
    const sportdetails = await sport.getall();
    console.log("reports details are :", reportdetails);
    console.log("report name is", reportdetails[0].venue);
    console.log("sports details are:", sportdetails);
    console.log("sport name is", sportdetails[0].name);
    response.render("report", {
      sport: sportdetails,
      slot: reportdetails,
      csrfToken: request.csrfToken(),
    });
  }
);
app.get(
  "/session/:sid/:player",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    console.log("call");

    const sportSession = await slot.getdetails(req.params.sid);
    if (sportSession.userId == req.user.id) {
      //console.log("called")
      //let sportSession =await slot.getDetailsBySportId(req.params.sid);
      // console.log("session id is",sportSession.id);
      //const array = play.split(",");
      try {
        let arr = [];
        for (let i = 0; i < sportSession.players.length; i++) {
          arr.push(sportSession.players[i]);
        }
        console.log("array is ", arr);

        let index = arr.indexOf(req.params.player);
        console.log("players id is", req.params.player);
        console.log("players are", index);
        if (index !== -1) {
          arr.splice(index, 1);
        }
        console.log("after arr", arr);
        await slot.removeplayers(
          sportSession.id,
          arr,
          sportSession.noofplayers + 1
        );
        res.redirect(
          `/sport/${sportSession.sportId}/session/${sportSession.id}`
        );
      } catch (error) {
        console.log(error);
        return res.status(422).json(error);
      }
    }
  }
);
app.get(
  "/newSport/:id/delete",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    if (req.user.role == "admin") {
      try {
        await slot.DeleteSport2(req.params.id);
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

app.get(
  "/session/:sid/delete1/delete",
  connectEnsureLogin.ensureLoggedIn("/login"),
  async (req, res) => {
    console.log("deleted id is", req.params.sid);
    if (req.user.role == "admin") {
      try {
        const deleted = await slot.DeleteSport1(req.params.sid);
        console.log("deleted session is", deleted);

        // await sport.DeleteSport(req.params.id);
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
