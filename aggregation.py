# script for aggregating fcover data from native resolution to 500m
import numpy as np

def aggregate(input_tif, output_tif):
    # Reading high-res data
    with rasterio.open(input_tif) as src:
        band1 = src.read(1) # fcover data (0 to 1)
        band2 = src.read(2) # input out of range flag (0 = in range, 1 = out of range)
        band3 = src.read(3) # output out of range flag (0 = in range, 1 = out of range)
        band4 = src.read(4) # confidence interval

        transform = src.transform
        lat = src.bounds.bottom + np.arange(src.height) * transform[4]
        lon = src.bounds.left + np.arange(src.width) * transform[0]
    
    # Calculate the mean value for the pixels falling into the same grid
    in_range_mask = band2 == 0 and band3 == 0
    mean_fcover = np.mean(band1[in_range_mask])

    # Define the resolution and grid parameters
    dx = transform[0]
    dx_grid = 360.0 / src.width / 2
    nx_tile = 2400
    
    # Calculate iy and ix for each pixel
    iy = np.round((90 - dx / 2 - lat) / dx).astype(int)
    ix = np.round((lon * np.cos(lat * np.pi / 180.0) - dx / 2 + 180) / dx).astype(int)
    
    # Initialize arrays to store aggregated data
    unique_indices = np.unique((ix, iy), axis=1)
    aggregated_values = np.full_like(unique_indices[0], np.nan)
    
    # Create a DataFrame to store the aggregated data
    df = pd.DataFrame({
        'ix': unique_indices[0],
        'iy': unique_indices[1],
        'mean_value': aggregated_values
    })

    # Save the DataFrame to a CSV file
    df.to_csv(output_tif, index=False)
