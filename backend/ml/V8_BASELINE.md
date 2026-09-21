# V8 Extreme-Weighted Ranking Experiment

Universe: 49 stocks
Horizon: 5 trading days
Base features: 65
Validation years: 2022-2026
Base model: RandomForestRegressor
Target: V7 same-day future excess-return percentile rank

## Control

V8 baseline was corrected so that the unweighted model
calls RandomForestRegressor.fit() without sample_weight.

The corrected baseline reproduced V7 exactly:

Mean daily Spearman: 0.0174
Top-1 spread: +0.7091%
Top-2 spread: +0.3296%
Top-5 spread: +0.2316%

## Moderate Weighting — 3x Maximum

Mean daily Spearman: 0.0161
Positive rank years: 3/5
Top-1 spread: +0.3823%
Top-2 spread: +0.0154%
Top-5 spread: +0.2639%

## Strong Weighting — 5x Maximum

Mean daily Spearman: 0.0137
Positive rank years: 3/5
Top-1 spread: +0.4977%
Top-2 spread: +0.2606%
Top-5 spread: +0.3217%

## Conclusion

Extreme weighting did not improve the overall scanner model.

Strong weighting improved Top-5 spread but reduced:
- whole-universe Spearman
- Top-1 spread
- Top-2 spread
- ranking consistency

V7 Random Forest remains the preferred baseline.

## V9 Direction

Keep the V7 target and training objective.

Investigate market-regime features to improve stability,
especially the weak 2023 validation period.

V7 benchmark:
- Mean daily Spearman: 0.0174
- Positive rank years: 4/5
- Top-1 spread: +0.7091%
- Top-2 spread: +0.3296%
- Top-5 spread: +0.2316%

V6.1 whole-universe Spearman benchmark: 0.0192
