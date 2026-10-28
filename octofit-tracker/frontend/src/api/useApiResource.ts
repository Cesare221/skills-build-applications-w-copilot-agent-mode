import { useEffect, useState } from 'react';

type ApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export function useApiResource<T>(path: string, load: (path: string) => Promise<T>): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load(path)
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [path, load]);

  return state;
}