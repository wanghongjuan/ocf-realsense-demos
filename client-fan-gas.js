// Copyright (c) 2017, Intel Corporation.

var ocf = require('ocf');

var client = ocf.client;

// Fan running delay, can be modified
var delay = 20000;
// Threshold of gas sensor detection, can be modified
var threshold = 5;

// Event handler
function onUpdate(resource) {
}

function onError(error) {
    if (error.deviceId) console.log('Device error: ' + error.deviceId);
}

function onfound(resource) {
}

client.on('update', onUpdate);
client.on('error', onError);

// Start OCF client
ocf.start();

var gasTimer;
client.findResources({resourceType:'oic.r.fan', observable: true},
                     onfound).then(function(resource) {
    console.log('Find fan server successful: deviceId=' + resource.deviceId);

    client.retrieve(resource.deviceId).then(function(res) {
        console.log('\nFan status:');
        console.log('Properties.fanStatus: ' + res.properties.fanStatus);
        console.log('Properties.delayStatus: ' + res.properties.delayStatus);
        console.log('Properties.delay: ' + res.properties.delay);
    }).catch(function(error) {
    });

    resource.properties.delay = delay;
    client.update(resource).then(function(res) {
    }).catch(function(error) {
    });
}).catch(function(error) {
    console.log('Find fan server failure: ' + error.name +
                ' - ' + error.message);
});

client.findResources({resourceType:'oic.r.gas', observable: true},
                     onfound).then(function(resource) {
    console.log('Find gas server successful: deviceId=' + resource.deviceId);

    gasTimer = setInterval(function() {
        client.retrieve(resource.deviceId).then(function(res) {
            console.log('\nGas sensor status:');
            console.log('Properties.sensorVolt: ' + res.properties.sensorVolt);
            console.log('Properties.airR0: ' + res.properties.airR0);
            console.log('Properties.threshold: ' + res.properties.threshold);
            console.log('Properties.ratio: ' + res.properties.ratio);
        }).catch(function(error) {
        });
    }, 2000);

    resource.properties.threshold = threshold;
    client.update(resource).then(function(res) {
    }).catch(function(error) {
    });
}).catch(function(error) {
    console.log('Find gas server failure: ' + error.name +
                ' - ' + error.message);
});
