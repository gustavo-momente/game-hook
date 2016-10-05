var express = require('express');
var logger = require('winston');
var fs = require('fs');
var path = require('path');
var settings = require('./settings.js');

logger.level = settings.log_level;
logger.add(logger.transports.File, {
    filename: 'main.log'
});

/* Initalize Mapper */
var mapper_json = require('fs').readFileSync(settings.mapper_file, 'utf8');
var mapper = JSON.parse(mapper_json);
logger.info('Loaded mapper: %s', settings.mapper_file);

/* Initalize Driver */
var driver = require(settings.driver_file);
logger.info('Loaded driver: %s', settings.driver_file);

/* Initalize Scripts */
var script_modules = [];
settings.scripts.forEach(function(script) {
    var script_name = path.basename(script, '.js');
    logger.info('Loaded script: %s', script);
    script_modules.push({
        name: script_name,
        script: require(script)
    });
});

// Check status of the driver.
if (driver.check_connection()) {
    logger.info('Successfully established a connection with driver.');
} else {
    driver.stop();
    process.exit(1);
}

/* Initalize Express API Endpoint */
var api = express();
api.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
/* API Endpoints */
api.get('/', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        properties: mapper.properties,
        scripts: script_results
    }));
});
api.get('/dictionary', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(mapper.dictionary));
});
/* End API Endpoints */

var server = api.listen(5000, function() {
    var host = server.address().address;
    var port = server.address().port;
    logger.info('Started API. Endpoint accessible at http://127.0.0.1:%s', port);
});

/* Preload the properties into an array for speed. */
var properties = [];

function walk_object(object) {
    for (var child in object) {
        if (object.hasOwnProperty(child)) {
            if (typeof object[child] == "object") {
                if (object[child].address != null) {
                    properties.push(object[child]);
                } else {
                    walk_object(object[child]);
                }
            }
        }
    }
}
walk_object(mapper.properties);

/* Main Logic Loop */
var script_results = {};
setInterval(function() {

    properties.forEach(function(property) {
        driver.read_property(property, mapper.dictionary);
    });

    script_results = {};
    script_modules.forEach(function(module) {
        var script = module.script;
        script_results[module.name] = new script(mapper, driver);
    });
}, 25);
