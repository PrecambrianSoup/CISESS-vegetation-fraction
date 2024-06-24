// Load the uploaded CSV file
var aggregatedData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Aggregation_Raw_Date');

// Function to convert date from YYYYMMDD to YYYY-MM-DD
function convertDate(dateStr) {
  // Extract year, month, and day from the date string
  var year = ee.String(dateStr).slice(0, 4);
  var month = ee.String(dateStr).slice(4, 6);
  var day = ee.String(dateStr).slice(6, 8);
  
  // Concatenate them into YYYY-MM-DD format
  var formattedDate = ee.String(year).cat('-').cat(month).cat('-').cat(day);
  
  return formattedDate;
}

// Match dataset based on latitude and longitude
function matchDataset(feature) {
  // Extract latitude and longitude from the ground data for matching
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  //var date = ee.Date(feature.get('Date'));
  var dateStr = ee.String(feature.get('Date')); // Date in YYYYMMDD format
  
  // Convert date string to YYYY-MM-DD format
  var formattedDateStr = convertDate(dateStr);
  
  // Convert formatted date string to ee.Date object
  var date = ee.Date(formattedDateStr);
  
  // Check if lat and lon are valid
  if (lat !== null && lon !== null) {
    // Define a coordinate at the latitude and longitude
    var point = ee.Geometry.Point([lon, lat]);
    
    // Load the dataset for matching
    var dataset = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
      .filterBounds(point)
      .filterDate(date, date.advance(1, 'day'))
      .first();
    
    // Extract satellite data attributes using reduceRegion
    var data = dataset.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    });
    
    // Add matched satellite data to the feature properties
    feature = feature.set('I1', data.get('I1'));
    feature = feature.set('I2', data.get('I2'));
    feature = feature.set('I3', data.get('I3'));
    feature = feature.set('SolarZenith', data.get('SolarZenith'));
    feature = feature.set('SolarAzimuth', data.get('SolarAzimuth'));
    feature = feature.set('SensorZenith', data.get('SensorZenith'));
    feature = feature.set('SensorAzimuth', data.get('SensorAzimuth'));
    
    return feature;
  }
}

// Apply the function to each feature in the aggregated data
var matchedData = aggregatedData.map(matchDataset);

// Print the first 40 elements to check for structure
var limitedData = matchedData.limit(40);
print('Limited Data (first 40 elements):', limitedData);

// Export the matched data to your Google Drive
Export.table.toDrive({
  collection: matchedData,
  description: 'matched_data_export',
  fileFormat: 'CSV'
});
