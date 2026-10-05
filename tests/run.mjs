// rolldown（Viteに同梱）でテスト用にTSを変換してから実行する
import { build } from 'rolldown'
for (const [src, out] of [['src/utils/diagnose.ts', 'diagnose'], ['src/types/diagnosis.ts', 'diagnosis'], ['src/types/profile.ts', 'profile']]) {
  await build({ input: src, platform: 'node', logLevel: 'silent', output: { file: `.test-build/${out}.mjs`, format: 'esm' } })
}
await import('./diagnose.test.mjs')
