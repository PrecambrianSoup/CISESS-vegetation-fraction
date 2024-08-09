# CISESS-vegetation-fraction

For comparing machine learning estimation of vegetation fraction based on satellite and ground cover data:

aggregation.py takes an input repo containing netCDF files with FCOVER data and aggregates them from native resolution to 500m pixel resolution.

matching.js appends reflectance and geometry data to the aggregated data from within Earth Engine. Data is matched by longitutde, latitude, and date.

data_prep.py filters the matched data based on quality flags and aggregation values.

random_forest_model.py, cubist_model.py, svm_model.py, and neural_network.py construct respective machine learning models trained on the filtered dataset.
