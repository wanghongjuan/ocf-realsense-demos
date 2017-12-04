// Copyright (c) 2017, Intel Corporation.

// Software requirements:
//     ZJS 0.4
// Hardware Requirements:
//     A mini fan.
//     A gas sensor.
//     An arduino 101 board.
// Wiring:
//     For mini fan:
//         Wire GND on the mini fan to GND on the Arduino 101
//         Wire VCC on the mini fan to VCC(5v) on the Arduino 101
//         Wire A5 on the mini fan to IO2 on the Arduino 101
//     For gas sensor:
//         Wire GND on the gas sensor to GND on the Arduino 101
//         Wire VCC on the gas sensor to VCC(5v) on the Arduino 101
//         Wire SIG on the gas sensor to A0 on the Arduino 101

var aio = require('aio');
var gpio = require('gpio');
var pins = require('arduino101_pins');
var ocf = require('ocf');

var server = ocf.server;
var GasSeneor = aio.open({pin: pins.A0});
var Fan = gpio.open({pin: 'IO2', mode: 'out'});

var sensorVolt, sensorValue, RS, airR0, threshold,
    ratio, fanStatus, delay, delayStatus;

// Data handler
function getAirR0() {
    sensorValue = 0;

    for (var i = 0; i < 100; i++) {
        sensorValue = sensorValue + GasSeneor.read();
    }

    sensorValue = sensorValue / 100;
    sensorVolt = sensorValue / 4096 * 3.3;
    RS = (3.3 - sensorVolt) / sensorVolt;
    airR0 = RS / 9.8;

    console.log('\nsensorVolt: ' + sensorVolt);
    console.log('airR0: ' + airR0);
}

function getRatio(R0) {
    sensorValue = GasSeneor.read();
    sensorVolt = sensorValue / 4096 * 3.3;
    RS = (3.3 - sensorVolt) / sensorVolt;
    ratio = RS / R0;

    console.log('\nsensorVolt: ' + sensorVolt);
    console.log('airR0: ' + R0);
    console.log('ratio: ' + ratio);
}

// Init gas sensor and fan
fanStatus = false;
delayStatus = false;
threshold = 8;
delay = 500;

getAirR0();
getRatio(airR0);
Fan.write(0);

// Init ocf
var PropertiesFan = {
    fanStatus: fanStatus,
    delayStatus: delayStatus,
    delay: delay
}
var ResourceInitFan = {
    resourcePath: '/a/fan',
    resourceTypes: ['oic.r.fan'],
    interfaces: ['oic.if.baseline'],
    discoverable: true,
    observable: true,
    secure: true,
    slow: false,
    properties: PropertiesFan
}

var PropertiesGasSensor = {
    sensorVolt: sensorVolt,
    airR0: airR0,
    threshold: threshold,
    ratio: ratio
}
var ResourceInitGas = {
    resourcePath: '/a/gas',
    resourceTypes: ['oic.r.gas'],
    interfaces: ['/oic/if/rw'],
    discoverable: true,
    observable: true,
    secure: true,
    slow: false,
    properties: PropertiesGasSensor
}

// Fan and gas sensor handler
var checkTimer = setInterval(function() {
    getRatio(airR0);
    PropertiesGasSensor.sensorVolt = sensorVolt;
    PropertiesGasSensor.airR0 = airR0;
    PropertiesGasSensor.ratio = ratio;

    if (ratio < threshold && fanStatus === false && delayStatus === false) {
        Fan.write(1);
        fanStatus = true;
        PropertiesFan.fanStatus = fanStatus;
    } else if (ratio >= threshold && fanStatus === true && delayStatus === false) {
        delayStatus = true;
        PropertiesFan.delayStatus = delayStatus;

        var delayTimer = setTimeout(function() {
            Fan.write(0);
            fanStatus = false;
            delayStatus = false;
            PropertiesFan.fanStatus = fanStatus;
            PropertiesFan.delayStatus = delayStatus;
        }, delay);
    }

    console.log('fanStatus: ' + fanStatus);
    console.log('delayStatus: ' + delayStatus);
    console.log('delay: ' + delay);
    console.log('threshold: ' + threshold);
}, 1000);

// Event handler
function onRetrieve(request, observe) {
    console.log('on("retrieve"): request.target.resourcePath = ' +
                request.target.resourcePath + ' observe = ' + observe);

    if (request.target.resourcePath === '/a/fan') {
        request.respond(PropertiesFan);
    } else if (request.target.resourcePath === '/a/gas') {
        request.respond(PropertiesGasSensor);
    } else {
        console.log('Resource requested does not exist');
    }
}

function onUpdate(request) {
    console.log('on("update"): request.target.resourcePath = ' +
                request.target.resourcePath);

    if (request.data.properties) {
        if (PropertiesFan.delay !== undefined &&
            request.data.properties.delay !== undefined) {
            PropertiesFan.delay = request.data.properties.delay;

            console.log('update PropertiesFan.delay = ' +
                        request.data.properties.delay);
        }

        if (PropertiesGasSensor.threshold !== undefined &&
            request.data.properties.threshold !== undefined) {
            PropertiesGasSensor.threshold = request.data.properties.threshold;

            console.log('update PropertiesGasSensor.threshold = ' +
                        request.data.properties.threshold);
        }
    }
}

server.on('retrieve', onRetrieve);
server.on('update', onUpdate);

// Regist server resources
server.register(ResourceInitFan).then(function(resource) {
    console.log('Fan registered');
}).catch(function(error) {
    console.log('Fan registration failure: ' + error.name +
                ' - ' + error.message);
});

server.register(ResourceInitGas).then(function(resource) {
    console.log('Gas Sensor registered');
}).catch(function(error) {
    console.log('Gas Sensor registration failure: ' + error.name +
                ' - ' + error.message);
});

// Start OCF server
ocf.start();
