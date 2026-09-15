import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const STORE_BRANDS = [
  "Circle K", "QuikTrip", "Shell", "Chevron", "7-Eleven", "Fry's Food",
  "Walgreens", "CVS", "Safeway", "Speedway", "Arco", "Pilot", "Murphy USA",
  "Casey's", "Wawa", "Sheetz", "RaceTrac", "Kum & Go", "Maverik", "Love's",
  "Buc-ee's", "OnCue", "Kwik Trip", "Holiday", "Thorntons", "AM/PM",
  "Costco Gas", "Sam's Club Fuel", "Kroger Fuel", "Albertsons",
];

const STORE_TYPES = [
  "GAS_STATION", "GAS_STATION", "GAS_STATION", "GAS_STATION",
  "CONVENIENCE_STORE", "CONVENIENCE_STORE", "SMOKE_SHOP", "GROCERY",
];

const STREET_NAMES = [
  "E Baseline Rd", "E Southern Ave", "E Broadway Rd", "E Main St",
  "E University Dr", "E Guadalupe Rd", "E Elliot Rd", "E Warner Rd",
  "E Ray Rd", "E Williams Field Rd", "S Signal Butte Rd", "S Ellsworth Rd",
  "S Power Rd", "S Val Vista Dr", "S Greenfield Rd", "S Higley Rd",
  "S Gilbert Rd", "S Lindsay Rd", "S Stapley Dr", "S Mesa Dr",
  "S Crismon Rd", "S Sossaman Rd", "S Recker Rd", "S Hawes Rd",
  "N Arizona Ave", "W Southern Ave", "W Guadalupe Rd", "E Chandler Blvd",
  "E Queen Creek Rd", "E Riggs Rd", "S Arizona Ave", "S Alma School Rd",
  "E Ocotillo Rd", "E Germann Rd", "S McQueen Rd", "S Cooper Rd",
  "E Pecos Rd", "N Dobson Rd", "E Brown Rd", "E McKellips Rd",
];

const ZIP_CENTERS: Record<string, { lat: number; lng: number; city: string }> = {
  "85120": { lat: 33.3893, lng: -111.5483, city: "Apache Junction" },
  "85142": { lat: 33.3114, lng: -111.5844, city: "Queen Creek" },
  "85201": { lat: 33.4152, lng: -111.8315, city: "Mesa" },
  "85202": { lat: 33.4050, lng: -111.8405, city: "Mesa" },
  "85203": { lat: 33.4350, lng: -111.8105, city: "Mesa" },
  "85204": { lat: 33.3989, lng: -111.7954, city: "Mesa" },
  "85205": { lat: 33.4213, lng: -111.7278, city: "Mesa" },
  "85206": { lat: 33.3820, lng: -111.7228, city: "Mesa" },
  "85207": { lat: 33.4213, lng: -111.6728, city: "Mesa" },
  "85208": { lat: 33.3620, lng: -111.6978, city: "Mesa" },
  "85209": { lat: 33.3620, lng: -111.6478, city: "Mesa" },
  "85210": { lat: 33.3820, lng: -111.8428, city: "Mesa" },
  "85212": { lat: 33.3213, lng: -111.6444, city: "Mesa" },
  "85213": { lat: 33.4213, lng: -111.6228, city: "Mesa" },
  "85215": { lat: 33.4600, lng: -111.6800, city: "Mesa" },
  "85224": { lat: 33.3060, lng: -111.8430, city: "Chandler" },
  "85225": { lat: 33.3060, lng: -111.8100, city: "Chandler" },
  "85233": { lat: 33.3530, lng: -111.7890, city: "Gilbert" },
  "85234": { lat: 33.3530, lng: -111.7500, city: "Gilbert" },
  "85236": { lat: 33.3200, lng: -111.7200, city: "Higley" },
  "85249": { lat: 33.2580, lng: -111.7700, city: "Chandler" },
  "85286": { lat: 33.3780, lng: -111.9180, city: "Tempe" },
  "85296": { lat: 33.2890, lng: -111.7600, city: "Gilbert" },
  "85297": { lat: 33.2700, lng: -111.6800, city: "Queen Creek" },
  "85298": { lat: 33.2800, lng: -111.6400, city: "Queen Creek" },
  "85295": { lat: 33.3100, lng: -111.7300, city: "Gilbert" },
};

const AMENITIES_POOL = [
  "ATM", "Restrooms", "Air Pump", "Car Wash", "Food", "Coffee",
  "EV Charging", "Lottery", "Propane", "Ice", "WiFi", "Drive-Through",
  "Tobacco Counter", "Fresh Produce", "Pharmacy",
];

const ZYN_VARIANTS = ["Wintergreen", "Cool Mint", "Spearmint", "Peppermint", "Coffee", "Cinnamon", "Citrus", "Smooth", "Menthol"];
const VELO_VARIANTS = ["Wintergreen", "Spearmint", "Citrus Burst", "Dragon Fruit", "Black Cherry"];
const ON_VARIANTS = ["Wintergreen", "Mint", "Citrus", "Coffee", "Berry"];
const ALP_VARIANTS = ["Mint", "Wintergreen", "Bergamot", "Eucalyptus", "Original"];
const ZEO_VARIANTS = ["Cosmic Mint", "Stellar Berry", "Nova Citrus", "Orbit Menthol", "Eclipse"];

const NIC_STRENGTHS = ["3", "6"];
const EXTENDED_STRENGTHS = ["3", "6", "8", "12"];

const PRODUCT_TYPES = [
  { type: "ZYN", brand: "Zyn", weight: 40, variants: ZYN_VARIANTS, strengths: NIC_STRENGTHS, category: "NICOTINE_POUCH" },
  { type: "VELO", brand: "Velo", weight: 14, variants: VELO_VARIANTS, strengths: NIC_STRENGTHS, category: "NICOTINE_POUCH" },
  { type: "ON_NICOTINE", brand: "On!", weight: 12, variants: ON_VARIANTS, strengths: ["2", "4", "8"], category: "NICOTINE_POUCH" },
  { type: "CAMEL_SNUS", brand: "Camel Snus", weight: 8, variants: ["Frost", "Mellow", "Robust", "Winterchill"], strengths: [], category: "SNUS" },
  { type: "ROGUE", brand: "Rogue", weight: 6, variants: ["Wintergreen", "Peppermint", "Mango", "Berry"], strengths: NIC_STRENGTHS, category: "NICOTINE_POUCH" },
  { type: "LUCY", brand: "Lucy", weight: 5, variants: ["Wintergreen", "Mint", "Mango", "Apple"], strengths: ["4", "8", "12"], category: "NICOTINE_POUCH" },
  { type: "ALP", brand: "Alp", weight: 8, variants: ALP_VARIANTS, strengths: NIC_STRENGTHS, category: "NICOTINE_POUCH" },
  { type: "ZEO_UNIVERSE", brand: "ZEO Universe", weight: 7, variants: ZEO_VARIANTS, strengths: EXTENDED_STRENGTHS, category: "NICOTINE_POUCH" },
  { type: "OTHER_NICOTINE", brand: "Other Nicotine", weight: 2, variants: [], strengths: [], category: "OTHER" },
  { type: "VAPE", brand: "Vape", weight: 3, variants: ["Mango", "Mint", "Tobacco"], strengths: ["5"], category: "VAPE" },
  { type: "CIGAR", brand: "Cigar", weight: 2, variants: ["Swisher", "Black & Mild", "Backwoods"], strengths: [], category: "CIGAR" },
  { type: "BOURBON", brand: "Bourbon", weight: 1, variants: ["Makers Mark", "Bulleit", "Jim Beam"], strengths: [], category: "SPIRIT" },
];

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weightedPick(products: typeof PRODUCT_TYPES) {
  const total = products.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of products) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return products[0];
}
function generatePhone(): string {
  return `(480) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

async function main() {
  console.log("Cleaning existing data...");
  await prisma.priceVote.deleteMany();
  await prisma.productRequest.deleteMany();
  await prisma.rewardsLedger.deleteMany();
  await prisma.review.deleteMany();
  await prisma.priceReport.deleteMany();
  await prisma.storeAmenity.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rateLimit.deleteMany();

  console.log("Seeding Product table...");
  for (let i = 0; i < PRODUCT_TYPES.length; i++) {
    const p = PRODUCT_TYPES[i];
    await prisma.product.create({
      data: {
        type: p.type,
        label: p.brand,
        category: p.category,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }

  console.log("Creating users...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@zynbuddy.com",
      name: "ZynBuddy Admin",
      firstName: "Admin",
      lastName: "User",
      passwordHash: await hash("admin123", 12),
      role: "ADMIN",
      rewardPoints: 9999,
      trustScore: 100,
      totalSubmissions: 200,
      totalUpvotes: 500,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@zynbuddy.com",
      name: "ZynBuddy Demo",
      firstName: "Demo",
      lastName: "User",
      passwordHash: await hash("demo123", 12),
      rewardPoints: 500,
      trustScore: 75,
      totalSubmissions: 25,
      totalUpvotes: 60,
    },
  });

  const seedUser = await prisma.user.create({
    data: {
      email: "seeder@zynbuddy.com",
      name: "Price Reporter",
      passwordHash: await hash("seed123", 12),
      rewardPoints: 2000,
      trustScore: 85,
      totalSubmissions: 100,
      totalUpvotes: 200,
    },
  });

  const communityUsers = [];
  const userNames = [
    "AZ_ZynFan", "MesaPouchKing", "GilbertNicGuy", "DesertPouch",
    "ChandlerZynner", "SunDevilSnus", "EastValleyVape", "QueenCreekQT",
    "TempeTobacco", "ApacheJunctionZyn", "HighleyHits", "PhoenixPoucher",
    "GilbertDealHunter", "MesaMintLover", "SonoranSnus",
  ];
  for (const uname of userNames) {
    const u = await prisma.user.create({
      data: {
        email: `${uname.toLowerCase().replace(/_/g, "")}@test.com`,
        name: uname,
        passwordHash: await hash("test123", 12),
        rewardPoints: randomInt(50, 1500),
        trustScore: randomInRange(10, 95),
        totalSubmissions: randomInt(5, 80),
        totalUpvotes: randomInt(2, 120),
      },
    });
    communityUsers.push(u);
  }
  const allUsers = [adminUser, demoUser, seedUser, ...communityUsers];

  console.log("Creating 300+ stores across 26 zip codes...");
  const allStores = [];
  const zipCodes = Object.keys(ZIP_CENTERS);

  for (const zip of zipCodes) {
    const { lat: cLat, lng: cLng, city } = ZIP_CENTERS[zip];
    const storeCount = randomInt(8, 18);

    for (let i = 0; i < storeCount; i++) {
      const lat = cLat + randomInRange(-0.025, 0.025);
      const lng = cLng + randomInRange(-0.035, 0.035);
      const brand = pick(STORE_BRANDS);
      const storeType = pick(STORE_TYPES);
      const storeNum = randomInt(1000, 9999);

      const store = await prisma.store.create({
        data: {
          name: `${brand} #${storeNum}`,
          brand,
          address: `${randomInt(100, 9999)} ${pick(STREET_NAMES)}`,
          city,
          state: "AZ",
          zipCode: zip,
          latitude: Math.round(lat * 10000) / 10000,
          longitude: Math.round(lng * 10000) / 10000,
          phone: Math.random() > 0.3 ? generatePhone() : null,
          storeType,
          isVerified: Math.random() > 0.35,
        },
      });
      allStores.push(store);

      const numAmenities = randomInt(2, 7);
      const shuffled = [...AMENITIES_POOL].sort(() => Math.random() - 0.5);
      for (let j = 0; j < numAmenities; j++) {
        await prisma.storeAmenity.create({
          data: { storeId: store.id, name: shuffled[j] },
        });
      }
    }
  }

  console.log(`Created ${allStores.length} stores`);

  console.log("Generating 14-day price history...");
  const now = new Date();
  const storesWithPrices = allStores.filter(() => Math.random() > 0.12);
  const allPriceReports: { id: string; userId: string }[] = [];

  for (const store of storesWithPrices) {
    const numReports = randomInt(3, 16);
    for (let r = 0; r < numReports; r++) {
      const product = weightedPick(PRODUCT_TYPES);
      const daysAgo = randomInt(0, 13);
      const hoursAgo = randomInt(0, 23);
      const reportDate = new Date(now);
      reportDate.setDate(reportDate.getDate() - daysAgo);
      reportDate.setHours(reportDate.getHours() - hoursAgo);

      let basePrice: number;
      switch (product.type) {
        case "ZYN": basePrice = randomInRange(3.99, 6.99); break;
        case "CAMEL_SNUS": basePrice = randomInRange(3.49, 5.99); break;
        case "VELO": basePrice = randomInRange(3.99, 5.49); break;
        case "ON_NICOTINE": basePrice = randomInRange(2.99, 4.99); break;
        case "ALP": basePrice = randomInRange(3.49, 5.99); break;
        case "ZEO_UNIVERSE": basePrice = randomInRange(4.49, 7.49); break;
        case "VAPE": basePrice = randomInRange(8.99, 24.99); break;
        case "CIGAR": basePrice = randomInRange(1.99, 8.99); break;
        case "BOURBON": basePrice = randomInRange(19.99, 49.99); break;
        default: basePrice = randomInRange(3.49, 5.99);
      }

      const deals = [
        null, null, null, null, null,
        "Buy 2 cans get 1 free", "Buy 5 cans for $20", "$1 off with rewards card",
        "Buy a roll, save $5", "2 for $8", "Weekly special: $3.99/can",
        "BOGO 50% off", "3 for $12", "Military discount 10% off",
        "$2 off first purchase", "Rewards members save 15%",
      ];

      const variant = product.variants.length > 0 ? pick(product.variants) : null;
      const strength = product.strengths.length > 0 ? pick(product.strengths) : null;

      const confirmedCount = randomInt(0, 25);
      const inaccurateCount = Math.random() > 0.92 ? randomInt(8, 14) : randomInt(0, 3);
      const isStale = inaccurateCount >= 10;

      const hasConfirmation = confirmedCount > 0 && Math.random() > 0.3;
      const confirmDate = hasConfirmation
        ? new Date(now.getTime() - randomInt(0, 3) * 24 * 60 * 60 * 1000)
        : null;

      const userId = pick(allUsers).id;
      const pr = await prisma.priceReport.create({
        data: {
          storeId: store.id,
          userId,
          productType: product.type,
          productBrand: product.brand,
          productVariant: variant,
          nicStrength: strength,
          pricePerCan: Math.round(basePrice * 100) / 100,
          pricePerRoll: Math.random() > 0.5 ? Math.round(basePrice * 9.5 * 100) / 100 : null,
          dealDescription: pick(deals),
          confirmedCount,
          inaccurateCount,
          isStale,
          lastConfirmedAt: confirmDate,
          createdAt: reportDate,
        },
      });
      allPriceReports.push({ id: pr.id, userId });
    }
  }

  console.log(`Created ${allPriceReports.length} price reports`);

  console.log("Generating sample votes...");
  let voteCount = 0;
  for (const pr of allPriceReports) {
    if (Math.random() > 0.3) continue;
    const numVoters = randomInt(1, 4);
    const voterPool = allUsers.filter((u) => u.id !== pr.userId);
    const shuffledVoters = [...voterPool].sort(() => Math.random() - 0.5).slice(0, numVoters);

    for (const voter of shuffledVoters) {
      try {
        await prisma.priceVote.create({
          data: {
            priceReportId: pr.id,
            userId: voter.id,
            voteType: Math.random() > 0.2 ? "CONFIRM" : "INACCURATE",
          },
        });
        voteCount++;
      } catch {
        // duplicate constraint hit
      }
    }
  }
  console.log(`Created ${voteCount} votes`);

  console.log("Generating reviews...");
  const reviewComments = [
    "Great selection of Zyn flavors!", "Good prices, friendly staff.",
    "Limited stock, often sold out.", "Best prices in the area!",
    "Clean store, always has what I need.", "Decent spot, prices could be better.",
    "They always have 6mg cool mint.", "Prices went up recently.",
    "Love the deals they run on weekends.", "Quick in and out.",
    "Great Alp selection here.", "Only place nearby with ZEO Universe!",
    "Wish they carried more On! flavors.", "Velo prices are the best here.",
    "Tobacco counter is always staffed.", "Huge selection, best in the valley.",
    "Rewards program saves me money here.", "Prices are fair, nothing special.",
    "My go-to for Zyn.", "New store, very modern and clean.",
    null, null, null,
  ];

  for (const store of allStores) {
    const numReviews = randomInt(0, 6);
    for (let r = 0; r < numReviews; r++) {
      await prisma.review.create({
        data: {
          storeId: store.id,
          userId: pick(allUsers).id,
          rating: randomInt(2, 5),
          comment: pick(reviewComments),
          createdAt: new Date(now.getTime() - randomInt(0, 45) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("\n=== Seed Complete ===");
  console.log(`- ${allUsers.length} users`);
  console.log(`  Admin: admin@zynbuddy.com / admin123`);
  console.log(`  Demo:  demo@zynbuddy.com / demo123`);
  console.log(`- ${allStores.length} stores across ${zipCodes.length} zip codes`);
  console.log(`- ${allPriceReports.length} price reports (14-day history)`);
  console.log(`- ${voteCount} votes`);
  console.log(`- ${PRODUCT_TYPES.length} products in Product table`);
  console.log(`- Zip codes: ${zipCodes.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
