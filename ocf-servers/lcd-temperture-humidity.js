// Copyright (c) 2017, Intel Corporation.

// Software requirements:
//     ZJS 0.4
// Hardware Requirements:
//     A TH02 temperature & humidity sensor.
//     A Grove LCD.
//     A base shiled
//     An arduino 101 board.

/*
 * Grove base shield configurations for the sensors supported by this script
 *     +--------------------------------------+------+
 *     | Sensor                               | Port |
 *     +--------------------------------------+------+
 *     | Grove LCD                            | I2C  |
 *     | TH02 temperature & humidity sensor   | I2C  |
 *     +--------------------------------------+------+
 */

var i2c = require('i2c');
var board = require('arduino101_pins');
var grove_lcd  = require('grove_lcd');
var ocf = require('ocf');
var server = ocf.server;

console.log('Starting OCF servers...');

// Grove LCD
try{
    var glcd = grove_lcd.init();
    var funcConfig = grove_lcd.GLCD_FS_ROWS_2
                | grove_lcd.GLCD_FS_DOT_SIZE_LITTLE
                | grove_lcd.GLCD_FS_8BIT_MODE;
    glcd.setFunction(funcConfig);

    var displayStateConfig = grove_lcd.GLCD_DS_DISPLAY_ON;
    glcd.setDisplayState(displayStateConfig);

    glcd.clear();
    glcd.setCursorPos(0, 0);
    glcd.print('T & H Demo...');
} catch(err){
    console.log('error is: ' + err);
}


// Grove Temperature & Humidity Sensor (High-Accuracy & Mini)
// http://www.hoperf.com/upload/sensor/TH02_V1.1.pdf
var TH02_I2C_ADDR = 0x40,       // TH02 I2C device address
    TH02_STATUS = 0,            // TH02 register addresses
    TH02_DATAh  = 1,
    TH02_DATAl  = 2,
    TH02_CONFIG = 3,
    TH02_ID     = 17,
    TH02_STATUS_RDY   = 0x01,   // Bit fields of TH02 registers
    TH02_CONFIG_START = 0x01,
    TH02_CONFIG_HEAT  = 0x02,
    TH02_CONFIG_TEMP  = 0x10,
    TH02_CONFIG_HUMI  = 0x00,
    TH02_CONFIG_FAST  = 0x20,
    TH02_ID_VAL       = 0x50;

var i2cBus = i2c.open({ bus: 0, speed: 100 });

var resPathTemperature = '/a/temperature',
    resTypeTemperature = 'oic.r.temperature',
    temperatureResource = null,
    temperatureProperties = {
        temperature: 25.0,
        units: 'C'
    },
    temperatureResourceInit = {
        resourcePath : resPathTemperature,
        resourceTypes: [ resTypeTemperature ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : false,
        properties   : temperatureProperties
    };

var resPathHumidity = '/a/humidity',
    resTypeHumidity = 'oic.r.humidity',
    humidityResource = null,
    humidityProperties = {
        humidity: 80
    },
    humidityResourceInit = {
        resourcePath : resPathHumidity,
        resourceTypes: [ resTypeHumidity ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : false,
        properties   : humidityProperties
    };

function writeRegister(reg, value) {
    i2cBus.write(TH02_I2C_ADDR, new Buffer([ reg, value ]));
}

function readRegister(reg) {
    return i2cBus.burstRead(TH02_I2C_ADDR, 1, reg);
}

function getId() {
    return readRegister(TH02_ID).readUInt8();
}

function getStatus() {
    return readRegister(TH02_STATUS).readUInt8();
}

function getConfig() {
    return readRegister(TH02_CONFIG).readUInt8();
}

function setConfig(config) {
    writeRegister(TH02_CONFIG, config);
}

function readTemperature(cb) {
    if ((getId() == TH02_ID_VAL) && !(getConfig() & TH02_CONFIG_START)) {
        setConfig(TH02_CONFIG_START | TH02_CONFIG_TEMP);
        var tid = setInterval(function() {
            if (!(getConfig() & TH02_CONFIG_START) && (getStatus() & TH02_STATUS_RDY)) {
                var data = i2cBus.burstRead(TH02_I2C_ADDR, 2, TH02_DATAh).readUInt16BE();
                data = (data >> 2) / 32 - 50;
                if (cb != null) cb(data);
                clearInterval(tid);
            }
        }, 50);
    }
}

function readHumidity(cb) {
    if ((getId() == TH02_ID_VAL) && !(getConfig() & TH02_CONFIG_START)) {
        setConfig(TH02_CONFIG_START);
        var tid = setInterval(function() {
            if (!(getConfig() & TH02_CONFIG_START) && (getStatus() & TH02_STATUS_RDY)) {
                var data = i2cBus.burstRead(TH02_I2C_ADDR, 2, TH02_DATAh).readUInt16BE();
                data = (data >> 4) / 16 - 24;
                if (cb != null) cb(data);
                clearInterval(tid);
            }
        }, 50);
    }
}

function getTemperatureOcRepresentation(request) {
    request.respond(temperatureProperties);
}

function getHumidityOcRepresentation(request) {
    request.respond(humidityProperties);
}


// Register Listeners
server.register(temperatureResourceInit).then(function(resource) {
    console.log('Temperature sensor registered');
    temperatureResource = resource;
}).catch(function(error) {
    console.log('Registration failure: ' + error.name);
});

server.register(humidityResourceInit).then(function(resource) {
    console.log('Humidity sensor registered');
    humidityResource = resource;
}).catch(function(error) {
    console.log('Registration failure: ' + error.name);
});

server.on('retrieve', function(request, observe) {
    if (request.target.resourcePath == resPathTemperature) {
        getTemperatureOcRepresentation(request);
    } else if (request.target.resourcePath == resPathHumidity) {
        getHumidityOcRepresentation(request);
    }
});


// Periodically sense temperature & humidity
setInterval(function() {
    readTemperature(function(temperature) {
        console.log('temperature: ' + temperature);
        temperatureProperties.temperature = temperature;
    });
    setTimeout(readHumidity, 500, function(humidity) {
        console.log('humidity: ' + humidity);
        humidityProperties.humidity = humidity;
        glcd.setColor(0, 255, 0);
        glcd.setCursorPos(0, 0);
        console.log()
        glcd.clear();
        glcd.print('H: ' + (humidity * 10 | 0) / 10 + '%rh');
        glcd.setCursorPos(0, 1);
        newTemp = (temperatureProperties.temperature * 10 | 0) / 10;
        glcd.print('T: ' + newTemp + 'C');
    });
}, 1000);

/* Start the OCF stack */
ocf.start();
