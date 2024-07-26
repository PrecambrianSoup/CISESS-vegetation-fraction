import os
import numpy as np
import pandas as pd
from datetime import datetime
from netCDF4 import Dataset as nc
import re

def read_readme(fn, doy):
    with open(fn, 'r') as file:
        text = file.read()
        # Find the Minimum DOY and Maximum DOY using regex
        pattern = r"Minimum day of year \(DOY\) = (\d+)\nMaximum DOY = (\d+)"
        match = re.search(pattern, text)
    
        # Checking if the doy are within the valid range as specified in the readme
        if match:
            min_doy = match.group(1)
            max_doy = match.group(2)
            if (doy > int(min_doy)) and (doy < int(max_doy)):
                return 0
            else:
                # Skip files with dates that are out of range
                print('DOY(%03d) Out of Range: %d-%d' % (doy, int(min_doy), int(max_doy)))
                return 1
        else:
            return 0

# setting path for the directory with NetCDF and README files
input_path = '/Users/katieyang/Downloads/LP05'

# setting path for creation of a result csv in the input directory
outdata = []
output_path = os.path.join(input_path, 'FCOVER_Aggregation_Results.csv')

# sets constants for the number of grid cells around earth and the distance covered by each grid cell
nx = 43200*2
dx = 360.0/nx

for fn in os.listdir(input_path):
    # process the file if it is a GBOV netcdf file and is native resolution
    if ('GBOV' in fn) and ('300M' not in fn) and fn.endswith(".nc"):
        print(fn)
        fname = os.path.join(input_path, fn)

        # Some native res files contain "20M" while others don't, so set the read me file name accordingly
        before, match, after = fn.partition('_20M')
        if match:
            fname2 = os.path.join(input_path, before+'_README.TXT')
        else:
            fname2 = os.path.join(input_path, fn[0:-7]+'_README.TXT')
        
        # Extracts satellite, site, and starting date info from the file name
        sat = fn[10:13]
        site = fn[14:18]
        date = fn[19:27]
        
        # Calculates the day of the year out of 365 days
        date = datetime.strptime(date, '%Y%m%d')
        doy = date.timetuple().tm_yday
        print(f"Parsed date from filename: {date}")
        
        # Checks if the date is within the valid range and skips to the next file if not
        doyflag = read_readme(fname2, doy)
        if doyflag:
            continue

        # Extracting latitude, longitude, FCOVER, quality flag, and 95% confidence interval data
        dataset = nc(fname)
        
        lat = dataset.variables['lat'][:,:]
        lon = dataset.variables['lon'][:,:]
        fc = dataset.variables['FCOVER'][:,:]
        qfin = dataset.variables['QF_IN'][:,:]
        qfout = dataset.variables['QF_OUT'][:,:]
        cl = dataset.variables['CL_95'][:,:]
        
        # Converting latitude and longitude into VNP09 grid indices
        iy = np.round((90-dx/2-lat)/dx)
        ix = np.round((lon*np.cos(lat*np.pi/180.0)-dx/2+180)/dx)

        # Determines the number of unique grid cells
        idx = ix + iy*nx
        
        idx_unq = np.unique(idx)
        n = len(idx_unq)
        
        # Masking to ignore data with invalid input/output flags or invalid FCOVER data
        mask = (qfin == 0) & (qfout == 0) & (fc >= 0)
        
        for i in range(0,n):
            # Find the number of pixels that have the same index for each unique grid index and filters to find the number of valid pixels
            tmp1 = idx == idx_unq[i]
            pixels = np.count_nonzero(tmp1)
            tmp2 = (idx == idx_unq[i]) & mask
            valid_pixels = np.count_nonzero(tmp2)

            # Calculates the percentage of valid pixels and aggregates if over 50% are valid and there are over 100 of them
            percent_agg = valid_pixels*100.0/pixels

            if percent_agg > 50 and valid_pixels > 100:
                # Calculates the mean fcover, standard deviation, and center longitude/latitude of the grid cell
                agg_fc = np.mean(fc[tmp2])
                std_fc = np.std(fc[tmp2])
                lat_centered = (90-dx/2 - (idx_unq[i]/nx)*dx)
                lon_centered = (((idx_unq[i] % nx)*dx + dx/2 - 180)/np.cos(lat_centered*np.pi/180.0))
                outdata.append([date, sat, site, lat_centered, lon_centered, agg_fc, std_fc, pixels, percent_agg])

df = pd.DataFrame(outdata, columns = ['Date','Sat','Site','Lat','Lon','FC500m','FCSTD','AggNum','AggPcnt'])

df.to_csv(output_path, index=False, date_format='%Y-%m-%d')

print(f"Aggregated data has been saved to {output_path}")
