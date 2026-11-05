# Leak detection methodology

No leak detector is implemented. A future evaluation should begin with a documented benchmark and a simple statistical baseline, freeze train/test periods, avoid leakage between time windows, report event-level and time-step metrics, and measure false positives and false negatives. Compare against the benchmark's documented scoring rules where available. Tests should include demand changes, sensor outages, stale/shifted clocks, and non-leak operational events. Report the dataset, split, uncertainty and limitations; benchmark performance is not field validation.
