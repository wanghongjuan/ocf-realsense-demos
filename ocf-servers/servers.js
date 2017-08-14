var gpio = require('gpio');
var ocf = require('ocf');
var server = ocf.server;

var playNote = false,
    timerId = 0;

// Buzzer
var buzzer = gpio.open({ pin: 4, mode: 'out', activeLow: false }),
    buzzerResource = null,
    buzzerProperties = {
        value: buzzer.read()? 0 : 1
    },
    buzzerResourceInit = {
        resourcePath : '/a/buzzer',
        resourceTypes: [ 'oic.r.buzzer' ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : buzzerProperties
};

var led = gpio.open({ pin: 2, mode: 'out', activeLow: false }),
    ledResource = null,
    ledProperties = {
      value: led.read()? 0 : 1
    },
    ledResourceInit = {
      resourcePath : '/a/led',
      resourceTypes: [ 'oic.r.led' ],
      interfaces   : [ 'oic.if.baseline' ],
      discoverable : true,
      observable   : false,
      properties   : ledProperties
};

// Buzzer will beep as an alarm pausing
// for 0.8 seconds between.
function playTone() {
    if (playNote)
       buzzer.write(1);
    else
       buzzer.write(0);

    playNote = !playNote;
}

function updateProperties(properties) {
    var sensorState = properties.value;

    console.log('Update received. value: ', sensorState);

    if (sensorState) {
        timerId = setInterval(playTone, 800);
    } else {
        if (timerId)
            clearInterval(timerId);

        buzzer.write(0);
    }
}

function onRetrieveBuzzer(request) {
    request.respond(buzzerProperties);
}

function onUpdateBuzzer(request) {
    console.log('--------Debug: set properties value is: ' + request.data.properties.value);
    //updateProperties(request.data.properties);
    if (request.data.properties) {
        var state = request.data.properties.value? 1 : 0
        if (state == 1){
          timerId = setInterval(playTone, 800);
        } else {
          clearInterval(timerId);
        }
        console.log('state is: ' + state );
        console.log('Set buzzer ' + (state? 'On' : 'Off'));
        buzzer.write(buzzerProperties.value = state);
    }
    request.respond(buzzerProperties);
}

function onRetrieveLed(request, observe) {
    request.respond(ledProperties).then(function() {
        console.log('\trespond success');
    }).catch(function(error) {
        console.log('\trespond failure: ' + error.name);
    });
}

function onUpdateLed(request) {
    if (request.data.properties) {
        var state = request.data.properties.value? 1 : 0;
        console.log('Set LED state: ' + state);
        led.write(ledProperties.value = state);
    }
    request.respond(ledProperties);
}

server.register(buzzerResourceInit).then(function(resource) {
  console.log("Buzzer registered");
  buzzerResource = resource;
}).catch(function(error) {
  console.log('Buzzer registration failure: ' + error.name);
});

server.register(ledResourceInit).then(function(resource) {
  console.log("Led registered");
  ledResource = resource;
}).catch(function(error) {
  console.log('Led registration failure: ' + error.name);
});

server.on('retrieve', function(request, observe) {
  if(request.target.resourcePath == '/a/buzzer') {
    onRetrieveBuzzer(request);
  } else if(request.target.resourcePath == '/a/led') {
    onRetrieveLed(request);
  }
})

server.on('update', function(request) {
  if(request.target.resourcePath == '/a/buzzer') {
    console.log('----- Update request path is: ' + request.target.resourcePath);
    onUpdateBuzzer(request);
  } else if(request.target.resourcePath == '/a/led') {
    console.log('----- Update request path is: ' + request.target.resourcePath);
    onUpdateLed(request);
  }
})

ocf.start();
