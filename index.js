const admin = require("firebase-admin");
const { Storage } = require('@google-cloud/storage');
const serviceAccount = require("./serviceAccountKey.json");
require('dotenv').config();

const scheduler = require('./helper');
const getBattleData = require("./getBattleData");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

//reference to bucket
const storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: serviceAccount
  })
const bucket = storage.bucket(process.env.storageBucket);

function uploadToFirebase(){
    const now = new Date();
    const file =  bucket.file(`history${now.getMonth()+1}${now.getDate()}.json`);

    getBattleData().then((data) => {
        const jsonData = JSON.stringify(data);
    
        file.save(jsonData, {
            contentType: "application/json"
        }, function (err) {
            if (err){
                console.error("Error", err);
            } else {
                console.log("File created successfully");
            }
        })
    });
}

// uploadToFirebase();
scheduler(20, 10, uploadToFirebase);