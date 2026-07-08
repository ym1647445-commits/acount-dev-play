document.addEventListener('DOMContentLoaded', async()=>{
  await requireAdmin();
  await loadDashboard();
});

async function loadDashboard(){
  const statsBox = document.getElementById('stats');
  const { data: accounts } = await db.from('game_accounts').select('*').order('created_at',{ascending:false});
  const rows = accounts || [];
  const stats = {
    'إجمالي الحسابات': rows.length,
    'المتاح': rows.filter(a=>a.status==='available').length,
    'المحجوز': rows.filter(a=>a.status==='reserved').length,
    'المباع': rows.filter(a=>a.status==='sold').length,
    'تكلفة الشراء': money(rows.reduce((s,a)=>s+Number(a.purchase_cost||0),0)),
    'إجمالي المبيعات': money(rows.filter(a=>a.status==='sold').reduce((s,a)=>s+Number(a.sell_price||0),0)),
    'إجمالي الأرباح': money(rows.filter(a=>a.status==='sold').reduce((s,a)=>s+Number(a.profit||0),0)),
    'آخر تحديث': new Date().toLocaleDateString('ar-EG')
  };
  statsBox.innerHTML = Object.entries(stats).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
  document.getElementById('latestRows').innerHTML = rows.slice(0,8).map(a=>`<tr><td>${a.code||''}</td><td>${a.game}</td><td>${a.account_name}</td><td>${money(a.sell_price)}</td><td><span class="badge ${a.status}">${statusText(a.status)}</span></td><td>${new Date(a.created_at).toLocaleDateString('ar-EG')}</td></tr>`).join('');
}
