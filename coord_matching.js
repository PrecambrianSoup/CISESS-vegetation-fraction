// Load the uploaded CSV file
var aggregatedData = ee.FeatureCollection('projects/cisess-summer24-kyang/assets/FCOVER_Aggregation_Results');

// Match dataset based on latitude and longitude
function matchDataset(feature) {
  var lat = ee.Number(feature.get('Lat'));
  var lon = ee.Number(feature.get('Lon'));
  
  // Define a point at the latitude and longitude if valid
  if (lat !== null && lon !== null) {
    var point = ee.Geometry.Point([lon, lat]);
    
    // Load the dataset for matching
    var dataset = ee.ImageCollection("NOAA/VIIRS/001/VNP09GA")
      .filterBounds(point)
      .filterDate('2017-05-01', '2017-05-31')
      .first();
    
    // Extract the data value at the point
    var value = dataset.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point,
      scale: 500,
      maxPixels: 1e13
    });
    
    // Return the feature with the added dataset value
    return feature.set('matched_value', value);
  } else {
    // Print error if lat/lon are invalid
    print('Invalid Lat/Lon for feature:', feature);
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

print('Matching initiated')
