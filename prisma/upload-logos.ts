/**
 * Script to fetch company logos and upload them to R2
 * Run with: npx tsx prisma/upload-logos.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// Company name to domain mapping for logo fetching
const companyDomains: Record<string, string> = {
  // Malls (local - will need manual logos or skip)
  'skopje-city-mall': 'skopjecitymall.mk',
  'east-gate-mall': 'eastgatemall.mk',
  'ramstore-mall': 'ramstore.com.mk',
  'capitol-mall': 'capitolmall.mk',

  // Telecommunications
  'makedonski-telekom': 'telekom.mk',
  'a1-makedonija': 'a1.mk',
  'lycamobile-mk': 'lycamobile.mk',

  // Energy & Utilities
  'evn-home': 'evn.mk',
  'evn-makedonija': 'evn.mk',
  'elektrani-na-severna-makedonija': 'elem.com.mk',
  'te-to-skopje': 'te-to.com.mk',

  // Oil & Gas
  'okta': 'okta.mk',
  'makpetrol': 'makpetrol.com.mk',

  // Banking
  'komercijalna-banka': 'kb.com.mk',
  'stopanska-banka': 'stb.com.mk',
  'nlb-banka': 'nlb.mk',
  'halkbank': 'halkbank.mk',
  'sparkasse-bank': 'sparkasse.mk',
  'procredit-bank': 'procreditbank.com.mk',

  // Healthcare
  'alkaloid-ad-skopje': 'alkaloid.com.mk',
  'acibadem-sistina': 'sistina.com.mk',
  'remedika-hospital': 'remedika.mk',
  'zhan-mitrev-clinic': 'zmc.mk',
  'euro-pharm': 'europharm.mk',

  // Food & Beverage
  'pivara-skopje': 'pivara.mk',
  'grozd': 'grozd.mk',
  'vitaminka': 'vitaminka.com.mk',
  'swisslion': 'swisslion.com',
  'zito-luks': 'zitoluks.mk',
  'pekabesko': 'pekabesko.mk',
  'mlekara-bitola': 'mlekara.mk',
  'burger-king-macedonia': 'bk.com',
  'kfc-macedonia': 'kfc.com',
  'mcdonalds-macedonia': 'mcdonalds.com',

  // Supermarkets
  'tinex': 'tinex.com.mk',
  'vero': 'vero.com.mk',
  'kam-market': 'kam.com.mk',
  'ramstore-market': 'ramstore.com.mk',
  'sp-market': 'spmarket.com.mk',
  'dm-drogerie-markt': 'dm.de',

  // Fashion - Inditex
  'zara': 'zara.com',
  'bershka': 'bershka.com',
  'stradivarius': 'stradivarius.com',
  'pull-and-bear': 'pullandbear.com',
  'massimo-dutti': 'massimodutti.com',
  'oysho': 'oysho.com',

  // Fashion - H&M
  'hm': 'hm.com',

  // Fashion - Other
  'mango': 'mango.com',
  'tommy-hilfiger': 'tommy.com',
  'calvin-klein': 'calvinklein.com',
  'guess': 'guess.com',
  'levis': 'levi.com',
  'tom-tailor': 'tom-tailor.de',
  'koton': 'koton.com',
  'lc-waikiki': 'lcwaikiki.com',
  'sinsay': 'sinsay.com',
  'reserved': 'reserved.com',
  'cropp': 'cropp.com',
  'house-fashion': 'housebrand.com',
  'mohito': 'mohito.com',
  'superdry': 'superdry.com',
  'ted-baker': 'tedbaker.com',
  'lacoste': 'lacoste.com',
  'gant': 'gant.com',
  'ltb-jeans': 'ltbjeans.com',
  'tudors': 'tudors.com',
  'motivi': 'motivi.com',
  'penny-black': 'pennyblack.com',
  'oltre': 'oltre.com',
  'twinset': 'twinset.com',
  'patrizia-pepe': 'patriziapepe.com',
  'armani-exchange': 'armaniexchange.com',
  'michael-kors': 'michaelkors.com',
  'philipp-plein': 'plein.com',

  // Underwear
  'calzedonia': 'calzedonia.com',
  'intimissimi': 'intimissimi.com',
  'tezenis': 'tezenis.com',
  'womensecret': 'womensecret.com',

  // Sports
  'nike': 'nike.com',
  'adidas': 'adidas.com',
  'puma': 'puma.com',
  'reebok': 'reebok.com',
  'new-balance': 'newbalance.com',
  'skechers': 'skechers.com',
  'timberland': 'timberland.com',
  'sport-vision': 'sportvision.com',
  'beosport': 'beosport.com',
  'office-shoes': 'officeshoes.com',

  // Shoes & Accessories
  'carpisa': 'carpisa.com',
  'parfois': 'parfois.com',
  'aldo': 'aldoshoes.com',
  'deichmann': 'deichmann.com',
  'ccc-shoes': 'ccc.eu',

  // Beauty
  'sephora': 'sephora.com',
  'the-body-shop': 'thebodyshop.com',
  'loccitane': 'loccitane.com',
  'kiko-milano': 'kikocosmetics.com',
  'mac-cosmetics': 'maccosmetics.com',
  'douglas': 'douglas.de',
  'lilly-drogerie': 'lilly.rs',

  // Jewelry
  'swarovski': 'swarovski.com',
  'pandora': 'pandora.net',
  'altinbas': 'altinbas.com',
  'zlatara-cekan': 'cekan.com.mk',

  // Electronics
  'istyle': 'istyle.com',
  'setec': 'setec.mk',
  'anhoch': 'anhoch.com',
  'neptun': 'neptun.mk',
  'samsung-store': 'samsung.com',
  'huawei-store': 'huawei.com',
  'xiaomi-store': 'mi.com',

  // Home & Furniture
  'jysk': 'jysk.com',
  'jumbo': 'jumbo.gr',
  'coin-casa': 'coincasa.it',
  'comodita-home': 'comoditahome.mk',
  'top-shop': 'topshop.mk',

  // Kids
  'carters': 'carters.com',
  'oshkosh-bgosh': 'oshkosh.com',
  'baby-center': 'babycenter.mk',
  'bebe-home': 'bebehome.mk',
  'hello-baby': 'hellobaby.mk',

  // Entertainment
  'cineplexx': 'cineplexx.at',

  // Manufacturing
  'johnson-matthey-macedonia': 'matthey.com',
  'gorenje-macedonia': 'gorenje.com',
  'kromberg-schubert-macedonia': 'kromberg-schubert.com',
  'draxlmaier-macedonia': 'draexlmaier.com',
  'makstil-ad-skopje': 'makstil.com.mk',
  'tab-mak-probishtip': 'tabmak.mk',
  'mermeren-kombinat-prilep': 'mermeren.com.mk',

  // Logistics
  'fershped': 'fershped.com.mk',
  'cargo-partner': 'cargo-partner.com',
  'dhl-macedonia': 'dhl.com',

  // Insurance
  'triglav-osiguruvanje': 'triglav.mk',
  'winner-insurance': 'winner.mk',
  'eurolink-osiguruvanje': 'eurolink.com.mk',
  'sava-osiguruvanje': 'sava.mk',

  // Technology
  'seavus': 'seavus.com',
  'netcetera-macedonia': 'netcetera.com',
  'emapta': 'emapta.com',

  // Real Estate
  'gtc-macedonia': 'gtc.com.pl',
  'orka-holding': 'orkaholding.com.mk',
  'granit-ad-skopje': 'granit.com.mk',

  // Hospitality
  'marriott-skopje': 'marriott.com',
  'holiday-inn-skopje': 'ihg.com',
  'aleksandar-palace': 'aleksandarpalace.com.mk',

  // Delivery
  'glovo-macedonia': 'glovoapp.com',
  'wolt-macedonia': 'wolt.com',

  // Cafes
  'costa-coffee': 'costa.co.uk',
  'starbucks-macedonia': 'starbucks.com',

  // Optics
  'grand-vision': 'grandvision.com',
  'fielmann': 'fielmann.de',

  // Bookstores
  'ikona': 'ikona.com.mk',
  'polica': 'polica.com.mk',
};

const API_BASE = 'http://localhost:4000';

async function downloadImage(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const location = response.headers.location;
        if (!location) {
          reject(new Error('Redirect without location'));
          return;
        }
        // Handle relative URLs
        const redirectUrl = location.startsWith('http') ? location : new URL(location, url).toString();
        downloadImage(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function uploadToR2(buffer: Buffer, filename: string): Promise<string> {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', buffer, {
    filename,
    contentType: 'image/png',
  });

  return new Promise((resolve, reject) => {
    const req = http.request(
      `${API_BASE}/storage/company/profile-picture`,
      {
        method: 'POST',
        headers: form.getHeaders(),
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.url) {
              resolve(json.url);
            } else {
              reject(new Error(`Upload failed: ${data}`));
            }
          } catch {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    form.pipe(req);
  });
}

async function main() {
  const results: Record<string, string> = {};
  const failed: string[] = [];

  console.log('🖼️  Starting logo upload process...\n');

  for (const [slug, domain] of Object.entries(companyDomains)) {
    // Use Google's high-quality favicon service
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    try {
      console.log(`📥 Fetching logo for ${slug} (${domain})...`);
      const buffer = await downloadImage(logoUrl);

      // Check if it's a valid image (not an error page)
      if (buffer.length < 100) {
        throw new Error('Image too small, likely a placeholder');
      }

      console.log(`📤 Uploading to R2 (${buffer.length} bytes)...`);
      const r2Url = await uploadToR2(buffer, `${slug}.png`);

      results[slug] = r2Url;
      console.log(`✅ ${slug}: ${r2Url}\n`);
    } catch (error) {
      console.log(`❌ ${slug}: Failed - ${error}\n`);
      failed.push(slug);
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  // Output results
  console.log('\n📊 Results Summary:');
  console.log(`✅ Successful: ${Object.keys(results).length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed companies:', failed.join(', '));
  }

  // Generate the logoUrl mappings for seed.ts
  console.log('\n📝 Logo URL mappings for seed.ts:\n');
  console.log('const companyLogos: Record<string, string> = {');
  for (const [slug, url] of Object.entries(results)) {
    console.log(`  '${slug}': '${url}',`);
  }
  console.log('};');

  // Save to file
  const outputPath = path.join(__dirname, 'logo-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Saved to ${outputPath}`);
}

main().catch(console.error);
