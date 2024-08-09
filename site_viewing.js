// Load dataset
var csvData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Filtered_Results');

// Function to convert Lat/Lon columns to Point geometries
function createPoint(feature) {
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  var point = ee.Geometry.Point([lon, lat]);
  return ee.Feature(point).copyProperties(feature);
}

// Map the function over the FeatureCollection
var dataWithPoints = csvData.map(createPoint);

// Define visualization parameters
var visParams = {
  color: 'red',
  pointSize: 5,
};

// Create a map centered on the mean coordinates
var center = dataWithPoints.geometry().centroid();
Map.centerObject(center, 4); 

// Add the points to the map
Map.addLayer(dataWithPoints, visParams, 'Points from CSV');
