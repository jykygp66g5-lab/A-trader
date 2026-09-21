# V10 Peer-Relative Feature Experiment

Universe: 49 stocks
Horizon: 5 trading days
Model: RandomForestRegressor
Target: same-day future 5-day excess-return percentile rank

## Architecture

V10 keeps the V7 model and target unchanged.

V7 features: 65
New peer-relative features: 6
V10 total features: 71

Peer groups: 7

- semiconductors
- software/cloud
- internet/consumer technology
- financials/fintech
- industrials/defense
- energy
- healthcare

## New Features

- peer_relative_performance_5d
- peer_relative_performance_20d
- peer_relative_performance_60d
- peer_relative_rsi_14
- peer_relative_volatility_20
- peer_relative_volume_ratio_20

Peer benchmarks use leave-one-out calculations.

A stock is never included in its own peer benchmark.

## Validation

Peer mapping:

- Expected symbols: 49
- Mapped symbols: 49
- Unique mapped symbols: 49
- Missing: 0
- Unexpected: 0
- Duplicates: 0

Peer feature validation:

- Rows: 113870
- Symbols: 49
- Complete peer rows: 110930
- All finite: True
- Leave-one-out manual calculation: PASSED
- Historical future-row independence: PASSED
- Maximum historical difference: 0.0

## Controlled V7 Baseline

Mean Spearman: 0.0223
Median Spearman: 0.0445
Worst Spearman: -0.0371
Positive rank years: 4/5

Top-1 spread: +0.5712% (4/5)
Top-2 spread: +0.2180% (4/5)
Top-5 spread: +0.2561% (4/5)

Beat rates:

- Top-1: 53.98%
- Top-2: 49.47%
- Top-5: 51.20%

## V10 Results

Mean Spearman: 0.0197
Median Spearman: 0.0336
Worst Spearman: -0.0405
Positive rank years: 4/5

Top-1 spread: +0.5754% (4/5)
Top-2 spread: +0.2470% (3/5)
Top-5 spread: +0.3661% (4/5)

Beat rates:

- Top-1: 53.19%
- Top-2: 50.88%
- Top-5: 51.72%

## V10 Minus V7

Mean Spearman: -0.0026
Median Spearman: -0.0109
Worst-year Spearman: -0.0034

Top-1 spread: +0.0041%
Top-2 spread: +0.0290%
Top-5 spread: +0.1100%

## 2023 Stress Test

V7:

- Spearman: -0.0371
- Top-1: -1.5268%
- Top-2: -1.6228%
- Top-5: -0.9467%

V10:

- Spearman: -0.0405
- Top-1: -1.7124%
- Top-2: -1.6017%
- Top-5: -0.9283%

## Finding

Peer-relative information contains useful signal, especially for
broader Top-5 selection.

However, V10 does not improve overall ranking quality and does not
repair the 2023 failure regime.

The additional complexity is therefore not sufficient to replace V7.

## Decision

Keep V7 Random Forest as the primary research baseline.

Keep V10 as a documented experiment.

Do not integrate V10 into the production scanner.

## Next Step

Before V11 feature engineering, diagnose the 2023 failure.

Investigate:

- performance by month
- performance by peer group
- false Top-1 selections
- predicted rank versus realized rank
- characteristics of incorrect high-confidence selections
- whether the failure is concentrated or persistent
- whether specific stocks dominate the losses
