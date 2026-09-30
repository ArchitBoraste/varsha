import { useNavigate } from 'react-router';
import { WARNINGS } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import { useForecast } from '../../state/useForecast.js';
import Button from '../Button/Button.jsx';
import RichText from './RichText.jsx';
import styles from './ChatMessage.module.css';

function AnswerTable({ table }) {
  const template = `minmax(0, 1.4fr) repeat(${table.columns.length - 1}, minmax(0, 1fr))`;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr style={{ gridTemplateColumns: template }}>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('|')} style={{ gridTemplateColumns: template }}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={index}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {table.note && <p className={styles.tableNote}>{table.note}</p>}
    </div>
  );
}

/** "Draft red alerts for these 3", "Draft orange alert for Wayanad", … from the districts' levels. */
function draftLabel({ districtIds, lead }, forecast) {
  const levels = new Set(districtIds.map((id) => forecast?.[id]?.days[lead - 1].warning));
  const level = levels.size === 1 ? `${WARNINGS[[...levels][0]]?.label.toLowerCase() ?? ''} ` : '';
  if (districtIds.length === 1) return `Draft ${level}alert for ${forecast?.[districtIds[0]]?.name ?? 'this district'}`;
  return `Draft ${level}alerts for these ${districtIds.length}`;
}

function Actions({ actions }) {
  const { setLead, setHighlightIds, selectDistrict, closeAssistant } = useAppState();
  const { data: forecast } = useForecast();
  const navigate = useNavigate();

  const run = (action) => {
    setLead(action.lead);
    closeAssistant();
    if (action.type === 'draft_alerts') {
      navigate(`/alerts?ids=${action.districtIds.join(',')}`);
    } else {
      setHighlightIds(action.districtIds);
      selectDistrict(action.districtIds[0]);
      navigate('/');
    }
  };

  return (
    <div className={styles.actions}>
      {actions.map((action) => (
        <Button key={action.type} variant={action.type === 'draft_alerts' ? 'primary' : 'secondary'} onClick={() => run(action)}>
          {action.type === 'draft_alerts' ? draftLabel(action, forecast) : 'Show on map'}
        </Button>
      ))}
    </div>
  );
}

/** One chat turn: the user's question on the right, or an answer with its table, sources and actions. */
export default function ChatMessage({ message, onRetry }) {
  if (message.role === 'user') return <p className={styles.question}>{message.text}</p>;

  if (message.failed) {
    return (
      <div className={styles.failed}>
        <p>{message.text}</p>
        {onRetry && (
          <Button onClick={onRetry} className={styles.retry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={styles.answer}>
        <RichText text={message.text} className={styles.text} />
        {message.table && <AnswerTable table={message.table} />}
        {message.sources?.length > 0 && (
          <ul className={styles.sources} aria-label="Sources">
            {message.sources.map((source) => (
              <li key={source}>Source: {source}</li>
            ))}
          </ul>
        )}
      </div>
      {message.actions?.length > 0 && <Actions actions={message.actions} />}
    </>
  );
}
