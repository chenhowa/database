var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_chenhowa',
  password        : 'apples',
  database        : 'cs340_chenhowa'
});

module.exports.pool = pool;
