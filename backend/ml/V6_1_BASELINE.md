# V6.1 Clean Cross-Section Baseline

Universe: 49 stocks
Features: 65
Validation: full feature-complete universe
Years: 2022-2026

## 5-Day Random Forest
Mean daily Spearman: 0.0192
Median yearly Spearman: 0.0203
Worst year: -0.0241
Best year: 0.0535
Positive rank years: 4/5
Top-1 spread: -0.4505%
Top-2 spread: +0.0153%

## 5-Day HistGradientBoosting
Mean daily Spearman: 0.0128
Median yearly Spearman: 0.0065
Worst year: -0.0366
Best year: 0.0586
Positive rank years: 4/5
Top-1 spread: +0.0596%
Top-2 spread: +0.2719%

## 10-Day Random Forest
Mean daily Spearman: 0.0090
Positive rank years: 3/5
Top-1 spread: -0.1604%
Top-2 spread: +0.4068%

## 10-Day HistGradientBoosting
Mean daily Spearman: -0.0179
Positive rank years: 1/5

## 20-Day Random Forest
Mean daily Spearman: -0.0395
Positive rank years: 2/5

## 20-Day HistGradientBoosting
Mean daily Spearman: -0.0235
Positive rank years: 1/5

## V7 Benchmark To Beat
Primary baseline:
5-Day Random Forest mean daily Spearman = 0.0192

V7 goal:
Train directly on same-day cross-sectional future-return rank.
