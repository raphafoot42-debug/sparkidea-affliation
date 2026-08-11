import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Spark Idea — Affiliation</title>
        <meta name="description" content="Programme d'affiliation Spark Idea" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
