# CISESS-vegetation-fraction

For machine learning estimation of vegetation fraction based on satellite and ground cover data

aggregation takes an input repo containing netCDF files with FCOVER data and aggregates them from native
resolution to 500m pixel resolution

coord_matching appends reflectance and geometry data to the aggregated data, matching data based on longitutde and latitude

data_prep filters the matched data based on quality flags
