import CommissionDashboard from '../commission-dashboard';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Commission Central</title>
        <meta name="description" content="Commission tracking dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <CommissionDashboard />
    </>
  );
}
