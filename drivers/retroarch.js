var logger = require('winston');
var util = require('util');
var sleepms = require('sleep-ms');

/* Initalize the Driver */
var BaseDriver = require('./_hex.js');
var Driver = function() {
    BaseDriver.apply(this, arguments);
};
util.inherits(Driver, BaseDriver);

var read_buffer = [];

/* Initalize UDP sockets to communicate with RetroArch */
var client = require('dgram').createSocket('udp4');

/**
 * Messages are received from RetroArch via UDP packets.
 * All responses should be READ_CORE_RAM when RetroArch sends the result
 * of a memory address lookup.
 * This API in RetroArch was added by Alcaro.  PR 3068
 */
client.on('message', function(data) {
    var message = data.toString();
    logger.silly(`RetroArch CMD Response: ${message}`);

    var split = message.split(' ');
    var address = split[1];
    var hex_values = split.slice(2).toString().slice(0, -1)

    if (hex_values == "-1") {
        logger.warn('Did not get a proper response back from RetroArch. Is a game loaded with a compatible core?')
        return false;
    }

    read_buffer[address] = hex_values.split(',');
});
client.on('close', function() {
    logger.error('Socket has been closed.');
});
client.on('error', function() {
    logger.error('Socket has encountered an error.');
});

Driver.prototype.check_connection = function() {
    logger.info('Driver is attempting to establish connection with RetroArch...');
    if (this.read_hex("00", 1) == null) {
        return false;
    }
    return true;
}

Driver.prototype.stop = function() {
    logger.error('Cannot establish a connection with RetroArch. Check if RetroArch is running, has a game loaded, and "network_cmd_enable" set to true in the RetroArch config.');
}

/**
 * RetroArch has command-line support, this sends messages over a UDP socket.
 * RetroArch recieves that message, and sends it's own message.
 * You will *not* get a response in this function, you will have to wait
 * for a response.
 */
Driver.prototype.send_message = function(message) {
    logger.silly(`RetroArch CMD Send: ${message}`);
    client.send(message, 0, message.length, 55355, '127.0.0.1', function(err, bytes) {
        if (err) {
            throw err;
        }
    });
    return true;
}

/**
 * This is a synchronous call that uses deasync to wait for a response
 * from the read_buffer. When a response is recieved from RetroArch,
 * the data is put into the read_buffer waiting to be picked up.
 * After, clear the buffer as to not keep stale data around for next time.
 * TODO: Refactor this horrible function to be based on promises instead of
 *       forcing the main thread to sleep and wait.
 */
Driver.prototype.read_hex = function(address, length, retries = 50) {
    this.send_message(`READ_CORE_RAM ${address} ${length}`);

    // Wait for a response from the buffer.
    var loops = 0;
    require('deasync').loopWhile(function() {
        sleepms(650);
        loops += 1;
        logger.verbose(`Waiting on response from read buffer for address ${address} on loop ${loops}.`);
        return read_buffer[address] == null && loops < retries;
    });

    if (read_buffer[address] == null) {
        logger.warn(`Timed out when attempting to read address ${address}`);
        return null;
    } else {
        var hex = read_buffer[address];
        // Clear out the buffer for that address, this prevents old values
        // from being cached.
        read_buffer[address] = null;
        return hex;
    }
}

/**
 * RetroArch does not send response packets for WRITE_CORE_RAM.
 * We must assume the HEX was written into RetroArch properly.
 */
Driver.prototype.write_hex = function(address, hex_array) {
    return this.send_message(`WRITE_CORE_RAM ${address} ${hex_array.join(' ')}`);
}

module.exports = new Driver();
