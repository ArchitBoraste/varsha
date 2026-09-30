import { formatPercent } from '../../lib/format.js';
import ChartCard from './ChartCard.jsx';
import LineChart from './LineChart.jsx';
import styles from './ChartBody.module.css';

const HEIGHT = 270;
// Keeps the diagram close to the mockup's proportions on wide screens.
const MAX_PLOT_WIDTH = 360;
const X_TICKS = [0, 0.5, 1].map((value) => ({ value, label: String(value) }));

/** How often heavy rain followed each forecast chance of ≥ 115.6 mm, raw against Varsha. */
export default function ReliabilityChart({ report, day, missing }) {
  const { bins } = report.reliability;
  return (
    <ChartCard id="reliability-title" title={`Reliability · chance of ≥ ${report.thresholds.reliability} mm`} note="On the diagonal = honest">
      {day ? (
        <LineChart
          height={HEIGHT}
          xs={bins}
          xDomain={[0, 1]}
          xTicks={X_TICKS}
          xTitle="Forecast chance"
          yTitle="Observed frequency"
          series={[
            { id: 'raw', label: 'Raw GFS', values: day.reliability.raw },
            { id: 'varsha', label: 'Varsha', values: day.reliability.varsha },
          ]}
          reference={{ type: 'diagonal' }}
          maxPlotWidth={MAX_PLOT_WIDTH}
          label="Reliability"
          describe={(i) => ({
            title: `Forecast chance ${formatPercent(bins[i] - 0.05)}–${formatPercent(bins[i] + 0.05)}`,
            lines: [
              `Varsha: happened ${formatPercent(day.reliability.varsha[i])}`,
              `Raw GFS: happened ${formatPercent(day.reliability.raw[i])}`,
            ],
          })}
        />
      ) : (
        <p className={styles.missing}>{missing}</p>
      )}
    </ChartCard>
  );
}
