import axios from "axios";
import { targetUsers } from "./targetUsers.js";

async function testRecentBattles(player) {
	const now = new Date();
	axios
		.get("https://api2.splinterlands.com/battle/history?player=" + player)
		.then((res) => {
			if (
				(now - new Date(res.data.battles[5].created_date)) /
					(1000 * 60 * 60) >
				12
			) {
				console.log(player + ": " + true);
				return;
			}
		})
		.catch((err) => {
			console.log(err);
		});
}

async function getPlayerRating(player) {
	axios
		.get(
			"https://game-api.splinterlands.com/players/details?name=" + player
		)
		.then((res) => {
			console.log(player + ": " + res.data.rating);
		})
		.catch((err) => {
			console.log(err);
		});
}

targetUsers.forEach((player) => {
	getPlayerRating(player);
});
