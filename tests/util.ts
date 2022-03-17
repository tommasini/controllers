import { EthQueryish } from '../src/util';

/**
 * Builds a EthQuery object that implements the bare minimum necessary to pass
 * to `query`.
 *
 * @param overrides - An optional set of methods to add to the fake EthQuery
 * object.
 * @returns The fake EthQuery object.
 */
export function buildFakeEthQuery(
  overrides: Record<string, (...args: any[]) => void> = {},
): EthQueryish {
  return {
    sendAsync() {
      // do nothing
    },
    ...overrides,
  };
}
