import { PrismaClient } from "../src/generated/prisma";
// import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  // const hashedPassword = await bcrypt.hash("password123", 10);

  // Create a test user
  // const user = await prisma.user.upsert({
  //   where: { email: "test@example.com" },
  //   update: {
  //     phone: "+1234567890",
  //     password: hashedPassword,
  //     name: "Test User",
  //     bio: "This is a test user for development purposes.",
  //     role: "USER",
  //     emailVerified: new Date(), // Mark email as verified
  //   },
  //   create: {
  //     email: "test@example.com",
  //     phone: "+1234567890",
  //     password: hashedPassword,
  //     name: "Test User",
  //     bio: "This is a test user for development purposes.",
  //     role: "USER",
  //     emailVerified: new Date(), // Mark email as verified
  //   },
  // });

  // console.log("Created test user:", user);

  // ============================================
  // SEED PLANS
  // ============================================

  // 1. Delight Plan (Lowest Tier)
  const delightPlan = await prisma.plan.upsert({
    where: { slug: "delight" },
    update: {
      name: "Delight",
      priceNGN: 50000,
      priceUSD: 30,
      priceGBP: 25,
      priceEUR: 28,
      currency: "NGN",
      durationDays: 180,
      maxMemorials: 1,
      maxPhotosPerMemorial: 50,
      maxVideosPerMemorial: 5,
      maxAdmins: 1,
      maxContributors: 5,
      storageQuotaMB: 500,
      prints: "Up to 30 Cards & 30 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: false,
      isVisible: true,
      displayOrder: 1,
      badgeText: null,
      badgeColor: null,
    },
    create: {
      slug: "delight",
      name: "Delight",
      description: "Perfect for personal memorials",
      priceNGN: 50000,
      priceUSD: 30,
      priceGBP: 25,
      priceEUR: 28,
      currency: "NGN",
      durationDays: 180,
      maxMemorials: 1,
      maxPhotosPerMemorial: 50,
      maxVideosPerMemorial: 5,
      maxAdmins: 1,
      maxContributors: 5,
      storageQuotaMB: 500,
      prints: "Up to 30 Cards & 30 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: false,
      isVisible: true,
      displayOrder: 1,
    },
  });

  // 2. Darling Plan (Middle Tier - Most Popular)
  const darlingPlan = await prisma.plan.upsert({
    where: { slug: "darling" },
    update: {
      name: "Darling",
      priceNGN: 120000,
      priceUSD: 73,
      priceGBP: 57,
      priceEUR: 67,
      currency: "NGN",
      durationDays: 270,
      maxMemorials: 1,
      maxPhotosPerMemorial: 100,
      maxVideosPerMemorial: 15,
      maxAdmins: 3,
      maxContributors: 15,
      storageQuotaMB: 1500,
      prints: "Up to 50 Cards & 50 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: true,
      isVisible: true,
      displayOrder: 2,
      badgeText: "Most Popular",
      badgeColor: "primary",
    },
    create: {
      slug: "darling",
      name: "Darling",
      description: "Most popular choice for families",
      priceNGN: 120000,
      priceUSD: 73,
      priceGBP: 57,
      priceEUR: 67,
      currency: "NGN",
      durationDays: 270,
      maxMemorials: 1,
      maxPhotosPerMemorial: 100,
      maxVideosPerMemorial: 15,
      maxAdmins: 3,
      maxContributors: 15,
      storageQuotaMB: 1500,
      prints: "Up to 50 Cards & 50 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: true,
      isVisible: true,
      displayOrder: 2,
      badgeText: "Most Popular",
      badgeColor: "primary",
    },
  });

  // 3. Deluxe Plan (Highest Tier)
  const deluxePlan = await prisma.plan.upsert({
    where: { slug: "deluxe" },
    update: {
      name: "Deluxe",
      priceNGN: 200000,
      priceUSD: 121,
      priceGBP: 95,
      priceEUR: 111,
      currency: "NGN",
      durationDays: 365,
      maxMemorials: 1,
      maxPhotosPerMemorial: 500,
      maxVideosPerMemorial: 50,
      maxAdmins: 10,
      maxContributors: 50,
      storageQuotaMB: 5000,
      prints: "Up to 100 Cards & 100 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: false,
      isVisible: true,
      displayOrder: 3,
      badgeText: "Best Value",
      badgeColor: "success",
    },
    create: {
      slug: "deluxe",
      name: "Deluxe",
      description: "Premium plan for families & organizations",
      priceNGN: 200000,
      priceUSD: 121,
      priceGBP: 95,
      priceEUR: 111,
      currency: "NGN",
      durationDays: 365,
      maxMemorials: 1,
      maxPhotosPerMemorial: 500,
      maxVideosPerMemorial: 50,
      maxAdmins: 10,
      maxContributors: 50,
      storageQuotaMB: 5000,
      prints: "Up to 100 Cards & 100 Programmes",
      allowRSVP: true,
      allowGuestbook: true,
      allowVirtualTributes: true,
      isPopular: false,
      isVisible: true,
      displayOrder: 3,
      badgeText: "Best Value",
      badgeColor: "success",
    },
  });

  console.log("Created plans:", { delightPlan, darlingPlan, deluxePlan });

  // ============================================
  // SEED PLAN TRANSLATIONS (English)
  // ============================================

  // Delight Plan - English Translation
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "en",
      },
    },
    update: {
      name: "Delight",
      description: "Perfect for personal memorials",
      badgeText: null,
      features: {
        memorials: "Custom Memorial page",
        photos: "Up to 50 photos",
        videos: "Up to 5 videos",
        prints: "30 Cards & 30 Programmes",
        rsvp: "RSVP management",
        guestbook: "Digital guestbook",
        tributes: "Virtual candles & flowers",
        storage: "500 MB storage",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "en",
      name: "Delight",
      description: "Perfect for personal memorials",
      badgeText: null,
      features: {
        memorials: "Custom Memorial page",
        photos: "Up to 50 photos",
        videos: "Up to 5 videos",
        prints: "30 Cards & 30 Programmes",
        rsvp: "RSVP management",
        guestbook: "Digital guestbook",
        tributes: "Virtual candles & flowers",
        storage: "500 MB storage",
      },
    },
  });

  // Darling Plan - English Translation
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "en",
      },
    },
    update: {
      name: "Darling",
      description: "Most popular choice for families",
      badgeText: "Most Popular",
      features: {
        memorials: "Custom Memorial pages",
        photos: "Up to 100 photos",
        videos: "Up to 15 videos",
        prints: "50 Cards & 50 Programmes",
        rsvp: "Advanced RSVP management",
        guestbook: "Digital guestbook",
        tributes: "Unlimited virtual candles & flowers",
        storage: "1.5 GB storage",
        admins: "Up to 3 administrators",
        contributors: "Up to 15 contributors",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "en",
      name: "Darling",
      description: "Most popular choice for families",
      badgeText: "Most Popular",
      features: {
        memorials: "CustomMemorial pages",
        photos: "Up to 100 photos",
        videos: "Up to 15 videos",
        prints: "50 Cards & 50 Programmes",
        rsvp: "Advanced RSVP management",
        guestbook: "Digital guestbook",
        tributes: "Unlimited virtual candles & flowers",
        storage: "1.5 GB storage",
        admins: "Up to 3 administrators",
        contributors: "Up to 15 contributors",
      },
    },
  });

  // Deluxe Plan - English Translation
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "en",
      },
    },
    update: {
      name: "Deluxe",
      description: "Premium plan for families & organizations",
      badgeText: "Best Value",
      features: {
        memorials: "Custom Memorial pages",
        photos: "Up to 500 photos",
        videos: "Up to 50 videos",
        prints: "100 Cards & 100 Programmes",
        rsvp: "Premium RSVP management",
        guestbook: "Enhanced digital guestbook",
        tributes: "Unlimited virtual candles & flowers",
        storage: "5 GB storage",
        admins: "Up to 10 administrators",
        contributors: "Up to 50 contributors",
        priority: "Priority support",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "en",
      name: "Deluxe",
      description: "Premium plan for families & organizations",
      badgeText: "Best Value",
      features: {
        memorials: "Custom Memorial pages",
        photos: "Up to 500 photos",
        videos: "Up to 50 videos",
        prints: "100 Cards & 100 Programmes",
        rsvp: "Premium RSVP management",
        guestbook: "Enhanced digital guestbook",
        tributes: "Unlimited virtual candles & flowers",
        storage: "5 GB storage",
        admins: "Up to 10 administrators",
        contributors: "Up to 50 contributors",
        priority: "Priority support",
      },
    },
  });

  console.log("Created plan translations (English)");

  // French translations
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "fr",
      },
    },
    update: {
      name: "Délice",
      description: "Parfait pour commencer votre voyage du souvenir",
      features: {
        memorials: "1 page commémorative",
        photos: "Jusqu'à 20 photos",
        videos: "Jusqu'à 5 vidéos",
        tributes: "Hommages illimités",
        customization: "Personnalisation de base",
        support: "Support par email",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "fr",
      name: "Délice",
      description: "Parfait pour commencer votre voyage du souvenir",
      features: {
        memorials: "1 page commémorative",
        photos: "Jusqu'à 20 photos",
        videos: "Jusqu'à 5 vidéos",
        tributes: "Hommages illimités",
        customization: "Personnalisation de base",
        support: "Support par email",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "fr",
      },
    },
    update: {
      name: "Chéri",
      description: "Notre plan le plus populaire pour les familles",
      features: {
        memorials: "Jusqu'à 3 pages commémoratives",
        photos: "Jusqu'à 50 photos",
        videos: "Jusqu'à 15 vidéos",
        tributes: "Hommages illimités",
        customization: "Personnalisation avancée",
        qrCode: "Codes QR personnalisés",
        support: "Support prioritaire",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "fr",
      name: "Chéri",
      description: "Notre plan le plus populaire pour les familles",
      features: {
        memorials: "Jusqu'à 3 pages commémoratives",
        photos: "Jusqu'à 50 photos",
        videos: "Jusqu'à 15 vidéos",
        tributes: "Hommages illimités",
        customization: "Personnalisation avancée",
        qrCode: "Codes QR personnalisés",
        support: "Support prioritaire",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "fr",
      },
    },
    update: {
      name: "Deluxe",
      description: "Expérience commémorative complète et illimitée",
      features: {
        memorials: "Pages commémoratives illimitées",
        photos: "Photos illimitées",
        videos: "Vidéos illimitées",
        tributes: "Hommages illimités",
        customization: "Personnalisation complète",
        qrCode: "Codes QR personnalisés",
        domain: "Nom de domaine personnalisé",
        priority: "Support prioritaire",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "fr",
      name: "Deluxe",
      description: "Expérience commémorative complète et illimitée",
      features: {
        memorials: "Pages commémoratives illimitées",
        photos: "Photos illimitées",
        videos: "Vidéos illimitées",
        tributes: "Hommages illimités",
        customization: "Personnalisation complète",
        qrCode: "Codes QR personnalisés",
        domain: "Nom de domaine personnalisé",
        priority: "Support prioritaire",
      },
    },
  });

  // Spanish translations
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "es",
      },
    },
    update: {
      name: "Delicia",
      description: "Perfecto para comenzar tu viaje de recuerdos",
      features: {
        memorials: "1 página conmemorativa",
        photos: "Hasta 20 fotos",
        videos: "Hasta 5 videos",
        tributes: "Tributos ilimitados",
        customization: "Personalización básica",
        support: "Soporte por correo electrónico",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "es",
      name: "Delicia",
      description: "Perfecto para comenzar tu viaje de recuerdos",
      features: {
        memorials: "1 página conmemorativa",
        photos: "Hasta 20 fotos",
        videos: "Hasta 5 videos",
        tributes: "Tributos ilimitados",
        customization: "Personalización básica",
        support: "Soporte por correo electrónico",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "es",
      },
    },
    update: {
      name: "Cariño",
      description: "Nuestro plan más popular para familias",
      features: {
        memorials: "Hasta 3 páginas conmemorativas",
        photos: "Hasta 50 fotos",
        videos: "Hasta 15 videos",
        tributes: "Tributos ilimitados",
        customization: "Personalización avanzada",
        qrCode: "Códigos QR personalizados",
        support: "Soporte prioritario",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "es",
      name: "Cariño",
      description: "Nuestro plan más popular para familias",
      features: {
        memorials: "Hasta 3 páginas conmemorativas",
        photos: "Hasta 50 fotos",
        videos: "Hasta 15 videos",
        tributes: "Tributos ilimitados",
        customization: "Personalización avanzada",
        qrCode: "Códigos QR personalizados",
        support: "Soporte prioritario",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "es",
      },
    },
    update: {
      name: "Deluxe",
      description: "Experiencia conmemorativa completa e ilimitada",
      features: {
        memorials: "Páginas conmemorativas ilimitadas",
        photos: "Fotos ilimitadas",
        videos: "Videos ilimitados",
        tributes: "Tributos ilimitados",
        customization: "Personalización completa",
        qrCode: "Códigos QR personalizados",
        domain: "Nombre de dominio personalizado",
        priority: "Soporte prioritario",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "es",
      name: "Deluxe",
      description: "Experiencia conmemorativa completa e ilimitada",
      features: {
        memorials: "Páginas conmemorativas ilimitadas",
        photos: "Fotos ilimitadas",
        videos: "Videos ilimitados",
        tributes: "Tributos ilimitados",
        customization: "Personalización completa",
        qrCode: "Códigos QR personalizados",
        domain: "Nombre de dominio personalizado",
        priority: "Soporte prioritario",
      },
    },
  });

  // Yoruba translations
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "yo",
      },
    },
    update: {
      name: "Ìdùnnú",
      description: "Ó dára láti bẹ̀rẹ̀ ìrìnàjò ìrántí rẹ",
      features: {
        memorials: "Ojú-ìwé ìrántí 1",
        photos: "Àwọn fọ́tò tó tó 20",
        videos: "Àwọn fídíò tó tó 5",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò ìpìlẹ̀",
        support: "Àtìlẹyìn ẹ́míèlì",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "yo",
      name: "Ìdùnnú",
      description: "Ó dára láti bẹ̀rẹ̀ ìrìnàjò ìrántí rẹ",
      features: {
        memorials: "Ojú-ìwé ìrántí 1",
        photos: "Àwọn fọ́tò tó tó 20",
        videos: "Àwọn fídíò tó tó 5",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò ìpìlẹ̀",
        support: "Àtìlẹyìn ẹ́míèlì",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "yo",
      },
    },
    update: {
      name: "Olùfẹ́",
      description: "Ètò tí ó gbajúmọ̀ jùlọ fún àwọn ìdílé",
      features: {
        memorials: "Àwọn ojú-ìwé ìrántí tó tó 3",
        photos: "Àwọn fọ́tò tó tó 50",
        videos: "Àwọn fídíò tó tó 15",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò ilọsíwájú",
        qrCode: "Àwọn kóòdù QR aláṣètò",
        support: "Àtìlẹyìn pàtàkì",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "yo",
      name: "Olùfẹ́",
      description: "Ètò tí ó gbajúmọ̀ jùlọ fún àwọn ìdílé",
      features: {
        memorials: "Àwọn ojú-ìwé ìrántí tó tó 3",
        photos: "Àwọn fọ́tò tó tó 50",
        videos: "Àwọn fídíò tó tó 15",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò ilọsíwájú",
        qrCode: "Àwọn kóòdù QR aláṣètò",
        support: "Àtìlẹyìn pàtàkì",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "yo",
      },
    },
    update: {
      name: "Deluxe",
      description: "Ìrírí ìrántí tí ó pé tí kò sí òpin",
      features: {
        memorials: "Àwọn ojú-ìwé ìrántí àìlópin",
        photos: "Àwọn fọ́tò àìlópin",
        videos: "Àwọn fídíò àìlópin",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò kíkún",
        qrCode: "Àwọn kóòdù QR aláṣètò",
        domain: "Orúkọ ìkápá aláṣètò",
        priority: "Àtìlẹyìn pàtàkì",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "yo",
      name: "Deluxe",
      description: "Ìrírí ìrántí tí ó pé tí kò sí òpin",
      features: {
        memorials: "Àwọn ojú-ìwé ìrántí àìlópin",
        photos: "Àwọn fọ́tò àìlópin",
        videos: "Àwọn fídíò àìlópin",
        tributes: "Àwọn ọ̀rọ̀ ìyìn àìlópin",
        customization: "Ìṣètò kíkún",
        qrCode: "Àwọn kóòdù QR aláṣètò",
        domain: "Orúkọ ìkápá aláṣètò",
        priority: "Àtìlẹyìn pàtàkì",
      },
    },
  });

  // Igbo translations
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "ig",
      },
    },
    update: {
      name: "Ọṅụ",
      description: "Ọ dị mma ịmalite njem ncheta gị",
      features: {
        memorials: "Ibe ncheta 1",
        photos: "Foto ruru 20",
        videos: "Vidiyo ruru 5",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi nke mbụ",
        support: "Nkwado email",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "ig",
      name: "Ọṅụ",
      description: "Ọ dị mma ịmalite njem ncheta gị",
      features: {
        memorials: "Ibe ncheta 1",
        photos: "Foto ruru 20",
        videos: "Vidiyo ruru 5",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi nke mbụ",
        support: "Nkwado email",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "ig",
      },
    },
    update: {
      name: "Onye Ọma",
      description: "Atụmatụ anyị kacha ewu ewu maka ezinụlọ",
      features: {
        memorials: "Ibe ncheta ruru 3",
        photos: "Foto ruru 50",
        videos: "Vidiyo ruru 15",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi dị elu",
        qrCode: "Koodu QR ahaziri",
        support: "Nkwado mbụ",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "ig",
      name: "Onye Ọma",
      description: "Atụmatụ anyị kacha ewu ewu maka ezinụlọ",
      features: {
        memorials: "Ibe ncheta ruru 3",
        photos: "Foto ruru 50",
        videos: "Vidiyo ruru 15",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi dị elu",
        qrCode: "Koodu QR ahaziri",
        support: "Nkwado mbụ",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "ig",
      },
    },
    update: {
      name: "Deluxe",
      description: "Ahụmịhe ncheta zuru oke na enweghị ngwụcha",
      features: {
        memorials: "Ibe ncheta na-enweghị ngwụcha",
        photos: "Foto na-enweghị ngwụcha",
        videos: "Vidiyo na-enweghị ngwụcha",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi zuru oke",
        qrCode: "Koodu QR ahaziri",
        domain: "Aha ngalaba ahaziri",
        priority: "Nkwado mbụ",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "ig",
      name: "Deluxe",
      description: "Ahụmịhe ncheta zuru oke na enweghị ngwụcha",
      features: {
        memorials: "Ibe ncheta na-enweghị ngwụcha",
        photos: "Foto na-enweghị ngwụcha",
        videos: "Vidiyo na-enweghị ngwụcha",
        tributes: "Nkwanye ugwu na-enweghị ngwụcha",
        customization: "Nhazi zuru oke",
        qrCode: "Koodu QR ahaziri",
        domain: "Aha ngalaba ahaziri",
        priority: "Nkwado mbụ",
      },
    },
  });

  // Hausa translations
  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: delightPlan.id,
        language: "ha",
      },
    },
    update: {
      name: "Farin Ciki",
      description: "Yana da kyau don fara tafiyar tunawa",
      features: {
        memorials: "Shafin tunawa 1",
        photos: "Hotuna har 20",
        videos: "Bidiyo har 5",
        tributes: "Girmamawa mara iyaka",
        customization: "Tsarin farko",
        support: "Tallafin imel",
      },
    },
    create: {
      planId: delightPlan.id,
      language: "ha",
      name: "Farin Ciki",
      description: "Yana da kyau don fara tafiyar tunawa",
      features: {
        memorials: "Shafin tunawa 1",
        photos: "Hotuna har 20",
        videos: "Bidiyo har 5",
        tributes: "Girmamawa mara iyaka",
        customization: "Tsarin farko",
        support: "Tallafin imel",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: darlingPlan.id,
        language: "ha",
      },
    },
    update: {
      name: "Masoya",
      description: "Shirinmu mafi shahara ga iyalai",
      features: {
        memorials: "Shafukan tunawa har 3",
        photos: "Hotuna har 50",
        videos: "Bidiyo har 15",
        tributes: "Girmamawa mara iyaka",
        customization: "Tsarin ci gaba",
        qrCode: "Lambobin QR na musamman",
        support: "Tallafi na farko",
      },
    },
    create: {
      planId: darlingPlan.id,
      language: "ha",
      name: "Masoya",
      description: "Shirinmu mafi shahara ga iyalai",
      features: {
        memorials: "Shafukan tunawa har 3",
        photos: "Hotuna har 50",
        videos: "Bidiyo har 15",
        tributes: "Girmamawa mara iyaka",
        customization: "Tsarin ci gaba",
        qrCode: "Lambobin QR na musamman",
        support: "Tallafi na farko",
      },
    },
  });

  await prisma.planTranslation.upsert({
    where: {
      planId_language: {
        planId: deluxePlan.id,
        language: "ha",
      },
    },
    update: {
      name: "Deluxe",
      description: "Cikakken kwarewar tunawa mara iyaka",
      features: {
        memorials: "Shafukan tunawa mara iyaka",
        photos: "Hotuna mara iyaka",
        videos: "Bidiyo mara iyaka",
        tributes: "Girmamawa mara iyaka",
        customization: "Cikakken tsari",
        qrCode: "Lambobin QR na musamman",
        domain: "Sunan yanki na musamman",
        priority: "Tallafi na farko",
      },
    },
    create: {
      planId: deluxePlan.id,
      language: "ha",
      name: "Deluxe",
      description: "Cikakken kwarewar tunawa mara iyaka",
      features: {
        memorials: "Shafukan tunawa mara iyaka",
        photos: "Hotuna mara iyaka",
        videos: "Bidiyo mara iyaka",
        tributes: "Girmamawa mara iyaka",
        customization: "Cikakken tsari",
        qrCode: "Lambobin QR na musamman",
        domain: "Sunan yanki na musamman",
        priority: "Tallafi na farko",
      },
    },
  });

  console.log("Created plan translations (French, Spanish, Yoruba, Igbo, Hausa)");

  // ============================================
  // SEED RENEWAL (Forever Access)
  // ============================================

  const foreverRenewal = await prisma.renewal.upsert({
    where: { slug: "forever-access" },
    update: {
      name: "Forever Access",
      priceNGN: 150000,
      priceUSD: 91,
      priceGBP: 72,
      priceEUR: 83,
      currency: "NGN",
      description: "One-time payment for lifetime access to your memorial pages",
      isActive: true,
      badgeText: "Lifetime",
      badgeColor: "gold",
    },
    create: {
      slug: "forever-access",
      name: "Forever Access",
      priceNGN: 150000,
      priceUSD: 91,
      priceGBP: 72,
      priceEUR: 83,
      currency: "NGN",
      description: "One-time payment for lifetime access to your memorial pages",
      isActive: true,
      badgeText: "Lifetime",
      badgeColor: "gold",
    },
  });

  console.log("Created renewal:", foreverRenewal);

  // Forever Access - English Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "en",
      },
    },
    update: {
      name: "Forever Access",
      description: "One-time payment for lifetime access to your memorial pages",
      badgeText: "Lifetime",
      features: {
        access: "Unlimited lifetime access",
        benefit: "Never lose your memories",
        support: "Priority customer support",
        updates: "All future features included",
        peace: "Peace of mind forever",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "en",
      name: "Forever Access",
      description: "One-time payment for lifetime access to your memorial pages",
      badgeText: "Lifetime",
      features: {
        access: "Unlimited lifetime access",
        benefit: "Never lose your memories",
        support: "Priority customer support",
        updates: "All future features included",
        peace: "Peace of mind forever",
      },
    },
  });

  console.log("Created renewal translation (English)");

  // Forever Access - French Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "fr",
      },
    },
    update: {
      name: "Accès Éternel",
      description: "Paiement unique pour un accès à vie à vos pages commémoratives",
      badgeText: "À vie",
      features: {
        access: "Accès illimité à vie",
        benefit: "Ne perdez jamais vos souvenirs",
        support: "Support client prioritaire",
        updates: "Toutes les fonctionnalités futures incluses",
        peace: "Tranquillité d'esprit pour toujours",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "fr",
      name: "Accès Éternel",
      description: "Paiement unique pour un accès à vie à vos pages commémoratives",
      badgeText: "À vie",
      features: {
        access: "Accès illimité à vie",
        benefit: "Ne perdez jamais vos souvenirs",
        support: "Support client prioritaire",
        updates: "Toutes les fonctionnalités futures incluses",
        peace: "Tranquillité d'esprit pour toujours",
      },
    },
  });

  // Forever Access - Spanish Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "es",
      },
    },
    update: {
      name: "Acceso Eterno",
      description: "Pago único para acceso de por vida a tus páginas conmemorativas",
      badgeText: "De por vida",
      features: {
        access: "Acceso ilimitado de por vida",
        benefit: "Nunca pierdas tus recuerdos",
        support: "Soporte al cliente prioritario",
        updates: "Todas las funciones futuras incluidas",
        peace: "Tranquilidad para siempre",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "es",
      name: "Acceso Eterno",
      description: "Pago único para acceso de por vida a tus páginas conmemorativas",
      badgeText: "De por vida",
      features: {
        access: "Acceso ilimitado de por vida",
        benefit: "Nunca pierdas tus recuerdos",
        support: "Soporte al cliente prioritario",
        updates: "Todas las funciones futuras incluidas",
        peace: "Tranquilidad para siempre",
      },
    },
  });

  // Forever Access - Yoruba Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "yo",
      },
    },
    update: {
      name: "Ìwọlé Láìláì",
      description: "Ìsanwó ẹyọkan fún ìwọlé ìgbésí ayé sí àwọn ojú-ìwé ìrántí rẹ",
      badgeText: "Ìgbésí ayé",
      features: {
        access: "Ìwọlé àìlópin ìgbésí ayé",
        benefit: "Má ṣe pàdánù àwọn ìrántí rẹ láìláì",
        support: "Àtìlẹyìn oníbàárà pàtàkì",
        updates: "Gbogbo àwọn ẹya ọjọ́ iwájú wà nínú",
        peace: "Ìfọkànbalẹ láìláì",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "yo",
      name: "Ìwọlé Láìláì",
      description: "Ìsanwó ẹyọkan fún ìwọlé ìgbésí ayé sí àwọn ojú-ìwé ìrántí rẹ",
      badgeText: "Ìgbésí ayé",
      features: {
        access: "Ìwọlé àìlópin ìgbésí ayé",
        benefit: "Má ṣe pàdánù àwọn ìrántí rẹ láìláì",
        support: "Àtìlẹyìn oníbàárà pàtàkì",
        updates: "Gbogbo àwọn ẹya ọjọ́ iwájú wà nínú",
        peace: "Ìfọkànbalẹ láìláì",
      },
    },
  });

  // Forever Access - Igbo Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "ig",
      },
    },
    update: {
      name: "Nnweta Ebighiebi",
      description: "Otu ụgwọ maka nnweta ndụ n'ibe ncheta gị",
      badgeText: "Ndụ",
      features: {
        access: "Nnweta ndụ na-enweghị ngwụcha",
        benefit: "Efula ncheta gị mgbe ọbụla",
        support: "Nkwado ndị ahịa mbụ",
        updates: "Atụmatụ ọhụrụ niile gụnyere",
        peace: "Udo nke uche ruo mgbe ebighiebi",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "ig",
      name: "Nnweta Ebighiebi",
      description: "Otu ụgwọ maka nnweta ndụ n'ibe ncheta gị",
      badgeText: "Ndụ",
      features: {
        access: "Nnweta ndụ na-enweghị ngwụcha",
        benefit: "Efula ncheta gị mgbe ọbụla",
        support: "Nkwado ndị ahịa mbụ",
        updates: "Atụmatụ ọhụrụ niile gụnyere",
        peace: "Udo nke uche ruo mgbe ebighiebi",
      },
    },
  });

  // Forever Access - Hausa Translation
  await prisma.renewalTranslation.upsert({
    where: {
      renewalId_language: {
        renewalId: foreverRenewal.id,
        language: "ha",
      },
    },
    update: {
      name: "Shiga Har Abada",
      description: "Biyan kuɗi sau ɗaya don samun damar rayuwa ga shafukan tunawa",
      badgeText: "Rayuwa",
      features: {
        access: "Samun damar rayuwa mara iyaka",
        benefit: "Kar ka taɓa rasa abubuwan tunawa",
        support: "Tallafin abokin ciniki na farko",
        updates: "Duk sabbin abubuwa na gaba an haɗa su",
        peace: "Kwanciyar hankali har abada",
      },
    },
    create: {
      renewalId: foreverRenewal.id,
      language: "ha",
      name: "Shiga Har Abada",
      description: "Biyan kuɗi sau ɗaya don samun damar rayuwa ga shafukan tunawa",
      badgeText: "Rayuwa",
      features: {
        access: "Samun damar rayuwa mara iyaka",
        benefit: "Kar ka taɓa rasa abubuwan tunawa",
        support: "Tallafin abokin ciniki na farko",
        updates: "Duk sabbin abubuwa na gaba an haɗa su",
        peace: "Kwanciyar hankali har abada",
      },
    },
  });

  console.log("Created renewal translations (All languages)");

  // ============================================
  // SEED TEMPLATES
  // ============================================

  console.log("\n🎨 Seeding templates...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
