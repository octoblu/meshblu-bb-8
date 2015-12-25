var sphero = require("sphero"),
    bb8 = sphero("6675371c24f5472180c28d2fdf9ee73a"); // change BLE address accordingly

bb8.connect(function() {
  bb8.color({ red: 0, green: 0, blue: 0 });
  // roll BB-8 in a random direction, changing direction every second

});
