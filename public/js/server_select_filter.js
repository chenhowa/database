

onmessage = function(e) {
	//Step 1: Make asynchronous POST request to server for the data.
	var id = e.data[0];
	var tableNames = e.data[1];
	var tableJoinKeys = e.data[2];
	var relTableName = e.data[3];
	var relJoinKeys = e.data[4];
	
	
	var req = new XMLHttpRequest();
	var address = "http://flip1.engr.oregonstate.edu:5445/getRelInnerJoins";
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	var payload = {};	//payload stores table name to make SELECT request
	payload.id = id;
	payload.tableNames = tableNames;
	payload.tableJoinKeys = tableJoinKeys;
	payload.relTableName = relTableName;
	payload.relJoinKeys = relJoinKeys;
	
	//Step 2: Add event listener to use data return server data to main thread when
	//data arrives.
	req.addEventListener('load', function(event) {
		event.preventDefault();
		
		//Get array of data from database.
		var response = JSON.parse(req.responseText).table;
		
		//Fix the dates if they're off before sending dates back to main thread.
		var reDate = /\d{4}-\d{1,2}-\d{1,2}T\d{1,2}/;
		response.forEach( function(rowObj) {
			for(var prop in rowObj) {
				if (reDate.test(rowObj[prop]) ) {
					rowObj[prop] = rowObj[prop].slice(0,10);
				}
			};
		});
		
		postMessage(response);
		
	});
	
	req.send(JSON.stringify(payload));
	
	
};