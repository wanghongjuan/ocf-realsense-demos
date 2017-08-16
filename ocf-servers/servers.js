var gpio = require('gpio');
var ocf = require('ocf');
var server = ocf.server;

console.log('Debug server is :' + server);

var rgbValue = [0, 0, 0],
    clockPin, dataPin;

clockPin = gpio.open({ pin: 'IO7', mode: 'out', activeLow: false });
dataPin = gpio.open({ pin: 'IO8', mode: 'out', activeLow: false });

// Buzzer
var buzzer = gpio.open({ pin: 'IO2', mode: 'out', activeLow: false }),
    buzzerResPath = '/a/buzzer',
    buzzerResType = 'oic.r',
    buzzerResource = null,
    buzzerProperties = {
        value: buzzer.read()? true : false
    },
    buzzerResourceInit = {
        resourcePath : buzzerResPath,
        resourceTypes: [ buzzerResType ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : buzzerProperties
    };


//RGB LED
function getProperties() {
    // Format the payload.
    var properties = {
        //rt: resourceTypeName,
        id: 'rgbled',
        rgbValue: rgbValue,
        range: [0, 255]
    };

    console.log('Send the response. value: ', rgbValue);
    return properties;
}

var ledResPath = '/a/rgbled',
    ledResource,
    ledProperties = getProperties(),
    ledResourceInit = {
        resourcePath: ledResPath,
        resourceTypes: ['oic.r.colour.rgb'],
        interfaces: ['oic.if.baseline'],
        discoverable: true,
        observable: true,
        properties: ledProperties
    },
    desiredLedProperties = {
        id: ledResourceInit.properties.id,
        minRange: ledResourceInit.properties.range[0],
        maxRange: ledResourceInit.properties.range[1],
        RValue: ledResourceInit.properties.rgbValue[0],
        GValue: ledResourceInit.properties.rgbValue[1],
        BValue: ledResourceInit.properties.rgbValue[2]
    };

function clk() {
    if (!gpio)
        return;

    clockPin.write(0);
    clockPin.write(1);
}

function sendByte(b) {
    if (!gpio)
        return;

    // send one bit at a time
    for (var i = 0; i < 8; i++) {
        if ((b & 0x80) != 0)
            dataPin.write(1);
        else
            dataPin.write(0);

        clk();
        b <<= 1;
    }
}

function sendColour(red, green, blue) {
    // start by sending a byte with the format '1 1 /B7 /B6 /G7 /G6 /R7 /R6'
    var prefix = 0xC0;

    if ((blue & 0x80) == 0) prefix |= 0x20;
    if ((blue & 0x40) == 0) prefix |= 0x10;
    if ((green & 0x80) == 0) prefix |= 0x08;
    if ((green & 0x40) == 0) prefix |= 0x04;
    if ((red & 0x80) == 0) prefix |= 0x02;
    if ((red & 0x40) == 0) prefix |= 0x01;

    sendByte(prefix);

    sendByte(blue);
    sendByte(green);
    sendByte(red);
}

// Set the RGB colour
function setColourRGB(red, green, blue) {
    // send prefix 32 x '0'
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);

    sendColour(red, green, blue);

    // terminate data frame
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
}

function checkColour(colour, range) {
    var min = range[0];
    var max = range[1];

    if (colour >= min && colour <= max)
        return true;

    return false;
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    var input = [properties.RValue, properties.GValue, properties.BValue],
        range = [properties.minRange, properties.maxRange];
    console.log('updateProperties range: ' +  range[0] + range[1]);
    if (!input)
        return;

    var r = parseInt(input[0]);
    var g = parseInt(input[1]);
    var b = parseInt(input[2]);
    console.log('updateProperties rgbValue: ' + input);
    if (!checkColour(r, range) || !checkColour(g, range) || !checkColour(b, range))
        return;

    setColourRGB(r, g, b);
    rgbValue = input;

    console.log('Update received. value: ', rgbValue);
}

function handleError(error) {
    console.log('Failed to send response with error: ', error);
}

function onretrieve(request, observe) {
    if(request.target.resourcePath == buzzerResPath) {
         request.respond(buzzerProperties);
    } else if(request.target.resourcePath == ledResPath){
        console.log('\nonretrieve: ' + request.target.resourcePath);
        ledResourceInit.properties = getProperties();
        request.respond(desiredLedProperties)//.catch(handleError);
        .then(function(){
            console.log('retrieve success');
        },
        function(error){
            console.log('failed to retrieve: '+ error);
        })
    }
    //server.removeEventLister("retrieve", onretrieve);
}

function onupdate(request){
    if(request.target.resourcePath == buzzerResPath) {
        if (request.data.properties) {
            var state = request.data.properties.value? true : false;
            console.log('Set buzzer ' + (state? 'On' : 'Off'));
            buzzer.write(buzzerProperties.value = state);
        }
        request.respond(buzzerProperties);
    } else if(request.target.resourcePath == ledResPath){
        console.log('\nupdate resource resourcePath: ' + request.data.deviceId);
        if(request.data.properties) {
            console.log('minRange is: ' + request.data.properties.minRange);
            console.log('maxRange is: ' + request.data.properties.maxRange);
            console.log('RValue is: ' + request.data.properties.RValue);
            console.log('GValue is: ' + request.data.properties.GValue);
            console.log('BValue is: ' + request.data.properties.BValue);
            
            updateProperties(request.data.properties);
            ledResourceInit.properties = getProperties();
        }
        request.respond(desiredLedProperties).catch(handleError);
    }
    //server.removeEventLister("update", onupdate);
}

console.log('Started OCF Server...');

//RGBLED register
server.register(ledResourceInit).then(function(resource) {
    console.log('RGB LED registered');
    ledResource = resource;
    setColourRGB(0, 0, 0);
}, function(error) {
    console.log('RGB LED registration failure: ' + error.name);
});

// buzzer register
server.register(buzzerResourceInit).then(function(resource) {
    console.log('Buzzer registered');
    buzzerResource = resource;
}).catch(function(error) {
    console.log('Buzzer registration failure: ' + error.name);
});

// Register Listeners
server.on('retrieve', function(request, observe) {
    onretrieve(request);
});

server.on('update', function(request, observe) {
    onupdate(request);
})

/* Start the OCF stack */
ocf.start();
