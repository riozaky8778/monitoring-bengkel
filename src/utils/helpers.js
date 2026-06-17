export const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export const formatTgl = (tgl) => {
  if (!tgl) return '—';
  const d = new Date(tgl);
  if (isNaN(d)) return String(tgl);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const toDateInput = (tgl) => {
  if (!tgl) return '';
  const d = new Date(tgl);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
};

export const fmtRp = (num) => {
  if (!num || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

export const fmt = (num) => {
  if (!num || isNaN(num)) return '0';
  return Number(num).toLocaleString('id-ID');
};

// Mesin Penyortir Status Otomatis
export const statusOf = (keterangan) => {
  const ket = String(keterangan || '').toUpperCase();
  if (ket.includes('SELESAI')) return 'SELESAI';
  if (ket.includes('PROSES') || ket.includes('PERBAIKAN')) return 'PROSES';
  return 'PENDING';
};