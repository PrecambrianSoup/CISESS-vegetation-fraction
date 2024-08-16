import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt

# Load the filtered data
input_path = '/Users/katieyang/Downloads/LP05/FCOVER_Filtered_Results.csv'
data = pd.read_csv(input_path)

# Select relevant features and target variable
features = ['SolarZenith', 'SolarAzimuth', 'SensorZenith', 'SensorAzimuth', 'I1', 'I2', 'I3', 'LC_Type1']
target = 'FC500m'

# Extract features (X) and target (y)
X = data[features]
y = data[target]

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train the Support Vector Regressor model
model = SVR(kernel='rbf')
model.fit(X_train_scaled, y_train)

# Predict on the test set
y_pred = model.predict(X_test_scaled)

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f'Mean Squared Error: {mse}')
print(f'Mean Absolute Error: {mae}')
print(f'R-squared: {r2}')

# Plot a graph of the predicted values vs actual values with R-squared, MAE, and trendline
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.7, edgecolors='w', linewidth=0.5, label='Data points')

# Plot a trendline (line of best fit)
z = np.polyfit(y_test, y_pred, 1)
p = np.poly1d(z)
plt.plot(y_test, p(y_test), "r--", lw=2, label='Trendline')

# Plot the 1:1 line
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'k--', lw=2, label='1:1 Line')

# Annotate with R-squared and MAE
plt.text(0.05, 0.95, f'$R^2$: {r2:.2f}\nMAE: {mae:.2f}', 
         transform=plt.gca().transAxes, fontsize=12,
         verticalalignment='top', bbox=dict(boxstyle='round,pad=0.3', edgecolor='black', facecolor='white'))

plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('SVM Predictions vs Actual Values')
plt.legend()
plt.show()
