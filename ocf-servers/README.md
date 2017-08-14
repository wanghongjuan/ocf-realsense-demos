# JavaScript OCF servers
This folder contains JavaScript implementation of the following OCF servers:
* Buzzer (x1)
* LED (x1)


# Setting up the OCF servers
## Setting up the HW
You need the devce and sensors in the following list:
* 1 x [Arduino 101](https://store.arduino.cc/usa/arduino-101)
* 1 x [Grove Buzzer](http://www.seeedstudio.com/wiki/Grove_-_Buzzer)
* 1 x [Grove LED Socket kit](http://wiki.seeedstudio.com/wiki/Grove_-_LED)

### Wiring
For Joule pin number, please refer to [here](https://www.zephyrproject.org/doc/boards/x86/arduino_101/doc/board.html#arduino-101-pinout)

|       Sensor      |   Pin  |          Link            |
|:-----------------:|:------:|:------------------------:|
| Buzzer            |   GPIO 4   |[Grove Buzzer](https://www.seeedstudio.com/Grove-Buzzer-p-768.html) |
| LED | GPIO 2 | [Grove LED Socket kit](http://wiki.seeedstudio.com/wiki/Grove_-_LED)|

Mount LED with Arduino 101 board as shown in the following picture (buzzer need to connect `SIG` to Pin `GPIO 4`):
![](../doc/sensor_connection.png)
