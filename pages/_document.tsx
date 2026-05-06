import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <meta name="description" content="DecoQ - Platform Verifikasi QRIS berbasis SHA-256 untuk keamanan transaksi digital" />
        <meta name="theme-color" content="#12120a" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff985' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='11' width='14' height='10' rx='2' ry='2'/><path d='M12 11V7'/><path d='M8 7a4 4 0 0 1 8 0'/></svg>" />
        <meta property="og:title" content="DecoQ - Verifikasi QRIS Terpercaya" />
        <meta property="og:description" content="Platform verifikasi QRIS berbasis SHA-256 untuk keamanan transaksi digital Anda" />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
