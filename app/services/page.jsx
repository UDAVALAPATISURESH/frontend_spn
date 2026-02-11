'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Redirect admin to admin page if logged in
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      if (role === 'admin') {
        router.push('/admin');
        return;
      }
    }
    api.get('/services').then((res) => setServices(res.data));
  }, [router]);

  return (
    <div>
      <h1>Services</h1>
      <div className="grid-3">
        {services.map((s) => (
          <div key={s.id} className="card">
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <p>
              {s.durationMinutes} min · ₹{s.price}
            </p>
            <a href="/booking" className="btn btn-secondary">
              Book
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

