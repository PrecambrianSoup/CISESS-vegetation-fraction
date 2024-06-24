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
    
        if match:
            min_doy = match.group(1)
            max_doy = match.group(2)
            if (doy > int(min_doy)) and (doy < int(max_doy)):
                return 0
            else:
                print('DOY(%03d) Out of Range: %d-%d' % (doy, int(min_doy), int(max_doy)))
                return 1
        else:
            print("DOY information not found in the text.")
            return 1

# setting path for the directory with NetCDF and README files
input_path = '/Users/katieyang/Downloads/LP05'

# setting path for creation of a result csv in the input directory
outdata = []
outfn = os.path.join(input_path, 'FCOVER_Aggregation_Results.csv')

# sets constants for the number of grid points and degrees of grid spacing
nx = 43200*2        
dx = 360.0/nx
dx_grid = 360/43200.0/2
        
for fn in os.listdir(input_path):
    # process the file if it is a GBOV netcdf file and is native resolution (not 300M)
    if ('GBOV' in fn) and ('300M' not in fn) and ('20M' not in fn) and fn.endswith(".nc"):
        print(fn)
        fname = os.path.join(input_path, fn)
        fname2 = os.path.join(input_path, fn[0:-7]+'_README.TXT')
        
        # Extracts satellite, site, and starting date info from the file name
        strsat = fn[10:13]
        strsite = fn[14:18]
        strdate = fn[19:27]
        
        # Calculates the day of the year out of 365 days and shifts it to the start of an 8-day period
        date = datetime.strptime(strdate, '%Y%m%d')
        doy = date.timetuple().tm_yday
        doy_8d = int(doy/8)*8 + 1
        
        # Checks if the date is within the valid range and skips to the next file if not
        doyflag = read_readme(fname2, doy)
        if doyflag:
            continue

        # Converts the date to YYYY-DOY format
        strdoy = '%03d' % doy_8d        
        dir_date = datetime.strptime(strdate[0:4] + "-" + strdoy, "%Y-%j").strftime("%Y.%m.%d")

        #GLASS01E01.V60.A2021001.h00v08.2022139.hdf

        # Extracting latitude, longitude, FCOVER, quality flag, and 95% confidence interval data
        dataset = nc(fname)
        
        lat = dataset.variables['lat'][:,:]
        lon = dataset.variables['lon'][:,:]
        fc = dataset.variables['FCOVER'][:,:]
        qfin = dataset.variables['QF_IN'][:,:]
        qfout = dataset.variables['QF_OUT'][:,:]
        cl = dataset.variables['CL_95'][:,:]
        
        # Converting latitude and longitude into grid indices and determines the number of grid cells
        iy = np.round((90-dx/2-lat)/dx)
        ix = np.round((lon*np.cos(lat*np.pi/180.0)-dx/2+180)/dx)

        idx = ix + iy*nx
        
        idx_unq = np.unique(idx)
        n = len(idx_unq)
        
        # Masking to ignore data with invalid input/output flags or invalid FCOVER data
        mask = (qfin == 0) & (qfout == 0) & (fc >= 0)
        
        for i in range(0,n):
            # Find the number of pixels that have the same pixel index and filters to find ones that are unmasked
            tmp1 = idx == idx_unq[i]
            nall = np.count_nonzero(tmp1)
            tmp2 = (idx == idx_unq[i]) & mask
            nagg = np.count_nonzero(tmp2)

            # Calculates the percentage of valid pixels and aggregates if over half are valid
            pagg = nagg*100.0/nall

            if pagg > 50:
                # Calculates the mean, standard deviation, and center longitude and latitude of the grid cell
                agg_fc = np.mean(fc[tmp2])
                std_fc = np.std(fc[tmp2])
                lon0 = (idx_unq[i] % nx)*dx + dx/2 - 180
                lat0 = 90-dx/2 - (idx_unq[i]/nx)*dx
                
                outdata.append([strdate, strsat, strsite, lat0, lon0, agg_fc, std_fc, nagg, pagg])


df = pd.DataFrame(outdata, columns = ['Date','Sat','Site','Lat','Lon','GrdFC500m','FCSTD','AggNum','AggPcnt'])

df.to_csv(outfn,index=False)
