# RealSense OCF Demos
These samples illustrate how to develop applications using Intel® RealSense™ JavaScript [API](https://01org.github.io/node-realsense/doc/spec) and Open Connectivity Foundation™ ([OCF](https://openconnectivity.org)) JavaScript [API](https://github.com/01org/zephyr.js/blob/master/docs/ocf.md).

## Architecture

![Image](./doc/sh-ocf-arc.png?raw=true)

## Demos
The following demos are provided in this release.
 - **Controling light by distance**(demo1): This sample app illustrates the use of libRealsense, libPT, and the Linux SDK Framework to use the ZR300 camera's depth and color sensors to detect people in the scene. Detected person in the scene will be displayed with the distance information on screen. Meanwhile, the led light will be on and off according to the person's position changing.
 - **Controling light/buzzer by person recognition**(demo2)：This sample app illustrates how to register new users to the database, upload the database to identify them when they appear in the scene. Recognized person in the scene will light a green led, otherwise light a red one and open buzzer.
 - **Controling fan turn on by gas density**: Transform fan status as density information of gas.
 - **Presenting Temperture and Humidity statys on LCD Panel**.

## Get Start

### Hardware

- PC with Ubuntu 16.04 which support BLE
- [Arduino 101](https://store.arduino.cc/usa/arduino-101)
- [Intel® RealSense™ Camera ZR300](https://newsroom.intel.com/chip-shots/intel-announces-tools-realsense-technology-development/)
- [Grove Chainable RGB LED](http://www.seeedstudio.com/depot/twig-chainable-rgb-led-p-850.html?cPath=156_157)
- [Grove Buzzer](http://wiki.seeed.cc/Grove-Buzzer/)
- [Grove Base Shield](https://www.seeedstudio.com/Base-Shield-V2-p-1378.html) (optional)
- [Grove Mini Fan](http://www.seeedstudio.com/wiki/Grove_-_Mini_Fan)
- [Grove Gas Sensor(MQ2)](http://www.seeedstudio.com/depot/Grove-Gas-SensorMQ2-p-937.html)
- [Grove Temperature & Humidity sensor](http://wiki.seeed.cc/Grove-TemptureAndHumidity_Sensor-High-Accuracy_AndMini-v1.0/)
- [Grove LCD RGB panel](http://www.seeedstudio.com/wiki/Grove_-_LCD_RGB_Backlight)


### Setup RealSense Execution Environment on Ubuntu

1. Please refer to this [tutorial](https://github.com/01org/node-realsense/blob/master/doc/setup_environment.md) for details introduction.

2. There are some dependencies(uuid-dev, libcure4-openssl-dev and a C++ compiler (gcc-5 or later) etc.) need to install at first, you can install them via command:
   ```
   # sudo apt-get install uuid-dev libcurl4-openssl-dev libboost-all-dev sqlite3 glib2.0-dev scons
   ```
3. Install [`iotivity-node`](https://github.com/otcshare/iotivity-node) via command `npm install iotivity-node@1.2.1-1`, for detail information, please refer to [here](https://github.com/otcshare/iotivity-node/blob/master/README.md).

4. Establish a BLE Connection from Arduino 101 on host:
The OCF server communicates with the OCF client or gateway over BLE through 6LoWPAN. Please reference this [document](https://github.com/01org/zephyr.js/blob/master/docs/6lowpan-ble.md#linux-setup) to build and run a ZJS IP application that uses 6LoWPAN as its IP transport.

5. Execute belows commands to start this demo journey:
   ```bash
   # git clone https://github.com/wanghongjuan/ocf-realsense-demos.git
   # cd ocf-realsense-demos
   ```
   Please follow below guide to set up zjs ocf server environment at first, then you can enter directory "demo1" or "demo2", following the corresponding README file to launch the demo. 


### Setup OCF Server Test Environment on Arduino 101
1. Please follow this [instruction](https://github.com/01org/zephyr.js/blob/master/README.md#getting-started) to setup the environment on host and board Arduino 101(A101).
* Tips: The ZJS OCF API has been extended to support multiple resource registrations with [this commit](https://github.com/01org/zephyr.js/commit/5d1674a724ba202bf966a4b2b66d50f80a0acb78), ZJS version 0.3 and below won't work with the script in folder ocf-server, you should either remain on the master branch or checkout the branch for version 0.4 or above once it’s available, we recommend you use the commit that is validation

2. Please refer to this [guidance](./ocf-servers/README.md#setting-up-the-hw) to setup the sensors on this board

3. Build and flash the ocf-servers/server.js image to A101 board with ZJS:
```
$ cd $ZJS_BASE
~/zephyr.js $ make ROM=256 JS=<Path to ocf-servers>/servers.js
```
The `ROM=256` parameter in the above command instructs the linker to allocate 256KB for x86 as the default partition size is not sufficient. Reference the [Getting more space on your Arduino 101](https://github.com/01org/zephyr.js#getting-more-space-on-your-arduino-101) section in the ZJS project for more information.

Then connect the A101 to your development host with a USB A/B cable, press the onboard `Master Reset` button, and flash the A101 board with the following command in few seconds:
```
~/zephyr.js $ make dfu
```

After successfully flashing both ARC and x86 images to the Arduino 101 board, press the `Master Reset` button again to run the uploaded OCF server script.
