


onmessage = function(e) {
	console.log("STARTNG UPDATE");
	
	var colNames = e.data[0];
	var values = e.data[1];
	var name = e.data[2];
	
	//For every value, if it is an empty string, turn it to a null.
	for(var i = 0; i < values.length; i++) {
		if(values[i] == "") {
			values[i] = null;
		}
	}
	
	//Send updated data to the server from the edit form.
	var req = new XMLHttpRequest();
	var address = "http://flip1.engr.oregonstate.edu:5445/updateEntity";
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	var payload = {};
	payload.colNames = colNames;
	payload.values = values;
	payload.name = name;
	
	//If the database update query succeeds, use the
	//database's response data to update the
	//appropariate rows in the table.
	req.addEventListener('load', function() {
		
		var response = JSON.parse(req.responseText);
		console.log(response);
		var row = response.row;
		
		//Use regEx to fix any date values from the database.
		var reDate = /\d{4}-\d{1,2}-\d{1,2}T\d{1,2}/;
		for(var prop in row) {
			if (reDate.test(row[prop]) ) {
				row[prop] = row[prop].slice(0,10);
			}
		}
		
		console.log(row);
		
		
		if(response.success) {
			console.log("success!");
			postMessage(row);
		}
		else {
			console.log(response);
			console.log("Unexpected failure!");
		}
	});
	
	//Send request and wait for response
	req.send(JSON.stringify(payload));

}