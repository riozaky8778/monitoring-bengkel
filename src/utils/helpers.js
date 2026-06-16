export const fmt = n => Number(n || 0).toLocaleString('id-ID');
export const fmtRp = n => 'Rp ' + fmt(n);

export const toDateInput = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
};

export const formatTgl = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
};

export function statusOf(ket = '') {
  const k = ket.toUpperCase();
  if (k.includes('SELESAI')) return 'SELESAI';
  if (k.includes('PROSES'))  return 'PROSES';
  return 'PENDING';
}

export const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];