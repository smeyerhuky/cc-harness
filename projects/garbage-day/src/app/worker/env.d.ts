// The Worker's bindings (wrangler.jsonc).
interface Env {
  LOBBY: DurableObjectNamespace<import('./index').LobbyDO>;
  MATCH: DurableObjectNamespace<import('./index').MatchDO>;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
}

declare namespace Cloudflare {
  interface Env {
    LOBBY: DurableObjectNamespace<import('./index').LobbyDO>;
    MATCH: DurableObjectNamespace<import('./index').MatchDO>;
    ASSETS: Fetcher;
    ENVIRONMENT: string;
  }
  interface GlobalProps {
    mainModule: typeof import('./index');
    durableNamespaces: 'LobbyDO' | 'MatchDO';
  }
}
