const Dropbox = require("dropbox").Dropbox;
require('dotenv').config();

const scheduler = require('./helper');
const getBattleData = require("./getBattleData");

function uploadToDropbox(){
    const dataArray = getBattleData();
    const jsonString = JSON.stringify(dataArray);
    const accessToken = process.env.ACCESS_TOKEN;

    const dbx = new Dropbox({accessToken: accessToken})

    const now = new Date();

    dbx.filesUpload({
        path: `/history${now.getMonth()+1}${now.getDate()}.json`,
        contents: Buffer.from(jsonString),
        mode: {'.tag': 'overwrite'},
        autorename: true,
        mute: false,
    }).then((response) => {
        console.log('File uploaded', response);
    }).catch((error) => {
        console.error('Error uploading file:', error);
    });
}

uploadToDropbox();
// scheduler(20, 10, uploadToDropbox());