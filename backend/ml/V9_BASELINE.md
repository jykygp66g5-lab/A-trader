# V9 Market-Regime Feature Experiment

Universe: 49 stocks
Horizon: 5 trading days
Base model: RandomForestRegressor
Target: same-day future 5-day excess-return percentile rank

## Architecture

V9 kept the V7 model and target unchanged.

V7 features: 65
New V9 regime features: 9
Total V9 features: 74

Added features:

- spy_trend_strength_20_200
- spy_trend_strength_50_200
- spy_volatility_ratio_20_60
- spy_drawdown_20
- spy_drawdown_60
- spy_momentum_acceleration
- qqq_spy_relative_20
- qqq_spy_relative_60
- qqq_spy_momentum_spread

## Validation

V9 regime feature validation passed.

- Historical leakage test maximum difference: 0.0
- Historical values unchanged after future truncation: True
- 49 stocks
- 103874 usable rows
- 74 unique features
- 0 missing feature values
- All feature values finite
- Same regime values correctly aligned across stocks on each date

## V7 Baseline

Mean daily Spearman: 0.0174
Median yearly Spearman: 0.0347
Worst yearly Spearman: -0.0407
Positive rank years: 4/5

Top-1 spread: +0.7091% (4/5)
Top-2 spread: +0.3296% (4/5)
Top-5 spread: +0.2316% (4/5)

Beat rates:
Top-1: 54.76%
Top-2: 51.77%
Top-5: 50.98%

## V9 Results

Mean daily Spearman: 0.0184
Median yearly Spearman: 0.0423
Worst yearly Spearman: -0.0408
Positive rank years: 3/5

Top-1 spread: -0.1751% (3/5)
Top-2 spread: +0.0168% (3/5)
Top-5 spread: +0.3566% (4/5)

Beat rates:
Top-1: 50.88%
Top-2: 48.96%
Top-5: 52.57%

## V9 Minus V7

Mean Spearman: +0.0010
Median Spearman: +0.0076
Worst-year Spearman: -0.0000

Top-1 spread: -0.8842%
Top-2 spread: -0.3128%
Top-5 spread: +0.1251%

## Year-by-Year Spearman

2022:
V7 +0.0067
V9 -0.0046

2023:
V7 -0.0407
V9 -0.0408

2024:
V7 +0.0418
V9 +0.0507

2025:
V7 +0.0347
V9 +0.0423

2026:
V7 +0.0444
V9 +0.0443

## Key Finding

Market-regime features slightly improved broad cross-sectional
ranking and Top-5 selection, but materially degraded the extreme
Top-1 and Top-2 selections.

Most importantly, V9 did not repair the weak 2023 regime.

The 2023 Top-1 spread deteriorated from:

V7: -1.3863%
V9: -2.7111%

Therefore the additional market-wide regime variables do not solve
the primary instability identified after V7.

## Decision

Do not replace V7 with V9.

V7 Random Forest remains the preferred baseline.

Keep V9 as a documented research experiment.

## V10 Direction

The evidence suggests that adding more global market context is not
enough.

V10 should investigate stock-specific cross-sectional information
that can distinguish individual stocks on the same date.

Candidate direction:

- sector-relative momentum
- sector-relative strength
- sector-relative volatility
- stock-versus-sector performance
- stock-versus-sector trend
- sector breadth

This is more directly aligned with the scanner's job of selecting
the best stocks from the same market environment.
