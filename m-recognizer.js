var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser'); // To parse body from POST request.
var app = express();
var cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
var uniqueDevices = 0;
const PORT = 17997;

app.get('/', function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    var connection = mysql.createConnection({
        host: 'localhost',
		// user: '...',
		// password: '...',
		// database: '...' 
    });
    // Load questions from database and send it.
    if (req.query.q == "questions") {
        connection.query("SELECT * FROM Questions", function(error, result, fields) {
            connection.end();
            res.end(JSON.stringify(result));
        });
    // Just increase devices counter
    } else if (req.query.q == "newDevice") {
        uniqueDevices++;
        console.log("Unique devices: " + uniqueDevices + ". Date: " + new Date());
        res.end("OK");
    // Find all matches, using attributes and send most possible types.
    } else {
        // Generate querystr
        var querystr = 'SELECT * FROM MushroomsInfo WHERE ';
        var attributes = req.query.attributes;
        var anyConditions = false;

        if (attributes["month"] != undefined) {
            querystr += "month LIKE '%" + attributes["month"] + "%' ";
            anyConditions = true;
        }
        if (attributes["forest"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "forest LIKE '%" + attributes["forest"] + "%' ";
            anyConditions = true;
        }
        if (attributes["cap_diameter"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "cap_diameter LIKE '%" + attributes["cap_diameter"] + "%' ";
            anyConditions = true;
        }
        if (attributes["cap_color"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "cap_color LIKE '%" + attributes["cap_color"] + "%' ";
            anyConditions = true;
        }
        if (attributes["stem_length"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "stem_length LIKE '%" + attributes["stem_length"] + "%' ";
            anyConditions = true;
        }
        if (attributes["stem_color"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "stem_color LIKE '%" + attributes["stem_color"] + "%' ";
            anyConditions = true;
        }
        if (attributes["ring_color"] != undefined) {
            if (anyConditions)
                querystr += "OR ";
            querystr += "ring_color LIKE '%" + attributes["ring_color"] + "%' ";
        }
        // 7 attributes - 100%
        // 1 attribute - 14%
        connection.query(querystr, function(error, result, fields) {
            connection.end();
            var results = [];
            for (var i = 0; i < result.length; i++) {
                var percent = calcPercent(attributes, result[i]);
                if (percent > 30) { // change limit
                    result[i].percent = percent;
                    results.push(result[i]);
                }
            }
            results.sort(function(a, b) { return b.percent - a.percent });
            res.end(JSON.stringify(results));
        });
    } // else
});

// Takes nothing
app.get('/db/names_list', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	var connection = mysql.createConnection({
        host: 'localhost',
		// user: '...',
		// password: '...',
		// database: '...' 
    });

  var querystr = "SELECT mushroom FROM MushroomsInfo";

  connection.query(querystr, function(error, result, fields) {
      connection.end();
      var results = [];
      for(var i = 0; i < result.length; i++)
      {
        results.push(result[i]["mushroom"].split(",")[0]);
      }
      res.end(JSON.stringify(results));
  });
});

// Takes mushroom id in query string.
app.get('/db/description', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  var connection = mysql.createConnection({
        host: 'localhost',
		// user: '...',
		// password: '...',
		// database: '...' 
    });

  var querystr = "SELECT * FROM MushroomsInfo WHERE id='" + req.query.id + "';";

  connection.query(querystr, function(error, result, fields) {
      connection.end();
      res.end(JSON.stringify(result));
  });
});

app.post('/new', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'content-type, authorization, content-length, X-Requested-With');

  var connection = mysql.createConnection({
        host: 'localhost',
		// user: '...',
		// password: '...',
		// database: '...' 
    });

  var attributes = req.body;

  attributes.cap_diameter = numPairToSequence(attributes.cap_diameter1, attributes.cap_diameter2);
  attributes.month = numPairToSequence(attributes.month1, attributes.month2);
  attributes.stem_length = numPairToSequence(attributes.stem_length1, attributes.stem_length2);
  attributes.stem_diameter = numPairToSequence(attributes.stem_diamter1, attributes.stem_diameter2);

  var querystr = "INSERT INTO tempMushroomsInfo (flag, mushroom, month, forest, cap_diameter, cap_color, cap_special, gills_color, gills_special, stem_length, stem_diameter, stem_color, stem_special, ring_color, ring_special, place, same_but_poisoned, links) " +
  "VALUES ('" + attributes.flag + "', '" + attributes.mushroom + "' , '" + attributes.month + "', '" + attributes.forest + "', '" +
   attributes.cap_diameter + "', '" + attributes.cap_color + "', '" + attributes.cap_special + "', '" + attributes.gills_color + "', '" + attributes.gills_special + "', '" + attributes.stem_length + "', '" + attributes.stem_diameter + "', '" + attributes.stem_color + "', '" + attributes.stem_special +
   "', '" + attributes.ring_color + "', '" + attributes.ring_special + "', '" + attributes.place + "', '" + attributes.same_but_poisoned + "', '" + attributes.links + "');";

  connection.query(querystr, function(error, result) {
      connection.end();
      if(!error){
        res.end(JSON.stringify(result));
      } else {
        res.end(JSON.stringify(error));
      }

  });
});

app.listen(PORT, function() {
    console.log('App listening on port ' + PORT +'!');
});

function calcPercent(attributes, row) {
    var percent = 0;
    if (attributes["month"] != undefined) {
        if (row["month"].indexOf(attributes["month"]) != -1)
            percent += 14;
    }
    if (attributes["forest"] != undefined) {
        if (row["forest"].indexOf(attributes["forest"]) != -1)
            percent += 14;
    }
    if (attributes["cap_diameter"] != undefined) {
        if (row["cap_diameter"].indexOf(attributes["cap_diameter"]) != -1)
            percent += 14;
    }
    if (attributes["cap_color"] != undefined) {
        if (row["cap_color"].indexOf(attributes["cap_color"]) != -1)
            percent += 14;
    }
    if (attributes["stem_length"] != undefined) {
        if (row["stem_length"].indexOf(attributes["stem_length"]) != -1)
            percent += 14;
    }
    if (attributes["stem_color"] != undefined) {
        if (row["stem_color"].indexOf(attributes["stem_color"]) != -1)
            percent += 14;
    }
    if (attributes["ring_color"] != undefined) {
        if (row["ring_color"].indexOf(attributes["ring_color"]) != -1)
            percent += 14;
    }
    return percent;
}

function numPairToSequence(num1, num2) {
  // num2 > num1
  num1 = Number(num1);
  num2 = Number(num2);
  var str = "";
  if(num1 > num2) {
    num2 = num2 + num1;
    num1 = num2 - num1;
    num2 = num2 - num1;
  }
  for(var i = num1; i <= num2; i++) {
    str += ";" + i;
  }
  str += ";";
  return str;
}
