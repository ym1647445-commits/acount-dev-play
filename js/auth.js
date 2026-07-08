async function requireAdmin(){
  const user = await getCurrentUser();
  if(!user){ location.href = 'index.html'; return null; }
  const profile = await getAdminProfile();
  if(!profile){ await db.auth.signOut(); location.href = 'index.html'; return null; }
  document.querySelectorAll('[data-admin-name]').forEach(el=>el.textContent = profile.name || user.email);
  document.querySelectorAll('[data-role]').forEach(el=>el.textContent = profile.role);
  if(profile.role === 'viewer') document.querySelectorAll('[data-hide-viewer]').forEach(el=>el.style.display='none');
  if(profile.role !== 'owner') document.querySelectorAll('[data-owner-only]').forEach(el=>el.style.display='none');
  return profile;
}

async function loginAdmin(e){
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');
  msg.textContent = 'جاري تسجيل الدخول...';
  const { error } = await db.auth.signInWithPassword({ email, password });
  if(error){ msg.textContent = 'خطأ: ' + error.message; return; }
  const profile = await getAdminProfile();
  if(!profile){ msg.textContent = 'الحساب ليس له صلاحية أدمن.'; await db.auth.signOut(); return; }
  location.href = 'dashboard.html';
}

async function logout(){ await db.auth.signOut(); location.href = 'index.html'; }

document.addEventListener('DOMContentLoaded',()=>{
  const form = document.getElementById('loginForm');
  if(form) form.addEventListener('submit', loginAdmin);
  document.querySelectorAll('[data-logout]').forEach(btn=>btn.addEventListener('click', logout));
});
