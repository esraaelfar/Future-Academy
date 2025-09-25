function playSound(){
	let mySound = new Audio('./retro_load.mp3');
	mySound.play();
}


function paginationUpdate() {
	tablePgNo = parseInt(document.getElementById("page-no").innerHTML);
	paginA = document
		.getElementsByClassName("pagination")[0]
		.querySelectorAll("a");

	paginA[0].setAttribute(//update forward button
		"href",
		(tablePgNo == 1 ? "scores_g1.html" : ("scores_g" + (tablePgNo-1) + ".html"))
	); 
	if (tablePgNo == 2) {
		paginA[0].setAttribute(
			"href",
			"scores_g1.html"
		);//first table has diff name : index.html
	}

	paginA[paginA.length - 1].setAttribute(//update backward button
		"href",
		"scores_g" +
			((tablePgNo >= paginA.length - 2 ? tablePgNo - 1 : tablePgNo) + 1) +
			".html"
	);

	for (var i = 1; i < paginA.length - 1; i++) {
		//skip first and last element (update )
		paginA[i].removeAttribute("class");
		if (parseInt(paginA[i].innerHTML) == tablePgNo) {
			paginA[i].setAttribute("class", "active");
		}
		if (i == 1) {
			paginA[i].setAttribute("href", "scores_g1.html");
		} else {
			paginA[i].setAttribute("href", "./scores_g" + i + ".html");
		}
	}
}
function scoreTableSort() {
	let scoresMap = new Map(); //key is  user name and value is Scores
	let oldScoresTable = Array.from(document.querySelectorAll("tr"));
	oldScoresTable.forEach((elm) => {
		if (
			elm === 0 ||
			elm.tagName.toLowerCase() != "tr" ||
			elm.getElementsByTagName("th").length > 0
		) {
			return; /*return; in forEach() is like continue; in normal loop*/
		}

		let tds = elm.querySelectorAll("td"); //placement,name,score
		// zeroth table data is the placement (skip)
		scoresMap.set(tds[1].innerHTML, parseInt(tds[2].innerHTML, 10));
	});

	scoresMap = new Map(
		[...scoresMap.entries()].sort((pair1, pair2) => pair2[1] - pair1[1])
	);

	return scoresMap;
}

function scoreTableUpdate() {
	// 	<table>
	// 	<caption>SCORES</caption>
	// <tr>
	//  <th>Pos</th>
	//  <th>Name</th>
	//  <th>Score</th>
	//  </tr>
	// <tr class="top">
	//  <td>🌟1</td>
	//  <td>Bill</td>
	//  <td>123</td>
	// </tr>
	// <tr>
	//  <td>2</td>
	//  <td>Garry</td>
	//  <td>34</td>
	// </tr>
	// .
	// .
	// .
	// </table>

	_scoresMap = scoreTableSort();

	document.getElementsByTagName("table")[0].remove();
	let bodyElm = document.getElementsByClassName("table-div")[0];
	let updatedTable = document.createElement("table");

	let tableCaption = document.createElement("caption"); //create table title
	let tableTitleDiv = document.createElement("div");
	tableTitleDiv.setAttribute("class", "table-title");
	let tableTitle = document.createElement("h1");
	tableTitle.innerHTML = `S C O R E S 🚀`;
	tableTitleDiv.appendChild(tableTitle);
	tableCaption.appendChild(tableTitleDiv);
	updatedTable.appendChild(tableCaption);

	let hrw = document.createElement("tr"); //create table header
	let posHead = document.createElement("th");
	posHead.innerHTML = "Pos.";
	let nameHead = document.createElement("th");
	nameHead.innerHTML = "Name";
	let scoreHead = document.createElement("th");
	scoreHead.innerHTML = "Score";

	hrw.appendChild(posHead); //fill the table header
	hrw.appendChild(nameHead);
	hrw.appendChild(scoreHead);
	updatedTable.appendChild(hrw);

	let i = 1;
	_scoresMap.forEach((score, name) => {
		//fill table data
		let drw = document.createElement("tr");
		let data = document.createElement("td");
		let data2 = document.createElement("td");
		let data3 = document.createElement("td");

		if (i == 1) {
			//top score
			drw.setAttribute("class", "top");
			data.innerHTML = "🌟" + i; //TODO: paste the litera utf-8 code instead
		} else if (i == 2) {
			data.innerHTML = "🥈"; //TODO: paste the litera utf-8 code instead
		} else if (i == 3) {
			data.innerHTML = "🥉"; //TODO: paste the litera utf-8 code instead
		} else {
			data.innerHTML = i;
		}
		drw.appendChild(data);

		data2.innerHTML = name;
		drw.appendChild(data2);

		data3.innerHTML = score;
		drw.appendChild(data3);

		updatedTable.appendChild(drw);
		i++;
	});

	bodyElm.appendChild(updatedTable);
}

window.addEventListener("load", paginationUpdate);
window.addEventListener("load", scoreTableUpdate);
window.addEventListener("load", playSound);
