let adminProfile = null;
let editingId = new URLSearchParams(location.search).get('id');

document.addEventListener('DOMContentLoaded', async()=>{
  adminProfile = await requireAdmin();
  if(document.getElementById('accountsRows')) initAccountsPage();
  if(document.getElementById('accountForm')) initFormPage();
});

async function initAccountsPage(){
  ['search','status','gameFilter'].forEach(id=>document.getElementById(id).addEventListener('input', loadAccounts));
  document.getElementById('refresh').addEventListener('click', loadAccounts);
  await loadAccounts();
}

async function loadAccounts(){
  let { data, error } = await db.from('game_accounts').select('*').order('created_at',{ascending:false});
  const tbody = document.getElementById('accountsRows');
  if(error){ tbody.innerHTML = `<tr><td colspan="11">${error.message}</td></tr>`; return; }
  const q = document.getElementById('search').value.trim().toLowerCase();
  const st = document.getElementById('status').value;
  const gf = document.getElementById('gameFilter').value.trim().toLowerCase();
  data = (data||[]).filter(a=>{
    const hay = `${a.code} ${a.game} ${a.account_name} ${a.account_id}`.toLowerCase();
    return (!q || hay.includes(q)) && (!st || a.status===st) && (!gf || String(a.game).toLowerCase().includes(gf));
  });
  tbody.innerHTML = data.map(a=>`
    <tr>
      <td>${a.code||''}</td><td>${a.game||''}</td><td>${a.account_name||''}</td><td>${a.account_id||''}</td><td>${a.server||''}</td>
      <td>${money(a.purchase_cost)}</td><td>${money(a.sell_price)}</td><td>${money(a.profit)}</td>
      <td>${a.seller_whatsapp?`<a class="btn secondary" target="_blank" href="${whatsappLink(a.seller_whatsapp)}">واتساب</a>`:''}</td>
      <td><span class="badge ${a.status}">${statusText(a.status)}</span></td>
      <td class="actions">
      <a class="btn secondary" href="public-account.html?id=${a.id}" target="_blank">PDF</a>
        <a class="btn secondary" href="add-account.html?id=${a.id}" data-hide-viewer>تعديل</a>
        ${adminProfile?.role==='owner'?`<button class="btn danger" onclick="deleteAccount(${a.id})">حذف</button>`:''}
      </td>
    </tr>`).join('') || `<tr><td colspan="11">لا توجد حسابات</td></tr>`;
}

async function deleteAccount(id){
  if(!confirm('حذف الحساب نهائيًا؟')) return;
  const { error } = await db.from('game_accounts').delete().eq('id', id);
  if(error) alert(error.message); else loadAccounts();
}

async function initFormPage(){
  if(adminProfile?.role === 'viewer'){ location.href='accounts.html'; return; }
  const form = document.getElementById('accountForm');
  const msg = document.getElementById('msg');
  if(editingId){
    document.getElementById('pageTitle').textContent = 'تعديل حساب';
    const { data } = await db.from('game_accounts').select('*').eq('id', editingId).single();
    if(data){ Object.keys(data).forEach(k=>{ if(form.elements[k]) form.elements[k].value = data[k] ?? ''; }); }
  }
  document.getElementById('images').addEventListener('change', e=>{
    document.getElementById('preview').innerHTML = [...e.target.files].map(f=>`<img src="${URL.createObjectURL(f)}">`).join('');
  });
  form.addEventListener('submit', async e=>{
    e.preventDefault(); msg.textContent='جاري الحفظ...';
    const fd = new FormData(form);
    const user = await getCurrentUser();
    const files = [...document.getElementById('images').files];
    const images = [];
    for(const file of files){ images.push(await uploadFile(STORAGE_BUCKETS.accounts, file, 'accounts')); }
    const payload = {
      game: fd.get('game'), account_name: fd.get('account_name'), account_id: fd.get('account_id'), server: fd.get('server'),
      description: fd.get('description'), purchase_cost: Number(fd.get('purchase_cost')||0), sell_price: Number(fd.get('sell_price')||0),
      price: Number(fd.get('sell_price')||0), seller_whatsapp: fd.get('seller_whatsapp'), internal_notes: fd.get('internal_notes'), status: fd.get('status'), created_by: user.id
    };
    if(images.length) payload.images = images;
    const res = editingId ? await db.from('game_accounts').update(payload).eq('id', editingId) : await db.from('game_accounts').insert(payload);
    if(res.error){ msg.textContent='خطأ: '+res.error.message; return; }
    msg.textContent='تم الحفظ بنجاح'; setTimeout(()=>location.href='accounts.html',700);
  });
}
