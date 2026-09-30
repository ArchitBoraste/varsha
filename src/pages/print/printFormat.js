// Helpers for the printable reports.

import { useSearchParams } from 'react-router';
import { istClock } from '../../lib/clock.js';
import { formatShortDate } from '../../lib/format.js';

const LEADS = 5;

/** The ?lead= of a print address, 1–5, else Day 1. */
export function useLeadParam() {
  const [params] = useSearchParams();
  const lead = Number(params.get('lead'));
  return Number.isInteger(lead) && lead >= 1 && lead <= LEADS ? lead : 1;
}

/** "29 Jul 2024, 16:08 IST" for an IST timestamp. */
export const formatIstTime = (iso) => `${formatShortDate(iso.slice(0, 10))} ${iso.slice(0, 4)}, ${istClock(iso)} IST`;
