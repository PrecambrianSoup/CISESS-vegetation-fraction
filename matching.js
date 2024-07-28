// Load the uploaded CSV file
var aggregatedData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Aggregation_Results');

// Match dataset based on latitude and longitude
function matchDataset(feature) {
  // Extract latitude and longitude from the ground data for matching
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  
  // Check if lat and lon are valid
  if (lat !== null && lon !== null) {
    // Define a coordinate at the latitude and longitude
    var point = ee.Geometry.Point([lon, lat]);
    
    // Load the datasets for matching
    var VIIRSdataset = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
      .filterBounds(point)
      .first();
    
    var IGBPdataset = ee.ImageCollection("MODIS/061/MCD12Q1")
      .filterBounds(point)
      .first();
    
    // Check if dataset is not null
    if (VIIRSdataset) {
      // Extract satellite data attributes using reduceRegion
      var data = VIIRSdataset.reduceRegion({
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
      feature = feature.set('QF1', data.get('QF1'));
      feature = feature.set('QF2', data.get('QF2'));
      feature = feature.set('QF3', data.get('QF3'));
      feature = feature.set('QF4', data.get('QF4'));
      feature = feature.set('QF5', data.get('QF5'));
      feature = feature.set('QF6', data.get('QF6'));
      feature = feature.set('QF7', data.get('QF7'));
    }
    
    if (IGBPdataset){
      var class_data = IGBPdataset.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: point,
        scale: 500,
        maxPixels: 1e13
      });
      
      feature = feature.set('IGBP_LC', class_data.get('LC_Type1'));
    }
  } 
  return feature;
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
