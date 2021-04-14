const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require('dotenv').config()
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntps2.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./burj-al-arab-32668-firebase-adminsdk-woovv-0bdd1085f2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });
  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          }
          else{
            req.status(401).send('Unauthorized access!!')
          }
        })
        .catch((error) => {
            req.status(401).send('Unauthorized access!!')
        });
    }
    else{
        req.status(401).send('Unauthorized access!!')
    }
  });
  app.delete('/delete/:id', (req, res) => {
    bookings.deleteOne({_id: ObjectId(req.params.id)})
      .then(result => {
          res.send(result.deleteCount > 0)
      })
  })
});

app.listen(port);
