document.addEventListener('DOMContentLoaded', async()=>{
  const profile = await requireAdmin();
  if(profile?.role === 'viewer') document.querySelector('#docForm button[type="submit"]').disabled = true;
  const form = document.getElementById('docForm');
  form.addEventListener('input', updatePreview);
  form.addEventListener('submit', saveDoc);
  document.getElementById('printBtn').addEventListener('click',()=>window.print());
  document.getElementById('pdfBtn').addEventListener('click',()=>html2pdf().from(document.getElementById('printArea')).save('devplay-sale-document.pdf'));
  updatePreview();
});

function updatePreview(){
  const fd = new FormData(document.getElementById('docForm'));
  document.getElementById('docPreview').innerHTML = `
    <p><strong>اسم البائع:</strong> ${fd.get('seller_name')||'................'}</p>
    <p><strong>رقم البطاقة:</strong> ${fd.get('national_id')||'................'}</p>
    <p><strong>اللعبة:</strong> ${fd.get('game')||'................'}</p>
    <p><strong>ID الحساب:</strong> ${fd.get('account_game_id')||'................'}</p>
    <p><strong>سعر البيع:</strong> ${money(fd.get('sale_price'))}</p>
    <p><strong>الإقرار:</strong> ${fd.get('declaration')||''}</p>
    <p><strong>التوقيع الإلكتروني:</strong> ${fd.get('electronic_signature')||'................'}</p>
    <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>`;
}

async function saveDoc(e){
  e.preventDefault();
  const msg = document.getElementById('msg'); msg.textContent = 'جاري الحفظ...';
  const fd = new FormData(e.target), user = await getCurrentUser();
  const idCard = await uploadFile(STORAGE_BUCKETS.sellers, document.getElementById('idCard').files[0], 'id-cards');
  const sellerCard = await uploadFile(STORAGE_BUCKETS.sellers, document.getElementById('sellerCard').files[0], 'seller-with-card');
  const payload = {
    seller_name: fd.get('seller_name'), national_id: fd.get('national_id'), id_card_image: idCard, seller_with_card_image: sellerCard,
    game: fd.get('game'), account_game_id: fd.get('account_game_id'), sale_price: Number(fd.get('sale_price')||0),
    declaration: fd.get('declaration'), electronic_signature: fd.get('electronic_signature'), created_by: user.id
  };
  const { error } = await db.from('sale_documents').insert(payload);
  msg.textContent = error ? 'خطأ: '+error.message : 'تم حفظ التوثيق بنجاح';
}
