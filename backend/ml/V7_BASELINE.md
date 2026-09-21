# V7 Direct Cross-Section Ranking Baseline

Universe: 49 stocks
Horizon: 5 trading days
Features: 65
Validation years: 2022-2026
Target: same-day percentile rank of future 5-day excess return vs SPY

## Random Forest

Mean daily Spearman: 0.0174
Median yearly Spearman: 0.0347
Worst year: -0.0407
Best year: 0.0444
Positive rank years: 4/5

Top-1 spread: +0.7091%
Positive Top-1 years: 4/5
Top-1 beats bottom: 54.76%

Top-2 spread: +0.3296%
Positive Top-2 years: 4/5
Top-2 beats bottom: 51.77%

Top-5 spread: +0.2316%
Positive Top-5 years: 4/5
Top-5 beats bottom: 50.98%

## HistGradientBoosting

Mean daily Spearman: 0.0159
Positive rank years: 3/5
Top-1 spread: -0.1341%
Top-2 spread: -0.0291%
Top-5 spread: +0.1746%

## Comparison With V6.1

V6.1 RF mean daily Spearman: 0.0192
V7 RF mean daily Spearman: 0.0174

V7 did not improve whole-universe Spearman.

However, V7 materially improved extreme selection:

V6.1 RF Top-1 spread: -0.4505%
V7 RF Top-1 spread: +0.7091%

V6.1 RF Top-2 spread: +0.0153%
V7 RF Top-2 spread: +0.3296%

V7 RF produced positive Top-1, Top-2, and Top-5 spreads in 4/5 validation years.

## V8 Objective

Preserve V7's direct cross-sectional ranking architecture while placing greater training emphasis on the extreme top and bottom future performers.

Primary goals:
- Preserve positive ranking in >= 4/5 years
- Mean daily Spearman >= 0.0192
- Top-1 spread > +0.7091%
- Top-2 spread > +0.3296%
- Top-5 spread > +0.2316%
- Positive selection spreads in >= 4/5 years
