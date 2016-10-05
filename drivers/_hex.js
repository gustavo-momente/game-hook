var logger = require('winston');
var util = require('util');

/* Initalize the Driver */
var BaseDriver = function() {};

BaseDriver.prototype.translate_hex_to_value = function(property, dictionary) {
    // Translation from HEX to readable values.
    if (property.type == "int") {
        return parseInt(property.hex.join(''), 16);
    } else if (property.type == "bool") {
        return parseInt(property.hex.join(''), 16) > 0;
    } else {

        /* Start logic for the dictionary */
        if (dictionary[property.type] == null) {
            logger.warn(`Cannot find a matching type in the dictionary for type ${property.type} at address ${property.address}.`);
            return false;
        } else {
            /*
              This forEach works for both object and string references.
              If the length is one - just return a single reference value.
              If the length is greater than one - return a concatenation.
              This just happens to work well for strings!
            */
            var result = [];
            var break_loop = false;
            property.hex.forEach(function(hex) {
                if (break_loop == true) {
                    return;
                }
                if (hex in dictionary[property.type]) {
                    var reference = dictionary[property.type][hex];
                    if (reference != null) {
                        // Found a reference for that HEX value in the dictionary.
                        result.push(reference);
                    } else {
                        // We have encountered a null, which stops the loop.
                        break_loop = true;
                    }
                } else {
                    logger.warn(`Cannot find a matching item in the dictionary ${property.type} for hex ${hex} at address ${property.address}.`);
                }
            });

            if (property.hex.length == 1) {
                return result[0];
            } else {
                return result.join('');
            }
            /* End logic for the dictionary */
        }
    }
}

BaseDriver.prototype.translate_value_to_hex = function(property, dictionary) {
    return false;
}

BaseDriver.prototype.read_property = function(property, dictionary) {
    property.hex = this.read_hex(property.address, property.length || 1);

    if (property.hex == null) {
        // The request timed out.
        return false;
    }

    if (property.type == null) {
        logger.warn(`No type defined for ${property.type} for address ${property.address}.`);
        return false;
    }

    if (property.nybble != null) {
        // The nybble is a half-byte. Hex can potentially be a single character.
        // This is most common for NES games.
        property.hex = [property.hex[0].charAt(property.nybble)];
    }

    property.value = this.translate_hex_to_value(property, dictionary);

    return property;
}


BaseDriver.prototype.write_property = function(property, new_value, dictionary) {
    var hex = null;
    if (property.type == null) {
        logger.warn(`No type for ${property.type} defined for address ${property.address}.`);
        return false;
    }

    // Translation from values to HEX.
    if (property.type == "int") {
        hex = [new_value.toString(16)];
    } else if (property.type == "bool") {
        if (new_value > 0) {
            hex = ["01"];
        } else {
            hex = ["00"];
        }
    } else {

        /* Start logic for the dictionary */
        if (dictionary[property.type] == null) {
            logger.warn(`Cannot find a matching type in the dictionary for type ${property.type} at address ${property.address}.`);
            return false;
        } else {
            /*
              This forEach works for both object and string references.
              If the length is one - just return a single reference value.
              If the length is greater than one - return a concatenation.
              This just happens to work well for strings!
            */
            var result = [];
            var break_loop = false;
            new_value.forEach(function(value) {
                if (break_loop == true) {
                    return;
                }
                if (hex in dictionary[property.type]) {
                    // TODO: Write the reverse of this.
                } else {
                    logger.warn(`Cannot find a matching item in the dictionary for hex ${hex} at address ${property.address}.`);
                }
            });

            if (property.hex.length == 1) {
                property.value = result[0];
            } else {
                property.value = result.join('');
            }
            /* End logic for the dictionary */
        }
    }

    if (property.nybble != null) {
        var hex = this.read_hex(property.address, property.length || 1);
        property.hex = [hex[0].charAt(property.nybble)];
    }

    if (hex) {
        this.write_hex(property.address, hex);
        return true;
    } else {
        return false;
    }
}

module.exports = BaseDriver;
