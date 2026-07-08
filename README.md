# DevPlay Studio Admin Dashboard

لوحة تحكم HTML + CSS + JavaScript لإدارة حسابات الألعاب وربطها بـ Supabase.

## التشغيل
1. افتحي `js/supabase.js`.
2. غيّري:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. افتحي `index.html` أو ارفعي المشروع على الاستضافة.

## Supabase Setup
1. من Supabase > SQL Editor شغّلي الملف:
   `supabase/schema.sql`
2. من Authentication أضيفي أدمن جديد بالإيميل والباسورد.
3. بعد إنشاء المستخدم، خدي الـ User ID من Auth Users.
4. شغّلي SQL مثل:

```sql
insert into public.admin_users (id, name, role, active)
values ('USER_ID_HERE', 'Yaso', 'owner', true);
```

## Storage Buckets
اعملي Buckets خاصة Private:
- account-images
- seller-documents
- sale-pdfs

## رفع على الدومين
ممكن ترفعي الملفات في:
- `devplaystudio.com/admin`
أو تعملي Subdomain:
- `admin.devplaystudio.com`

## الصلاحيات
- Owner: إضافة/تعديل/حذف كل شيء.
- Admin: إضافة وتعديل الحسابات والسياسات والتوثيق.
- Viewer: مشاهدة فقط.

## مهم جدًا
لا تضعي Service Role Key في ملفات الموقع أبدًا. استخدمي Anon Public Key فقط.
