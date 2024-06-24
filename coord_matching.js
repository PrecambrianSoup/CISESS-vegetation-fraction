# Matches reflectance dataset to aggregated FCOVER data by latitude and longitude

// Load the uploaded CSV file
var aggregatedData = FCOVER_Agg_Results;

// Match dataset based on latitude and longitude
function matchDataset(feature) {
  // Extract latitude and longitude from the feature
  var lat = feature.geometry().coordinates().get(1);
  var lon = feature.geometry().coordinates().get(0);
  
  // Define a point at the latitude and longitude
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
    scale: 500
  });
  
  // Return the feature with the added dataset value
  return feature.set('matched_value', value);
}

// Apply the function to each feature in the aggregated data
var matchedData = aggregatedData.map(matchDataset);

// Print the matched data
print(matchedData);

// Export the matched data to your Google Drive
Export.table.toDrive({
  collection: matchedData,
  description: 'matched_data_export',
  fileFormat: 'CSV'
});
