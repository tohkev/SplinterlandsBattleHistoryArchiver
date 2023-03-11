const fetch = require("node-fetch");
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

	return hoursSinceLastBattle ? hoursSinceLastBattle < 24 : false; 
}

async function getAllInactiveUsers(){
    let inactiveUsers = [];

    targetUsers.forEach(async user => {
        let isActive = await isActiveUser(user);
        if (!isActive){
            console.log(user);
            inactiveUsers.push(user);
        }
    })

    return inactiveUsers
}

getAllInactiveUsers().then(result => console.log(result));