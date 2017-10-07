


onmessage = function(e) {
	var colName = e.data[0];
	var tableName = e.data[1];
	
	//Send updated data to the server from the edit form.
	var req = new XMLHttpRequest();
	var address = "http://flip1.engr.oregonstate.edu:5445/getForeignKeys";
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	var payload = {};
	payload.colName = colName;
	payload.name = tableName;
	
	//If the database update query succeeds, send the matching ids back
	//to the main thread.
	req.addEventListener('load', function() {
		var response = JSON.parse(req.responseText);
		var rows = response.rows;
		
		if(response.success) {
			postMessage([true, rows, colName]);
		}
		else {
			console.log(response);
			console.log("Unexpected failure!");
			postMessage([false, null]);
		}
	});
	
	//Send request and wait for response
	req.send(JSON.stringify(payload));
	
};