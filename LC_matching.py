import pandas as pd
from scipy.spatial import cKDTree

# Load reflectance and land class data
reflectance_df = pd.read_csv('/Users/katieyang/Downloads/VIIRS_Export_MD_2023_new.csv')
land_class_df = pd.read_csv('/Users/katieyang/Downloads/LC_Export_MD.csv')

# Build KDTree for land class data
land_class_coords = land_class_df[['Lat', 'Lon']].to_numpy()
tree = cKDTree(land_class_coords)

# Query the KDTree to find the nearest land class point for each reflectance point
reflectance_coords = reflectance_df[['Lat', 'Lon']].to_numpy()
distances, indices = tree.query(reflectance_coords, k=1)

# Match the land class using the nearest neighbor indices
reflectance_df['LC_Type1'] = land_class_df.iloc[indices]['LC_Type1'].values

# Save the new dataframe with appended land class information
output_path = '/Users/katieyang/Downloads/MD_2023_matched.csv'
reflectance_df.to_csv(output_path, index=False)

print(f'Matched prediction input data has been saved successfully to {output_path}')