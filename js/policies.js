let profile = null;
document.addEventListener('DOMContentLoaded', async()=>{
  profile = await requireAdmin();
  await loadPolicies();
  const form = document.getElementById('policyForm');
  if(form) form.addEventListener('submit', savePolicy);
});

async function loadPolicies(){
  const { data, error } = await db.from('account_policies').select('*').order('updated_at',{ascending:false});
  const box = document.getElementById('policiesList');
  if(error){ box.innerHTML = `<div class="card">${error.message}</div>`; return; }
  box.innerHTML = (data||[]).map(p=>`
    <div class="card policy-card">
      <strong>${p.title}</strong>
      <span class="tagline">${p.game || 'سياسة عامة'} - ${p.type === 'sell' ? 'بيع' : 'شراء'}</span>
      <textarea readonly>${p.content}</textarea>
      <div class="actions">
        <button class="btn secondary" onclick="copyPolicy(${p.id})">نسخ</button>
        ${profile?.role !== 'viewer'?`<button class="btn danger" onclick="deletePolicy(${p.id})">حذف</button>`:''}
      </div>
    </div>`).join('') || '<div class="card">لا توجد سياسات</div>';
}

async function savePolicy(e){
  e.preventDefault();
  const form = e.target, fd = new FormData(form), user = await getCurrentUser();
  const payload = { game: fd.get('game') || null, type: fd.get('type'), title: fd.get('title'), content: fd.get('content'), updated_by: user.id };
  const { error } = await db.from('account_policies').insert(payload);
  document.getElementById('msg').textContent = error ? error.message : 'تم حفظ السياسة';
  if(!error){ form.reset(); loadPolicies(); }
}

async function copyPolicy(id){
  const { data } = await db.from('account_policies').select('content').eq('id', id).single();
  if(data){ await navigator.clipboard.writeText(data.content); alert('تم نسخ السياسة'); }
}

async function deletePolicy(id){
  if(!confirm('حذف السياسة؟')) return;
  const { error } = await db.from('account_policies').delete().eq('id', id);
  if(error) alert(error.message); else loadPolicies();
}
