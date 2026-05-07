// scripts/scrape.ts
// Dùng Groq (miễn phí) để scrape sản phẩm Shopee + tự động download ảnh
//
// Cách dùng:
//   npx ts-node scripts/scrape.ts --url "https://shopee.vn/..." --cat 1
//   npx ts-node scripts/scrape.ts --url "..." --cat 1 --dry-run
//   npx ts-node scripts/scrape.ts --file links.txt --cat 1

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

const prisma = new PrismaClient()
const GROQ_API_KEY = process.env.GROQ_API_KEY!

// ─── Thư mục lưu ảnh ──────────────────────────────────────────────────────────
// Ảnh sẽ lưu vào: public/uploads/products/<slug>/0.jpg, 1.jpg, ...
// Đồng thời copy sang D:\AFF SHOPEE WEB\public\uploads\products\<slug>\
const LOCAL_IMAGE_BASE = path.join('public', 'uploads', 'products')

// ─── Parse shopid + itemid từ URL Shopee ──────────────────────────────────────

function extractShopeeIds(shopeeUrl: string): { shopId: string; itemId: string } | null {
  try {
    const decoded = decodeURIComponent(shopeeUrl)
    // Dạng: shopee.vn/TEN-i.SHOPID.ITEMID
    const match = decoded.match(/-i\.(\d+)\.(\d+)/)
    if (match) return { shopId: match[1], itemId: match[2] }

    // Dạng query string: ?shopid=...&itemid=...
    const urlObj = new URL(shopeeUrl.startsWith('http') ? shopeeUrl : 'https://' + shopeeUrl)
    const shopId = urlObj.searchParams.get('shopid')
    const itemId = urlObj.searchParams.get('itemid')
    if (shopId && itemId) return { shopId, itemId }

    return null
  } catch {
    return null
  }
}

// ─── Gọi Shopee API lấy image URLs ───────────────────────────────────────────

async function fetchShopeeImages(shopId: string, itemId: string): Promise<string[]> {
  const apiUrl = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer':          'https://shopee.vn/',
      'Accept':           'application/json',
      'Accept-Language':  'vi-VN,vi;q=0.9',
      'x-api-source':     'pc',
      'x-requested-with': 'XMLHttpRequest',
    },
  })

  if (!res.ok) throw new Error(`Shopee API lỗi ${res.status}`)

  const data = await res.json()
  const item = data?.data?.item

  if (!item) throw new Error('Shopee API không trả về item data')

  // Lấy tất cả ảnh: images[] là mảng hash
  const imageHashes: string[] = item.images ?? []
  return imageHashes.map(
    (hash: string) => `https://down-vn.img.susercontent.com/file/${hash}_tn`
  )
}

// ─── Download 1 ảnh về local ──────────────────────────────────────────────────

function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':    'https://shopee.vn/',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(destPath)
        return reject(new Error(`HTTP ${res.statusCode} khi tải: ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => {
      file.close()
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
      reject(err)
    })
  })
}

// ─── Download toàn bộ ảnh sản phẩm ──────────────────────────────────────────

async function downloadAllImages(imageUrls: string[], productSlug: string): Promise<string> {
  const folder = path.join(LOCAL_IMAGE_BASE, productSlug)
  fs.mkdirSync(folder, { recursive: true })

  const downloaded: string[] = []

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]
    const ext = '.jpg'
    const fileName = `${i}${ext}`
    const destPath = path.join(folder, fileName)

    try {
      await downloadImage(url, destPath)
      downloaded.push(fileName)
      console.log(`     📸 Ảnh ${i + 1}/${imageUrls.length}: ${fileName} ✓`)
    } catch (e) {
      console.warn(`     ⚠️  Ảnh ${i + 1} thất bại: ${e}`)
    }

    // Delay nhỏ tránh bị rate limit
    if (i < imageUrls.length - 1) await new Promise(r => setTimeout(r, 300))
  }

  // Trả về đường dẫn web ảnh đầu tiên (dùng cho imageUrl trong DB)
  const firstImage = downloaded[0]
  return firstImage
    ? `/uploads/products/${productSlug}/${firstImage}`
    : ''
}

// ─── Lấy tên sản phẩm từ URL ──────────────────────────────────────────────────

function extractNameFromUrl(shopeeUrl: string): string {
  try {
    const decoded = decodeURIComponent(shopeeUrl)
    const match = decoded.match(/shopee\.vn\/([^?#]+)/)
    if (!match) return ''
    const slug = match[1]
      .replace(/-i\.\d+\.\d+.*$/, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return slug.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  } catch {
    return ''
  }
}

// ─── Dùng Groq làm sạch tên + tạo mô tả ──────────────────────────────────────

interface ScrapedProduct {
  name:        string
  price:       number
  oldPrice:    number | null
  description: string | null
  imageUrl:    string | null
}

async function enrichWithGroq(rawName: string, shopeeUrl: string): Promise<ScrapedProduct> {
  const prompt = `Đây là tên sản phẩm lấy từ URL Shopee (chưa được format đẹp):
"${rawName}"

Link gốc: ${shopeeUrl}

Hãy:
1. Làm sạch tên sản phẩm (viết hoa đúng chỗ, bỏ ký tự thừa)
2. Đoán giá hợp lý cho sản phẩm này tại thị trường Việt Nam (số nguyên VND).
3. Viết mô tả đầy đủ dạng PLAIN TEXT, KHÔNG dùng HTML hay markdown, Dùng định dạng Tiêu đề section viết HOA và kết thúc bằng dấu hai chấm, mỗi chi tiết bắt đầu bằng dấu - ở đầu dòng nhìn chuyên nghiệp.

Trả về JSON duy nhất, KHÔNG markdown:
{
  "name": "tên sản phẩm đã làm sạch",
  "price": 100000,
  "oldPrice": 135000,
  "description": "mô tả ngắn",
  "imageUrl": null
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens:  1200,
      messages: [
        { role: 'system', content: 'Bạn là tool xử lý dữ liệu sản phẩm thương mại điện tử Việt Nam. Chỉ trả về JSON thuần túy, không có text thừa.' },
        { role: 'user',   content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API lỗi ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('Groq không trả về text')

  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Không tìm thấy JSON:\n${text}`)

  const parsed = JSON.parse(match[0]) as ScrapedProduct
  if (!parsed.name) throw new Error('Thiếu name trong response')

  if (!parsed.price || parsed.price <= 0) parsed.price = 99000

  return parsed
}

// ─── Parse args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const get  = (flag: string) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined }
  return {
    url:    get('--url'),
    file:   get('--file'),
    cat:    Number(get('--cat') || '0'),
    dryRun: args.includes('--dry-run'),
  }
}

// ─── Xử lý 1 link ─────────────────────────────────────────────────────────────

async function processOne(url: string, categoryId: number, dryRun: boolean) {
  const trimmed = url.trim()
  if (!trimmed || !trimmed.includes('shopee')) {
    console.log(`  ⏭  Bỏ qua (không phải Shopee): ${trimmed}`)
    return
  }

  console.log(`\n🔍 Đang xử lý: ${trimmed}`)

  // Bước 1: lấy tên từ URL
  const rawName = extractNameFromUrl(trimmed)
  if (!rawName) {
    console.error('  ❌ Không parse được tên từ URL')
    return
  }
  console.log(`  📝 Tên thô từ URL: ${rawName}`)

  // Bước 2: Groq làm sạch + tạo mô tả
  let scraped: ScrapedProduct
  try {
    scraped = await enrichWithGroq(rawName, trimmed)
  } catch (e) {
    console.error(`  ❌ Groq thất bại: ${e}`)
    scraped = { name: rawName, price: 99000, oldPrice: null, description: null, imageUrl: null }
    console.log(`  ⚠️  Dùng fallback: tên thô + giá mặc định`)
  }

  console.log(`  ✅ Tên: ${scraped.name}`)
  console.log(`     Giá: ${scraped.price.toLocaleString('vi-VN')}₫` +
    (scraped.oldPrice ? ` (gốc: ${scraped.oldPrice.toLocaleString('vi-VN')}₫)` : ''))

  // Tạo slug sớm để dùng cho tên folder ảnh
  const slug =
    slugify(scraped.name, { lower: true, locale: 'vi', strict: true }).slice(0, 80)
    + '-' + Date.now()

  // Bước 3: Lấy ảnh từ Shopee API + download về local
  const ids = extractShopeeIds(trimmed)
  if (ids) {
    console.log(`  🖼  Đang lấy ảnh từ Shopee API (shopId=${ids.shopId}, itemId=${ids.itemId})...`)
    try {
      const imageUrls = await fetchShopeeImages(ids.shopId, ids.itemId)
      console.log(`     Tìm thấy ${imageUrls.length} ảnh`)

      if (imageUrls.length > 0) {
        if (!dryRun) {
          const firstImagePath = await downloadAllImages(imageUrls, slug)
          scraped.imageUrl = firstImagePath
          console.log(`  ✅ Ảnh lưu tại: public/uploads/products/${slug}/`)
          console.log(`     imageUrl trong DB: ${firstImagePath}`)
        } else {
          console.log(`  🧪 Dry-run — bỏ qua download ảnh`)
          console.log(`     Sẽ download ${imageUrls.length} ảnh vào: public/uploads/products/${slug}/`)
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Không lấy được ảnh từ Shopee API: ${e}`)
      console.warn(`     → Ảnh sẽ để trống, thêm thủ công qua admin`)
    }
  } else {
    console.warn(`  ⚠️  Không parse được shopId/itemId từ URL — bỏ qua bước lấy ảnh`)
  }

  if (dryRun) {
    console.log(`  🧪 Dry-run — không lưu DB`)
    return
  }

  // Bước 4: Lưu vào DB
  try {
    const product = await prisma.product.create({
      data: {
        name:        scraped.name,
        slug,
        description: scraped.description,
        price:       scraped.price,
        oldPrice:    scraped.oldPrice,
        imageUrl:    scraped.imageUrl,
        affLink:     trimmed,
        categoryId,
        isActive:    true,
      },
    })
    console.log(`  💾 Đã lưu — id: ${product.id}`)
    console.log(`  🌐 Xem tại: https://shopee-aff-production.up.railway.app/san-pham/${product.slug}`)
  } catch (e) {
    console.error(`  ❌ Lỗi lưu DB: ${e}`)
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { url, file, cat, dryRun } = parseArgs()

  if (!GROQ_API_KEY) {
    console.error('❌ Thiếu GROQ_API_KEY trong .env')
    console.error('   Lấy miễn phí tại: https://console.groq.com')
    process.exit(1)
  }
  if (!cat) {
    console.error('❌ Cần --cat <categoryId>  ví dụ: --cat 1')
    process.exit(1)
  }
  if (!url && !file) {
    console.error('❌ Cần --url hoặc --file')
    console.error('Ví dụ:')
    console.error('  npx ts-node scripts/scrape.ts --url "https://shopee.vn/..." --cat 1')
    console.error('  npx ts-node scripts/scrape.ts --file links.txt --cat 1')
    process.exit(1)
  }

  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  console.log('\n📂 Categories:')
  cats.forEach(c => console.log(`   [${c.id}] ${c.name}`))

  if (dryRun) console.log('\n🧪 Dry-run mode — sẽ KHÔNG lưu vào database\n')

  if (url) {
    await processOne(url, cat, dryRun)
  } else if (file) {
    const filePath = path.resolve(file)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Không tìm thấy file: ${filePath}`)
      process.exit(1)
    }
    const lines = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean)

    console.log(`\n📋 ${lines.length} link trong file`)
    for (let i = 0; i < lines.length; i++) {
      console.log(`\n[${i + 1}/${lines.length}]`)
      await processOne(lines[i], cat, dryRun)
      if (i < lines.length - 1) await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log('\n✅ Xong!')
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
