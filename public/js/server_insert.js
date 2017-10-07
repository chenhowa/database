
onmessage = function(e) {
	console.log("STARTNG INSERT");
	
	//Step 1: Send a POST request to the server with the
	//data.
	var req = new XMLHttpRequest();
	var address = "http://flip1.engr.oregonstate.edu:5445/addEntity";
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	var payload = {};
	
	var colNames = e.data[0];
	var values = e.data[1];
	var name = e.data[2];
	
	//for every value in the row to be inserted, if the value is empty string, turn it to null
	for(var i = 0; i < values.length; i++) {
		if(values[i] == "") {
			values[i] = null;
		}
	}
	
	payload.colNames = colNames;
	payload.values = values;
	payload.name = name;
	
	//Step 2: If the insert request succeeded,
	//send true and data back to main thread.
	//Else send false and null back to the main thread.
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			var response = JSON.parse(req.responseText);
			console.log(response);
			var reDate = /\d{4}-\d{1,2}-\d{1,2}T\d{1,2}/;
			//If response was successful, use the response data from the database
			//to make a new row for the table.
			if(response.success == true) {
				for(var prop in response.row) {
					if (reDate.test(response.row[prop]) ) {
						response.row[prop] = response.row[prop].slice(0,10);
					}
				}
				
				postMessage([true, response.row]);
			}
			else {
				postMessage([false, null]);
			}
		}
		else {
			console.log("Error: " + req.statusText);
		}
	});
	
	//Send request and wait for response
	req.send(JSON.stringify(payload));
};