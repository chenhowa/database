/***********************************************************
Program Name: 	Server-Side Fitness Application
Author:			Howard Chen
Last Modified:	3-16-2017
Description:	Implements the server-side code for Fitness Application.
				Handles GET and POST requests that web spplication will send.
				Returns information from database to web application using MySQL
***********************************************************/

/****************************************************************************************
Boilerplate Code from the lectures to set up the
express-handlebars-bodyParser-sessions-request system.
***************************************************************************************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars'); //names are assumed to be .handlebars files.
app.set('port', 5445);   //while you're logged in to flip this should be all right

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Set up sessions for this app
var session = require('express-session');
app.use(session({secret:'potato'}));

//Set up request for this app
var request = require('request');

app.use(express.static('public'));

//Set up mysql
var mysql = require('./dbcon.js');



/****************************************************************************************
Code for handling GET and POST requests in the server.
***************************************************************************************/

//Sends a script to the client to handle rendering of the page.
//Script will also set up the client to make AJAX requests to this server
//	when the correct DOM elements are clicked.
app.get('/', function(req, res, next) {
	var context = {};
	context.script = "<script src='./js/events.js'></script>";
	res.render('app', context);	
});

//Handles requests from the client to add new data to the workouts database.
//This code verifies the new data has a name field before adding it, and then
//returns the results of the add so that the client can act appropriately.
app.post('/addEntity', function(req, res, next) {
	
	//Initialize response object that will be sent back.
	//Default response is that the POST request failed.
	var resBody = {};
	resBody.success = false;
	
	var colNames = req.body.colNames;
	var values = req.body.values;
	var name = req.body.name;
	
	var insertQuery = "INSERT INTO " + name + " (";
	for(var i = 0; i < colNames.length; i++) {
		insertQuery += colNames[i];
		if(i != colNames.length - 1) {
			insertQuery += ",";
		}
		insertQuery += " ";
	}
	insertQuery += ") VALUES (?)";
	console.log(insertQuery);
	console.log(values);
	
	//First, create a new entry based on the name.
	mysql.pool.query(insertQuery,
		[values],
		function(err, result) {
			if(err) {
				//if error, let the calling thread know.
				console.log(result);
				res.send(JSON.stringify(resBody));
			}		
			else {
				resBody.success = true;
				//Since insert was successful, get the values for the rows
				var selectQuery = "SELECT * FROM " + name + " WHERE " + colNames[0] + "=" + result.insertId.toString();
				console.log(selectQuery);
				
				mysql.pool.query(selectQuery, [], function(err, rows, field) {
					if(err) {
						next(err);
						return;
					}
					//send the array of rows back to the client.
					else {
						if(rows.length == 1) {
							resBody.row = rows[0];
							res.send(JSON.stringify(resBody));
						}
						else {
							console.log("ERROR! Insert returned two rows!");
							next(err);
							return;
						}
					}
				});
			}
	});
	
	
	
});

//Handles requests from the client to remove database entries with the specified id.
app.post("/removeRel", function(req,res,next) {
	
	//Create response object. Default is to say query failed.
	var resBody = {};
	resBody.success = false;
	var tableName = req.body.name;
	var id = req.body.rowId;
	
	
	//Attempt to delete the requested id.
	mysql.pool.query("DELETE FROM " + tableName + " WHERE " + "rowID" + " =?", [id],
		function(err, result) {
			if(err) {
				next(err);
				return;
			}
			else {
	//If delete succeeded, inform the client by sending a
	//response with success = true.
				resBody.success = true;
				res.send(JSON.stringify(resBody));
			}
		});
	
});

app.post("/getRelInnerJoins", function(req, res, next) {
	var id = req.body.id;
	var tableNames = req.body.tableNames;
	var tableJoinKeys = req.body.tableJoinKeys;
	var relTableName = req.body.relTableName;
	var relJoinKeys = req.body.relJoinKeys;
	
	//generate alias for every table
	var alias = [];
	for(var i = 0; i < tableNames.length; i++) {
		alias.push("a" + i.toString());
	}
	console.log(alias);
	
		var selectQuery = "SELECT "
		for(var i = 0; i < relJoinKeys.length; i++) {
			selectQuery += " " + alias[i] + ".*";
			if(i != relJoinKeys.length - 1) {
				selectQuery += ","
			}
			selectQuery += " ";
		}
		
		if(relJoinKeys.length == 1) {
			selectQuery += ", " + "r.*"
		}
		
		selectQuery += " FROM " + tableNames[0] + " AS " + alias[0] + " INNER JOIN " + relTableName + " AS r" + " ON ";
		selectQuery += alias[0] + "." + tableJoinKeys[0] + "=" + "r" + "." + relJoinKeys[0];
		
		//While there are stll tables left to INNER JOIN, INNER JOIN them.
		for(var i = 1; i < relJoinKeys.length; i++ ) {
			selectQuery += " INNER JOIN " + tableNames[i] + " AS " + alias[i] + " ON "
			selectQuery += alias[i] + "." + tableJoinKeys[i] + "=" + "r" + "." + relJoinKeys[i];
		}
		selectQuery += " WHERE " + "r" + "." + relJoinKeys[0] + "=" + id + ";";
		console.log(selectQuery);
	
	
	//Once query is created, give it a go.
	mysql.pool.query(selectQuery, function(err, rows, field) {
		if(err) {
			next(err);
			return;
		}
		//If query succeeded, send the array of rows back to the client.
		else {
			var resBody = {};
			resBody.table = rows;
			res.send(JSON.stringify(resBody));
		}
		
	});
});

//Handles requests from the client to return the contents of the database.
app.post("/getTable", function(req,res,next) {
	
	//Attempt to get all rows of the database.
	var tableName = req.body.name;
	//console.log(tableName);			//Will allow you to see table name that was requested.
	mysql.pool.query('SELECT * FROM ' + tableName,
		function(err, rows, field) {
			if(err) {
				next(err);
				return;
			}
	//If query succeeded, send the array of rows back to the client.
			else {
				var resBody = {};
				resBody.table = rows;
				res.send(JSON.stringify(resBody));
			}
		}
	);
	
	
});


app.post("/getForeignKeys", function(req, res, next) {
	var tableName = req.body.name;
	var colName = req.body.colName;
	
	var resBody = {};
	resBody.success = false;
	
	var selectQuery = "SELECT " + colName + " FROM " + tableName;
	mysql.pool.query(selectQuery, function(err, rows, field) {
		if(err) {
			next(err);
			return;
		}
		else {
			resBody.success = true;
			resBody.rows = rows;
			res.send(JSON.stringify(resBody));
		}
	});
	
	
});

//Handles requests to update a specific entry of the database (through row ID).
app.post("/updateEntity", function(req,res,next) {
	
	//Initialize response object. Default is that query failed.
	var resBody = {};
	resBody.success = false;
	
	var colNames = req.body.colNames;
	var values = req.body.values;
	var name = req.body.name;
	
	var rowId = values[0];
	
	
	//Build the select old data query.
	var selectOld = "SELECT * FROM " + name + " WHERE " + colNames[0] + "=?";
	console.log(selectOld);
	
	//Build the update query.
	var updateFields = "UPDATE " + name + " SET ";
	for(var i = 1; i < colNames.length; i++) {
		updateFields += colNames[i] + "=?";
		if(i != colNames.length - 1) {
			updateFields += ",";
		}
		updateFields += " ";
	}
	updateFields += "WHERE " + colNames[0] + "=?";
	
	console.log(updateFields);
	
	//Perform safe update. First, get old values of the row from the database.
	mysql.pool.query(selectOld, [rowId], function(err, result) {
		if(err){
			next(err);
			return;
		}
		
		if(result.length == 1) {
			var resultObject = result[0];
			console.log(resultObject);
			var updateArray = [];
			var i = 0;
			
			for (var prop in resultObject) {
				if(prop != colNames[0]) {
					updateArray.push(values[i] || resultObject[prop]);
				}
				i++;
			}
			updateArray.push(rowId);
			
			console.log(updateArray);
			
			
			mysql.pool.query(updateFields, updateArray, function(err, result) {
						if(err) {
							next(err);
							return;
						}
						else {
						//Once the database has been updated, return the updated row
						//to the client so the client can process and render it.
							mysql.pool.query(selectOld, [rowId], function(err, result) {
									console.log("new Select");
									if(err) {
										next(err);
										return;
									}
									else {
										console.log(result[0]);
										resBody.row = result[0];
										resBody.success = true;
										res.send(JSON.stringify(resBody));
									}

								}
							);
						}
					}
			);
				
		}
		else {
			console.log("ERROR. Old row not found");
		}
		
	});
	
	
});


//Resets table for use in database. Database should now be empty.
//Code was provided by OSU, so I won't comment this code.
app.get('/reset-table',function(req,res,next){
	var context = {};
	mysql.pool.query(
		"DROP TABLE IF EXISTS charDirectCharTime, \
		charSwitchCharTime, \
		charHasTitleTime, \
		cityExistsTime, \
		charExistsTime, \
		buildingExistsTime, \
		building, \
		characters, \
		times, \
		title, \
		city;" , function(err){
		
		var createCity = "CREATE TABLE city( \
						cityID INT NOT NULL AUTO_INCREMENT, \
						city_name VARCHAR(255) NOT NULL, \
						population INT, \
						country VARCHAR(255), \
						PRIMARY KEY(cityID) \
						) ENGINE = InnoDB;";
		mysql.pool.query(createCity, function(err){
			var createChar = "CREATE TABLE characters ( \
						charID INT NOT NULL AUTO_INCREMENT, \
						firstName VARCHAR(255) NOT NULL, \
						lastName VARCHAR(255) NOT NULL, \
						age INT, \
						cityFID INT NOT NULL, \
						FOREIGN KEY(cityFID) REFERENCES city(cityID), \
						PRIMARY KEY(charID) \
						) ENGINE = InnoDB;";
			mysql.pool.query(createChar, function(err){
				
				var createBuilding = "CREATE TABLE building( \
						buildID INT NOT NULL AUTO_INCREMENT, \
						build_name VARCHAR(255) NOT NULL, \
						squareFeet DECIMAL(10, 2), \
						levels INT, \
						cityFID INT NOT NULL, \
						FOREIGN KEY(cityFID) REFERENCES city(cityID), \
						PRIMARY KEY(buildID) \
						) ENGINE = InnoDB;";

				mysql.pool.query(createBuilding, function(err){
					var createTitle = "CREATE TABLE title( \
							titleID INT NOT NULL AUTO_INCREMENT, \
							title_name VARCHAR(255) NOT NULL, \
							PRIMARY KEY(titleID) \
							) ENGINE = InnoDB;";
					mysql.pool.query(createTitle, function(err){
						var createTimes = "CREATE TABLE times( \
							timeID INT NOT NULL AUTO_INCREMENT, \
							start DATE NOT NULL, \
							end DATE, \
							PRIMARY KEY(timeID) \
							) ENGINE = InnoDB;";
						mysql.pool.query(createTimes, function(err){
							var insertCity = 'INSERT INTO city(city_name, population, country) VALUES\
								("Tokyo", 1000, "Japan"),\
								("London", 100, "England"),\
								("New York", 5000, "U.S.A");';
							mysql.pool.query(insertCity, function(err) {
								var insertChar = 'INSERT INTO characters(firstName, lastName, age, cityFID) VALUES \
									("Jim", "Crow", 80, (SELECT cityID FROM city WHERE country = "U.S.A") ), \
									("Mary", "Crawford", 16, (SELECT cityID FROM city WHERE country = "England") ), \
									("Nishikori", "Kei", 33, (SELECT cityID FROM city WHERE country = "Japan") );';
								mysql.pool.query(insertChar, function(err) {
									var insertBuild = 'INSERT INTO building(build_name, squareFeet, levels, cityFID) VALUES\
										("Library", 5000.0, 3, (SELECT cityID FROM city WHERE country = "England") ),\
										("Cafe", 2000.0, 2, (SELECT cityID FROM city WHERE country = "U.S.A") ),\
										("Stadium", 10500.0, 10, (SELECT cityID FROM city WHERE country = "Japan") );';
									mysql.pool.query(insertBuild, function(err) {
										var insertTitle =	'INSERT INTO title(title_name) VALUES\
												("College Student"),\
												("Electrician"),\
												("Hotline Volunteer");';
										mysql.pool.query(insertTitle, function(err) {
											var insertTimes =	'INSERT INTO times(start, end) VALUES\
													("2000-01-03", "2005-02-06"), \
													("2005-12-02", "2007-08-30"), \
													("2016-08-17", "2005-11-24");';
											mysql.pool.query(insertTimes, function(err) {
												var createDirect = "CREATE TABLE charDirectCharTime( \
													rowID INT NOT NULL AUTO_INCREMENT, \
													UNIQUE KEY row (rowID), \
													cid1 INT NOT NULL, \
													cid2 INT NOT NULL, \
													timeID INT NOT NULL, \
													FOREIGN KEY(cid1) REFERENCES characters(charID), \
													FOREIGN KEY(cid2) REFERENCES characters(charID), \
													FOREIGN KEY(timeID) REFERENCES times(timeID), \
													PRIMARY KEY(cid1, cid2, timeID) \
													) ENGINE = InnoDB;";
												mysql.pool.query(createDirect, function(err){
													var createSwitch = "CREATE TABLE charSwitchCharTime( \
														rowID INT NOT NULL AUTO_INCREMENT, \
														UNIQUE KEY row (rowID), \
														switcherID INT NOT NULL, \
														cid INT NOT NULL, \
														timeID INT NOT NULL, \
														FOREIGN KEY(switcherID) REFERENCES characters(charID), \
														FOREIGN KEY(cid) REFERENCES characters(charID), \
														FOREIGN KEY(timeID) REFERENCES times(timeID), \
														PRIMARY KEY(switcherID, cid, timeID) \
														) ENGINE = InnoDB;";
													mysql.pool.query(createSwitch, function(err){
														var createHasTitle = "CREATE TABLE charHasTitleTime( \
															rowID INT NOT NULL AUTO_INCREMENT, \
															UNIQUE KEY row (rowID), \
															charID INT NOT NULL, \
															titleID INT NOT NULL, \
															timeID INT NOT NULL, \
															FOREIGN KEY(charID) REFERENCES characters(charID), \
															FOREIGN KEY(titleID) REFERENCES title(titleID), \
															FOREIGN KEY(timeID) REFERENCES times(timeID), \
															PRIMARY KEY(charID, titleID, timeID) \
															) ENGINE = InnoDB;";
														mysql.pool.query(createHasTitle, function(err){
															var createCityExists = "CREATE TABLE cityExistsTime( \
																rowID INT NOT NULL AUTO_INCREMENT, \
																UNIQUE KEY row (rowID), \
																cityID INT NOT NULL, \
																timeID INT NOT NULL, \
																FOREIGN KEY(cityID) REFERENCES city(cityID), \
																FOREIGN KEY(timeID) REFERENCES times(timeID), \
																PRIMARY KEY(cityID, timeID) \
																) ENGINE = InnoDB;";
															mysql.pool.query(createCityExists, function(err){
																var createCharExists = "CREATE TABLE charExistsTime( \
																	rowID INT NOT NULL AUTO_INCREMENT, \
																	UNIQUE KEY row (rowID), \
																	charID INT NOT NULL, \
																	timeID INT NOT NULL, \
																	FOREIGN KEY(charID) REFERENCES characters(charID), \
																	FOREIGN KEY(timeID) REFERENCES times(timeID), \
																	PRIMARY KEY(charID, timeID) \
																	) ENGINE = InnoDB;";
																mysql.pool.query(createCharExists, function(err){
																	var createBuildingExists = "CREATE TABLE buildingExistsTime ( \
																			rowID INT NOT NULL AUTO_INCREMENT, \
																			UNIQUE KEY row (rowID), \
																			buildID INT NOT NULL, \
																			timeID INT NOT NULL, \
																			FOREIGN KEY(buildID) REFERENCES building(buildID), \
																			FOREIGN KEY(timeID) REFERENCES times(timeID), \
																			PRIMARY KEY(buildID, timeID) \
																			) ENGINE = InnoDB;";
																	mysql.pool.query(createBuildingExists, function(err){
																		context.results = "Table reset";
																		res.render('log',context);
																		
																		var charExists =	'INSERT INTO charExistsTime(charID,  \
																			timeID) VALUES \
																			((SELECT charID FROM characters WHERE charID = 1), \
																				(SELECT timeID FROM times WHERE timeID = 2)), \
																			((SELECT charID FROM characters WHERE charID = 2), \
																				(SELECT timeID FROM times WHERE timeID = 3));'; 
																		mysql.pool.query(charExists, function(err) {
																			
																		});
																		
																		var buildExists =	'INSERT INTO  \
																			buildingExistsTime(buildID, timeID) VALUES \
																			((SELECT buildID FROM building WHERE buildID = 2), \
																				(SELECT timeID FROM times WHERE timeID = 1)), \
																			((SELECT buildID FROM building WHERE buildID = 3), \
																				(SELECT timeID FROM times WHERE timeID = 1));'; 
																		mysql.pool.query(buildExists, function(err) {
																			
																		});
																		
																		var cityExists =	'INSERT INTO cityExistsTime(cityID,  \
																			timeID) VALUES \
																			((SELECT cityID FROM city WHERE cityID = 3), \
																				(SELECT timeID FROM times WHERE timeID = 2)), \
																			((SELECT cityID FROM city WHERE cityID = 3), \
																				(SELECT timeID FROM times WHERE timeID = 1));'; 
																		mysql.pool.query(cityExists, function(err) {
																			
																		});
																		
																		var charDirect =	'INSERT INTO charDirectCharTime(cid1,  \
																			cid2, timeID) VALUES \
																			(1, 2, 3), \
																			(1, 3, 2), \
																			(2, 3, 1);'; 
																		mysql.pool.query(charDirect, function(err) {
																			
																		});
																		
																		var charSwitch =	'INSERT INTO  \
																			charSwitchCharTime(switcherID, cid, timeID) VALUES \
																			(2, 2, 1), \
																			(2, 3, 3), \
																			(3, 1, 1);'; 
																		mysql.pool.query(charSwitch, function(err) {
																			
																		});
																		
																		var charTitle =	'INSERT INTO charHasTitleTime(charID,  \
																			titleID, timeID) VALUES \
																			(1, 1, 3), \
																			(1, 3, 1), \
																			(3, 3, 2);'; 
																		mysql.pool.query(charTitle, function(err) {
																			
																		});
																	});
																});
															});
														});
													});
												});
											});
										});
									});	
								});
							});
						});
					});
				});
			});
		});
	});
});


/****************************************************************************************
Code for handling 404 and 500 errors (unknown resource errors and server errors)
***************************************************************************************/
//Handles unknown resource errors.
app.use(function(req,res) {
	res.status(404);
	res.render('404');
});

//handle server errors.
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.type('plain\text');
	res.status(500);
	res.render('500');
});

/****************************************************************************************
STARTS THE APPLICATION.
***************************************************************************************/
app.listen(app.get('port'), function() {
	console.log("Check started on port " + app.get("port") + "; press Ctrl-C to terminate.");
});
