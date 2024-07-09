import pandas as pd
import numpy as np

# Define the input and output file paths
input_csv_path = '/Users/katieyang/Downloads/reflectance_and_geometry.csv'
output_csv_path = '/Users/katieyang/Downloads/LP05/FCOVER_Filtered_Results.csv'

# Read the aggregated results CSV into a pandas DataFrame
df = pd.read_csv(input_csv_path)

# Filtering by cloud (q1 bit 2-3), shadow (q2 bit 3), and snow (q7 bit 0) flags

def confident_clear(qf1):
    if pd.isna(qf1):
        return False
    qf1 = int(qf1)
    return (qf1 & (3 << 2)) == 0

def no_cloud_shadow(qf2):
   if pd.isna(qf2):
        return False
   qf2 = int(qf2)
   return (qf2 & (1 << 3)) == 0

def no_snow_present(qf7):
   if pd.isna(qf7):
        return False
   qf7 = int(qf7)
   return (qf7 & 1) == 0

# Apply the qf filters to the DataFrame and filter by aggregation amount/percentage
filtered_df = df[df['QF1'].apply(confident_clear) & df['QF2'].apply(confident_clear) & df['QF7'].apply(no_snow_present)
                 & (df['AggNum'] > 50) & (df['AggNum'] > 60)]

# Divide the I1, I2, I3 columns by 1000 and the azimuth/zenith columns by 100 for scaling
df['I1'] = df['I1'] / 1000
df['I2'] = df['I2'] / 1000
df['I3'] = df['I3'] / 1000
df['SensorAzimuth'] = df['SensorAzimuth'] / 100
df['SensorZenith'] = df['SensorZenith'] / 100
df['SolarAzimuth'] = df['SolarAzimuth'] / 100
df['SolarZenith'] = df['SolarZenith'] / 100

# Save the filtered results into a new CSV file
filtered_df.to_csv(output_csv_path, index=False)

print(f"Filtering complete")
