// アプリのロゴマーク（書類にチェック）
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 64) / 56} viewBox="0 0 56 64" aria-hidden="true">
      <path d="M6 4h30l14 14v40a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#FFFFFF" />
      <path d="M36 4v12a2 2 0 0 0 2 2h12" fill="#CFE3F3" />
      <path d="M16 38l8 8 16-17" fill="none" stroke="#4AA8E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
