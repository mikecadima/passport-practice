const express = require('express');
const app = express();

const eS = require("express-session")
const expressSession = eS({ secret:'djfdfjdkjf',resave:false,saveUninitialized:false});

const passport = require('passport');
const Strategy = require('passport-local').Strategy

const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(express.urlencoded({extended:true}))
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

//from elephant sql
const pgp = require("pg-promise")();
const db = pgp('postgres://ntazjgoh:Zh2wdZz2k3odjKIe-EGGzOltDFEa1q8J@ruby.db.elephantsql.com:5432/ntazjgoh')

//empty array
// const db = [];

//your own
// const db = [{username: 'mike', password:"123456", id:1}]

//with sql
passport.use(new Strategy((username, password, callback)=>{
    // let user = db.find(u=>u.username===username);
    // if(!user) return callback(null,false);

    //sql
    let user = db.one(`SELECT * FROM students WHERE username='${username}'`)
    .then(u=>{
        bcrypt.compare(password, user.password)
        .then(result=.)
        if(!result) return callback(null,false);
        return callback(null,user);
    })

    // return callback(null,user);
}))
//without sql
// passport.use(new Strategy((username, password, callback)=>{
//     let user = db.find(u=>u.username===username);
//     if(!user) return callback(null,false);

//     bcrypt.compare(password, user.password)
//     .then(result=>{
//         if(!result) return callback(null,false);
//         return callback(null,user);
//     })

//     // return callback(null,user);
// }))

passport.serializeUser((user,callback)=>callback(null,user.id));

passport.deserializeUser((id,callback)=>{
    let user = db.find(u=>String(u.id)===String(id));
    if(!user) return callback({"not-found":"NO user with that id is found."});
    return callback(null,user);
});

const port = 4578

const checkIsLoggedIn = (req,res,next)=>{
    if(req.isAuthenticated()) return next();
    return res.redirect("/login")
}

const checkIfExist = (req,res,next)=>{
    let user = db.find(u=>u.username===req.body.username);
    if(user) return res.send("user already exists")
    next();
}
//with sql
const createUser = (req,res,next)=>{
    bcrypt.hash(req.body.password, saltRounds)
    .then(hash=>{
        //let id = db.length > 0 ? db.sort((a,b)=>a.id-b.id)[db.length-1].id+1 : 1;
        db.none(`INSERT INTO students (username, password, name) VALUES ($1, $2, $3)`, [req.body.username,hash,req.body.name])
        .then(()=>next())
        .catch(err=>console.log(err))
    })
    .catch(err=>console.log(err))
}
//witout sql
// const createUser = (req,res,next)=>{
//     bcrypt.hash(req.body.password, saltRounds)
//     .then(hash=>{
//         let id = db.length > 0 ? db.sort((a,b)=>a.id-b.id)[db.length-1].id+1 : 1;
//         db.push({
//             id:id,
//             username:req.body.username,
//             password:hash,
//             name:req.body.name
//     });
//     next();
//     })
// }

// const createUser = async (req,res,next)=>{
//     let hash = await bcrypt.hash(req.body.password, saltRounds)
    
//     let id = db.length > 0 ? db.sort((a,b)=>a.id-b.id)[db.length-1].id+1 : 1;
//     db.push({
//         id:db.sort((a,b)=>a.id-b.id)[db.length-1].id+1,
//         username:req.body.username,
//         password:req.body.password,
//         name:req.body.name
//     })
//     console.log(db.sort((a,b)=>a.id-b.id)[db.length-1].id+1)
//     next();
// }

app.get("/", checkIsLoggedIn,(req,res)=>res.send(`you are Authenticated: ${req.user.username}`))

app.get("/login", (req,res)=>res.sendFile(__dirname + '/login.html'))

app.post("/login", passport.authenticate('local'), (req,res)=>{
    res.redirect("/")
})

app.get("/register", (req,res)=>res.sendFile(__dirname + '/register.html'))

app.post("/register", checkIfExist, createUser,(req,res,next)=>{
    res.redirect("/login")
})

app.get("/logout", ()=>{
    req.logout();
    req.redirect("/");
})

app.listen(port,()=> console.log(`http://localhost${port}`))