import ChartCard from './ChartCard.jsx';
import LineChart from './LineChart.jsx';
import styles from './ChartBody.module.css';

const HEIGHT = 230;

/** Fractions skill score at ≥ 64.5 mm as the neighbourhood grows, raw against Varsha. */
export default function FssChart({ report, day, missing }) {
  const { scalesKm, useful } = report.fss;
  return (
    <ChartCard
      id="fss-title"
      title={`FSS by neighbourhood size · ≥ ${report.thresholds.fss} mm`}
      note="Right place, not just right amount"
    >
      {day ? (
        <LineChart
          height={HEIGHT}
          xs={scalesKm}
          xDomain={[scalesKm[0], scalesKm.at(-1)]}
          xTicks={scalesKm.map((value) => ({ value, label: String(value) }))}
          xTitle="Neighbourhood size, km"
          yTitle="FSS"
          series={[
            { id: 'raw', label: 'Raw GFS', values: day.fss.raw },
            { id: 'varsha', label: 'Varsha', values: day.fss.varsha },
          ]}
          reference={{ type: 'level', value: useful, label: 'useful skill' }}
          label="Fractions skill score"
          describe={(i) => ({
            title: `${scalesKm[i]} km neighbourhood`,
            lines: [`Varsha ${day.fss.varsha[i].toFixed(2)}`, `Raw GFS ${day.fss.raw[i].toFixed(2)}`],
          })}
        />
      ) : (
        <p className={styles.missing}>{missing}</p>
      )}
    </ChartCard>
  );
}
