// Load the uploaded CSV file as a FeatureCollection
var fcoverData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Estimation_Results');

// Transform the points to include geometries
var fcoverPoints = fcoverData.map(function(feature) {
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  var point = ee.Geometry.Point([lon, lat]);
  return feature.setGeometry(point);
});

// Limit the number of points for better performance
var sampledFcoverPoints = fcoverPoints.limit(80000);

// Define visualization parameters for FCover predictions
var visParams = {
  min: 0, 
  max: 1, 
  palette: ['red', 'yellow', 'green']
};

// Create an image from the points using the FCover predictions
var fcoverImage = sampledFcoverPoints.reduceToImage({
  properties: ['FCover_Prediction'],
  reducer: ee.Reducer.mean()  // Aggregates the FCover values
}).reproject({
  crs: 'EPSG:4326',
  scale: 1000  // Adjust scale as necessary
}).reduceResolution({
  reducer: ee.Reducer.mean(),
  maxPixels: 1024
});

// Add the FCover prediction image to the map
Map.centerObject(fcoverData, 4);  // Center and zoom on the entire dataset
Map.addLayer(fcoverImage, visParams, 'FCover Predictions');

// Optional: Add the sampled points themselves
Map.addLayer(sampledFcoverPoints, {color: 'blue'}, 'Sampled FCover Points');
