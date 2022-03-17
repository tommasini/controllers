// It's not worth typing this since we will replace it soon anyway
declare module 'eth-keyring-controller';

// It's not worth typing this since the `web3` package is not typed anyway
declare module 'single-call-balance-checker-abi';

// This adds a global and we can assume it matches the same type as `fetch`
declare module 'isomorphic-fetch';

// We want to remove this package, so it's not worth typing right now
declare module 'web3-provider-engine';
declare module 'web3-provider-engine/subproviders/provider';
declare module 'web3-provider-engine/zero';
