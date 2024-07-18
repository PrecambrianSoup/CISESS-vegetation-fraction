# CISESS-vegetation-fraction

For machine learning estimation of vegetation fraction based on satellite and ground cover data:

aggregation.py takes an input repo containing netCDF files with FCOVER data and aggregates them from native resolution to 500m pixel resolution.

matching.py appends reflectance and geometry data to the aggregated data from within Earth Engine. Data is matched by longitutde, latitude, and date.

data_prep.js filters the matched data based on quality flags and aggregation values.

model.py constructs a random forest regression model trained on the filtered dataset.
