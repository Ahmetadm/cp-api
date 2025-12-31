import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter: pool });

const categories = [
  { slug: 'telecommunications', labelEn: 'Telecommunications', labelMk: 'Телекомуникации', labelSq: 'Telekomunikacion' },
  { slug: 'banking', labelEn: 'Banking', labelMk: 'Банкарство', labelSq: 'Bankë' },
  { slug: 'insurance', labelEn: 'Insurance', labelMk: 'Осигурување', labelSq: 'Sigurim' },
  { slug: 'energy', labelEn: 'Energy', labelMk: 'Енергетика', labelSq: 'Energji' },
  { slug: 'retail', labelEn: 'Retail', labelMk: 'Малопродажба', labelSq: 'Shitje me pakicë' },
  { slug: 'food-beverage', labelEn: 'Food & Beverage', labelMk: 'Храна и пијалаци', labelSq: 'Ushqim dhe pije' },
  { slug: 'healthcare', labelEn: 'Healthcare', labelMk: 'Здравство', labelSq: 'Shëndetësi' },
  { slug: 'pharmaceuticals', labelEn: 'Pharmaceuticals', labelMk: 'Фармација', labelSq: 'Farmaci' },
  { slug: 'transportation', labelEn: 'Transportation', labelMk: 'Транспорт', labelSq: 'Transport' },
  { slug: 'hospitality', labelEn: 'Hospitality', labelMk: 'Угостителство', labelSq: 'Hoteleri' },
  { slug: 'e-commerce', labelEn: 'E-commerce', labelMk: 'Е-трговија', labelSq: 'E-tregti' },
  { slug: 'automotive', labelEn: 'Automotive', labelMk: 'Автомобилска индустрија', labelSq: 'Industri automobilistike' },
  { slug: 'construction', labelEn: 'Construction', labelMk: 'Градежништво', labelSq: 'Ndërtim' },
  { slug: 'real-estate', labelEn: 'Real Estate', labelMk: 'Недвижности', labelSq: 'Pasuri të paluajtshme' },
  { slug: 'education', labelEn: 'Education', labelMk: 'Образование', labelSq: 'Arsim' },
  { slug: 'technology', labelEn: 'Technology', labelMk: 'Технологија', labelSq: 'Teknologji' },
  { slug: 'delivery', labelEn: 'Delivery', labelMk: 'Достава', labelSq: 'Dërgim' },
  { slug: 'utilities', labelEn: 'Utilities', labelMk: 'Комунални услуги', labelSq: 'Shërbime komunale' },
  { slug: 'fashion', labelEn: 'Fashion', labelMk: 'Мода', labelSq: 'Modë' },
  { slug: 'beauty-cosmetics', labelEn: 'Beauty & Cosmetics', labelMk: 'Убавина и козметика', labelSq: 'Bukuri dhe kozmetikë' },
  { slug: 'sports-fitness', labelEn: 'Sports & Fitness', labelMk: 'Спорт и фитнес', labelSq: 'Sport dhe fitnes' },
  { slug: 'entertainment', labelEn: 'Entertainment', labelMk: 'Забава', labelSq: 'Argëtim' },
  { slug: 'jewelry-watches', labelEn: 'Jewelry & Watches', labelMk: 'Накит и часовници', labelSq: 'Bizhuteri dhe orë' },
  { slug: 'home-furniture', labelEn: 'Home & Furniture', labelMk: 'Дом и мебел', labelSq: 'Shtëpi dhe mobilje' },
];

const companies = [
  // ==================== MALLS ====================
  { name: 'Skopje City Mall', slug: 'skopje-city-mall', supportEmail: null, categories: ['retail', 'entertainment'] },
  { name: 'East Gate Mall', slug: 'east-gate-mall', supportEmail: null, categories: ['retail', 'entertainment'] },
  { name: 'Ramstore Mall', slug: 'ramstore-mall', supportEmail: null, categories: ['retail', 'entertainment'] },
  { name: 'Capitol Mall', slug: 'capitol-mall', supportEmail: null, categories: ['retail', 'entertainment'] },

  // ==================== TELECOMMUNICATIONS ====================
  { name: 'Makedonski Telekom', slug: 'makedonski-telekom', supportEmail: null, categories: ['telecommunications'] },
  { name: 'A1 Makedonija', slug: 'a1-makedonija', supportEmail: null, categories: ['telecommunications'] },
  { name: 'Lycamobile MK', slug: 'lycamobile-mk', supportEmail: null, categories: ['telecommunications'] },

  // ==================== ENERGY & UTILITIES ====================
  { name: 'EVN Home', slug: 'evn-home', supportEmail: null, categories: ['energy', 'utilities'] },
  { name: 'EVN Makedonija', slug: 'evn-makedonija', supportEmail: null, categories: ['energy', 'utilities'] },
  { name: 'Elektrani na Severna Makedonija', slug: 'elektrani-na-severna-makedonija', supportEmail: null, categories: ['energy', 'utilities'] },
  { name: 'TE-TO Skopje', slug: 'te-to-skopje', supportEmail: null, categories: ['energy', 'utilities'] },

  // ==================== OIL & GAS ====================
  { name: 'Okta', slug: 'okta', supportEmail: null, categories: ['energy'] },
  { name: 'Makpetrol', slug: 'makpetrol', supportEmail: null, categories: ['energy', 'retail'] },

  // ==================== BANKING ====================
  { name: 'Komercijalna Banka', slug: 'komercijalna-banka', supportEmail: null, categories: ['banking'] },
  { name: 'Stopanska Banka', slug: 'stopanska-banka', supportEmail: null, categories: ['banking'] },
  { name: 'NLB Banka', slug: 'nlb-banka', supportEmail: null, categories: ['banking'] },
  { name: 'Halkbank', slug: 'halkbank', supportEmail: null, categories: ['banking'] },
  { name: 'Sparkasse Bank', slug: 'sparkasse-bank', supportEmail: null, categories: ['banking'] },
  { name: 'ProCredit Bank', slug: 'procredit-bank', supportEmail: null, categories: ['banking'] },

  // ==================== PHARMACEUTICALS & HEALTHCARE ====================
  { name: 'Alkaloid AD Skopje', slug: 'alkaloid-ad-skopje', supportEmail: null, categories: ['pharmaceuticals', 'healthcare'] },
  { name: 'Acibadem Sistina', slug: 'acibadem-sistina', supportEmail: null, categories: ['healthcare'] },
  { name: 'Remedika Hospital', slug: 'remedika-hospital', supportEmail: null, categories: ['healthcare'] },
  { name: 'Zhan Mitrev Clinic', slug: 'zhan-mitrev-clinic', supportEmail: null, categories: ['healthcare'] },
  { name: 'Euro Pharm', slug: 'euro-pharm', supportEmail: null, categories: ['pharmaceuticals', 'retail'] },

  // ==================== FOOD & BEVERAGE ====================
  { name: 'Pivara Skopje', slug: 'pivara-skopje', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Grozd', slug: 'grozd', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Vitaminka', slug: 'vitaminka', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Swisslion', slug: 'swisslion', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Zito Luks', slug: 'zito-luks', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Pekabesko', slug: 'pekabesko', supportEmail: null, categories: ['food-beverage', 'retail'] },
  { name: 'Mlekara Bitola', slug: 'mlekara-bitola', supportEmail: null, categories: ['food-beverage'] },
  { name: 'Burger King Macedonia', slug: 'burger-king-macedonia', supportEmail: null, categories: ['food-beverage', 'hospitality'] },
  { name: 'KFC Macedonia', slug: 'kfc-macedonia', supportEmail: null, categories: ['food-beverage', 'hospitality'] },
  { name: 'McDonald\'s Macedonia', slug: 'mcdonalds-macedonia', supportEmail: null, categories: ['food-beverage', 'hospitality'] },

  // ==================== SUPERMARKETS & RETAIL ====================
  { name: 'Tinex', slug: 'tinex', supportEmail: null, categories: ['retail'] },
  { name: 'Vero', slug: 'vero', supportEmail: null, categories: ['retail'] },
  { name: 'Kam Market', slug: 'kam-market', supportEmail: null, categories: ['retail'] },
  { name: 'Ramstore Market', slug: 'ramstore-market', supportEmail: null, categories: ['retail'] },
  { name: 'SP Market', slug: 'sp-market', supportEmail: null, categories: ['retail'] },
  { name: 'DM Drogerie Markt', slug: 'dm-drogerie-markt', supportEmail: null, categories: ['retail', 'beauty-cosmetics'] },

  // ==================== FASHION - INDITEX GROUP ====================
  { name: 'Zara', slug: 'zara', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Bershka', slug: 'bershka', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Stradivarius', slug: 'stradivarius', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Pull & Bear', slug: 'pull-and-bear', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Massimo Dutti', slug: 'massimo-dutti', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Oysho', slug: 'oysho', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== FASHION - H&M GROUP ====================
  { name: 'H&M', slug: 'hm', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== FASHION - OTHER INTERNATIONAL ====================
  { name: 'Mango', slug: 'mango', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Calvin Klein', slug: 'calvin-klein', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Guess', slug: 'guess', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Levi\'s', slug: 'levis', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Tom Tailor', slug: 'tom-tailor', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Koton', slug: 'koton', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'LC Waikiki', slug: 'lc-waikiki', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Sinsay', slug: 'sinsay', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Reserved', slug: 'reserved', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Cropp', slug: 'cropp', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'House', slug: 'house-fashion', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Mohito', slug: 'mohito', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Superdry', slug: 'superdry', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Ted Baker', slug: 'ted-baker', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Lacoste', slug: 'lacoste', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Gant', slug: 'gant', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'LTB Jeans', slug: 'ltb-jeans', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Tudors', slug: 'tudors', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Motivi', slug: 'motivi', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Penny Black', slug: 'penny-black', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Oltre', slug: 'oltre', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Twinset', slug: 'twinset', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Patrizia Pepe', slug: 'patrizia-pepe', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Armani Exchange', slug: 'armani-exchange', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Michael Kors', slug: 'michael-kors', supportEmail: null, categories: ['fashion', 'retail', 'jewelry-watches'] },
  { name: 'Philipp Plein', slug: 'philipp-plein', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== UNDERWEAR & LINGERIE ====================
  { name: 'Calzedonia', slug: 'calzedonia', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Intimissimi', slug: 'intimissimi', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Tezenis', slug: 'tezenis', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Women\'secret', slug: 'womensecret', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== SPORTS & ATHLETIC WEAR ====================
  { name: 'Nike', slug: 'nike', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'Adidas', slug: 'adidas', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'Puma', slug: 'puma', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'Reebok', slug: 'reebok', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'New Balance', slug: 'new-balance', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'Skechers', slug: 'skechers', supportEmail: null, categories: ['sports-fitness', 'fashion', 'retail'] },
  { name: 'Timberland', slug: 'timberland', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Sport Vision', slug: 'sport-vision', supportEmail: null, categories: ['sports-fitness', 'retail'] },
  { name: 'Beosport', slug: 'beosport', supportEmail: null, categories: ['sports-fitness', 'retail'] },
  { name: 'Office Shoes', slug: 'office-shoes', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== SHOES & ACCESSORIES ====================
  { name: 'Carpisa', slug: 'carpisa', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Parfois', slug: 'parfois', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Aldo', slug: 'aldo', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Deichmann', slug: 'deichmann', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'CCC Shoes', slug: 'ccc-shoes', supportEmail: null, categories: ['fashion', 'retail'] },

  // ==================== BEAUTY & COSMETICS ====================
  { name: 'Sephora', slug: 'sephora', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'The Body Shop', slug: 'the-body-shop', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'L\'Occitane', slug: 'loccitane', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'Kiko Milano', slug: 'kiko-milano', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'MAC Cosmetics', slug: 'mac-cosmetics', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'Douglas', slug: 'douglas', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },
  { name: 'Lilly Drogerie', slug: 'lilly-drogerie', supportEmail: null, categories: ['beauty-cosmetics', 'retail'] },

  // ==================== JEWELRY & WATCHES ====================
  { name: 'Swarovski', slug: 'swarovski', supportEmail: null, categories: ['jewelry-watches', 'retail'] },
  { name: 'Pandora', slug: 'pandora', supportEmail: null, categories: ['jewelry-watches', 'retail'] },
  { name: 'Altinbas', slug: 'altinbas', supportEmail: null, categories: ['jewelry-watches', 'retail'] },
  { name: 'Zlatara Cekan', slug: 'zlatara-cekan', supportEmail: null, categories: ['jewelry-watches', 'retail'] },

  // ==================== ELECTRONICS & TECHNOLOGY ====================
  { name: 'iStyle', slug: 'istyle', supportEmail: null, categories: ['technology', 'retail', 'e-commerce'] },
  { name: 'Setec', slug: 'setec', supportEmail: null, categories: ['technology', 'retail', 'e-commerce'] },
  { name: 'Anhoch', slug: 'anhoch', supportEmail: null, categories: ['technology', 'retail', 'e-commerce'] },
  { name: 'Neptun', slug: 'neptun', supportEmail: null, categories: ['technology', 'retail', 'e-commerce'] },
  { name: 'Samsung Store', slug: 'samsung-store', supportEmail: null, categories: ['technology', 'retail'] },
  { name: 'Huawei Store', slug: 'huawei-store', supportEmail: null, categories: ['technology', 'retail'] },
  { name: 'Xiaomi Store', slug: 'xiaomi-store', supportEmail: null, categories: ['technology', 'retail'] },

  // ==================== HOME & FURNITURE ====================
  { name: 'JYSK', slug: 'jysk', supportEmail: null, categories: ['home-furniture', 'retail'] },
  { name: 'Jumbo', slug: 'jumbo', supportEmail: null, categories: ['home-furniture', 'retail'] },
  { name: 'Coin Casa', slug: 'coin-casa', supportEmail: null, categories: ['home-furniture', 'retail'] },
  { name: 'Comodita Home', slug: 'comodita-home', supportEmail: null, categories: ['home-furniture', 'retail'] },
  { name: 'Top Shop', slug: 'top-shop', supportEmail: null, categories: ['home-furniture', 'retail'] },

  // ==================== KIDS & BABY ====================
  { name: 'Carter\'s', slug: 'carters', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'OshKosh B\'Gosh', slug: 'oshkosh-bgosh', supportEmail: null, categories: ['fashion', 'retail'] },
  { name: 'Baby Center', slug: 'baby-center', supportEmail: null, categories: ['retail'] },
  { name: 'Bebe Home', slug: 'bebe-home', supportEmail: null, categories: ['retail'] },
  { name: 'Hello Baby', slug: 'hello-baby', supportEmail: null, categories: ['retail'] },

  // ==================== ENTERTAINMENT & CINEMA ====================
  { name: 'Cineplexx', slug: 'cineplexx', supportEmail: null, categories: ['entertainment'] },

  // ==================== MANUFACTURING & INDUSTRY ====================
  { name: 'Johnson Matthey Macedonia', slug: 'johnson-matthey-macedonia', supportEmail: null, categories: ['automotive'] },
  { name: 'Gorenje Macedonia', slug: 'gorenje-macedonia', supportEmail: null, categories: ['home-furniture', 'technology'] },
  { name: 'Kromberg & Schubert Macedonia', slug: 'kromberg-schubert-macedonia', supportEmail: null, categories: ['automotive'] },
  { name: 'Draxlmaier Macedonia', slug: 'draxlmaier-macedonia', supportEmail: null, categories: ['automotive'] },
  { name: 'Makstil AD Skopje', slug: 'makstil-ad-skopje', supportEmail: null, categories: ['construction'] },
  { name: 'TAB MAK Probishtip', slug: 'tab-mak-probishtip', supportEmail: null, categories: ['automotive'] },
  { name: 'Mermeren Kombinat Prilep', slug: 'mermeren-kombinat-prilep', supportEmail: null, categories: ['construction'] },

  // ==================== LOGISTICS & TRANSPORTATION ====================
  { name: 'Fershped', slug: 'fershped', supportEmail: null, categories: ['transportation', 'delivery'] },
  { name: 'Cargo Partner', slug: 'cargo-partner', supportEmail: null, categories: ['transportation', 'delivery'] },
  { name: 'DHL Macedonia', slug: 'dhl-macedonia', supportEmail: null, categories: ['transportation', 'delivery'] },

  // ==================== INSURANCE ====================
  { name: 'Triglav Osiguruvanje', slug: 'triglav-osiguruvanje', supportEmail: null, categories: ['insurance'] },
  { name: 'Winner Insurance', slug: 'winner-insurance', supportEmail: null, categories: ['insurance'] },
  { name: 'Eurolink Osiguruvanje', slug: 'eurolink-osiguruvanje', supportEmail: null, categories: ['insurance'] },
  { name: 'Sava Osiguruvanje', slug: 'sava-osiguruvanje', supportEmail: null, categories: ['insurance'] },

  // ==================== TECHNOLOGY COMPANIES ====================
  { name: 'Seavus', slug: 'seavus', supportEmail: null, categories: ['technology'] },
  { name: 'Netcetera Macedonia', slug: 'netcetera-macedonia', supportEmail: null, categories: ['technology'] },
  { name: 'Emapta', slug: 'emapta', supportEmail: null, categories: ['technology'] },

  // ==================== REAL ESTATE & CONSTRUCTION ====================
  { name: 'GTC Macedonia', slug: 'gtc-macedonia', supportEmail: null, categories: ['real-estate', 'construction'] },
  { name: 'Orka Holding', slug: 'orka-holding', supportEmail: null, categories: ['real-estate', 'construction'] },
  { name: 'Granit AD Skopje', slug: 'granit-ad-skopje', supportEmail: null, categories: ['construction'] },

  // ==================== HOSPITALITY ====================
  { name: 'Marriott Skopje', slug: 'marriott-skopje', supportEmail: null, categories: ['hospitality'] },
  { name: 'Holiday Inn Skopje', slug: 'holiday-inn-skopje', supportEmail: null, categories: ['hospitality'] },
  { name: 'Hotel Aleksandar Palace', slug: 'aleksandar-palace', supportEmail: null, categories: ['hospitality'] },

  // ==================== DELIVERY & E-COMMERCE ====================
  { name: 'Glovo Macedonia', slug: 'glovo-macedonia', supportEmail: null, categories: ['delivery', 'e-commerce'] },
  { name: 'Wolt Macedonia', slug: 'wolt-macedonia', supportEmail: null, categories: ['delivery', 'e-commerce'] },

  // ==================== CAFES & RESTAURANTS ====================
  { name: 'Costa Coffee', slug: 'costa-coffee', supportEmail: null, categories: ['food-beverage', 'hospitality'] },
  { name: 'Starbucks Macedonia', slug: 'starbucks-macedonia', supportEmail: null, categories: ['food-beverage', 'hospitality'] },

  // ==================== OPTICS ====================
  { name: 'Grand Vision', slug: 'grand-vision', supportEmail: null, categories: ['healthcare', 'retail'] },
  { name: 'Fielmann', slug: 'fielmann', supportEmail: null, categories: ['healthcare', 'retail'] },

  // ==================== BOOKSTORES ====================
  { name: 'Ikona', slug: 'ikona', supportEmail: null, categories: ['retail', 'education'] },
  { name: 'Polica', slug: 'polica', supportEmail: null, categories: ['retail', 'education'] },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed Categories
  console.log('📁 Seeding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { labelEn: category.labelEn, labelMk: category.labelMk, labelSq: category.labelSq },
      create: category,
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // Seed Companies
  console.log('🏢 Seeding companies...');
  for (const company of companies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { name: company.name, supportEmail: company.supportEmail },
      create: {
        name: company.name,
        slug: company.slug,
        supportEmail: company.supportEmail,
      },
    });
  }
  console.log(`✅ Seeded ${companies.length} companies`);

  // Seed Company-Category relationships
  console.log('🔗 Seeding company-category relationships...');
  let relationCount = 0;
  for (const company of companies) {
    const companyRecord = await prisma.company.findUnique({ where: { slug: company.slug } });
    if (!companyRecord) continue;

    for (const categorySlug of company.categories) {
      const categoryRecord = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!categoryRecord) continue;

      await prisma.companyCategory.upsert({
        where: {
          companyId_categoryId: {
            companyId: companyRecord.id,
            categoryId: categoryRecord.id,
          },
        },
        update: {},
        create: {
          companyId: companyRecord.id,
          categoryId: categoryRecord.id,
        },
      });
      relationCount++;
    }
  }
  console.log(`✅ Seeded ${relationCount} company-category relationships`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

