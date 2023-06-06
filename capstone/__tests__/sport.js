const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;
const login = async (agent, username, password,role1) => {
    let res = await agent.get("/login");
    res = await agent.post("/session").send({
      email: username,
      password: password,
      role:role1
    });
  };
describe("Application", function () {
    beforeAll(async () => {
      await db.sequelize.sync({ force: true });
      server = app.listen(3000, () => {});
      agent = request.agent(server);
    });
  
    afterAll(async () => {
      try {
        await db.sequelize.close();
        await server.close();
      } catch (error) {
        console.log(error);
      }
    });
    test("admin Sign up", async () => {
        let res = await agent.get("/signup");
        res = await agent.post("/users").send({
          firstName: "admin",
          email: "admin@test.com",
          password: "123456",
          role:"admin"
        });
        expect(res.statusCode).toBe(302);
      });
      test("admin Sign out", async () => {
        let res = await agent.get("/admin-dashboard");
        expect(res.statusCode).toBe(200);
        res = await agent.get("/signout");
        expect(res.statusCode).toBe(302);
        res = await agent.get("/admin-dashboard");
        expect(res.statusCode).toBe(302);
      });
      test("player Sign up", async () => {
        let res = await agent.get("/signup");
        res = await agent.post("/users").send({
            firstName: "player",
          email: "player@test.com",
          password: "123456789",
          role:"player"
        });
        expect(res.statusCode).toBe(302);
      });
      test("player Sign out", async () => {
        let res = await agent.get("/player-dashboard");
        expect(res.statusCode).toBe(200);
        res = await agent.get("/signout");
        expect(res.statusCode).toBe(302);
        res = await agent.get("/player-dashboard");
        expect(res.statusCode).toBe(302);
      });

      test("test for creating sport by admin",async()=>{
        const agent = request.agent(server);
       await login(agent, "admin@test.com", "123456","admin");
       let res = await agent.get("/admin-dashboard");
       res = await agent.get("/newSport");
       //there is only one admin in database so id=1
       res = await agent.post("/newSport").send({
        sport:"cricket"
        });
        console.log("sp5",res.text)

        const sportslist = await agent
      .get("/allsports")
      .set("Accept", "application/json");
    const sportlist1 = JSON.parse(sportslist.text);
    //console.log("sport",sportlist1)
    
    // console.log("sport",sportlist1[0].name)
    // console.log("sport",sportlist1.length)
    expect(sportlist1.length).toBe(1);
    
      })


      test("test for creating session by admin",async()=>{
        const agent = request.agent(server);
       await login(agent, "admin@test.com", "123456","admin");
       let res = await agent.get("/sportsessions");
       const sportslist = await agent
       .get("/allsports")
       .set("Accept", "application/json");
     const sportlist1 = JSON.parse(sportslist.text);
     console.log("sport",sportlist1)
     
     // console.log("sport",sportlist1[0].name)
     console.log("sport",sportlist1.length)
     const latest = sportlist1[sportlist1.length-1]
     console.log("latest",latest)
       res = await agent.post(`/sport/${latest.id}/session`).send({
            time: new Date().toISOString(),
            venue: "HYD",
            players: "me,you,he",
            noofplayers:12
        });


        const sessionlist = await agent
      .get(`/sport/${latest.id}`)
      .set("Accept", "application/json");
    const sessionlist1 = JSON.parse(sessionlist.text);
    // console.log("sport5",sessionlist1)
    // console.log("sport5",sessionlist1.sessions)
    expect(sessionlist1.sessions.length).toBe(1);
      
      })

      
      test("test for creating session by player",async()=>{
        const agent = request.agent(server);
       await login(agent, "player@test.com", "123456789","player");
       let res = await agent.get("/sportsessions");
       const sportslist = await agent
       .get("/allsports")
       .set("Accept", "application/json");
     const sportlist1 = JSON.parse(sportslist.text);
     //console.log("sport",sportlist1)
     
     // console.log("sport",sportlist1[0].name)
     console.log("sport",sportlist1.length)
     const latest = sportlist1[sportlist1.length-1]
     //console.log("latest",latest)
       res = await agent.post(`/sport/${latest.id}/session`).send({
            time: new Date().toISOString(),
            venue: "HYD",
            players: "me,you,he",
            noofplayers:12
        });


        const sessionlist = await agent
      .get(`/sport/${latest.id}`)
      .set("Accept", "application/json");
    const sessionlist1 = JSON.parse(sessionlist.text);
    // console.log("sport5",sessionlist1)
    // console.log("sport5",sessionlist1.sessions)
    expect(sessionlist1.sessions.length).toBe(2);
      
      })



})