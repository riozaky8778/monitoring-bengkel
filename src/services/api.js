export const API = 'https://script.google.com/macros/s/AKfycbzBUtv_dvzoc0r8RNzLle-xb-6jhwULN6ESH1tgwZvWBn6sLyxxwP93JiIhtOBB991o/exec';
export const IS_DEMO = API.includes('GANTI_DENGAN_URL');

export async function apiFetch(params) {
  const url = `${API}?` + new URLSearchParams(params);
  const r = await fetch(url);
  return r.json();
}

export async function apiPost(body) {
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
  return r.json();
}

export async function getKendaraan() {
  if (IS_DEMO) return demoKendaraan();
  const res = await apiFetch({ action: 'getKendaraan' });
  return res.data || [];
}

export function demoData() {
  const kend = demoKendaraan();
  return Array.from({ length: 32 }, (_, i) => {
    const k = kend[i % kend.length];
    return {
      NO: i + 500,
      NO_PO: String(1000 + i),
      NOPOL: k.NOPOL,
      DRIVER: k.DRIVER || ['TEGUH','SUPARMIADI','RIAN HIDAYAT','BUDI'][i%4],
      TGL_PENGAJUAN: `${String(i%28+1).padStart(2,'0')}-Mei-26`,
      DEPO: k.DEPO || ['UJUNG BATU','HANGTUAH','PASIR PUTIH','DURI'][i%4],
      DIVISI: k.DIVISI,
      BENGKEL: ['Mega Riau','Anugrah Servis','Harapan Motor','Pratama'][i%4],
      JENIS_MOBIL: k.TYPE,
      KM: 10000 + (i * 7123 % 300000),
      REASON: 'SERVICE BERKALA / PERBAIKAN KOMPONEN',
      TGL_MASUK: `${String(i%28+1).padStart(2,'0')}-Jun-26`,
      TGL_KELUAR: i%3===0 ? '' : `${String(Math.min(i%28+3,30)).padStart(2,'0')}-Jun-26`,
      KETERANGAN: i%3===0 ? 'PROSES PERBAIKAN' : 'SELESAI',
      TOTAL_BIAYA: i%3===0 ? 0 : 350000 + (i * 134567 % 2500000),
    };
  });
}

export function demoKendaraan() {
  return [
    { NOPOL:'BM 9856 TN', MERK:'MITSUBISHI', TYPE:'L300 PU FB-R (4X2)',   JENIS_ARMADA:'L300',             TYPE_BAK:'Box',          DEPO:'BAGAN BATU',  DIVISI:'AQUA',       TAHUN:'2014', DRIVER:'',                        ID_DRIVER:'',         SUMBER:'SECONDARY' },
    { NOPOL:'BM 8779 TX', MERK:'MITSUBISHI', TYPE:'COLT DIESEL FE 84G',    JENIS_ARMADA:'R6 Long',          TYPE_BAK:'Box',          DEPO:'BAGAN BATU',  DIVISI:'AQUA',       TAHUN:'2018', DRIVER:'',                        ID_DRIVER:'',         SUMBER:'SECONDARY' },
    { NOPOL:'BM 7321 TH', MERK:'MITSUBISHI', TYPE:'COLT DIESEL FE 84G',    JENIS_ARMADA:'R6 Long',          TYPE_BAK:'Bak Terbuka',  DEPO:'DURI',        DIVISI:'AQUA',       TAHUN:'2019', DRIVER:'',                        ID_DRIVER:'',         SUMBER:'SECONDARY' },
    { NOPOL:'BM 6540 AB', MERK:'MITSUBISHI', TYPE:'L300 PU FB-R (4X2)',    JENIS_ARMADA:'L300',             TYPE_BAK:'Box',          DEPO:'DUMAI',       DIVISI:'AQUA',       TAHUN:'2016', DRIVER:'',                        ID_DRIVER:'',         SUMBER:'SECONDARY' },
    { NOPOL:'BM 5123 QM', MERK:'MITSUBISHI', TYPE:'COLT DIESEL FE 74S',    JENIS_ARMADA:'R4 Short',         TYPE_BAK:'Box',          DEPO:'UJUNG BATU',  DIVISI:'AQUA',       TAHUN:'2017', DRIVER:'',                        ID_DRIVER:'',         SUMBER:'SECONDARY' },
    { NOPOL:'BM 9416 TU', MERK:'MITSUBISHI', TYPE:'FN 517 ML2(6X2)',       JENIS_ARMADA:'RD 10 6X2 TRUCK',  TYPE_BAK:'',             DEPO:'PALAS',       DIVISI:'VIT',        TAHUN:'2012', DRIVER:'CHARLI HARIANTO HUTASOIT', ID_DRIVER:'23101827', SUMBER:'PRIMARY'   },
    { NOPOL:'BM 8873 OU', MERK:'MITSUBISHI', TYPE:'FJ Y1WL (6X2)',         JENIS_ARMADA:'RD 10 6X2 TRUCK',  TYPE_BAK:'',             DEPO:'PALAS',       DIVISI:'VIT',        TAHUN:'2014', DRIVER:'TOHER',                   ID_DRIVER:'1711976',  SUMBER:'PRIMARY'   },
    { NOPOL:'BM 7654 PQ', MERK:'MITSUBISHI', TYPE:'FM 517 HS (6X4)',       JENIS_ARMADA:'RD 10 6X4 TRUCK',  TYPE_BAK:'',             DEPO:'HANGTUAH',    DIVISI:'VIT',        TAHUN:'2015', DRIVER:'AHMAD FAUZI',             ID_DRIVER:'23201533', SUMBER:'PRIMARY'   },
    { NOPOL:'BM 4321 RS', MERK:'HINO',       TYPE:'FM 260 JD',             JENIS_ARMADA:'RD 10 6X2 TRUCK',  TYPE_BAK:'',             DEPO:'PASIR PUTIH', DIVISI:'AQUA',       TAHUN:'2016', DRIVER:'SUPARNO',                 ID_DRIVER:'1800234',  SUMBER:'PRIMARY'   },
    { NOPOL:'BM 1031 JC', MERK:'DAIHATSU',   TYPE:'XENIA',                 JENIS_ARMADA:'RD.4 MINIBUS',     TYPE_BAK:'',             DEPO:'HO',          DIVISI:'IT SUPPORT', TAHUN:'2010', DRIVER:'RIZAL SIBURIAN',          ID_DRIVER:'',         SUMBER:'INVENTARIS'},
    { NOPOL:'BM 1172 JX', MERK:'DAIHATSU',   TYPE:'XENIA',                 JENIS_ARMADA:'RD.4 MINIBUS',     TYPE_BAK:'',             DEPO:'HO',          DIVISI:'HR',         TAHUN:'2012', DRIVER:'HALIANTO',                ID_DRIVER:'23121841', SUMBER:'INVENTARIS'},
    { NOPOL:'BM 2233 KL', MERK:'TOYOTA',     TYPE:'AVANZA',                JENIS_ARMADA:'RD.4 MINIBUS',     TYPE_BAK:'',             DEPO:'HO',          DIVISI:'SALES',      TAHUN:'2019', DRIVER:'BUDI SANTOSO',            ID_DRIVER:'',         SUMBER:'INVENTARIS'},
  ];
}
