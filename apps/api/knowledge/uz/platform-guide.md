# Milcow foydalanish qo'llanmasi

## Milcow haqida
Milcow — biznes mijozlar (B2B) uchun xom sut va sut mahsulotlarini ulgurji xarid qilish platformasi. Koreyadagi hamkor fermalarning xom suti, qaymog'i, sariyog'i, pishlog'i, yogurti va quruq sutini tonnalab sotamiz. Mijozlarimiz — sut qayta ishlash korxonalari, novvoyxonalar, kafe tarmoqlari va oziq-ovqat ishlab chiqaruvchilar. Jismoniy shaxslarga (B2C) sotmaymiz.

## Ro'yxatdan o'tish va akkaunt
Biznes mijozlar kompaniya nomi va biznes ma'lumotlari bilan xaridor (BUYER) sifatida ro'yxatdan o'tadi. Ombor xodimi (STAFF) va administrator (ADMIN) akkauntlarini Milcow o'zi beradi. Tizimga kirgandan keyin buyurtma berish, shartnoma tuzish va olib ketishni band qilish mumkin.

## Qanday buyurtma beriladi
Har bir mahsulotning tonnadagi minimal buyurtma miqdori bor, undan kam buyurtma berib bo'lmaydi. Buyurtmada jo'natiladigan ombor va qabul qilish usuli (yetkazib berish yoki ombordan olib ketish) tanlanadi. Tanlangan omborda zaxira yetmasa, buyurtma qabul qilinmaydi. Bitta buyurtmada bir mahsulot ikki marta bo'lishi mumkin emas.

## Buyurtma holatlari
Buyurtma quyidagi tartibda o'tadi: to'lov kutilmoqda (PENDING) → to'langan (PAID) → tayyorlanmoqda (PREPARING) → yo'lda (SHIPPING) yoki olib ketishga tayyor (READY_FOR_PICKUP) → yakunlangan (COMPLETED). Xaridor buyurtmani faqat PENDING yoki PAID holatida bekor qila oladi; tayyorlash boshlangach bekor qilib bo'lmaydi.

## To'lov
To'lovlar Toss Payments orqali amalga oshiriladi. Server to'langan summani buyurtma summasi bilan qayta solishtiradi, summa farq qilsa to'lov tasdiqlanmaydi. Faqat to'lov kutilayotgan buyurtmani to'lash mumkin.

## Yetkazib berish va ombordan olib ketish
DELIVERY tanlansa, kiritilgan manzilga yetkazib beramiz. PICKUP tanlansa, ombordagi olib ketish vaqt oralig'ini band qilasiz. Har bir vaqt oralig'ining sig'imi bor: to'lgan yoki allaqachon boshlangan oraliqni band qilib bo'lmaydi. Band qilgach MC- bilan boshlanadigan darvoza kodi beriladi — uni ombor darvozasida ko'rsatasiz. Olib ketish SCHEDULED → LOADING → READY → PICKED_UP tartibida o'tadi; yuklash boshlangach bandni bekor qilib bo'lmaydi.

## Oylik yetkazib berish shartnomasi
Har oy bir xil miqdor kerak bo'lsa, shartnoma tuzish mumkin. Shartnoma 1 oydan 24 oygacha bo'ladi, oylik miqdor (tonna) va tonna narxi butun muddat davomida o'zgarmaydi. Shartnoma DRAFT (qoralama) → REVIEW (ko'rib chiqish) → ACTIVE (amalda) → ENDED (tugagan) tartibida o'tadi. Xaridor qoralamani ko'rib chiqishga yuborishi yoki amalga kirmasdan bekor qilishi mumkin; tasdiqlashni administrator qiladi. Shartnoma amalda bo'lsa, har oyning yetkazib berish sanasida buyurtma avtomatik yaratiladi.

## Shartnoma qo'shimcha xizmatlari
Shartnomaga oylik to'lovli qo'shimcha xizmatlar qo'shish mumkin: sovuq zanjir yetkazib berish, sifat tahlili hisoboti, narxni muzlatish va boshqalar. Ularning narxi har oy avtomatik yaratiladigan buyurtma summasiga qo'shiladi.

## Aloqa
Savolingizni saytdagi Aloqa sahifasi orqali qoldiring. AI yordamchi javob bera olmagan savollarga xodimlarimiz tekshirib javob beradi.
