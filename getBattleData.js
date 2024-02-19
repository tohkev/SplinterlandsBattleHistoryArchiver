const fetch = require("node-fetch");
const fs = require("fs");
const targetUsers = require("./targetUsers.js");
const schedule = require("node-schedule");
const ecc = require('eosjs-ecc') // https://www.npmjs.com/package/eosjs-ecc
const axios = require('axios'); // npm i axios

async function getBattleHistory(player = "", bearerToken) {
	const battleHistory = await fetch(
		"https://api2.splinterlands.com/battle/history?player=" + player, {
		method: 'get',
		headers: new Headers({
			'Authorization': 'Bearer ' + bearerToken, 
		})}
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
		.catch((error) => {
			console.error("Error with fetching data", error);
		});
	
	if (battleHistory && battleHistory.battles){
		return battleHistory.battles.filter((battle) => isRecentBattle(battle));
	}
	else{
		return [];
	}
}

async function loginUser(username, posting_key){
	let params = {
		username: username,
		posting_key: posting_key,
		stake_frequency: 5,   // Minutes
		airdrop_frequency: 3  // Hours
	  }

	  params.ts = new Date().getTime();
	  params.login_signature = ecc.sign(`${params.username}${params.ts}`, params.posting_key);
	  let url = `https://api2.splinterlands.com/players/login`
		  + `?name=${params.username}`
		  + `&ts=${params.ts}`
		  + `&sig=${params.login_signature}`;
	  let response = await axios.get(url);
	  return response.data.jwt_token;
}

function isRecentBattle(battle) {
	const now = new Date();
	const compare = new Date(battle.created_date);
	return Math.abs(now - compare) / (1000 * 60 * 60) <= 24;
}

function getBattleInfo(battle) {
	return {
		created_date: battle.created_date ? battle.created_date : "",
		match_type: battle.match_type ? battle.match_type : "",
		mana_cap: battle.mana_cap ? battle.mana_cap : "",
		ruleset: battle.ruleset ? battle.ruleset : "",
		inactive: battle.inactive ? battle.inactive : "",
	};
}

function getMonsterInfo(team) {
	const monster1 = team.monsters[0];
	const monster2 = team.monsters[1];
	const monster3 = team.monsters[2];
	const monster4 = team.monsters[3];
	const monster5 = team.monsters[4];
	const monster6 = team.monsters[5];

	return {
		summoner_id: team.summoner.card_detail_id,
		summoner_level: team.summoner.level,
		monster_1: {
			id: monster1 ? monster1.card_detail_id : "",
			level: monster1 ? monster1.level : "",
			abilities: monster1 ? monster1.abilities : "",
		},
		monster_2: {
			id: monster2 ? monster2.card_detail_id : "",
			level: monster2 ? monster2.level : "",
			abilities: monster2 ? monster2.abilities : "",
		},
		monster_3: {
			id: monster3 ? monster3.card_detail_id : "",
			level: monster3 ? monster3.level : "",
			abilities: monster3 ? monster3.abilities : "",
		},
		monster_4: {
			id: monster4 ? monster4.card_detail_id : "",
			level: monster4 ? monster4.level : "",
			abilities: monster4 ? monster4.abilities : "",
		},
		monster_5: {
			id: monster5 ? monster5.card_detail_id : "",
			level: monster5 ? monster5.level : "",
			abilities: monster5 ? monster5.abilities : "",
		},
		monster_6: {
			id: monster6 ? monster6.card_detail_id : "",
			level: monster6 ? monster6.level : "",
			abilities: monster6 ? monster6.abilities : "",
		},
	};
}

async function runGetBattleData(num) {
	let battlesList = [];
	username = ''
	posting_key = ''

	let jwt_token = '';
	await loginUser(username, posting_key).then(response => {
		jwt_token = response
	});

	const battles = targetUsers.map((user) => {
		return getBattleHistory(user, jwt_token)
			.then((battles) =>
				battles.map((battle) => {
					const details = JSON.parse(battle.details);
					if (details.type != "Surrender") {
						if (battle.winner) {
							const battleInfo = getBattleInfo(battle);
							const monsterDetails1 = getMonsterInfo(
								details.team1
							);
							const monsterDetails2 = getMonsterInfo(
								details.team2
							);
							if (battle.winner == battle.player_1) {
								return [
									{
										...battleInfo,
										...monsterDetails1,
										battle_queue_id:
											battle.battle_queue_id_1,
										winner: true,
									},
									{
										...battleInfo,
										...monsterDetails2,
										battle_queue_id:
											battle.battle_queue_id_2,
										winner: false,
									},
								];
							} else if (battle.winner == battle.player_2) {
								return [
									{
										...battleInfo,
										...monsterDetails2,
										battle_queue_id:
											battle.battle_queue_id_2,
										winner: true,
									},
									{
										...battleInfo,
										...monsterDetails1,
										battle_queue_id:
											battle.battle_queue_id_1,
										winner: false,
									},
								];
							}
						}
					}
				})
			)
			.then((data) => (battlesList = [...battlesList, ...data]));
	});

	Promise.all(battles).then(() => {
		const cleanBattleList = battlesList.filter((x) => x != undefined);
		fs.writeFile(
			`data/history${num}.json`,
			JSON.stringify(cleanBattleList),
			function (err) {
				if (err) {
					console.log(err);
				}
			}
		);
	});
}

const rule = new schedule.RecurrenceRule();
rule.hour = 20;
rule.minute = 15;

let month = new Date().getMonth() + 1;
let day = new Date().getDate();

runGetBattleData(`0${month}${day}`);

const job = schedule.scheduleJob(rule, function () {
	runGetBattleData(`${0 + month}${day}`);
});
