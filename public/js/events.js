/************************************************************************************
Program Name:	Your Name Database Display Application
Author:			Howard Chen
Description:	Script that sets up event handlers and AJAX requests from the
				client page.
Last Modified:	5-21-2017

NOTE: 	This code has repeated elements and could be refactored into some global functions.
		But this was my first time writing such an application, so I accept
		that I was inefficient. At least it seems to work!
***********************************************************************************/

/*
NEXT TIME: 
//Definitely a lot of bad practice in here, but I'm running short on time.
//Definitely vulnerable to SQL injection attacks, but oh well.


Fix functions like bindEdit and bindAdd to take into account whether a column is tcol, tcol+ date, tcol + fk, etc.

Also create visual elements for filtering by rows, replacing IDs with identifiers, etc.
ADD FUNCTIONALITY TO ADD BUTTONS FOR RELATIONS.

for any foreign key column, make the input a SELECT with only the possible values from the table, sorted ascending.
	make it a Primary_Key/Attribute pair for ease of viewing. Thus, there can probably be a
	single add function for all this!

//Also should probably have a cancel button for each add request (and edit request).
//and disable editing functionality unless cancel is clicked.

//ADDITIONAL CHANGES TO DATABASE TABLE DEFINITION!
Date's attributes should be a unique key.
First/Last Age should be a unique key.
Name/Country should be a unique key.
Name/squarefeet should be a unique key.
Name should be a unique key.
UPDATE THE FINAL PROJECT DOCS TO REFLECT ADDITION OF A ROW ID, which I already added.
*/

/*Global variables -- definite elements of the page*/
var charTableBody = document.getElementById("charBody");
var cityTableBody = document.getElementById("cityBody");
var buildingTableBody = document.getElementById("buildingBody");
var titleTableBody = document.getElementById("titleBody");
var timesTableBody = document.getElementById("timesBody");

var charExistsBody = document.getElementById("charExistsTimesBody");
var charDirectBody = document.getElementById("charDirectCharBody");
var charSwitchBody = document.getElementById("charSwitchCharTimesBody");
var buildingExistsBody = document.getElementById("buildingExistsTimesBody");
var cityExistsBody = document.getElementById("cityExistsTimesBody");
var charHasTitleBody = document.getElementById("charHasTitleTimesBody");

var submitFilterAge = document.getElementById("submitAgeFilter");
var filterAge = document.getElementById("selectAgeFilter");

var submitCityName = document.getElementById("submitCityName");
var searchCityName = document.getElementById("searchCityName");

var charSelect = document.getElementById("charChoice");
var citySelect = document.getElementById("cityChoice");
var buildSelect = document.getElementById("buildChoice");

var charRel = document.getElementById("charRel");
var cityRel = document.getElementById("cityRel");
var buildRel = document.getElementById("buildRel");

var charSubmit = document.getElementById("submitCharRel");
var citySubmit = document.getElementById("submitCityRel");
var buildSubmit = document.getElementById("submitBuildRel");

var filterTable = document.getElementById("filterTable");
var filterBody = document.getElementById("filterBody");
var filterHead = document.getElementById("filterHead");

updateSelectFromTable(charSelect, "characters");
updateSelectFromTable(citySelect, "city");
updateSelectFromTable(buildSelect, "building");

function updateSelectFromTable( selectId, tableName ) {
	//clear out the inside of the select.
	selectId.innerHTML = "";
	
	//get table body rows from the server.
	var server_select_get = new Worker("./js/server_get.js");
	server_select_get.onmessage = function(e) {
		var rows = e.data;
		for(var i = 0; i < rows.length; i++ ) {
			var row = rows[i];
			var newOption = document.createElement("option");
			
			var j = 0;
			for(var prop in row) {
				if(j == 0) {
					newOption.value += row[prop];
					newOption.textContent += row[prop] + ": ";
				}
				if( j == 1) {
					newOption.textContent += row[prop];
				}
				j++;
			}
			selectId.appendChild(newOption);
		}		
		
	};
	server_select_get.postMessage([tableName]);
}

bindSelectSubmit(charSelect, charRel, charSubmit, "characters");
bindSelectSubmit(citySelect, cityRel, citySubmit, "city");
bindSelectSubmit(buildSelect, buildRel, buildSubmit, "building");

function bindSelectSubmit(selectId, relId, submitButton, curTableName) {
	submitButton.addEventListener("click", function(event) {
		event.preventDefault();
		
		//First, get the base id
		var baseId = selectId.value;
		
		//Also get column names of relationship table, and get names of other tables involved.
		//Notice that the orders are parallel.
		var relTableName = relId.value;
		var relTable = document.getElementById(relTableName);
		var relTableColCells = relTable.getElementsByClassName("tcol");
		var relColNames = [];
		var relTableNames = [];
		for(var i = 0; i < relTableColCells.length; i++) {
			if(relTableColCells[i].classList.contains("fk") ) {
				relColNames.push(relTableColCells[i].textContent);
				if(relTableColCells[i].classList.contains("characters") ) {
					relTableNames.push("characters");
				} else if ( relTableColCells[i].classList.contains("city") ) {
					relTableNames.push("city");
				} else if (relTableColCells[i].classList.contains("building")  ) {
					relTableNames.push("building");
				} else if (relTableColCells[i].classList.contains("title")  ) {
					relTableNames.push("title");
				} else if (relTableColCells[i].classList.contains("times")  ) {
					relTableNames.push("times");
				} else {
					console.log("ERROR foreign key not annotated with table name");
				}
			}
		}
		
		if(relTableNames.length == 1) {
			relTableNames.push(relTableName);
		}
		
		//Third, put the names of the entity primary keys in an array, in the same order
		//as they appear in the other arrays. Also get column names of each table, in one long
		//ordering for generating a table.
		var keyNames = [];
		var colNames = [];
		for(var i = 0; i < relTableNames.length; i++) {
			var table = document.getElementById(relTableNames[i]);
			var headerCells = table.getElementsByTagName("th");
			keyNames.push(headerCells[0].textContent);
			for(var j = 0; j < headerCells.length; j++ ) {
				colNames.push(headerCells[j].textContent);
			}
		}
		
		
		var server_select_filter = new Worker("./js/server_select_filter.js");
		server_select_filter.onmessage = function(e) {
			//First, clear out the table for displaying the relationship.
			filterHead.innerHTML = "";
			filterBody.innerHTML = "";
			
			//second, slot in the column names into the table.
			for(var i = 0; i < colNames.length; i++ ) {
				var headerCell = document.createElement("th");
				headerCell.textContent = colNames[i];
				filterHead.appendChild(headerCell);
			}
			
			//third, process each returned row and toss it into the table.
			var rows = e.data;
			for(var i = 0; i < rows.length; i++) {
				var newRow = filterBody.insertRow();
				//create a new row.
				var j = 0;
				for(var prop in rows[i]) {
					if(prop != "rowID") {
						var newCell = newRow.insertCell(j);
						j++;
						newCell.textContent = rows[i][prop];
					}
				}
			}
			
			
			
			
		};
		server_select_filter.postMessage([baseId, relTableNames, keyNames, relTableName, relColNames]);
		
		
		
	});
	
	
	
}


/*First, define an overall function that will populate every single table,
and also call functions add event listeners and shit as the need comes up*/

setUpTable(cityTableBody, "entity", "city", [addEdit, convertToField, bindEditButton], "charChoice");
setUpTable(charTableBody, "entity", "characters", [addEdit, convertToField, bindEditButton], "cityChoice");
setUpTable(buildingTableBody, "entity", "building", [addEdit, convertToField, bindEditButton], "buildChoice");
setUpTable(titleTableBody, "entity", "title", [addEdit, convertToField, bindEditButton], doNothing);
setUpTable(timesTableBody, "entity", "times", [addEdit, convertToField, bindEditButton], doNothing);

setUpTable(charExistsBody, "relationship", "charExistsTime", [addRemove, convertToField]);
setUpTable(charDirectBody, "relationship", "charDirectCharTime", [addRemove, convertToField]);
setUpTable(charSwitchBody, "relationship", "charSwitchCharTime", [addRemove, convertToField]);
setUpTable(buildingExistsBody, "relationship", "buildingExistsTime", [addRemove, convertToField]);
setUpTable(cityExistsBody, "relationship", "cityExistsTime", [addRemove, convertToField]);
setUpTable(charHasTitleBody, "relationship", "charHasTitleTime", [addRemove, convertToField]);



function bindCityNameSearch() {
	submitCityName.addEventListener("click", function(e) {
		e.preventDefault();
		var searchText = searchCityName.value;
		searchText = searchText.toLowerCase();
		var cityRows = cityTableBody.getElementsByTagName("tr");
		
		//First, undo all "hidden" classes, so that the correct
		//one can be applied.
		for(var i = 0; i < cityRows.length; i++) {
			cityRows[i].classList.toggle("hidden", false);
		}
		
		if(searchText === "") {
			//If the searchText was empty, then allow the
			//rows to all be shown again.
		} else {
			//Otherwise check the text of each city name cell to see
			//if it contains the searchText as a substring.
			for(var i = 0; i < cityRows.length; i++) {
				var name = cityRows[i].children[1].children[0].value;
				if(name.toLowerCase().indexOf(searchText) === -1) {
					//if the name doesn't contain the substring, hide it.
					cityRows[i].classList.toggle("hidden", true);
				}
			}
		}
	});
}
bindCityNameSearch();

function bindAgeFilter() {
	submitFilterAge.addEventListener("click", function(e) {
		e.preventDefault();
		var filterChoice = filterAge.value;
		var charRows = charTableBody.getElementsByTagName("tr");
		
		//First, undo all "hidden" classes, so that the correct one can
		//be applied.
		for(var i = 0; i < charRows.length; i++) {
			charRows[i].classList.toggle("hidden", false);
		}
		
		if(filterChoice == "None") {
			//Do nothing, since the "hidden" class has already been
			//removed.
		}
		else if(filterChoice == "30") {
			//Then for each row, make sure the age column is below 30.
			//All rows that fail should be given the "hidden" class.
			local_toggleHiddenOnAge("30");
		}
		else if(filterChoice == "50") {
			//Then for each row, make sure the age column is below 50.
			//All rows that fail should be given the "hidden" class.
			local_toggleHiddenOnAge("50");
		}
		else {
			console.log("What is going on here?");
		}
		
		function local_toggleHiddenOnAge(ageStr) {
			var age = parseInt(ageStr);
			for(var i = 0; i < charRows.length; i++) {
				var curAge = charRows[i].children[3].children[0].value;
				if(curAge >= age) {
					charRows[i].classList.toggle("hidden", true);
				}
			}
		}
		
	});
}
bindAgeFilter();

function doNothing() {
	
}

function setUpTable(tableBody, type, sqlName, rowFn, selectId) {
	//Use Web Worker to get data from the server.
	var serverGet = new Worker('./js/server_get.js');
	serverGet.onmessage = function(e) {
		//get the data returned from the server, or note the error returned from server.
		var data = e.data;
		
		//Now that you have the data, build a table with it.
		data.forEach( function(rowObj) {
			//Create a new row with a complete set columns for each
			//property in the row
			var newRow = tableBody.insertRow();
			var i = 0;
			for (var prop in rowObj) {
				var newCell = newRow.insertCell(i);
				i++;
				newCell.textContent = rowObj[prop];
			};
			
			rowFn.forEach(function(fn) {
				fn(newRow, i, sqlName);
				i++;
			});
			
		});
	};
	serverGet.postMessage([sqlName]);
	
	//Finish setting up table differently depending on whether entity or relationship.
	if(type == "entity") {
		var headerRow = tableBody.previousElementSibling.firstElementChild;
		var col = headerRow.children.length;
		addAdd(headerRow, col, sqlName);
		bindAddEntity(headerRow, col, sqlName);
	}
	else if(type == "relationship") {
		var headerRow = tableBody.previousElementSibling.firstElementChild;
		var col = headerRow.children.length;
		addAdd(headerRow,col, sqlName);
		bindAddRel(headerRow, col, sqlName);
	}
}

function bindAddRel(row, col, sqlName) {
	bindAddEntity(row, col, sqlName);
}

function bindAddEntity(row, col, sqlName) {
	var addButton = (row.getElementsByClassName("add"))[0];
	var table = row;
	var dataCols = row.getElementsByClassName("tcol");
	
	//get the row's table.
	while(table.nodeName != "TABLE") {
		table = table.parentElement;
	}
	
	//get the table's header cells.
	var headerCells = table.getElementsByTagName("th");
	
	addButton.addEventListener("click", function(event) {
		event.preventDefault();
		
		//First, add new row to the table.
		var newRow = table.insertRow();
		
		//highlight the row.
		newRow.style.backgroundColor = "yellow";
		
		//For each data column, add a new cell based on its class
		var i;
		for( i = 0; i < headerCells.length; i++) {
			var newCell = newRow.insertCell(i);
			
			if(headerCells[i].classList.contains("date") ) {
				var newInput = document.createElement("input");
				newInput.type = "date";
				newInput.value = "2001-01-01";
				newCell.appendChild(newInput);
				//If this is the first column cell, disable it.
				if(i == 0 ) {
					newInput.readOnly = "true";
					newInput.disabled = "true";
				}
			} else if (headerCells[i].classList.contains("fk") ) {
				//unfortunately, have to get your fk stuff here.
				//should allow NULL? No. for now, no NULL.
				
				//First, get the correct table.
				var tableName = "";
				if(headerCells[i].classList.contains("characters") ) {
					tableName = "characters";
				} else if (headerCells[i].classList.contains("city") ) {
					tableName = "city";
				} else if (headerCells[i].classList.contains("building") ) {
					tableName = "building";
				} else if (headerCells[i].classList.contains("title") ) {
					tableName = "title";
				} else if (headerCells[i].classList.contains("times") ) {
					tableName = "times";
				} else {
					console.log("UNEXPECTED ERROR in ConvertToField: \
							table name not found in foreign key header");
					return -1;
				}
				//Next, get the the column name of the referenced table's row identifier.
				var colName = document.getElementById(tableName)
											.getElementsByTagName("th")[0].textContent;
				
				//lambda to capture the value of i in the for loop.
				var server_lambda = function(newCell) {
					var server_fk_select = new Worker("./js/server_fk_select.js");
					server_fk_select.onmessage = function(e) {
						var newSelect = document.createElement("select");
						if(e.data[0] == true) {
							var rows = e.data[1];
							var colName = e.data[2];
							
							//stuff the newSelect with the returned data.
							for(var i = 0; i < rows.length; i++) {
								var newOption = document.createElement("option");
								newOption.value = rows[i][colName];
								newOption.textContent = rows[i][colName];
								newSelect.appendChild(newOption);
							}
							
							//put the newSelect into the current cell.
							var newFkCell = newCell.appendChild(newSelect);
							
						}
						else {
							console.log("failure to construct foreign key list");
						}
					};
					server_fk_select.postMessage([colName, tableName]);
				}
				server_lambda(newCell);
				
			} else if (headerCells[i].classList.contains("tcol") ){
				//this SHOULD just be a regular cell.
				var newInput = document.createElement("input");
				newInput.type = "text";
				
				newCell.appendChild(newInput);
			
				//If this is the first column cell, disable it.
				if(i == 0 ) {
					newInput.readOnly = "true";
					newInput.disabled = "true";
				}
			}
			else {
				console.log("there was an unexpected error in adding");
			}
		}
		
		//add a edit button. Notice how it's nice to get a reference to the new added node!
		var edit = addEdit(newRow, i, sqlName);
		
		//bind the edit button to correct event.
		bindEditButton(newRow, i, sqlName);
		
		//disable all add, remove, and edit buttons.
		var editButtons = table.getElementsByClassName("edit");
		for(var i = 0; i < editButtons.length; i++) {
			editButtons[i].disabled = "true";
		}
		
		var addButtons = table.getElementsByClassName("add");
		for(var i = 0; i < addButtons.length; i++) {
			addButtons[i].disabled = "true";
		}
		
		var removeButtons = table.getElementsByClassName("remove");
		for(var i = 0; i < removeButtons.length; i++) {
			removeButtons[i].disabled = "true";
		}
		
		var rowCells = newRow.children;
		
		//Add a submit button to the table and bind it correctly to the correct web worker.
		//Probably should abstract this to a function.
		//The submit functionality has three parts: what server, what to do when the info comes back,
		//and what to do while the info is waiting.
		
		//Set up the submit button
		var submitButton = document.createElement("input");
		submitButton.type = "submit";
		submitButton.style.backgroundColor = "lightgreen";
		table.appendChild(submitButton);
		
		//Bind the submit button click event to a server processing.
		submitButton.addEventListener('click', function(event) {
			event.preventDefault();
			
			//Put all the INPUT rowCell values into an array
			//and send it to a thread to be validated by the server
			var values = [];
			for(var j = 0; j < rowCells.length; j++) {
				var cellElement = rowCells[j].children[0];
				if(cellElement.nodeName == "INPUT") {
					values.push(cellElement.value);
				}
				if(cellElement.nodeName == "SELECT") {
					values.push(cellElement.value);
				}
			}
			//Put all the column names into an array
			//and send it to a thread to be validated by the server
			var colNames = [];
			var columns = table.getElementsByTagName("thead");
			columns = columns[0].getElementsByTagName("th");
			for(var i = 0; i < columns.length; i++) {
				if(columns[i].children.length == 0) {
					colNames.push(columns[i].textContent);
				}
			}
			
			var server_insert = new Worker("./js/server_insert.js");
			server_insert.onmessage = function(e) {
				if(e.data[0] == true) {
					//If insert was successful, populate the row with the values,
					//then remove the row.
					var i = 0;
					var rowObj = e.data[1];
					var dataCells = newRow.children;
					for(var prop in rowObj) {
						var cellElement = dataCells[i].children[0];
						if(cellElement.nodeName == "INPUT") {
							cellElement.value = rowObj[prop];
						}
						else if(cellElement.nodeName == "SELECT") {
							cellElement.value = rowObj[prop];
						}
						else {
							console.log("Something went wrong. I encountered an ADD or EDIT \
								before I should have");
						}
						i++;
					}
					
					//Also update the select icons.
					updateSelectFromTable(charSelect, "characters");
					updateSelectFromTable(citySelect, "city");
					updateSelectFromTable(buildSelect, "building");
				}
				else {
					//If insert was NOT successful, delete the added row.
					console.log("Insert failed");
					
					newRow.innerHTML = "";
					newRow.remove();
				}
			};
			server_insert.postMessage([colNames, values, sqlName]);
			
			//Undisable all add and edit and remove buttons.
			var editButtons = table.getElementsByClassName("edit");
			for(var i = 0; i < editButtons.length; i++) {
				editButtons[i].disabled = "";
			}
			
			var addButtons = table.getElementsByClassName("add");
			for(var i = 0; i < addButtons.length; i++) {
				addButtons[i].disabled = "";
			}
			
			var removeButtons = table.getElementsByClassName("remove");
			for(var i = 0; i < removeButtons.length; i++) {
				removeButtons[i].disabled = "";
			}
			
			//Make fields readOnly
			for(var j = 0; j < rowCells.length; j++) {
				var cellElement = rowCells[j].children[0];
				if(cellElement.nodeName == "INPUT") {
					cellElement.readOnly = "true";
				}
				if(cellElement.nodeName == "SELECT") {
					cellElement.disabled = "true";
				}
				
				if(j == 0) {
					cellElement.disabled = "";
				}
				
			}
			
			//unhighlight the row.
			newRow.style.backgroundColor = "";
			
			//Remove the submit button from the DOM.
			submitButton.remove();
		});
	});
	
}

function addRemove(newRow, col, tableName) {
	//Add a remove button for the row.
	var removeCell = newRow.insertCell(col);
	var remove = document.createElement("button");
	remove.className = "button";
	remove.textContent = "Remove";
	remove.className = "remove";
	removeCell.appendChild(remove);
	
	//Bind remove button to script to remove the row from the server and
	//delete the row from the table.
	remove.addEventListener('click', function(event) {
		event.stopPropagation();
		event.preventDefault();
		
		//Spawn a new thread to ask server to remove the row
		var server_remove = new Worker('./js/server_remove.js');
		server_remove.onmessage = (function(e) {
			if(e.data == true) {
				//Removal was successful, so remove the row.
				var rowId = newRow.rowIndex - 1;
				newRow.parentElement.deleteRow(rowId);
			}
			else {
				console.log("Error in removal attempt");
			}
		});
		var id = newRow.children[0].children[0].value;
		server_remove.postMessage([id, tableName]);
	});
}

function addEdit(newRow, col, tableName) {
	//Add an edit button for the row.
	var editCell = newRow.insertCell(col);
	var edit = document.createElement("button");
	edit.textContent = "Edit";
	edit.className = "edit";
	editCell.appendChild(edit);
	return edit;
}

function addAdd(newRow, col, tableName) {
	var addCell = newRow.insertCell(col);
	var add = document.createElement("button");
	add.textContent = "Add";
	add.className = "add";
	addCell.appendChild(add);
}

function convertToField(newRow, col, tableName) {
	//To determine what to do with each of the rows, web
	//need to check the types of the table headers.
	var table = newRow;
	while(table.nodeName != "TABLE") {
		table = table.parentElement;
	}
	
	//So now we have the table. Now we need to get a handle on the table header row.
	var tableHead = table.getElementsByTagName("thead")[0];
	var tableHeadCells = tableHead.getElementsByTagName("th");
	
	
	var children = newRow.children;
	for(var i = 0; i < tableHeadCells.length; i++) {
		//first, check if it counts as a data cell.
		if(tableHeadCells[i].classList.contains("tcol") ) {
			//Cool, it's a data cell column. Is it a date cell column?
			if(tableHeadCells[i].classList.contains("date") ) {
				//If its a date cell, fit the data into a date type.
				var newInput = document.createElement("input");
				newInput.type = "date";
				var textValue = children[i].textContent;
				children[i].textContent = "";
				var newDateCell = children[i].appendChild(newInput);
				newInput.value = textValue;
				newInput.readOnly = "true";
				
			}
			else if (tableHeadCells[i].classList.contains("fk") ) {
				//If it's a foreign key, get a list of possible values it could be, but set it
				// to the current one.
				
				//First, get the correct table.
				var tableName = "";
				if(tableHeadCells[i].classList.contains("characters") ) {
					tableName = "characters";
				} else if (tableHeadCells[i].classList.contains("city") ) {
					tableName = "city";
				} else if (tableHeadCells[i].classList.contains("building") ) {
					tableName = "building";
				} else if (tableHeadCells[i].classList.contains("title") ) {
					tableName = "title";
				} else if (tableHeadCells[i].classList.contains("times") ) {
					tableName = "times";
				} else {
					console.log("UNEXPECTED ERROR in ConvertToField: table name not found in foreign key header");
					return -1;
				}
				//Next, get the the row-identifying column name.
				var colName = document.getElementById(tableName).getElementsByTagName("th")[0].textContent;
				
				//lambda to capture the value of i in the for loop.
				var server_lambda = function(i) {
					var oldText = children[i].textContent;
					var curCell = children[i];
					var server_fk_select = new Worker("./js/server_fk_select.js");
					server_fk_select.onmessage = function(e) {
						if(e.data[0] == true) {
							var newSelect = document.createElement("select");
							var rows = e.data[1];
							var colName = e.data[2];
							
							//Put the original data as the first option.
							var newOption = document.createElement("option");
							newOption.value = oldText;
							newOption.textContent = oldText;
							newSelect.appendChild(newOption);
							
							for(var i = 0; i < rows.length; i++) {
								if(rows[i][colName] != oldText) {
									var newOption = document.createElement("option");
									newOption.value = rows[i][colName];
									newOption.textContent = rows[i][colName];
									newSelect.appendChild(newOption);
								}
								else {
									//same as old text, so do nothing.
								}
							}
							
							//replace with newSelect
							curCell.textContent = "";
							var newFkCell = curCell.appendChild(newSelect);
							newSelect.disabled = "true";
							
						}
						else {
							console.log("failure to construct foreign key list");
						}
					};
					server_fk_select.postMessage([colName, tableName]);
				}
				server_lambda(i);
			}
			else {
				//if it isn't a date or foreign key column, just convert it to a text field
				var newInput = document.createElement("input");
				newInput.type = "text";
				var textValue = children[i].textContent;
				children[i].textContent = "";
				var newTextCell = children[i].appendChild(newInput);
				newInput.value = textValue;
				newInput.readOnly = "true";
			}
			
			
			
		} else {
			//if not data, don't convert, so do nothing.
		}
	};
}

function bindEditButton(newRow, col, tableName) {
	var edit = newRow.getElementsByClassName("edit");
	edit[0].addEventListener('click', function(event){
		event.preventDefault();
		//highlight the row.
		newRow.style.backgroundColor = "yellow";
		
		var rowCells = newRow.children;
		for(var j = 1; j < rowCells.length; j++) {
			var cellElement = rowCells[j].children[0];
			if(cellElement.nodeName == "INPUT") {
				//Make fields editable.
				cellElement.readOnly = "";
			}
			
			if(rowCells[j].children[0].nodeName == "SELECT") {
				//undisable all selects.
				cellElement.disabled = "";
			}
		}
		//Get a reference to the entire table
		var table = newRow;
		while(table.parentElement.nodeName != "TABLE") {
			table = table.parentElement;
		}
		table = table.parentElement;
		
		//Make all other edit buttons inaccessible.
		var editButtons = table.getElementsByClassName("edit");
		for(var i = 0; i < editButtons.length; i++) {
			editButtons[i].disabled = "true";
		}
		
		//Make all add buttons inaccessible.
		var addButtons = table.getElementsByClassName("add");
		for(var i = 0; i < addButtons.length; i++) {
			addButtons[i].disabled = "true";
		}
		
		//Set up the submit button
		var submitButton = document.createElement("input");
		submitButton.type = "submit";
		submitButton.style.backgroundColor = "lightgreen";
		table.appendChild(submitButton);
		
		//Bind the submit button click event to a server processing.
		submitButton.addEventListener('click', function(event) {
			event.preventDefault();
			//unhighlight the row.
			newRow.style.backgroundColor = "";
			
			//Make fields readOnly (or disabled) again
			for(var j = 1; j < rowCells.length; j++) {
				var cellElement = rowCells[j].children[0];
				if(cellElement.nodeName == "INPUT") {
					cellElement.readOnly = "true";
				}
				
				if(cellElement.nodeName == "SELECT") {
					cellElement.disabled = "true";
				}
				
			}
			
			//Put all the INPUT and SELECT rowCell values into an array
			//and send it to a thread to be validated by the server
			var values = [];
			for(var j = 0; j < rowCells.length; j++) {
				var cellElement = rowCells[j].children[0];
				if(cellElement.nodeName == "INPUT") {
					values.push(cellElement.value);
				}
				
				if(cellElement.nodeName == "SELECT") {
					values.push(cellElement.value);
				}
			}
			//Put all the column names into an array
			//and send it to a thread to be validated by the server
			var colNames = [];
			var columns = table.getElementsByTagName("thead");
			columns = columns[0].getElementsByTagName("th");
			for(var i = 0; i < columns.length; i++) {
				if(columns[i].children.length == 0) {
					colNames.push(columns[i].textContent);
				}
			}

			var server_update = new Worker('./js/server_update.js');
			server_update.onmessage = (function(e){
				//Put the returned data back in the row to correctly reflect state
				//of database.
				
				var i = 0;
				for (var prop in e.data) {
					rowCells[i].children[0].value = e.data[prop];
					i++;
				}
				
				//Also update select for any changes.
				updateSelectFromTable(charSelect, "characters");
				updateSelectFromTable(citySelect, "city");
				updateSelectFromTable(buildSelect, "building");
				
			});
			server_update.postMessage([colNames, values, tableName]);
			
			
			//Free all add and submit buttons.
			var editButtons = table.getElementsByClassName("edit");
			for(var i = 0; i < editButtons.length; i++) {
				editButtons[i].disabled = "";
			}
			
			//Make all add buttons inaccessible.
			var addButtons = table.getElementsByClassName("add");
			for(var i = 0; i < addButtons.length; i++) {
				addButtons[i].disabled = "";
			}
			
			//Remove the submit button from the DOM.
			submitButton.remove();
		});
	});
}