'use strict';

let client = require( 'iotivity-node' ).client;
let ledList = {},
    count = 0,
    updateProperties = {
      range: [0, 255]
    };

var getResource = function (){
return new Promise((resolve, reject) => {

  function errorHandler(error){
    console.log('Response with error ', error.message);
  }
  
  client.on('error', errorHandler);

  client.on( "resourcefound", function( resource ) {
    console.log('-------' + resource.resourcePath);
      if(resource.resourcePath.indexOf('/a/rgbled') > -1 ||
        resource.resourcePath.indexOf('/a/buzzer') > -1){
          if (!(resource.resourcePath in ledList)) {
            ledList[resource.resourcePath] = resource;
            count++; 
          }
          if (count == 2) {
            setTimeout(() => {
              resolve(ledList);
            }, 2000);
          }
      } 
  })
  .findResources()
  .catch( function( error ) {
    console.log("Client: Starting device discovery failed: " +
      ( "" + error ) + "\n" + JSON.stringify( error, null, 4 ));
    reject(error);
  })
  setTimeout(() => {reject('Promise doesn\'t get fulfild result within 10000 ms, please try again')}, 10000);
});
}

var updateResource = function (resource, data){
  if (resource.resourcePath.indexOf('/a/buzzer') > -1 ) {
    resource.properties.value = data;
  }else {
    resource.properties.minRange = updateProperties.range[0];
    resource.properties.maxRange = updateProperties.range[1];
    resource.properties.RValue = data[0];
    resource.properties.GValue = data[1];
    resource.properties.BValue = data[2];
    console.log(resource.properties.RValue);
    console.log(resource.properties.GValue);
    console.log(resource.properties.BValue);
  }
  client.update(resource)
  .then(
      function(updateResource){
          if(updateResource == resource){
              console.log('updated resource');
          }
      },
      function(error){
          console.log('failed to update resource with error', JSON.stringify(error, null, 4));
      }
  )
  .catch((error) => {
     console.log('Failed to retrieve resource with error: ', error.message);
     process.exit(1);
  });
}

module.exports = {
  getResource: getResource,
  updateResource: updateResource
};

