// Load the uploaded CSV file
var aggregatedData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Aggregation_Results');

// Match dataset based on latitude, longitude, and date
function matchDataset(feature) {
  // Extract latitude, longitude, and date from the ground data for matching
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  var dateString = feature.get('Date');
  
  // Convert dateString to ee.Date
  var date = ee.Date(dateString); // Assuming date is in "YYYY-MM-DD" format
  
  // Define a coordinate at the latitude and longitude
  var point = ee.Geometry.Point([lon, lat]);
  
  // Load the datasets for matching using filterDate
  var VIIRScollection = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
    .filterBounds(point)
    .filterDate(date, date.advance(1, 'day'));
    
  var IGBPcollection = ee.ImageCollection("MODIS/061/MCD12Q1")
    .filterBounds(point)
    .filterDate('2020-01-01', '2022-12-31');
  
  var VIIRSdataset = VIIRScollection.first();
  var IGBPdataset = IGBPcollection.first();
  
  // Define the default properties with null values
  var defaultVIIRSProperties = {
    'I1': null, 'I2': null, 'I3': null, 'SolarZenith': null,
    'SolarAzimuth': null, 'SensorZenith': null, 'SensorAzimuth': null,
    'QF1': null, 'QF2': null, 'QF3': null, 'QF4': null,
    'QF5': null, 'QF6': null, 'QF7': null
  };

  var defaultIGBPProperties = {'LC_Type1': null};

  // Set VIIRS data or default null values
  var VIIRSProperties = ee.Dictionary(ee.Algorithms.If(
    VIIRSdataset,
    VIIRSdataset.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    }).select(['I1', 'I2', 'I3', 'QF1', 'QF2', 'QF3', 'QF4', 'QF5', 'QF6', 'QF7', 'SolarZenith', 'SolarAzimuth', 'SensorZenith', 'SensorAzimuth']),
    defaultVIIRSProperties
  ));

  feature = feature.setMulti(VIIRSProperties);

  // Set IGBP data or default null values
  var IGBPProperties = ee.Dictionary(ee.Algorithms.If(
    IGBPdataset,
    IGBPdataset.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    }).select(['LC_Type1']),
    defaultIGBPProperties
  ));

  feature = feature.setMulti(IGBPProperties);

  return feature;
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
