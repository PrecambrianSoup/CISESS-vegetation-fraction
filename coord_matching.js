// Load the uploaded CSV file
var aggregatedData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Aggregation');

// Match dataset based on latitude and longitude
function matchDataset(feature) {
  // Extract latitude and longitude from the ground data for matching
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  var date = ee.Date(feature.get('Date')); // Date in YYYY-MM-DD format
  
  // Check if lat and lon are valid
  if (lat !== null && lon !== null) {
    // Define a coordinate at the latitude and longitude
    var point = ee.Geometry.Point([lon, lat]);
    
    // Load the dataset for matching
    var dataset = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
      .filterBounds(point)
      .filterDate(date, date.advance(1, 'day'))
      .first();
    
    // Extract satellite data attributes
    var data = dataset.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    });
    
    // Add matched satellite data to the new dataset
    feature = feature.set('I1', data.get('I1'));
    feature = feature.set('I2', data.get('I2'));
    feature = feature.set('I3', data.get('I3'));
    feature = feature.set('SolarZenith', data.get('SolarZenith'));
    feature = feature.set('SolarAzimuth', data.get('SolarAzimuth'));
    feature = feature.set('SensorZenith', data.get('SensorZenith'));
    feature = feature.set('SensorAzimuth', data.get('SensorAzimuth'));
    feature = feature.set('QF1', data.get('QF1'));
    feature = feature.set('QF2', data.get('QF2'));
    feature = feature.set('QF3', data.get('QF3'));
    feature = feature.set('QF4', data.get('QF4'));
    feature = feature.set('QF5', data.get('QF5'));
    feature = feature.set('QF6', data.get('QF6'));
    feature = feature.set('QF7', data.get('QF7'));
    
    return feature;
  }
}

// Apply the function to each feature in the aggregated data
var matchedData = aggregatedData.map(matchDataset);

// Print the first 40 elements to check for structure
var limitedData = matchedData.limit(40);
print('Limited Data (first 40 elements):', limitedData);

// Export the matched data to Google Drive
Export.table.toDrive({
  collection: matchedData,
  description: 'matched_data_export',
  fileFormat: 'CSV'
});
