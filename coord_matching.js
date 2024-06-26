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
    
    // Load the datasets for matching
    var VIIRS = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
      .filterBounds(point)
      .filterDate(date, date.advance(1, 'day'))
      .first();

    var MODIS = ee.ImageCollection("MODIS/061/MCD12Q1")
      .filterBounds(point)
      .filterDate('2001-01-01', '2022-01-01')
      .first();
    
    // Extract satellite data
    var VIIRSdata = VIIRS.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    });

    // Extract land cover type
    var MODISdata = dataset.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    });
    
    // Add matched satellite data to the new dataset
    feature = feature.set('I1', VIIRSdata.get('I1'));
    feature = feature.set('I2', VIIRSdata.get('I2'));
    feature = feature.set('I3', VIIRSdata.get('I3'));
    feature = feature.set('SolarZenith', VIIRSdata.get('SolarZenith'));
    feature = feature.set('SolarAzimuth', VIIRSdata.get('SolarAzimuth'));
    feature = feature.set('SensorZenith', VIIRSdata.get('SensorZenith'));
    feature = feature.set('SensorAzimuth', VIIRSdata.get('SensorAzimuth'));
    feature = feature.set('QF1', VIIRSdata.get('QF1'));
    feature = feature.set('QF2', VIIRSdata.get('QF2'));
    feature = feature.set('QF3', VIIRSdata.get('QF3'));
    feature = feature.set('QF4', VIIRSdata.get('QF4'));
    feature = feature.set('QF5', VIIRSdata.get('QF5'));
    feature = feature.set('QF6', VIIRSdata.get('QF6'));
    feature = feature.set('QF7', VIIRSdata.get('QF7'));

    // Add matched land cover type data to the new dataset
    feature = feature.set('IGBP_land_class', data.get('LC_Type1'));
    feature = feature.set('UMD_land_class', data.get('LC_Type2'));
    feature = feature.set('LAI_land_class', data.get('LC_Type3'));
    feature = feature.set('NPP_land_class', data.get('LC_Type4'));
    feature = feature.set('PFT_land_class', data.get('LC_Type5'));
    
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
