// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { experimental_readRawConfig } from 'wrangler';

/** The part of the raw config this test reads. */
interface Bindings {
  readonly durable_objects?: { readonly bindings: readonly unknown[] };
  readonly vars?: Readonly<Record<string, unknown>>;
}

// Wrangler's declarations import its config types from `@cloudflare/workers-utils`, which it
// bundles instead of installing, so they don't resolve: the reader is typed here.
const readRawConfig = experimental_readRawConfig as unknown as (args: { config: string }) => {
  rawConfig: Bindings & { readonly previews?: Bindings };
};

// A Worker Preview inherits no bindings or vars from the top level of `wrangler.jsonc`: any the
// Worker reads from `env` must be declared again in the `previews` block, or every pull request's
// preview runs without them (kb/design/stack-and-ci.md, "Deployment").
describe('wrangler.jsonc', () => {
  const { rawConfig } = readRawConfig({
    config: new URL('../wrangler.jsonc', import.meta.url).pathname,
  });

  it('gives previews the same Durable Object bindings as production', () => {
    expect(rawConfig.durable_objects?.bindings.length).toBeGreaterThan(0);
    expect(rawConfig.previews?.durable_objects?.bindings).toEqual(
      rawConfig.durable_objects?.bindings,
    );
  });

  it('gives previews a value for every var, with their own ENVIRONMENT', () => {
    expect(Object.keys(rawConfig.previews?.vars ?? {})).toEqual(Object.keys(rawConfig.vars ?? {}));
    expect(rawConfig.previews?.vars?.ENVIRONMENT).toBe('preview');
  });
});
