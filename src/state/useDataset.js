import { useEffect, useReducer, useState } from 'react';
import { loadData, peekData } from '../lib/data.js';

/** A file from public/data: `data` is undefined until it arrives, `error` is set if it fails. */
export function useDataset(file) {
  const [, rerender] = useReducer((count) => count + 1, 0);
  const [failure, setFailure] = useState(null);
  const data = peekData(file);

  useEffect(() => {
    if (peekData(file)) return undefined;
    let active = true;
    loadData(file).then(
      () => active && rerender(),
      (error) => active && setFailure({ file, error }),
    );
    return () => {
      active = false;
    };
  }, [file]);

  return { data, error: failure?.file === file ? failure.error : null };
}

/** District polygons and state outlines, as feature arrays. */
export function useIndiaGeo() {
  const districts = useDataset('districts.geojson');
  const states = useDataset('states.geojson');
  return {
    districts: districts.data?.features,
    states: states.data?.features,
    error: districts.error ?? states.error,
  };
}
