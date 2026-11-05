# Simulation Lab: dataset, training, and limits

## Dataset used

The app includes the 818 KB CSV `backend/data/water_anomaly_benchmark.csv` from the [Zenodo dataset record](https://zenodo.org/records/15096167). The dataset contains 8,737 hourly rows from an anonymized urban water distribution network. Its 18 inputs are precomputed anomaly scores derived from SCADA, energy, and environmental signals; they are not raw pressure or flow values. The `fault_d7` label means a timestamp is within seven days of a recorded leak event. It does not indicate that a leak was physically confirmed at that hour.

Attribution: Babela, J., Munk, M., & Munkova, D. *Hourly Anomaly Scores and Leak Labels from a Multi-Source Urban Water Distribution Network Dataset*. Zenodo (2025), DOI [10.5281/zenodo.15096167](https://doi.org/10.5281/zenodo.15096167). License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The dataset README identifies the same license and explains the columns.

## Training and evaluation

Run `node backend/train_simulation_model.mjs` to reproduce `backend/app/simulation_model.json`. The script imputes missing values with training-period medians, standardizes features with training-period statistics, and fits class-weighted logistic regression using a deterministic full-batch gradient descent implementation.

Records are kept in timestamp order. The earliest 70% form the training period, the final 30% form the holdout, and a 14-day embargo around the split avoids putting adjacent leak-proximity windows on opposite sides. Current run: 5,947 training rows and 2,454 later holdout rows. Example cases are selected only from this later holdout.

At the default 0.50 threshold, the holdout confusion counts are TP=1,219, FP=140, TN=82, FN=1,013. Precision is 89.7%, recall is 54.6%, and F1 is 67.9%. However, 91.0% of holdout labels are positive, so an always-positive rule has 91.0% accuracy while this model has 53.0%. Treat this model as an educational failure-analysis demo, not a useful or deployable detector. The alert threshold changes the benchmark score interpretation; it does not retrain the model.

## What the Simulation Lab demonstrates

- A strong labeled leak-proximity case and a quieter labeled case.
- A quiet non-leak-proximity case and a high-scoring non-leak-proximity case.
- How changing the score threshold changes whether each benchmark example is flagged.
- A small explanation of the model's strongest feature contributions and the holdout metrics.

All case dates and labels are original benchmark observations. No simulated geography is drawn on the Delhi map. A score is not a calibrated probability; “flagged” is not a leak diagnosis. The benchmark is not Delhi data, and the model cannot support Delhi operational decisions.

## Why no Delhi-trained model is included

Publicly accessible benchmark data is not a substitute for a verified Delhi water network, local sensor history, or field-confirmed leak labels. Those are needed for a model that claims to detect Delhi events. The Simulation Lab intentionally stays separate from the Delhi map and asset registry.
