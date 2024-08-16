import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from joblib import dump
import matplotlib.pyplot as plt
import numpy as np

# Load the filtered data
input_path = '/Users/katieyang/Downloads/LP05/FCOVER_Filtered_Results.csv'
data = pd.read_csv(input_path)

# Select relevant features and target variable
features = ['SolarZenith', 'SolarAzimuth', 'SensorZenith', 'SensorAzimuth', 'I1', 'I2', 'I3', 'LC_Type1']
target = 'FC500m'

X = data[features]
y = data[target]

# Assign weights to each sample based on the inverse of FCover value frequency
hist, bin_edges = np.histogram(y, bins=10)
bin_indices = np.digitize(y, bin_edges[:-1])
weights = 1 / (hist[bin_indices - 1] + 1)

# Split data into training and testing sets
X_train, X_test, y_train, y_test, weights_train, weights_test = train_test_split(X, y, weights, test_size=0.2, random_state=42)

# Train the RandomForestRegressor model with sample weights
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train, sample_weight=weights_train)

# Predict on the test set
y_pred = model.predict(X_test)

# Save the trained model
model_path = '/Users/katieyang/Downloads/LP05/FCOVER_RF_Model.joblib'
dump(model, model_path)

print(f"Model saved to {model_path}")

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f'Mean Squared Error: {mse}')
print(f'Mean Absolute Error: {mae}')
print(f'R-squared: {r2}')

# Feature importance
importances = model.feature_importances_
feature_importances = pd.DataFrame({'Feature': features, 'Importance': importances})
print(feature_importances.sort_values(by='Importance', ascending=False))

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
plt.title('Random Forest Predictions vs Actual Values')
plt.legend()
plt.show()

# Plot a histogram of the residual values
residuals = y_test - y_pred
plt.hist(residuals, bins=30)
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.title('Histogram of Residuals')
plt.show()
