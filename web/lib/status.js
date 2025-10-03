export function statusTH(s){
  switch(String(s||'').toUpperCase()){
    case 'DRAFT': return 'รอยืนยัน';
    case 'SUBMITTED': return 'กำลังดำเนินการ';
    case 'APPROVED': return 'อนุมัติแล้ว';
    case 'REJECTED': return 'ปฏิเสธแล้ว';
    default: return s;
  }
}
