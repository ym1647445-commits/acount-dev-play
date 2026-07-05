// ضع بيانات مشروع Supabase هنا
const SUPABASE_URL = "https://fosepdbsvzflvarklxsm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvc2VwZGJzdnpmbHZhcmtseHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjYxNDYsImV4cCI6MjA5ODg0MjE0Nn0.c43dkVqy3IFbf2_lRSv4vDRbM-v7jyxDp5vzegweZnY";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKETS = {
  accounts: 'account-images',
  documents: 'seller-documents',
  pdfs: 'sale-pdfs'
};

async function getCurrentUser(){
  const { data } = await db.auth.getUser();
  return data.user;
}

async function getAdminProfile(){
  const user = await getCurrentUser();
  if(!user) return null;
  const { data, error } = await db.from('admin_users').select('*').eq('id', user.id).eq('active', true).single();
  if(error) return null;
  return data;
}

function statusText(status){
  return {available:'متاح', reserved:'محجوز', sold:'تم البيع'}[status] || status;
}

function money(v){return `${Number(v || 0).toLocaleString('ar-EG')} ج.م`}

function whatsappLink(phone){
  const clean = String(phone || '').replace(/\D/g,'');
  const egypt = clean.startsWith('20') ? clean : `2${clean}`;
  return `https://wa.me/${egypt}`;
}

async function uploadFile(bucket, file, folder='uploads'){
  if(!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const { error } = await db.storage.from(bucket).upload(path, file);
  if(error) throw error;
  return path;
}
