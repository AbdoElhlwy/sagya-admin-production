# سقيا الحرمين — إصلاح Admin Dashboard

## الرابط المستخدم

```
REACT_APP_API_URL=https://sagya-backend-production.onrender.com/api
```

مُعرَّف في:
- `admin/.env.example`
- `admin/src/App.jsx` كـ fallback

## بيانات الدخول

```
الهاتف:      +966500000001
كلمة المرور: Sagya@2024!
```

## Endpoints المستخدمة

| الصفحة | Endpoint |
|--------|----------|
| Login | POST /auth/admin-login |
| Dashboard | GET /admin/dashboard |
| Users | GET /users |
| Requests | GET /volunteer-requests |
| Volunteers | GET /volunteers |
| Tasks | GET /tasks |
| Donations | GET /donations |
| Campaigns | GET /campaigns |
| Payments | GET /payments |
| Notifications | GET /notifications |
| Reports | GET /reports/summary |
| QR Verify | GET /qr/verify/:code |
| Files | GET /files |
| Settings | GET /settings + PATCH /settings |
| Status | GET /api/status (بدون /api prefix إضافي) |

## ما تم إصلاحه

1. **Login** — يقرأ `res.token` و `res.refreshToken` و `res.user` مباشرة من الرد الفعلي
2. **API Client** — دالة موحدة `apiRequest` تتعامل مع 401/403/404/500/Network Error
3. **Dashboard stats** — يقبل camelCase (من Backend) وsnake_case معاً
4. **ESLint** — تم إزالة `useAuth` غير المستخدمة، وإصلاح جميع الـ hooks dependencies
5. **Build** — `CI=false react-scripts build` يمنع warnings من تحويل إلى errors
6. **تصميم** — واجهة احترافية RTL عربية بهوية سقيا الحرمين (أخضر داكن + ذهبي + عاجي)
7. **Endpoints مقطوعة** — لا تكسر الصفحة، تعرض رسالة واضحة مع زر Retry
8. **لا localhost / لا روابط قديمة** — الرابط الوحيد هو sagya-backend-production

## كيف ترفع التعديل

```bash
cd sagya-haramain/admin

git add .
git commit -m "fix: complete admin dashboard rewrite — login, API client, UI"
git push
```

Vercel سيكتشف الـ push تلقائياً ويعيد النشر.

## تحقق بعد النشر

1. افتح https://sagya-admin-production.vercel.app
2. أدخل +966500000001 / Sagya@2024!
3. يجب أن تنتقل للـ Dashboard مباشرة
4. إذا Dashboard فشل في جلب البيانات، تظهر رسالة خطأ مع زر Retry وزر Health Check
5. جميع الصفحات الأخرى تفتح ولو بجداول فارغة

## تذكير: ALLOWED_ORIGINS على Render

تأكد أن Render يحتوي:
```
ALLOWED_ORIGINS=https://sagya-admin-production.vercel.app
```
