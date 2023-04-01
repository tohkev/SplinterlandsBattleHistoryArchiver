const fs = require('fs');

const fetch = require("node-fetch");
const schedule = require("node-schedule");
const targetUsers = require("./targetUsers.js")

async function isActiveUser(player = "") {
	const hoursSinceLastBattle = await fetch(
		"https://api2.splinterlands.com/battle/history?player=" + player
	)
		.then((response) => {
			if (!response.ok) {
				console.log(response);
				throw new Error("Error in Network Response");
			}
			return response;
		})
		.then((battleHistory) => {
			return battleHistory.json();
		})
        .then((battleHistoryJson) => {

            if (battleHistoryJson.battles[0]){
                let lastBattleTime = new Date(battleHistoryJson.battles[0].created_date);
                let now = new Date();
    
                const timeDifferenceMS = now.getTime() - lastBattleTime.getTime()
                return timeDifferenceMS / (1000 * 60 * 60);
            }
            else {
                return false;
            }
        })
		.catch((error) => {
			console.error("Error with fetching data", error);
		});

	return {name: player, lastBattle: hoursSinceLastBattle, isActive: hoursSinceLastBattle ? hoursSinceLastBattle <= 24 : false};
}

async function getAllInactiveUsers(){
    let inactiveUsers = [];

    targetUsers.forEach(async user => {
        let currentUser = await isActiveUser(user);
        if (!currentUser.isActive){
            console.log(`${currentUser.name}: last battle ${currentUser.lastBattle} hours ago`);
            inactiveUsers.push(user);
        }
    })

    return inactiveUsers
}

async function combineJSONFiles(start, end){
    let startJson = fs.readFileSync(`./data/history${start}.json`);
    let resultJson = JSON.parse(startJson);

    for (let i = start+1; i <= end; i++){
        const fileData = fs.readFileSync(`./data/history${i}.json`);
        const parsedData = JSON.parse(fileData);

        parsedData.forEach(battle => resultJson.push(battle));
    }

    // Convert the new object into a JSON string
    const jsonString = JSON.stringify(resultJson);

    // Write the JSON string to a new file
    fs.writeFileSync('combined.json', jsonString);
}

function scheduler(hour, minute, callbackFunction){
    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute;

    const job = schedule.scheduleJob(rule, function () {
        callbackFunction();
    });
}

module.exports = scheduler;

// getAllInactiveUsers();