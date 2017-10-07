

onmessage = function(e) {
	
	//Make remove request to server, passing server the row's hidden ID.
	var address = "http://flip1.engr.oregonstate.edu:5445/removeRel";
	var req = new XMLHttpRequest();
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	
	//send row id and table name to the server.
	var payload = {};
	payload.rowId = e.data[0];
	payload.name = e.data[1];
	
	//If server response comes back with a result of TRUE,
	//you can remove the row from the table. Otherwise, do nothing.
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			//Get response of the server.
			var response = JSON.parse(req.responseText);
			console.log(response);
			
			//If database removal was successful, then delete the
			//specified row.
			if(response.success == true)
			{
				postMessage(true);
			}
			else {
				console.log("oops");
				postMessage(false);
			}
		}
		else {
			console.log("ERROR IN REMOVE ATTEMPT");
		}	
	});
	
	//Send request and wait for response
	req.send(JSON.stringify(payload));
};