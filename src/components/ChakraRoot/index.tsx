import React from "react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

/**
 * Provider shell for chakra.
 *
 * These two providers used to be mounted by the consumer at the application entry, wrapping
 * the whole tree — which pulled `@chakra-ui/react` + `@emotion/*` + zag-js (about 570 KB in
 * total) into the initial bundle unconditionally, even though Button.Chakra is the only thing
 * that actually uses chakra.
 *
 * Changed to "whoever uses it wraps it": ChakraButton wraps itself (it is already a lazy chunk,
 * so chakra travels with it), and the consumer entry no longer needs a global provider, which
 * takes chakra out of the initial bundle entirely.
 *
 * Both system and cache are module-level singletons, so wrapping in several places does not
 * create duplicates; nested wrapping passes the very same instance and is idempotent. The cache
 * keeps `prepend: true` so chakra's style tags are inserted near the top of head — lower
 * priority than antd — matching the previous behaviour.
 */
const cache = createCache({
  key: "css",
  prepend: true,
});

const system = createSystem(defaultConfig, {
  disableLayers: true,
  preflight: false,
});

export interface ChakraRootProps {
  children?: React.ReactNode;
}

const ChakraRoot: React.FC<ChakraRootProps> = ({ children }) => (
  <CacheProvider value={cache}>
    <ChakraProvider value={system}>{children}</ChakraProvider>
  </CacheProvider>
);

export default ChakraRoot;
