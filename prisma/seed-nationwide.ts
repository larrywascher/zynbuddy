import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const US_CITIES: { city: string; state: string; lat: number; lng: number; zip: string; areaCode: string }[] = [
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.0060, zip: "10001", areaCode: "212" },
  { city: "Brooklyn", state: "NY", lat: 40.6782, lng: -73.9442, zip: "11201", areaCode: "718" },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437, zip: "90001", areaCode: "213" },
  { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611, zip: "92101", areaCode: "619" },
  { city: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194, zip: "94102", areaCode: "415" },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, zip: "60601", areaCode: "312" },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, zip: "77001", areaCode: "713" },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.7970, zip: "75201", areaCode: "214" },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, zip: "78701", areaCode: "512" },
  { city: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936, zip: "78201", areaCode: "210" },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, zip: "19101", areaCode: "215" },
  { city: "Pittsburgh", state: "PA", lat: 40.4406, lng: -79.9959, zip: "15201", areaCode: "412" },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740, zip: "85001", areaCode: "602" },
  { city: "Tucson", state: "AZ", lat: 32.2226, lng: -110.9747, zip: "85701", areaCode: "520" },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, zip: "80201", areaCode: "303" },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321, zip: "98101", areaCode: "206" },
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784, zip: "97201", areaCode: "503" },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, zip: "33101", areaCode: "305" },
  { city: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792, zip: "32801", areaCode: "407" },
  { city: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572, zip: "33601", areaCode: "813" },
  { city: "Jacksonville", state: "FL", lat: 30.3322, lng: -81.6557, zip: "32099", areaCode: "904" },
  { city: "Atlanta", state: "GA", lat: 33.7490, lng: -84.3880, zip: "30301", areaCode: "404" },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, zip: "37201", areaCode: "615" },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, zip: "28201", areaCode: "704" },
  { city: "Raleigh", state: "NC", lat: 35.7796, lng: -78.6382, zip: "27601", areaCode: "919" },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589, zip: "02101", areaCode: "617" },
  { city: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458, zip: "48201", areaCode: "313" },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.2650, zip: "55401", areaCode: "612" },
  { city: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786, zip: "64101", areaCode: "816" },
  { city: "St. Louis", state: "MO", lat: 38.6270, lng: -90.1994, zip: "63101", areaCode: "314" },
  { city: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398, zip: "89101", areaCode: "702" },
  { city: "Salt Lake City", state: "UT", lat: 40.7608, lng: -111.8910, zip: "84101", areaCode: "801" },
  { city: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581, zip: "46201", areaCode: "317" },
  { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988, zip: "43201", areaCode: "614" },
  { city: "Cleveland", state: "OH", lat: 41.4993, lng: -81.6944, zip: "44101", areaCode: "216" },
  { city: "New Orleans", state: "LA", lat: 29.9511, lng: -90.0715, zip: "70112", areaCode: "504" },
  { city: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164, zip: "73101", areaCode: "405" },
  { city: "Baltimore", state: "MD", lat: 39.2904, lng: -76.6122, zip: "21201", areaCode: "410" },
  { city: "Washington", state: "DC", lat: 38.9072, lng: -77.0369, zip: "20001", areaCode: "202" },
  { city: "Richmond", state: "VA", lat: 37.5407, lng: -77.4360, zip: "23219", areaCode: "804" },
  { city: "Milwaukee", state: "WI", lat: 43.0389, lng: -87.9065, zip: "53201", areaCode: "414" },
  { city: "Louisville", state: "KY", lat: 38.2527, lng: -85.7585, zip: "40201", areaCode: "502" },
  { city: "Boise", state: "ID", lat: 43.6150, lng: -116.2023, zip: "83701", areaCode: "208" },
  { city: "Albuquerque", state: "NM", lat: 35.0844, lng: -106.6504, zip: "87101", areaCode: "505" },
];

const STORE_BRANDS = [
  "Circle K", "QuikTrip", "Shell", "Chevron", "7-Eleven", "Walgreens",
  "CVS", "Speedway", "Pilot", "Murphy USA", "Casey's", "Wawa", "Sheetz",
  "RaceTrac", "Kum & Go", "Maverik", "Love's", "Buc-ee's", "Kwik Trip",
  "Holiday", "AM/PM", "Costco Gas", "Kroger Fuel", "Target", "Walmart",
];

const STORE_TYPES = [
  "GAS_STATION", "GAS_STATION", "GAS_STATION",
  "CONVENIENCE_STORE", "CONVENIENCE_STORE", "SMOKE_SHOP", "GROCERY",
];

const STREET_NAMES = [
  "Main St", "Broadway", "Market St", "Oak Ave", "Elm St", "Park Ave",
  "Washington Blvd", "MLK Jr Blvd", "1st Ave", "2nd Ave", "3rd Ave",
  "Lincoln Ave", "Jefferson St", "Madison Ave", "Monroe Dr", "Central Ave",
  "Highland Ave", "Riverside Dr", "Lakeview Dr", "Sunset Blvd",
  "Commerce Dr", "Industrial Pkwy", "University Ave", "College St",
  "Spring St", "Church St", "State St", "Front St", "Pine St", "Maple Ave",
];

const AMENITIES_POOL = [
  "ATM", "Restrooms", "Air Pump", "Car Wash", "Food", "Coffee",
  "EV Charging", "Lottery", "Propane", "Ice", "WiFi", "Drive-Through",
  "Tobacco Counter", "Fresh Produce", "Pharmacy",
];

const PRODUCT_TYPES = [
  { type: "ZYN", brand: "Zyn", weight: 40, variants: ["Wintergreen", "Cool Mint", "Spearmint", "Peppermint", "Coffee", "Cinnamon", "Citrus", "Smooth", "Menthol"], strengths: ["3", "6"] },
  { type: "VELO", brand: "Velo", weight: 14, variants: ["Wintergreen", "Spearmint", "Citrus Burst", "Dragon Fruit", "Black Cherry"], strengths: ["3", "6"] },
  { type: "ON_NICOTINE", brand: "On!", weight: 12, variants: ["Wintergreen", "Mint", "Citrus", "Coffee", "Berry"], strengths: ["2", "4", "8"] },
  { type: "CAMEL_SNUS", brand: "Camel Snus", weight: 8, variants: ["Frost", "Mellow", "Robust", "Winterchill"], strengths: [] },
  { type: "ROGUE", brand: "Rogue", weight: 6, variants: ["Wintergreen", "Peppermint", "Mango", "Berry"], strengths: ["3", "6"] },
  { type: "LUCY", brand: "Lucy", weight: 5, variants: ["Wintergreen", "Mint", "Mango", "Apple"], strengths: ["4", "8", "12"] },
  { type: "ALP", brand: "Alp", weight: 8, variants: ["Mint", "Wintergreen", "Bergamot", "Eucalyptus", "Original"], strengths: ["3", "6"] },
  { type: "ZEO_UNIVERSE", brand: "ZEO Universe", weight: 7, variants: ["Cosmic Mint", "Stellar Berry", "Nova Citrus", "Orbit Menthol", "Eclipse"], strengths: ["3", "6", "8", "12"] },
];

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedPick(products: typeof PRODUCT_TYPES) {
  const total = products.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of products) { r -= p.weight; if (r <= 0) return p; }
  return products[0];
}

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Andrew", "Emily", "Paul", "Donna", "Joshua", "Michelle",
  "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah",
  "Timothy", "Stephanie",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

const USERNAMES = [
  "ZynHunter", "PouchPro", "MintFanatic", "NicDealFinder", "BudgetPouch",
  "DailyZynner", "PriceScout", "FlavorChaser", "NicotineNomad", "DealDiver",
  "PouchPatrol", "MintyFresh", "SaveOnZyn", "CoolMintKing", "WintergreenWiz",
  "CheapPouches", "ZynAdvisor", "PriceHawk", "SmartShopper", "NicSaver",
  "PouchExpert", "FreshMintFan", "ZynTracker", "DealAlert", "PouchReporter",
  "NicBudget", "ValueHunter", "ZynExplorer", "MintMaster", "PouchFinder",
  "NicNavigator", "ZynScout", "DealSeeker", "PriceTracker", "SmokelessFan",
  "ZynReview", "PouchRater", "NicCompare", "BestDeals", "ZynSpotter",
  "PouchWatch", "MintMonitor", "NicCheck", "ZynAlert", "DealHound",
  "PouchGuide", "NicExpert", "ZynHelper", "PriceGuru", "PouchChamp",
];

async function main() {
  console.log("=== Nationwide Seed (additive) ===\n");

  console.log("Creating 50 test users...");
  const newUsers = [];
  for (let i = 0; i < 50; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const username = USERNAMES[i];
    const u = await prisma.user.create({
      data: {
        email: `${username.toLowerCase()}@testuser.com`,
        name: username,
        firstName: first,
        lastName: last,
        passwordHash: await hash("test123", 10),
        rewardPoints: randInt(10, 2000),
        trustScore: rand(5, 98),
        totalSubmissions: randInt(1, 100),
        totalUpvotes: randInt(0, 200),
      },
    });
    newUsers.push(u);
  }
  console.log(`Created ${newUsers.length} users`);

  const existingUsers = await prisma.user.findMany({ select: { id: true }, take: 100 });
  const allUserIds = existingUsers.map(u => u.id);

  console.log("\nCreating 200 stores across 44 US cities...");
  const allNewStores = [];
  const storesPerCity = Math.ceil(200 / US_CITIES.length);

  for (const loc of US_CITIES) {
    const count = randInt(Math.max(3, storesPerCity - 1), storesPerCity + 2);
    for (let i = 0; i < count; i++) {
      if (allNewStores.length >= 200) break;
      const lat = loc.lat + rand(-0.04, 0.04);
      const lng = loc.lng + rand(-0.06, 0.06);
      const brand = pick(STORE_BRANDS);

      const store = await prisma.store.create({
        data: {
          name: `${brand} #${randInt(1000, 9999)}`,
          brand,
          address: `${randInt(100, 9999)} ${pick(STREET_NAMES)}`,
          city: loc.city,
          state: loc.state,
          zipCode: loc.zip,
          latitude: Math.round(lat * 10000) / 10000,
          longitude: Math.round(lng * 10000) / 10000,
          phone: Math.random() > 0.3 ? `(${loc.areaCode}) ${randInt(200, 999)}-${randInt(1000, 9999)}` : null,
          storeType: pick(STORE_TYPES),
          isVerified: Math.random() > 0.3,
        },
      });
      allNewStores.push(store);

      const numAmenities = randInt(2, 6);
      const shuffled = [...AMENITIES_POOL].sort(() => Math.random() - 0.5);
      for (let j = 0; j < numAmenities; j++) {
        await prisma.storeAmenity.create({
          data: { storeId: store.id, name: shuffled[j] },
        });
      }
    }
    if (allNewStores.length >= 200) break;
  }
  console.log(`Created ${allNewStores.length} stores`);

  console.log("\nGenerating price reports...");
  const now = new Date();
  const allPriceReports: { id: string; userId: string }[] = [];

  for (const store of allNewStores) {
    const numReports = randInt(3, 12);
    for (let r = 0; r < numReports; r++) {
      const product = weightedPick(PRODUCT_TYPES);
      const daysAgo = randInt(0, 13);
      const reportDate = new Date(now);
      reportDate.setDate(reportDate.getDate() - daysAgo);
      reportDate.setHours(reportDate.getHours() - randInt(0, 23));

      let basePrice: number;
      switch (product.type) {
        case "ZYN": basePrice = rand(3.99, 6.99); break;
        case "VELO": basePrice = rand(3.99, 5.49); break;
        case "ON_NICOTINE": basePrice = rand(2.99, 4.99); break;
        case "CAMEL_SNUS": basePrice = rand(3.49, 5.99); break;
        case "ALP": basePrice = rand(3.49, 5.99); break;
        case "ZEO_UNIVERSE": basePrice = rand(4.49, 7.49); break;
        default: basePrice = rand(3.49, 5.99);
      }

      const deals = [
        null, null, null, null,
        "Buy 2 cans get 1 free", "$1 off with rewards card", "Buy 5 for $20",
        "BOGO 50% off", "3 for $12", "Weekly special",
      ];

      const variant = product.variants.length > 0 ? pick(product.variants) : null;
      const strength = product.strengths.length > 0 ? pick(product.strengths) : null;
      const confirmedCount = randInt(0, 20);
      const inaccurateCount = Math.random() > 0.92 ? randInt(8, 14) : randInt(0, 3);

      const userId = pick(allUserIds);
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
          isStale: inaccurateCount >= 10,
          lastConfirmedAt: confirmedCount > 0 ? new Date(now.getTime() - randInt(0, 3) * 86400000) : null,
          createdAt: reportDate,
        },
      });
      allPriceReports.push({ id: pr.id, userId });
    }
  }
  console.log(`Created ${allPriceReports.length} price reports`);

  console.log("\nGenerating votes...");
  let voteCount = 0;
  for (const pr of allPriceReports) {
    if (Math.random() > 0.35) continue;
    const numVoters = randInt(1, 3);
    const voters = allUserIds.filter(id => id !== pr.userId).sort(() => Math.random() - 0.5).slice(0, numVoters);
    for (const voterId of voters) {
      try {
        await prisma.priceVote.create({
          data: {
            priceReportId: pr.id,
            userId: voterId,
            voteType: Math.random() > 0.2 ? "CONFIRM" : "INACCURATE",
          },
        });
        voteCount++;
      } catch { /* duplicate */ }
    }
  }
  console.log(`Created ${voteCount} votes`);

  console.log("\nGenerating reviews...");
  const comments = [
    "Great selection!", "Good prices, friendly staff.", "Limited stock lately.",
    "Best prices in town!", "Clean store.", "Decent spot.", "Always stocked.",
    "Prices went up recently.", "Love the weekend deals.", "Quick in and out.",
    "Huge selection.", "Rewards program is great here.", "My go-to store.",
    null, null,
  ];
  let reviewCount = 0;
  for (const store of allNewStores) {
    const numReviews = randInt(0, 5);
    for (let r = 0; r < numReviews; r++) {
      await prisma.review.create({
        data: {
          storeId: store.id,
          userId: pick(allUserIds),
          rating: randInt(2, 5),
          comment: pick(comments),
          createdAt: new Date(now.getTime() - randInt(0, 45) * 86400000),
        },
      });
      reviewCount++;
    }
  }
  console.log(`Created ${reviewCount} reviews`);

  console.log("\n=== Nationwide Seed Complete ===");
  console.log(`- ${newUsers.length} new users (password: test123)`);
  console.log(`- ${allNewStores.length} new stores across ${US_CITIES.length} cities`);
  console.log(`- ${allPriceReports.length} price reports`);
  console.log(`- ${voteCount} votes`);
  console.log(`- ${reviewCount} reviews`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
