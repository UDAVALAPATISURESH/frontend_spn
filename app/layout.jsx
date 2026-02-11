import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Salon Booking',
  description: 'Salon appointment booking system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <header className="header">
          <div className="container header-inner">
            <div className="logo">SalonBooking</div>
            <Navbar />
          </div>
        </header>
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}



